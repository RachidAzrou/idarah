import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware } from "./middleware/auth";
import { tenantMiddleware } from "./middleware/tenant";
import { authService } from "./services/auth";
import { memberService } from "./services/member";
import { feeService } from "./services/fee";
import { financialService } from "./services/financial";
import { cardService } from "./services/card";
import { insertUserSchema, insertMemberSchema, insertMembershipFeeSchema } from "@shared/schema";
import { generateFeesHandler } from "./api/jobs/fees/generate";
import { createMemberHandler } from "./api/members/create";
import publicScreensRouter from "./routes/public-screens";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createMemberSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  gender: z.enum(['M', 'V']),
  birthDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  category: z.enum(['STUDENT', 'STANDAARD', 'SENIOR']),
  email: z.string().optional(),
  phone: z.string().optional(),
  street: z.string(),
  number: z.string(),
  bus: z.string().optional(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
  financialSettings: z.object({
    paymentMethod: z.enum(['SEPA', 'OVERSCHRIJVING', 'BANCONTACT', 'CASH']),
    iban: z.string().optional(),
    paymentTerm: z.enum(['MONTHLY', 'YEARLY']),
  }),
  organization: z.object({
    interestedInActiveRole: z.boolean(),
    roleDescription: z.string().optional(),
  }),
  permissions: z.object({
    privacyAgreement: z.boolean(),
    photoVideoConsent: z.boolean(),
    newsletterSubscription: z.boolean(),
    whatsappList: z.boolean(),
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(email, password);
      
      if (!result.success) {
        return res.status(401).json({ message: result.message });
      }

      res.json({
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    res.json({ user: req.user });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.tenantId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Members routes
  app.get("/api/members", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const members = await storage.getMembersByTenant(req.tenantId!);
      res.json(members);
    } catch (error) {
      console.error("Members API error:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/members/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      if (!member || member.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.post("/api/members", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      // Transform the data to match expected format
      const transformedData = {
        ...req.body,
        // Convert string date to Date object if needed
        birthDate: typeof req.body.birthDate === 'string' ? new Date(req.body.birthDate) : req.body.birthDate,
      };
      
      const memberData = createMemberSchema.parse(transformedData);
      const result = await memberService.createMember(req.tenantId!, memberData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(201).json(result.member);
    } catch (error) {
      console.error("Error creating member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid member data", 
          errors: error.issues 
        });
      }
      res.status(400).json({ message: "Invalid member data" });
    }
  });

  app.put("/api/members/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const memberData = insertMemberSchema.partial().parse(req.body);
      const member = await storage.getMember(req.params.id);
      
      if (!member || member.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Member not found" });
      }

      const updatedMember = await storage.updateMember(req.params.id, memberData);
      res.json(updatedMember);
    } catch (error) {
      res.status(400).json({ message: "Invalid member data" });
    }
  });

  app.delete("/api/members/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      
      if (!member || member.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Member not found" });
      }

      await storage.deleteMember(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Membership fees routes
  app.get("/api/fees", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const fees = await storage.getMembershipFeesByTenant(req.tenantId!);
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch membership fees" });
    }
  });

  app.get("/api/fees/member/:memberId", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const fees = await storage.getMembershipFeesByMember(req.params.memberId);
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member fees" });
    }
  });

  app.post("/api/fees", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const feeData = insertMembershipFeeSchema.parse(req.body);
      const fee = await storage.createMembershipFee({
        ...feeData,
        tenantId: req.tenantId!,
      });
      res.status(201).json(fee);
    } catch (error) {
      res.status(400).json({ message: "Invalid fee data" });
    }
  });

  app.put("/api/fees/:id/mark-paid", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const result = await feeService.markFeePaid(req.params.id, req.tenantId!);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json(result.fee);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark fee as paid" });
    }
  });

  app.delete("/api/fees/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      await storage.deleteMembershipFee(req.params.id, req.tenantId!);
      res.json({ message: "Lidgeld verwijderd" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete membership fee" });
    }
  });

  // Financial routes
  app.get("/api/transactions", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByTenant(req.tenantId!);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const transactionData = { 
        ...req.body, 
        tenantId: req.tenantId,
        date: new Date(req.body.date)
      };
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.put("/api/transactions/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const transactionData = { 
        ...req.body, 
        date: req.body.date ? new Date(req.body.date) : undefined
      };
      const transaction = await storage.updateTransaction(req.params.id, transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.delete("/api/transactions/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      await storage.deleteTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  app.get("/api/financial/reports", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const reports = await financialService.generateReports(req.tenantId!);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate financial reports" });
    }
  });

  // Tenant management routes
  app.get("/api/tenant/current", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.tenantId!);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // Return tenant data with consistent field names
      const mappedTenant = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        street: tenant.street,
        number: tenant.number,
        postalCode: tenant.postalCode,
        city: tenant.city,
        country: tenant.country,
        email: tenant.email,
        phone: tenant.phone,
        website: tenant.website,
        companyNumber: tenant.companyNumber,
        companyType: tenant.companyType,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        // Include fee settings
        studentFee: tenant.studentFee,
        adultFee: tenant.adultFee,
        seniorFee: tenant.seniorFee,
        defaultPaymentTerm: tenant.defaultPaymentTerm,
        defaultPaymentMethod: tenant.defaultPaymentMethod,
        createdAt: tenant.createdAt,
      };
      
      res.json(mappedTenant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  app.put("/api/tenant/current", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const tenantData = req.body;
      
      // Map frontend field names to database field names
      const mappedData = {
        name: tenantData.name,
        slug: tenantData.slug,
        street: tenantData.street,
        number: tenantData.number,
        postalCode: tenantData.postalCode,
        city: tenantData.city,
        country: tenantData.country,
        email: tenantData.email,
        phone: tenantData.phone,
        website: tenantData.website,
        companyNumber: tenantData.companyNumber,
        companyType: tenantData.companyType,
        logoUrl: tenantData.logoUrl,
        primaryColor: tenantData.primaryColor,
      };
      
      const updatedTenant = await storage.updateTenant(req.tenantId!, mappedData);
      
      // Return consistent response format
      const mappedResponse = {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        street: updatedTenant.street,
        number: updatedTenant.number,
        postalCode: updatedTenant.postalCode,
        city: updatedTenant.city,
        country: updatedTenant.country,
        email: updatedTenant.email,
        phone: updatedTenant.phone,
        website: updatedTenant.website,
        companyNumber: updatedTenant.companyNumber,
        companyType: updatedTenant.companyType,
        logoUrl: updatedTenant.logoUrl,
        primaryColor: updatedTenant.primaryColor,
        createdAt: updatedTenant.createdAt,
      };
      
      res.json(mappedResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  // Settings routes
  app.put("/api/settings/fees", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const { studentFee, adultFee, seniorFee, defaultPaymentTerm, defaultPaymentMethod } = req.body;
      
      // Update tenant with fee settings
      const updatedTenant = await storage.updateTenant(req.tenantId!, {
        studentFee: studentFee ? parseFloat(studentFee).toString() : undefined,
        adultFee: adultFee ? parseFloat(adultFee).toString() : undefined,
        seniorFee: seniorFee ? parseFloat(seniorFee).toString() : undefined,
        defaultPaymentTerm,
        defaultPaymentMethod,
      });
      
      res.json({ success: true, message: "Fee settings updated", data: updatedTenant });
    } catch (error) {
      console.error("Error updating fee settings:", error);
      res.status(500).json({ message: "Failed to update fee settings" });
    }
  });

  // Users routes
  app.get("/api/users", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const users = await storage.getUsersByTenant(req.tenantId!);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser({
        ...userData,
        tenantId: req.tenantId!,
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/users/:id/reset-password", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      // Generate a new temporary password
      const newPassword = Math.random().toString(36).slice(-8);
      await storage.updateUser(req.params.id, { password: newPassword });
      
      // In a real app, you would send this via email
      res.json({ 
        message: "Password reset successfully",
        temporaryPassword: newPassword 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Rules routes
  app.get("/api/rules", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const rules = await storage.getRulesByTenant(req.tenantId!);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rules" });
    }
  });

  app.post("/api/rules", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const ruleData = req.body;
      const rule = await storage.createRule({
        ...ruleData,
        tenantId: req.tenantId!,
      });
      res.status(201).json(rule);
    } catch (error) {
      res.status(400).json({ message: "Invalid rule data" });
    }
  });

  app.put("/api/rules/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const ruleData = req.body;
      const rule = await storage.updateRule(req.params.id, ruleData);
      res.json(rule);
    } catch (error) {
      res.status(400).json({ message: "Invalid rule data" });
    }
  });

  app.delete("/api/rules/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      await storage.deleteRule(req.params.id);
      res.json({ message: "Rule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rule" });
    }
  });

  // Public screens routes
  app.get("/api/public-screens", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const screens = await storage.getPublicScreensByTenant(req.tenantId!);
      res.json(screens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public screens" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByTenant(req.tenantId!);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // SEPA export routes
  app.get("/api/sepa-exports", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const exports = await storage.getSepaExportsByTenant(req.tenantId!);
      res.json(exports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SEPA exports" });
    }
  });

  // Rolling fees API routes
  app.post("/api/jobs/fees/generate", generateFeesHandler);
  
  // Enhanced member creation with rolling fees
  app.post("/api/members/create", authMiddleware, tenantMiddleware, createMemberHandler);

  // Public screens routes - some routes need auth, others are public
  app.use("/api/public-screens", publicScreensRouter);

  // Card routes - Public endpoints for Live Card
  app.get("/card/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const { standalone, v } = req.query;
      
      const cardData = await cardService.getCardData(memberId);
      if (!cardData) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Lidkaart niet gevonden</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: system-ui; text-align: center; padding: 2rem;">
            <h1>Lidkaart niet gevonden</h1>
            <p>De opgevraagde lidkaart bestaat niet of is niet beschikbaar.</p>
          </body>
          </html>
        `);
      }

      // Return a simple HTML page that loads the React component
      const html = `
        <!DOCTYPE html>
        <html lang="nl">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Digitale Lidkaart - ${cardData.member.firstName} ${cardData.member.lastName}</title>
          <meta name="description" content="Digitale lidkaart voor ${cardData.tenant.name}">
          <style>
            body { margin: 0; padding: 0; font-family: system-ui; }
            .loading { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              background: #f3f4f6; 
            }
          </style>
        </head>
        <body>
          <div id="card-root">
            <div class="loading">Lidkaart laden...</div>
          </div>
          <script>
            window.__CARD_DATA__ = ${JSON.stringify({
              member: cardData.member,
              cardMeta: cardData.cardMeta,
              tenant: cardData.tenant,
              standalone: standalone === '1',
            })};
          </script>
          <script type="module">
            // This would normally load the React component
            // For now, show basic card info
            document.getElementById('card-root').innerHTML = \`
              <div style="padding: 2rem; max-width: 400px; margin: 2rem auto; background: white; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                <h1 style="margin: 0 0 1rem 0; color: #1f2937;">${cardData.member.firstName} ${cardData.member.lastName}</h1>
                <p style="margin: 0 0 0.5rem 0; font-family: monospace; color: #6b7280;">#${cardData.member.memberNumber}</p>
                <p style="margin: 0 0 1rem 0; color: #6b7280;">${cardData.member.category}</p>
                <div style="text-align: center; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;">
                  <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">QR Code voor verificatie</p>
                  <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; color: #9ca3af;">Scan om status te verifiëren</p>
                </div>
              </div>
            \`;
          </script>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error serving Live Card:', error);
      res.status(500).send('Internal Server Error');
    }
  });


  // Card invalidation endpoint (authenticated)
  app.post("/api/card/invalidate", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const { memberId, tenantBrandingBump } = req.body;
      
      if (memberId) {
        const cardData = await cardService.getCardData(memberId);
        if (cardData && cardData.member.tenantId === req.tenantId) {
          await cardService.invalidateCard(cardData.cardMeta.id);
        }
      }
      
      if (tenantBrandingBump) {
        // TODO: Implement tenant branding version bump
        // This would increment tenant.brandingVersion and invalidate all cards
      }
      
      res.json({ success: true, message: "Card invalidated" });
    } catch (error) {
      console.error('Error invalidating card:', error);
      res.status(500).json({ message: "Failed to invalidate card" });
    }
  });

  // Get current tenant for card preview
  app.get("/api/tenant/current", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.tenantId!);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  // Card management endpoints for admin
  app.get("/api/cards", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const cards = await storage.getAllCardsWithMembers(req.tenantId!);
      res.json(cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.get("/api/cards/stats", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const stats = await storage.getCardStats(req.tenantId!);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching card stats:', error);
      res.status(500).json({ message: "Failed to fetch card stats" });
    }
  });

  app.post("/api/cards/:memberId/create", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const { memberId } = req.params;
      const member = await storage.getMember(memberId);
      
      if (!member || member.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Check if card already exists
      const existingCard = await storage.getCardMetaByMember(memberId);
      if (existingCard) {
        return res.status(409).json({ message: "Card already exists for this member" });
      }

      const cardData = await cardService.getOrCreateCardMeta(memberId);
      if (cardData) {
        res.json({ success: true, message: "Card created", card: cardData });
      } else {
        res.status(500).json({ message: "Failed to create card" });
      }
    } catch (error) {
      console.error('Error creating card:', error);
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.post("/api/cards/:memberId/regenerate", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const { memberId } = req.params;
      const member = await storage.getMember(memberId);
      
      if (!member || member.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Member not found" });
      }

      const cardData = await cardService.getOrCreateCardMeta(memberId);
      if (cardData) {
        await cardService.invalidateCard(memberId);
        res.json({ success: true, message: "Card regenerated" });
      } else {
        res.status(500).json({ message: "Failed to regenerate card" });
      }
    } catch (error) {
      console.error('Error regenerating card:', error);
      res.status(500).json({ message: "Failed to regenerate card" });
    }
  });

  app.post("/api/cards/:memberId/deactivate", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const { memberId } = req.params;
      const member = await storage.getMember(memberId);
      
      if (!member || member.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Member not found" });
      }

      const cardMeta = await storage.getCardMetaByMember(memberId);
      if (cardMeta) {
        await storage.updateCardMeta(cardMeta.id, { status: 'VERLOPEN' });
        res.json({ success: true, message: "Card deactivated" });
      } else {
        res.status(404).json({ message: "Card not found" });
      }
    } catch (error) {
      console.error('Error deactivating card:', error);
      res.status(500).json({ message: "Failed to deactivate card" });
    }
  });

  // Rate limiting for card verification (in-memory)
  const verificationRateLimit = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  const RATE_LIMIT_MAX_REQUESTS = 30;

  function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const userLimit = verificationRateLimit.get(ip);
    
    if (!userLimit || now > userLimit.resetTime) {
      verificationRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      return true;
    }
    
    if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }

  // Card verification status logic
  function deriveCardStatus(cardMeta: any, member: any, fees?: any[]): 'ACTUEEL' | 'NIET_ACTUEEL' | 'VERLOPEN' {
    if (!member.active) {
      return 'VERLOPEN';
    }
    
    // Check if card is valid until date has passed
    if (cardMeta.validUntil && new Date(cardMeta.validUntil) < new Date()) {
      return 'VERLOPEN';
    }
    
    // Check card meta status
    if (cardMeta.status === 'VERLOPEN') {
      return 'VERLOPEN';
    }
    
    if (cardMeta.status === 'MOMENTOPNAME') {
      return 'NIET_ACTUEEL';
    }
    
    // Check if current year fees are paid (optional business logic)
    if (fees && fees.length > 0) {
      const currentYear = new Date().getFullYear();
      const currentYearFees = fees.filter(fee => {
        const feeYear = new Date(fee.periodStart).getFullYear();
        return feeYear === currentYear;
      });
      
      const hasPaidCurrentYear = currentYearFees.some(fee => fee.status === 'PAID');
      if (!hasPaidCurrentYear) {
        return 'NIET_ACTUEEL';
      }
    }
    
    return 'ACTUEEL';
  }

  // Public card verification API
  app.get("/api/card/verify/:qrToken", async (req, res) => {
    try {
      const { qrToken } = req.params;
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Rate limiting
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ 
          error: "Te veel verzoeken. Probeer later opnieuw." 
        });
      }

      // Validate qrToken format
      if (!qrToken || typeof qrToken !== 'string' || qrToken.length < 10) {
        return res.status(404).json({ 
          error: "Onbekende of ingetrokken code" 
        });
      }

      // Lookup card by qrToken
      const cardMeta = await storage.getCardMetaByQrToken(qrToken);
      if (!cardMeta) {
        return res.status(404).json({ 
          error: "Onbekende of ingetrokken code" 
        });
      }

      // Get member and tenant info
      const member = await storage.getMember(cardMeta.memberId);
      const tenant = await storage.getTenant(cardMeta.tenantId);
      
      if (!member || !tenant) {
        return res.status(404).json({ 
          error: "Onbekende of ingetrokken code" 
        });
      }

      // Get member fees for status calculation
      const memberFees = await storage.getMembershipFeesByMember(member.id);
      
      // Derive current status
      const status = deriveCardStatus(cardMeta, member, memberFees);
      
      // Format valid until date (Belgian format)
      const validUntil = cardMeta.validUntil ? 
        new Date(cardMeta.validUntil).toLocaleDateString('nl-BE', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          timeZone: 'Europe/Brussels'
        }) : null;

      // Check voting rights (default false if not set)
      const eligibleToVote = member.votingRights || false;

      // Get member category label
      const categoryLabels = {
        'STUDENT': 'Student',
        'STANDAARD': 'Volwassene', 
        'SENIOR': 'Senior'
      };
      const category = categoryLabels[member.category] || member.category;

      const response = {
        status,
        validUntil,
        eligibleToVote,
        member: {
          name: `${member.firstName} ${member.lastName}`,
          memberNumber: member.memberNumber,
          category
        },
        tenant: {
          name: tenant.name,
          logoUrl: tenant.logoUrl
        },
        refreshedAt: new Date().toISOString(),
        etag: cardMeta.etag
      };

      // Set headers
      res.set({
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
      });
      
      if (cardMeta.etag) {
        res.set('ETag', cardMeta.etag);
      }

      res.json(response);
      
    } catch (error) {
      console.error('Error in card verification:', error);
      res.status(500).json({ 
        error: "Er ging iets mis. Probeer opnieuw." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
