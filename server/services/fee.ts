import { storage } from "../storage";
import { type MembershipFee } from "@shared/schema";

interface MarkFeePaidResult {
  success: boolean;
  message?: string;
  fee?: MembershipFee;
}

class FeeService {
  async markFeePaid(feeId: string, tenantId: string): Promise<MarkFeePaidResult> {
    try {
      const fee = await storage.getMembershipFee(feeId);
      if (!fee || fee.tenantId !== tenantId) {
        return {
          success: false,
          message: "Lidgeld niet gevonden",
        };
      }

      if (fee.status === 'PAID') {
        return {
          success: false,
          message: "Lidgeld is al betaald",
        };
      }

      const updatedFee = await storage.updateMembershipFee(feeId, {
        status: 'PAID',
        paidAt: new Date(),
        method: 'OVERSCHRIJVING', // Default payment method
      });

      // Create transaction record
      await storage.createTransaction({
        tenantId,
        memberId: fee.memberId,
        type: 'INCOME',
        category: 'Lidgeld',
        amount: fee.amount,
        date: new Date(),
        method: 'OVERSCHRIJVING',
        description: `Lidgeld betaling voor periode ${fee.periodStart.toLocaleDateString('nl-BE')} - ${fee.periodEnd.toLocaleDateString('nl-BE')}`,
        relatedFeeId: feeId,
      });

      return {
        success: true,
        fee: updatedFee,
      };
    } catch (error) {
      console.error("Error marking fee as paid:", error);
      return {
        success: false,
        message: "Fout bij het markeren van lidgeld als betaald",
      };
    }
  }
}

export const feeService = new FeeService();
