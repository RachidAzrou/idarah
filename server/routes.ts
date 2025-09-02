import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware } from "./middleware/auth";
import { tenantMiddleware } from "./middleware/tenant";
import { authService } from "./services/auth";
import { memberService } from "./services/member";
import { feeService } from "./services/fee";
import { financialService } from "./services/financial";
import { insertUserSchema, insertMemberSchema, insertMembershipFeeSchema } from "@shared/schema";
import { generateFeesHandler } from "./api/jobs/fees/generate";
import { createMemberHandler } from "./api/members/create";
import publicScreensRouter from "./routes/public-screens";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createMemberSchema = insertMemberSchema.omit({
  tenantId: true,
  memberNumber: true,
}).extend({
  birthDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
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
      const memberData = createMemberSchema.parse(req.body);
      const result = await memberService.createMember(req.tenantId!, memberData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(201).json(result.member);
    } catch (error) {
      console.error("Error creating member:", error);
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

  // Financial routes
  app.get("/api/transactions", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByTenant(req.tenantId!);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
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
      // This endpoint can store fee settings in tenant metadata or create a separate settings table
      // For now, we'll just return success as the settings are applied client-side
      res.json({ success: true, message: "Fee settings updated" });
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
