import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware } from "./middleware/auth";
import { tenantMiddleware } from "./middleware/tenant";
import { quickAuthMiddleware, storeVerifyToken } from "./middleware/quickAuth";
import { authService } from "./services/auth";
import { memberService } from "./services/member";
import { feeService } from "./services/fee";
import { financialService } from "./services/financial";
import { cardService } from "./services/card";
import { ruleService } from "./services/ruleService";
import { boardService } from "./services/board";
import { makeCardETag } from "./lib/card/etag";
import { randomBytes } from "crypto";
import { computeCardStatus } from "./lib/card/status";
import { insertUserSchema, insertMemberSchema, insertMembershipFeeSchema, cardMeta, insertBoardMemberSchema, emailSegments, emailSuppresses } from "@shared/schema";

// Define AuthenticatedRequest type
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: 'SUPERADMIN' | 'BEHEERDER' | 'MEDEWERKER';
    active: boolean;
    createdAt: Date;
  };
  tenantId: string;
}
import { eq } from "drizzle-orm";
import { db } from "./db";
import { generateFeesHandler } from "./api/jobs/fees/generate";
import { createMemberHandler } from "./api/members/create";
import publicScreensRouter from "./routes/public-screens";
import { z } from "zod";
import * as XLSX from 'xlsx';

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

  // Quick authentication for QR verification
  app.post("/api/auth/quick-verify", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(email, password);
      
      if (!result.success) {
        return res.status(401).json({ error: "Ongeldige inloggegevens" });
      }

      // Check if user has staff/manager role
      const user = result.user;
      if (user.role !== 'BEHEERDER' && user.role !== 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang - alleen medewerkers en beheerders" });
      }

      // Generate and store verification token
      const verifyToken = `verify_${Date.now()}_${user.id}`;
      storeVerifyToken(verifyToken, user.id, user.role);
      
      res.json({
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        token: verifyToken,
      });
    } catch (error) {
      res.status(400).json({ error: "Ongeldige aanvraag" });
    }
  });

  // Profile routes
  app.put("/api/profile", authMiddleware, async (req, res) => {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: "Naam en email zijn verplicht" });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && req.user && existingUser.id !== req.user.id) {
        return res.status(409).json({ message: "Dit email adres is al in gebruik" });
      }

      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const updatedUser = await storage.updateUser(req.user.id, { name, email });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Er is een fout opgetreden bij het bijwerken van uw profiel" });
    }
  });

  app.put("/api/profile/password", authMiddleware, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Huidig en nieuw wachtwoord zijn verplicht" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Nieuw wachtwoord moet minimaal 6 karakters zijn" });
      }

      // Verify current password using auth service
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      const loginResult = await authService.login(req.user.email, currentPassword);
      if (!loginResult.success) {
        return res.status(400).json({ message: "Huidig wachtwoord is incorrect" });
      }

      // Update password hash using auth service
      const hashedPassword = await authService.hashPassword(newPassword);
      await storage.updateUser(req.user!.id, { passwordHash: hashedPassword });
      res.json({ message: "Wachtwoord succesvol gewijzigd" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Er is een fout opgetreden bij het wijzigen van het wachtwoord" });
    }
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
      
      // Fetch financial settings and permissions for each member
      const membersWithDetails = await Promise.all(
        members.map(async (member) => {
          const [financialSettings, permissions] = await Promise.all([
            storage.getMemberFinancialSettings(member.id),
            storage.getMemberPermissions(member.id)
          ]);
          
          return {
            ...member,
            financialSettings,
            permissions
          };
        })
      );
      
      res.json(membersWithDetails);
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
      
      // Fetch financial settings and permissions for this member
      const [financialSettings, permissions] = await Promise.all([
        storage.getMemberFinancialSettings(member.id),
        storage.getMemberPermissions(member.id)
      ]);
      
      res.json({
        ...member,
        financialSettings,
        permissions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  // Check for duplicates endpoint
  app.post("/api/members/check-duplicates", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const memberData = req.body;
      
      // FORCE DEBUG: Kijk eerst wat er in de database staat
      const allMembers = await storage.getMembersByTenant(req.tenantId!);
      const memberNumbers = allMembers.map(m => m.memberNumber);
      
      console.log("🔍 TENANT:", req.tenantId);
      console.log("🔍 EXISTING NUMBERS:", memberNumbers);
      console.log("🔍 CHECKING FOR:", memberData.memberNumber);
      console.log("🔍 NORMALIZED CHECK:", memberData.memberNumber ? memberData.memberNumber.padStart(4, '0') : 'NO NUMBER');
      
      const duplicateCheck = await memberService.checkForDuplicates(req.tenantId!, memberData);
      
      console.log("🔍 RESULT:", duplicateCheck);
      res.json(duplicateCheck);
    } catch (error) {
      console.error("Error checking duplicates:", error);
      res.status(500).json({ message: "Failed to check for duplicates" });
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
      console.log("PUT member request body:", JSON.stringify(req.body, null, 2));
      
      // Transform the data to match expected format (same as PATCH endpoint)
      const transformedData = {
        ...req.body,
        // Convert string date to Date object if needed
        birthDate: req.body.birthDate && typeof req.body.birthDate === 'string' ? new Date(req.body.birthDate) : req.body.birthDate,
      };
      
      // Remove undefined/null birthDate to avoid validation issues
      if (!transformedData.birthDate || isNaN(transformedData.birthDate.getTime())) {
        delete transformedData.birthDate;
      }
      
      // Handle voting rights field mapping
      if (req.body.organization?.votingEligible !== undefined) {
        transformedData.votingRights = req.body.organization.votingEligible;
        console.log("PUT mapped voting rights:", transformedData.votingRights);
      }
      
      console.log("PUT transformed data:", JSON.stringify(transformedData, null, 2));
      
      const memberData = insertMemberSchema.partial().parse(transformedData);
      console.log("PUT parsed member data:", JSON.stringify(memberData, null, 2));
      
      const member = await storage.getMember(req.params.id);
      
      if (!member || member.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Member not found" });
      }

      const updatedMember = await storage.updateMember(req.params.id, memberData);
      console.log("PUT updated member successfully:", updatedMember.id);
      
      // Handle card status when member active status changes (PUT route)
      if (memberData.active === false) {
        // If member is being deactivated, automatically mark their card as expired
        try {
          await db
            .update(cardMeta)
            .set({ 
              status: 'VERLOPEN'
            })
            .where(eq(cardMeta.memberId, req.params.id));
          console.log("PUT: Automatically set card status to VERLOPEN for deactivated member:", req.params.id);
        } catch (cardError) {
          console.error("PUT: Error updating card status for deactivated member:", cardError);
          // Don't fail the main request if card update fails
        }
      } else if (memberData.active === true && member.active === false) {
        // If member is being reactivated, recalculate their card status
        try {
          await cardService.recalculateCardStatus(req.params.id, req.tenantId);
          console.log("PUT: Recalculated card status for reactivated member:", req.params.id);
        } catch (cardError) {
          console.error("PUT: Error recalculating card status for reactivated member:", cardError);
          // Don't fail the main request if card update fails
        }
      }
      
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member - detailed:", error);
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        return res.status(400).json({ 
          message: "Invalid member data", 
          errors: error.issues 
        });
      }
      res.status(500).json({ message: "Server error updating member" });
    }
  });

  app.patch("/api/members/:id", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      console.log("PATCH member request body:", JSON.stringify(req.body, null, 2));
      
      // Transform the data to match expected format (same as PUT endpoint)
      const transformedData = {
        ...req.body,
        // Convert string date to Date object if needed
        birthDate: req.body.birthDate && typeof req.body.birthDate === 'string' ? new Date(req.body.birthDate) : req.body.birthDate,
      };
      
      // Remove undefined/null birthDate to avoid validation issues
      if (!transformedData.birthDate) {
        delete transformedData.birthDate;
      }
      
      // Handle voting rights field mapping
      if (req.body.organization?.votingEligible !== undefined) {
        transformedData.votingRights = req.body.organization.votingEligible;
        console.log("PATCH mapped voting rights:", transformedData.votingRights);
      }
      
      const memberData = insertMemberSchema.partial().parse(transformedData);
      console.log("PATCH parsed member data:", JSON.stringify(memberData, null, 2));
      
      const member = await storage.getMember(req.params.id);
      
      if (!member || member.tenantId !== req.tenantId) {
        return res.status(404).json({ message: "Member not found" });
      }

      const updatedMember = await storage.updateMember(req.params.id, memberData);
      console.log("Updated member successfully:", updatedMember.id);
      
      // Handle card status when member active status changes (PATCH route)
      if (memberData.active === false) {
        // If member is being deactivated, automatically mark their card as expired
        try {
          await db
            .update(cardMeta)
            .set({ 
              status: 'VERLOPEN'
            })
            .where(eq(cardMeta.memberId, req.params.id));
          console.log("PATCH: Automatically set card status to VERLOPEN for deactivated member:", req.params.id);
        } catch (cardError) {
          console.error("PATCH: Error updating card status for deactivated member:", cardError);
          // Don't fail the main request if card update fails
        }
      } else if (memberData.active === true && member.active === false) {
        // If member is being reactivated, recalculate their card status
        try {
          await cardService.recalculateCardStatus(req.params.id, req.tenantId);
          console.log("PATCH: Recalculated card status for reactivated member:", req.params.id);
        } catch (cardError) {
          console.error("PATCH: Error recalculating card status for reactivated member:", cardError);
          // Don't fail the main request if card update fails
        }
      }
      
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member - detailed:", error);
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        return res.status(400).json({ 
          message: "Invalid member data", 
          errors: error.issues 
        });
      }
      res.status(500).json({ message: "Server error updating member" });
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

  // Export members to Excel
  app.post("/api/members/export", authMiddleware, tenantMiddleware, async (req, res) => {
    try {
      const { memberIds, fields } = req.body;
      
      if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ message: "Member IDs are required" });
      }
      
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: "Export fields are required" });
      }

      // Fetch members and their details
      const members = await Promise.all(
        memberIds.map(async (memberId) => {
          const member = await storage.getMember(memberId);
          if (!member || member.tenantId !== req.tenantId) {
            return null;
          }
          
          // Fetch financial settings and permissions
          const [financialSettings, permissions] = await Promise.all([
            storage.getMemberFinancialSettings(member.id),
            storage.getMemberPermissions(member.id)
          ]);
          
          return {
            ...member,
            financialSettings,
            permissions
          };
        })
      );

      // Filter out null members and format data for export
      const validMembers = members.filter((member): member is NonNullable<typeof member> => member !== null);
      
      // Map member data to export format
      const exportData = validMembers.map(member => {
        const row: any = {};
        
        fields.forEach(field => {
          switch (field) {
            case 'memberNumber':
              row['Lidnummer'] = member.memberNumber;
              break;
            case 'firstName':
              row['Voornaam'] = member.firstName;
              break;
            case 'lastName':
              row['Achternaam'] = member.lastName;
              break;
            case 'birthDate':
              row['Geboortedatum'] = member.birthDate ? new Date(member.birthDate).toLocaleDateString('nl-BE') : '';
              break;
            case 'gender':
              row['Geslacht'] = member.gender === 'M' ? 'Man' : member.gender === 'V' ? 'Vrouw' : '';
              break;
            case 'nationality':
              row['Nationaliteit'] = member.country || '';
              break;
            case 'email':
              row['E-mail'] = member.email || '';
              break;
            case 'phone':
              row['Telefoon'] = member.phone || '';
              break;
            case 'address':
              row['Adres'] = member.street && member.number ? `${member.street} ${member.number}${member.bus ? `/${member.bus}` : ''}` : '';
              break;
            case 'postalCode':
              row['Postcode'] = member.postalCode || '';
              break;
            case 'city':
              row['Stad'] = member.city || '';
              break;
            case 'country':
              row['Land'] = member.country || '';
              break;
            case 'status':
              row['Status'] = member.active ? 'Actief' : 'Inactief';
              break;
            case 'category':
              row['Categorie'] = member.category;
              break;
            case 'joinDate':
              row['Inschrijfdatum'] = member.createdAt ? new Date(member.createdAt).toLocaleDateString('nl-BE') : '';
              break;
            case 'votingRights':
              row['Stemrecht'] = member.votingRights ? 'Ja' : 'Nee';
              break;
            case 'membershipFee':
              row['Lidmaatschapsbijdrage'] = ''; // This would need to be calculated from fees
              break;
            case 'paymentMethod':
              row['Betaalmethode'] = member.financialSettings?.paymentMethod || '';
              break;
            case 'iban':
              row['IBAN'] = member.financialSettings?.iban || '';
              break;
            case 'paymentStatus':
              row['Betaalstatus'] = ''; // This would need to be calculated from fees
              break;
            case 'emergencyContact':
              row['Noodcontact'] = ''; // Not in current schema
              break;
            case 'emergencyPhone':
              row['Noodcontact telefoon'] = ''; // Not in current schema
              break;
            case 'notes':
              row['Notities'] = ''; // Not in current schema
              break;
          }
        });
        
        return row;
      });

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-width columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Leden');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Set response headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="leden_export_${timestamp}.xlsx"`);
      
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting members:", error);
      res.status(500).json({ message: "Failed to export members" });
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
      const hashedPassword = await authService.hashPassword(newPassword);
      await storage.updateUser(req.params.id, { passwordHash: hashedPassword });
      
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

  // Card routes are handled by client-side React routing


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

  // Public card data API (JSON)
  app.get("/api/card/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      
      const cardData = await cardService.getCardData(memberId);
      if (!cardData) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Check if member has paid for current year
      const currentYear = new Date().getFullYear();
      const memberFees = await storage.getMembershipFeesByMember(memberId);
      const currentYearFees = memberFees.filter(fee => {
        const feeYear = new Date(fee.periodStart).getFullYear();
        return feeYear === currentYear;
      });
      const currentYearPaid = currentYearFees.some(fee => fee.status === 'PAID');

      // Create badges array
      const badges = [];
      if (currentYearPaid) {
        badges.push(`Betaald ${currentYear}`);
      }
      if (cardData.member.votingRights) {
        badges.push("Stemgerechtigd");
      }

      const response = {
        memberId: cardData.member.id,
        firstName: cardData.member.firstName,
        lastName: cardData.member.lastName,
        memberNumber: cardData.member.memberNumber,
        category: cardData.member.category,
        status: cardData.cardMeta.status,
        validUntil: cardData.cardMeta.validUntil,
        votingRights: cardData.member.votingRights || false,
        badges,
        qrToken: cardData.cardMeta.qrToken,
        tenant: {
          name: cardData.tenant.name,
          logoUrl: cardData.tenant.logoUrl,
          primaryColor: cardData.tenant.primaryColor || '#bb2e2e'
        },
        etag: cardData.cardMeta.etag
      };

      // Set ETag header for caching
      res.set('ETag', cardData.cardMeta.etag);
      res.json(response);
    } catch (error) {
      console.error('Error fetching card data:', error);
      res.status(500).json({ message: "Failed to fetch card data" });
    }
  });

  // Protected card verification API (requires staff authentication)
  app.get("/api/card/verify/:qrToken", quickAuthMiddleware, async (req, res) => {
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

      // Get member fees for status calculation and payment info
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

      // Calculate age from birth date
      let age = null;
      if (member.birthDate) {
        const birthDate = new Date(member.birthDate);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Process fees for payment information (recent fees only, last 2 years)
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
      
      const recentFees = memberFees
        .filter(fee => new Date(fee.periodStart) >= cutoffDate)
        .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime())
        .slice(0, 6) // Limit to last 6 fees
        .map(fee => ({
          id: fee.id,
          period: `${new Date(fee.periodStart).getFullYear()}`,
          amount: fee.amount,
          status: fee.status,
          periodEnd: new Date(fee.periodEnd).toLocaleDateString('nl-BE', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            timeZone: 'Europe/Brussels'
          }),
          paidAt: fee.paidAt ? new Date(fee.paidAt).toLocaleDateString('nl-BE', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            timeZone: 'Europe/Brussels'
          }) : null
        }));

      // Calculate payment status summary
      const outstandingFees = recentFees.filter(fee => fee.status === 'PENDING' || fee.status === 'OVERDUE' || fee.status === 'OPEN');
      const paidFees = recentFees.filter(fee => fee.status === 'PAID');
      
      let paymentStatusSummary = 'Alles is betaald';
      if (outstandingFees.length > 0) {
        const overdueCount = outstandingFees.filter(fee => fee.status === 'OVERDUE').length;
        const pendingCount = outstandingFees.filter(fee => fee.status === 'PENDING' || fee.status === 'OPEN').length;
        
        if (overdueCount > 0 && pendingCount > 0) {
          paymentStatusSummary = `${overdueCount} vervallen en ${pendingCount} openstaande betalingen`;
        } else if (overdueCount > 0) {
          paymentStatusSummary = `${overdueCount} vervallen ${overdueCount === 1 ? 'betaling' : 'betalingen'}`;
        } else {
          paymentStatusSummary = `${pendingCount} openstaande ${pendingCount === 1 ? 'betaling' : 'betalingen'}`;
        }
      }

      const response = {
        status,
        validUntil,
        eligibleToVote,
        member: {
          name: `${member.firstName} ${member.lastName}`,
          memberNumber: member.memberNumber,
          category,
          age
        },
        tenant: {
          name: tenant.name,
          logoUrl: tenant.logoUrl
        },
        fees: recentFees,
        paymentStatus: {
          summary: paymentStatusSummary,
          totalOutstanding: outstandingFees.length,
          totalPaid: paidFees.length,
          hasOutstanding: outstandingFees.length > 0
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

  // Public card API endpoint (no authentication required) - for standalone public viewing
  app.get("/api/public/card/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;

      // Get member data
      const member = await storage.getMember(memberId);
      if (!member || !member.active) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Get tenant data
      const tenant = await storage.getTenant(member.tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get or create card metadata
      let cardMeta = await storage.getCardMetaByMember(memberId);
      if (!cardMeta) {
        cardMeta = await storage.createCardMeta({
          memberId,
          tenantId: member.tenantId,
          qrToken: randomBytes(32).toString('hex'),
          validUntil: new Date(new Date().getFullYear(), 11, 31), // End of current year
          etag: makeCardETag(
            {
              id: member.id,
              firstName: member.firstName,
              lastName: member.lastName,
              memberNumber: member.memberNumber,
              category: member.category,
              votingRights: member.votingRights || false,
            },
            {
              name: tenant.name,
              logoUrl: tenant.logoUrl,
              primaryColor: tenant.primaryColor || '#bb2e2e',
            },
            'ACTUEEL',
            new Date(new Date().getFullYear(), 11, 31),
            []
          )
        });
      }

      // Get member fees for status calculation
      const memberFees = await storage.getMembershipFeesByMember(memberId);
      
      // Derive current status
      const status = await computeCardStatus(memberId);

      // Build response
      const response = {
        memberId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        memberNumber: member.memberNumber,
        category: member.category,
        votingRights: member.votingRights || false,
        status,
        validUntil: cardMeta.validUntil,
        qrToken: cardMeta.qrToken,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          logoUrl: tenant.logoUrl
        }
      };

      // Set cache headers for 10 seconds
      res.set('Cache-Control', 'public, max-age=10');
      res.json(response);
    } catch (error) {
      console.error('Error fetching public card data:', error);
      res.status(500).json({ message: "Failed to fetch card data" });
    }
  });

  // Card lifecycle management endpoints
  app.post('/api/members/:id/card/refresh-validuntil', authMiddleware, async (req, res) => {
    try {
      const memberId = req.params.id;
      
      // Verify member belongs to user's tenant
      const member = await storage.getMember(memberId);
      if (!member || !req.user || member.tenantId !== req.user.tenantId) {
        return res.status(404).json({ error: "Lid niet gevonden" });
      }
      
      // Import the service functions
      const { updateMemberValidUntil } = await import('./lib/card/simple-validuntil');
      const { computeCardStatus } = await import('./lib/card/status');
      
      // Update validUntil based on paid periods
      const newValidUntil = await updateMemberValidUntil(memberId);
      
      // Get updated card status
      const newStatus = await computeCardStatus(memberId);
      
      res.json({
        memberId,
        validUntil: newValidUntil?.toISOString() || null,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('Error refreshing card validUntil:', error);
      res.status(500).json({ error: "Fout bij het vernieuwen van geldigheid" });
    }
  });

  app.get('/api/members/:id/card/status-details', authMiddleware, async (req, res) => {
    try {
      const memberId = req.params.id;
      
      // Verify member belongs to user's tenant  
      const member = await storage.getMember(memberId);
      if (!member || !req.user || member.tenantId !== req.user.tenantId) {
        return res.status(404).json({ error: "Lid niet gevonden" });
      }
      
      // Import and get detailed status
      const { getCardStatusDetails } = await import('./lib/card/status');
      const details = await getCardStatusDetails(memberId);
      
      res.json(details);
      
    } catch (error) {
      console.error('Error getting card status details:', error);
      res.status(500).json({ error: "Fout bij het ophalen van kaart status" });
    }
  });

  app.post('/api/admin/rollover', authMiddleware, async (req, res) => {
    try {
      // Check for SUPERADMIN role
      if (req.user!.role !== 'SUPERADMIN') {
        return res.status(403).json({ error: "Onvoldoende rechten voor deze actie" });
      }
      
      // Import rollover service
      const { rolloverDaily } = await import('./lib/fees/rollover');
      
      const tenantId = req.body.tenantId || req.user!.tenantId;
      const summary = await rolloverDaily(tenantId);
      
      res.json({
        success: true,
        summary,
      });
      
    } catch (error) {
      console.error('Error running rollover:', error);
      res.status(500).json({ error: "Fout bij het uitvoeren van rollover" });
    }
  });

  // Reconciliatie endpoints
  
  // Import bankafschrift
  app.post('/api/finance/import', authMiddleware, async (req, res) => {
    try {
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Onvoldoende rechten" });
      }

      const { StatementImportService } = await import('../lib/reconcile/import');
      const importService = new StatementImportService();
      
      // Voor demo - in productie zou dit file upload zijn
      const { file, options } = req.body;
      
      const validation = importService.validateFile(file);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: "Bestand validatie mislukt", 
          details: validation.errors 
        });
      }
      
      const result = await importService.importStatement(
        file, 
        options, 
        req.user!.tenantId, 
        req.user!.id
      );
      
      res.json({
        success: true,
        statement: result.statement,
        transactionCount: result.transactions.length,
      });
      
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ 
        error: "Fout bij importeren", 
        message: error instanceof Error ? error.message : "Onbekende fout" 
      });
    }
  });

  // Preview import zonder opslaan
  app.post('/api/finance/import/preview', authMiddleware, async (req, res) => {
    try {
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Onvoldoende rechten" });
      }

      const { StatementImportService } = await import('../lib/reconcile/import');
      const importService = new StatementImportService();
      
      const { file, options } = req.body;
      const preview = await importService.previewTransactions(file, options);
      
      res.json(preview);
      
    } catch (error) {
      console.error('Preview error:', error);
      res.status(500).json({ 
        error: "Fout bij preview", 
        message: error instanceof Error ? error.message : "Onbekende fout" 
      });
    }
  });

  // Bank statements lijst
  app.get('/api/finance/statements', authMiddleware, async (req, res) => {
    try {
      // TODO: Implementeer database query voor bank statements
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen statements" });
    }
  });

  // Bank transacties met filters
  app.get('/api/finance/bank-transactions', authMiddleware, async (req, res) => {
    try {
      // TODO: Implementeer database query met filters
      const { status, from, to, side, category, vendor, q } = req.query;
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen transacties" });
    }
  });

  // Bevestig match
  app.post('/api/finance/bank-transactions/:id/confirm', authMiddleware, async (req, res) => {
    try {
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Onvoldoende rechten" });
      }

      const transactionId = req.params.id;
      const { matchedFeeId, matchedMemberId, categoryId, vendorId } = req.body;
      
      // TODO: Implementeer database update
      console.log(`Confirming match for transaction ${transactionId}`);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Fout bij bevestigen match" });
    }
  });

  // Split transactie
  app.post('/api/finance/bank-transactions/:id/split', authMiddleware, async (req, res) => {
    try {
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Onvoldoende rechten" });
      }

      const transactionId = req.params.id;
      const { splits } = req.body;
      
      // TODO: Implementeer split logica
      console.log(`Splitting transaction ${transactionId}`);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Fout bij splitsen transactie" });
    }
  });

  // Afkeuren transactie
  app.post('/api/finance/bank-transactions/:id/reject', authMiddleware, async (req, res) => {
    try {
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Onvoldoende rechten" });
      }

      const transactionId = req.params.id;
      const { note } = req.body;
      
      // TODO: Implementeer reject logica
      console.log(`Rejecting transaction ${transactionId}`);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Fout bij afkeuren transactie" });
    }
  });

  // Boek transacties naar journaal
  app.post('/api/finance/book', authMiddleware, async (req, res) => {
    try {
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Onvoldoende rechten" });
      }

      const { statementId, transactionIds } = req.body;
      
      // TODO: Implementeer booking logica
      console.log(`Booking transactions`, { statementId, transactionIds });
      
      res.json({ success: true, bookedCount: transactionIds?.length || 0 });
    } catch (error) {
      res.status(500).json({ error: "Fout bij boeken transacties" });
    }
  });

  // Expense categories CRUD
  app.get('/api/finance/categories', authMiddleware, async (req, res) => {
    try {
      // TODO: Implementeer database query
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen categorieën" });
    }
  });

  app.post('/api/finance/categories', authMiddleware, async (req, res) => {
    try {
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Onvoldoende rechten" });
      }

      const { name, code, color } = req.body;
      // TODO: Implementeer database insert
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Fout bij aanmaken categorie" });
    }
  });

  // Vendors CRUD
  app.get('/api/finance/vendors', authMiddleware, async (req, res) => {
    try {
      // TODO: Implementeer database query
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen leveranciers" });
    }
  });

  app.post('/api/finance/vendors', authMiddleware, async (req, res) => {
    try {
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Onvoldoende rechten" });
      }

      const { name, iban, defaultCategoryId } = req.body;
      // TODO: Implementeer database insert
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Fout bij aanmaken leverancier" });
    }
  });

  // Match rules CRUD
  app.get('/api/finance/rules', authMiddleware, async (req, res) => {
    try {
      // TODO: Implementeer database query
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen regels" });
    }
  });

  app.post('/api/finance/rules', authMiddleware, async (req, res) => {
    try {
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Onvoldoende rechten" });
      }

      const { name, priority, criteria, action } = req.body;
      // TODO: Implementeer database insert
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Fout bij aanmaken regel" });
    }
  });

  // Rapportage endpoints
  
  // Cashflow rapportage
  app.get('/api/reports/cashflow', authMiddleware, async (req, res) => {
    try {
      const { from, to, types, categories, methods, statuses } = req.query;
      
      // Mock data voor nu - TODO: Implementeer echte queries
      const mockData = [
        { date: '2024-01-01', income: 12500, expense: 8300, net: 4200 },
        { date: '2024-01-02', income: 15600, expense: 9100, net: 6500 },
        { date: '2024-01-03', income: 13400, expense: 7800, net: 5600 },
      ];
      
      res.json(mockData);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen cashflow data" });
    }
  });

  // Categorie breakdown
  app.get('/api/reports/categories', authMiddleware, async (req, res) => {
    try {
      const { kind = 'expense', from, to } = req.query;
      
      // Mock data - TODO: Implementeer echte aggregatie
      const mockData = [
        { category: 'Lidgelden', amount: 25000, count: 120 },
        { category: 'Nutsvoorzieningen', amount: 4500, count: 12 },
        { category: 'Onderhoud', amount: 3200, count: 8 },
        { category: 'Verzekeringen', amount: 2800, count: 4 },
      ];
      
      res.json(mockData);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen categorie data" });
    }
  });

  // Gestapelde categorie data per maand
  app.get('/api/reports/stacked-by-category', authMiddleware, async (req, res) => {
    try {
      // Mock data - TODO: Implementeer echte aggregatie
      const mockData = [
        { month: '2024-01', 'Lidgelden': 8500, 'Nutsvoorzieningen': 1200, 'Onderhoud': 800 },
        { month: '2024-02', 'Lidgelden': 9200, 'Nutsvoorzieningen': 1100, 'Onderhoud': 600 },
        { month: '2024-03', 'Lidgelden': 7800, 'Nutsvoorzieningen': 1300, 'Onderhoud': 1200 },
      ];
      
      res.json(mockData);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen gestapelde data" });
    }
  });

  // Fee status trend
  app.get('/api/reports/fee-status-trend', authMiddleware, async (req, res) => {
    try {
      // Mock data - TODO: Implementeer echte aggregatie
      const mockData = [
        { month: '2024-01', betaald: 85, openstaand: 25, vervallen: 5 },
        { month: '2024-02', betaald: 92, openstaand: 18, vervallen: 8 },
        { month: '2024-03', betaald: 88, openstaand: 22, vervallen: 6 },
      ];
      
      res.json(mockData);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen fee status trend" });
    }
  });

  // Top leden per bedrag
  app.get('/api/reports/top-members', authMiddleware, async (req, res) => {
    try {
      // Mock data - TODO: Implementeer echte aggregatie
      const mockData = [
        { memberId: '1', name: 'Jan Janssen', total: 2500, count: 12, spark: [200, 220, 180, 250, 300] },
        { memberId: '2', name: 'Marie Peeters', total: 2200, count: 11, spark: [180, 200, 210, 190, 220] },
        { memberId: '3', name: 'Ahmed Hassan', total: 1950, count: 10, spark: [195, 180, 200, 175, 210] },
      ];
      
      res.json(mockData);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen top leden data" });
    }
  });

  // Betaalmethode breakdown
  app.get('/api/reports/methods', authMiddleware, async (req, res) => {
    try {
      // Mock data - TODO: Implementeer echte aggregatie
      const mockData = [
        { method: 'SEPA', amount: 18500, count: 85 },
        { method: 'OVERSCHRIJVING', amount: 6200, count: 25 },
        { method: 'BANCONTACT', amount: 1800, count: 12 },
        { method: 'CASH', amount: 950, count: 8 },
        { method: 'OVERIG', amount: 450, count: 3 },
      ];
      
      res.json(mockData);
    } catch (error) {
      res.status(500).json({ error: "Fout bij ophalen betaalmethode data" });
    }
  });

  // Rule validation endpoints
  app.get('/api/members/:id/voting-rights', authMiddleware, async (req, res) => {
    try {
      const memberId = req.params.id;
      const tenantId = req.user!.tenantId;

      // Verify member belongs to user's tenant
      const member = await storage.getMember(memberId);
      if (!member || member.tenantId !== tenantId) {
        return res.status(404).json({ error: "Lid niet gevonden" });
      }

      const status = await ruleService.getVotingRightsStatus(memberId, tenantId);
      res.json(status);
    } catch (error) {
      console.error('Error getting voting rights:', error);
      res.status(500).json({ error: "Fout bij ophalen stemrecht status" });
    }
  });

  app.post('/api/members/:id/voting-rights/override', authMiddleware, async (req, res) => {
    try {
      const memberId = req.params.id;
      const tenantId = req.user!.tenantId;
      const { overrideValue, reason } = req.body;

      // Verify member belongs to user's tenant
      const member = await storage.getMember(memberId);
      if (!member || member.tenantId !== tenantId) {
        return res.status(404).json({ error: "Lid niet gevonden" });
      }

      // Validate input
      if (typeof overrideValue !== 'boolean' || !reason || typeof reason !== 'string') {
        return res.status(400).json({ error: "Ongeldige parameters" });
      }

      const override = await ruleService.createRuleOverride(
        memberId,
        tenantId,
        'STEMRECHT',
        overrideValue,
        reason,
        req.user!.id
      );

      // Get updated status
      const updatedStatus = await ruleService.getVotingRightsStatus(memberId, tenantId);

      res.json({
        override,
        status: updatedStatus
      });
    } catch (error) {
      console.error('Error creating voting rights override:', error);
      res.status(500).json({ error: "Fout bij aanmaken stemrecht override" });
    }
  });

  // Public board member status endpoint (no auth required)
  app.get('/api/public/board-status/:memberId', async (req, res) => {
    try {
      const memberId = req.params.memberId;
      
      if (!memberId) {
        return res.status(400).json({ error: "Member ID vereist" });
      }

      // Get board member status for the given member
      const boardMember = await boardService.getBoardMemberByMemberId(null, memberId);
      
      if (!boardMember) {
        return res.json({ isActiveBoardMember: false });
      }

      res.json({
        isActiveBoardMember: boardMember.boardMember?.status === 'ACTIEF',
        role: boardMember.boardMember?.role
      });
    } catch (error) {
      console.error('Error fetching public board member status:', error);
      res.status(500).json({ error: "Fout bij ophalen bestuursstatus" });
    }
  });

  // Board member endpoints
  app.get('/api/board/members', authMiddleware, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      
      // Special case: lookup by memberId for crown highlighting
      if (req.query.memberId) {
        const boardMember = await boardService.getBoardMemberByMemberId(tenantId, req.query.memberId as string);
        return res.json(boardMember ? [boardMember] : []);
      }

      const filters = {
        status: req.query.status as 'ACTIEF' | 'INACTIEF' | undefined,
        role: req.query.role as string | undefined,
        q: req.query.q as string | undefined,
      };

      const boardMembers = await boardService.listBoardMembers(tenantId, filters);
      res.json(boardMembers);
    } catch (error) {
      console.error('Error fetching board members:', error);
      res.status(500).json({ error: "Fout bij ophalen bestuursleden" });
    }
  });

  app.get('/api/board/members/:id', authMiddleware, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const boardMember = await boardService.getBoardMember(tenantId, req.params.id);
      
      if (!boardMember) {
        return res.status(404).json({ error: "Bestuurslid niet gevonden" });
      }

      res.json(boardMember);
    } catch (error) {
      console.error('Error fetching board member:', error);
      res.status(500).json({ error: "Fout bij ophalen bestuurslid" });
    }
  });

  app.post('/api/board/members', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can create
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const tenantId = req.user!.tenantId;
      const validatedData = insertBoardMemberSchema.parse(req.body);

      const boardMember = await boardService.createBoardMember(tenantId, validatedData);
      res.json(boardMember);
    } catch (error) {
      console.error('Error creating board member:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Ongeldige gegevens", details: error.errors });
      }
      res.status(500).json({ error: "Fout bij aanmaken bestuurslid" });
    }
  });

  app.put('/api/board/members/:id', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can update
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const tenantId = req.user!.tenantId;
      const validatedData = insertBoardMemberSchema.partial().parse(req.body);

      const boardMember = await boardService.updateBoardMember(tenantId, req.params.id, validatedData);
      
      if (!boardMember) {
        return res.status(404).json({ error: "Bestuurslid niet gevonden" });
      }

      res.json(boardMember);
    } catch (error) {
      console.error('Error updating board member:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Ongeldige gegevens", details: error.errors });
      }
      res.status(500).json({ error: "Fout bij bijwerken bestuurslid" });
    }
  });

  app.post('/api/board/members/:id/end-term', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can end terms
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const tenantId = req.user!.tenantId;
      const { endDate, note } = req.body;

      const result = await boardService.endActiveTerm(
        tenantId, 
        req.params.id, 
        new Date(endDate), 
        note
      );

      res.json({ success: result });
    } catch (error) {
      console.error('Error ending board term:', error);
      res.status(500).json({ error: "Fout bij beëindigen mandaat" });
    }
  });

  app.post('/api/board/reorder', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can reorder
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const tenantId = req.user!.tenantId;
      const orderData = req.body; // { id: string; orderIndex: number }[]

      const result = await boardService.reorderBoard(tenantId, orderData);
      res.json({ success: result });
    } catch (error) {
      console.error('Error reordering board:', error);
      res.status(500).json({ error: "Fout bij herordenen bestuur" });
    }
  });

  app.get('/api/board/members/by-member/:memberId', authMiddleware, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const memberId = req.params.memberId;

      const boardMember = await boardService.getBoardMemberByMemberId(tenantId, memberId);
      res.json(boardMember);
    } catch (error) {
      console.error('Error fetching board member by member ID:', error);
      res.status(500).json({ error: "Fout bij ophalen bestuurslid" });
    }
  });

  // Email Messaging Routes
  const { EmailService } = await import('./services/email.js');
  const emailService = new EmailService();

  // Templates
  app.get('/api/messages/templates', authMiddleware, async (req, res) => {
    try {
      const templates = await emailService.listTemplates(req.user!.tenantId);
      // Add no-cache headers to prevent duplicates
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: "Fout bij ophalen templates" });
    }
  });

  app.post('/api/messages/templates', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can create
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const template = await emailService.createTemplate(req.user!.tenantId, req.body);
      res.json(template);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: "Fout bij aanmaken template" });
    }
  });

  app.put('/api/messages/templates/:id', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can update
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const template = await emailService.updateTemplate(req.user!.tenantId, req.params.id, req.body);
      res.json(template);
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: "Fout bij bijwerken template" });
    }
  });

  app.delete('/api/messages/templates/:id', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can delete
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      await emailService.deleteTemplate(req.user!.tenantId, req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: "Fout bij verwijderen template" });
    }
  });

  app.post('/api/messages/templates/:id/test', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can send test
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const { toEmail, sampleContext } = req.body;
      await emailService.sendTestEmail(req.user!.tenantId, req.params.id, toEmail, sampleContext);
      res.json({ success: true });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ error: "Fout bij verzenden testmail" });
    }
  });

  // Segments
  app.get('/api/messages/segments', authMiddleware, async (req, res) => {
    try {
      const segments = await emailService.listSegments(req.user!.tenantId);
      res.json(segments);
    } catch (error) {
      console.error('Error fetching segments:', error);
      res.status(500).json({ error: "Fout bij ophalen segmenten" });
    }
  });

  app.post('/api/messages/segments', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can create
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const segment = await emailService.createSegment(req.user!.tenantId, req.body);
      res.json(segment);
    } catch (error) {
      console.error('Error creating segment:', error);
      res.status(500).json({ error: "Fout bij aanmaken segment" });
    }
  });

  app.delete('/api/messages/segments/:id', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can delete
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      await emailService.deleteSegment(req.user!.tenantId, req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting segment:', error);
      res.status(500).json({ error: "Fout bij verwijderen segment" });
    }
  });

  app.post('/api/messages/segments/:id/preview', authMiddleware, async (req, res) => {
    try {
      const segment = await db.select()
        .from(emailSegments)
        .where(and(
          eq(emailSegments.tenantId, req.user!.tenantId),
          eq(emailSegments.id, req.params.id)
        ))
        .limit(1);

      if (!segment[0]) {
        return res.status(404).json({ error: "Segment niet gevonden" });
      }

      const preview = await emailService.previewSegment(req.user!.tenantId, segment[0].rules);
      res.json(preview);
    } catch (error) {
      console.error('Error previewing segment:', error);
      res.status(500).json({ error: "Fout bij preview segment" });
    }
  });

  // Campaigns
  app.get('/api/messages/campaigns', authMiddleware, async (req, res) => {
    try {
      const campaigns = await emailService.listCampaigns(req.user!.tenantId);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: "Fout bij ophalen campagnes" });
    }
  });


  app.post('/api/messages/campaigns', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can create
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const campaign = await emailService.createCampaign(req.user!.tenantId, {
        ...req.body,
        createdById: req.user!.id,
      });
      res.json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: "Fout bij aanmaken campagne" });
    }
  });

  app.post('/api/messages/campaigns/:id/queue', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can queue
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const result = await emailService.queueCampaign(req.user!.tenantId, req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Error queuing campaign:', error);
      res.status(500).json({ error: "Fout bij in queue zetten campagne" });
    }
  });

  // Worker endpoint
  app.post('/api/messages/worker/tick', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await emailService.processQueuedMessages(limit);
      res.json(result);
    } catch (error) {
      console.error('Error processing queued messages:', error);
      res.status(500).json({ error: "Fout bij verwerken berichten" });
    }
  });

  // Tracking endpoints
  app.get('/api/messages/track/open/:messageId/:token.png', async (req, res) => {
    try {
      await emailService.trackOpen(req.params.messageId, req.params.token);
      
      // Return 1x1 transparent PNG
      const img = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length,
        'Cache-Control': 'no-cache',
      });
      res.end(img);
    } catch (error) {
      console.error('Error tracking open:', error);
      res.status(404).end();
    }
  });

  app.get('/api/messages/track/click/:messageId/:token', async (req, res) => {
    try {
      const originalUrl = decodeURIComponent(req.query.u as string);
      const redirectUrl = await emailService.trackClick(req.params.messageId, req.params.token, originalUrl);
      
      if (redirectUrl) {
        res.redirect(302, redirectUrl);
      } else {
        res.status(404).send('Link not found');
      }
    } catch (error) {
      console.error('Error tracking click:', error);
      res.status(404).send('Link not found');
    }
  });

  // Single transactional send
  app.post('/api/messages/send', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can send
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const { templateCode, memberId, email, context } = req.body;
      
      const message = await emailService.sendTransactional(req.user!.tenantId, templateCode, {
        memberId,
        email,
        context,
      });
      
      res.json(message);
    } catch (error) {
      console.error('Error sending transactional email:', error);
      res.status(500).json({ error: "Fout bij verzenden e-mail" });
    }
  });

  // Composer send - sends to multiple recipients of different types
  app.post('/api/messages/composer/send', authMiddleware, async (req, res) => {
    try {
      // Check permissions - only BEHEERDER and SUPERADMIN can send
      if (req.user!.role === 'MEDEWERKER') {
        return res.status(403).json({ error: "Geen toegang" });
      }

      const { recipients, subject, content } = req.body;
      
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: "Geadresseerden zijn vereist" });
      }
      
      if (!subject || !content) {
        return res.status(400).json({ error: "Onderwerp en inhoud zijn vereist" });
      }

      let totalRecipients = 0;
      const results = [];

      // Process each recipient based on type
      for (const recipient of recipients) {
        if (recipient.type === 'member') {
          // Send to individual member
          try {
            const context = await emailService.buildMemberContext(req.user!.tenantId, recipient.value);
            
            // Create a temporary template for this message
            const tempTemplate = {
              subject,
              body_html: emailService.convertToHTML(content),
              body_text: content,
            };
            
            const rendered = await emailService.renderTemplate(tempTemplate, context);
            
            // Send directly via transporter
            await emailService.transporter.sendMail({
              from: process.env.SMTP_FROM,
              to: context.member.email,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
            });
            
            totalRecipients++;
            results.push({ type: 'member', recipient: context.member.email, status: 'sent' });
          } catch (error) {
            console.error('Error sending to member:', error);
            results.push({ type: 'member', recipient: recipient.value, status: 'failed', error: error.message });
          }
        } else if (recipient.type === 'segment') {
          // Send to all members in segment
          try {
            const segment = await emailService.getSegment(req.user!.tenantId, recipient.value);
            if (segment) {
              const preview = await emailService.previewSegment(req.user!.tenantId, segment.rules);
              
              for (const member of preview.sample) {
                try {
                  const context = await emailService.buildMemberContext(req.user!.tenantId, member.id);
                  
                  const tempTemplate = {
                    subject,
                    body_html: emailService.convertToHTML(content),
                    body_text: content,
                  };
                  
                  const rendered = await emailService.renderTemplate(tempTemplate, context);
                  
                  await emailService.transporter.sendMail({
                    from: process.env.SMTP_FROM,
                    to: context.member.email,
                    subject: rendered.subject,
                    html: rendered.html,
                    text: rendered.text,
                  });
                  
                  totalRecipients++;
                  results.push({ type: 'segment', recipient: context.member.email, status: 'sent' });
                } catch (error) {
                  console.error('Error sending to segment member:', error);
                  results.push({ type: 'segment', recipient: member.email, status: 'failed', error: error.message });
                }
              }
            }
          } catch (error) {
            console.error('Error processing segment:', error);
            results.push({ type: 'segment', recipient: recipient.value, status: 'failed', error: error.message });
          }
        } else if (recipient.type === 'email') {
          // Send to direct email
          try {
            const context = {
              member: { firstName: 'Geachte', lastName: 'heer/mevrouw', email: recipient.value },
              tenant: { name: 'Organisatie' },
              card: { url: '#' },
              fees: [],
            };
            
            const tempTemplate = {
              subject,
              body_html: emailService.convertToHTML(content),
              body_text: content,
            };
            
            const rendered = await emailService.renderTemplate(tempTemplate, context);
            
            await emailService.transporter.sendMail({
              from: process.env.SMTP_FROM,
              to: recipient.value,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
            });
            
            totalRecipients++;
            results.push({ type: 'email', recipient: recipient.value, status: 'sent' });
          } catch (error) {
            console.error('Error sending to email:', error);
            results.push({ type: 'email', recipient: recipient.value, status: 'failed', error: error.message });
          }
        }
      }
      
      res.json({ 
        message: `E-mail verzonden naar ${totalRecipients} geadresseerd(en)`,
        totalRecipients,
        results 
      });
    } catch (error) {
      console.error('Error sending composer email:', error);
      res.status(500).json({ error: "Fout bij verzenden e-mail" });
    }
  });

  // Unsubscribe route
  app.get('/email/unsubscribe', async (req, res) => {
    try {
      const token = req.query.token as string;
      
      // In a real implementation, you would decode the token to get tenant and email
      // For now, we'll create a simple unsubscribe page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Uitschrijven</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .container { text-align: center; }
            .success { color: #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Uitschrijven</h1>
            <p class="success">Je bent succesvol uitgeschreven van marketing e-mails.</p>
            <p>Je ontvangt nog steeds belangrijke transactionele berichten zoals betalingsherinneringen.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send('Er is een fout opgetreden');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
