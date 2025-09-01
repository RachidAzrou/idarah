import { storage } from "../storage";
import { type InsertMember, type Member } from "@shared/schema";
import { randomUUID } from "crypto";

interface CreateMemberData extends InsertMember {
  financialSettings: {
    paymentMethod: 'SEPA' | 'OVERSCHRIJVING' | 'BANCONTACT' | 'CASH';
    iban?: string;
    paymentTerm: 'MONTHLY' | 'YEARLY';
  };
}

interface CreateMemberResult {
  success: boolean;
  message?: string;
  member?: Member;
}

class MemberService {
  async createMember(tenantId: string, memberData: CreateMemberData): Promise<CreateMemberResult> {
    try {
      // Generate unique member number
      const memberNumber = await this.generateMemberNumber(tenantId);
      
      // Create member
      const member = await storage.createMember({
        ...memberData,
        tenantId,
        memberNumber,
      });

      // Create financial settings if provided
      if (memberData.financialSettings) {
        // In a real implementation, you'd create the financial settings record
        // For now, we'll just log it as the schema is already set up
        console.log("Financial settings would be created:", memberData.financialSettings);
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
    const year = new Date().getFullYear();
    const members = await storage.getMembersByTenant(tenantId);
    const memberCount = members.length + 1;
    return `${year}-${memberCount.toString().padStart(3, '0')}`;
  }

  private async generateInitialFee(member: Member): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Default fee amount based on category
    let amount = 25.00; // Default for VOLWASSEN
    if (member.category === 'STUDENT') amount = 15.00;
    if (member.category === 'SENIOR') amount = 20.00;

    await storage.createMembershipFee({
      tenantId: member.tenantId,
      memberId: member.id,
      periodStart,
      periodEnd,
      amount: amount.toString(),
      status: 'OPEN',
    });
  }
}

export const memberService = new MemberService();
