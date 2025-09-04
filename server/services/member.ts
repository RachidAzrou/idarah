import { storage } from "../storage";
import { type InsertMember, type Member } from "@shared/schema";
import { randomUUID } from "crypto";

interface CreateMemberData extends Omit<InsertMember, 'tenantId' | 'memberNumber'> {
  financialSettings: {
    paymentMethod: 'SEPA' | 'OVERSCHRIJVING' | 'BANCONTACT' | 'CASH';
    iban?: string;
    paymentTerm: 'MONTHLY' | 'YEARLY';
  };
  organization: {
    interestedInActiveRole: boolean;
    roleDescription?: string;
  };
  permissions: {
    privacyAgreement: boolean;
    photoVideoConsent: boolean;
    newsletterSubscription: boolean;
    whatsappList: boolean;
  };
}

interface CreateMemberResult {
  success: boolean;
  message?: string;
  member?: Member;
}

interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicateNumber?: Member;
  duplicateNameAddress?: Member;
  suggestedNumber?: string;
}

class MemberService {
  async checkForDuplicates(tenantId: string, memberData: CreateMemberData & { memberNumber?: string }): Promise<DuplicateCheckResult> {
    const result: DuplicateCheckResult = { hasDuplicates: false };

    console.log("🔍 SERVICE - Checking duplicates for tenant:", tenantId, "memberNumber:", memberData.memberNumber);

    // Check for duplicate member number if provided
    if (memberData.memberNumber) {
      const existingByNumber = await storage.getMemberByNumber(tenantId, memberData.memberNumber);
      console.log("🔍 SERVICE - Found existing member:", existingByNumber ? `ID: ${existingByNumber.id}, Number: ${existingByNumber.memberNumber}` : "NONE");
      
      if (existingByNumber) {
        result.hasDuplicates = true;
        result.duplicateNumber = existingByNumber;
        result.suggestedNumber = await storage.getNextAvailableMemberNumber(tenantId, memberData.memberNumber);
        console.log("🔍 SERVICE - DUPLICATE DETECTED! Suggested number:", result.suggestedNumber);
      }
    }

    // Check for duplicate name and address combination
    if (memberData.street && memberData.number) {
      const existingByNameAddress = await storage.getMemberByNameAndAddress(
        tenantId,
        memberData.firstName,
        memberData.lastName,
        memberData.street,
        memberData.number
      );
      if (existingByNameAddress) {
        result.hasDuplicates = true;
        result.duplicateNameAddress = existingByNameAddress;
      }
    }

    return result;
  }

  async createMember(tenantId: string, memberData: CreateMemberData): Promise<CreateMemberResult> {
    try {
      // Generate unique member number
      const memberNumber = await this.generateMemberNumber(tenantId);
      
      // Create member (exclude extra frontend fields)
      const { financialSettings, organization, permissions, ...memberFields } = memberData;
      const member = await storage.createMember({
        ...memberFields,
        tenantId,
        memberNumber,
        active: true, // Nieuwe leden zijn standaard actief
      });

      // Create financial settings if provided
      if (memberData.financialSettings) {
        await storage.createMemberFinancialSettings({
          memberId: member.id,
          ...memberData.financialSettings,
        });
      }

      // Create permissions if provided
      if (memberData.permissions) {
        await storage.createMemberPermissions({
          memberId: member.id,
          ...memberData.permissions,
        });
      }

      // Generate initial membership fee
      await this.generateInitialFee(member);

      return {
        success: true,
        member,
      };
    } catch (error) {
      console.error("Error creating member:", error);
      return {
        success: false,
        message: "Fout bij het aanmaken van het lid",
      };
    }
  }

  private async generateMemberNumber(tenantId: string): Promise<string> {
    const members = await storage.getMembersByTenant(tenantId);
    
    // Find the highest existing member number for this tenant
    let maxNumber = 0;
    for (const member of members) {
      const match = member.memberNumber.match(/^(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    // Generate next sequential number
    const nextNumber = maxNumber + 1;
    return nextNumber.toString().padStart(4, '0');
  }

  private async generateInitialFee(member: Member): Promise<void> {
    try {
      // Get member's financial settings to determine payment frequency
      const financialSettings = await storage.getMemberFinancialSettings(member.id);
      
      if (!financialSettings) {
        console.error(`No financial settings found for member ${member.id}`);
        return;
      }

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Calculate period end based on payment term
      let periodEnd: Date;
      if (financialSettings.paymentTerm === 'YEARLY') {
        // For yearly payments, the period lasts one full year
        periodEnd = new Date(periodStart);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1); // Last day of the period
      } else {
        // For monthly payments, the period lasts one month
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of next month
      }
      
      // Get tenant-specific fee settings
      const tenant = await storage.getTenantById(member.tenantId);
      if (!tenant) {
        console.error(`No tenant found for member ${member.id}`);
        return;
      }

      // Get fee amount based on category and payment frequency using tenant settings
      let yearlyAmount = parseFloat(tenant.adultFee || '25.00'); // Default for STANDAARD
      if (member.category === 'STUDENT') yearlyAmount = parseFloat(tenant.studentFee || '15.00');
      if (member.category === 'SENIOR') yearlyAmount = parseFloat(tenant.seniorFee || '20.00');
      
      // Calculate amount based on payment term
      let amount: number;
      if (financialSettings.paymentTerm === 'YEARLY') {
        amount = yearlyAmount;
      } else {
        // For monthly payments, divide yearly amount by 12
        amount = yearlyAmount / 12;
      }

      await storage.createMembershipFee({
        tenantId: member.tenantId,
        memberId: member.id,
        memberNumber: member.memberNumber,
        memberName: `${member.firstName} ${member.lastName}`,
        periodStart,
        periodEnd,
        amount: amount.toString(),
        status: 'OPEN',
      });
    } catch (error) {
      console.error('Error generating initial fee for member:', error);
      throw error;
    }
  }
}

export const memberService = new MemberService();
