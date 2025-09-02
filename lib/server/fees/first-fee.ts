/**
 * First fee creation logic for new members
 */

import { db } from '../../../server/db';
import { membershipFees, memberFinancialSettings, members } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Create the first membership fee for a new member
 */
export async function createFirstFeeForMember(memberId: string, joinDate?: Date): Promise<void> {
  try {
    // Get member's financial settings
    const [settings] = await db
      .select()
      .from(memberFinancialSettings)
      .where(eq(memberFinancialSettings.memberId, memberId));

    if (!settings) {
      throw new Error(`No financial settings found for member ${memberId}`);
    }

    const anchorDate = joinDate || new Date();
    const amount = settings.preferredTerm === 'YEARLY' 
      ? parseFloat(settings.yearlyAmount) 
      : parseFloat(settings.monthlyAmount);

    // Get member details for the fee record
    const [member] = await db.select().from(members).where(eq(members.id, memberId));
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    // Create the first fee
    await db.insert(membershipFees).values({
      tenantId: member.tenantId,
      memberId,
      memberNumber: member.memberNumber,
      memberName: `${member.firstName} ${member.lastName}`,
      amount: amount.toString(),
      status: 'OPEN',
      periodStart: anchorDate,
      periodEnd: getNextPeriodEnd(anchorDate, settings.preferredTerm)
    });

  } catch (error) {
    console.error('Error creating first fee:', error);
    throw error;
  }
}

/**
 * Calculate the end date for the next period
 */
function getNextPeriodEnd(startDate: Date, term: 'MONTHLY' | 'YEARLY'): Date {
  const endDate = new Date(startDate);
  
  if (term === 'MONTHLY') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  
  // Subtract 1 day to get the last day of the period
  endDate.setDate(endDate.getDate() - 1);
  
  return endDate;
}