import { db } from '../../../server/db';
import { beNow } from '../time';

/**
 * Get billing anchor for a member. Priority: billingAnchorAt > joinDate > current time
 */
export async function getBillingAnchor(memberId: string): Promise<Date> {
  const member = await db.query.members.findFirst({
    where: (members, { eq }) => eq(members.id, memberId),
    with: {
      financialSettings: true
    }
  });
  
  if (!member) {
    throw new Error(`Member ${memberId} not found`);
  }
  
  // Priority: billingAnchorAt > joinDate > current time
  if (member.financialSettings?.billingAnchorAt) {
    return new Date(member.financialSettings.billingAnchorAt);
  }
  
  if (member.joinDate) {
    return new Date(member.joinDate);
  }
  
  return beNow();
}

/**
 * Set billing anchor for a member
 */
export async function setBillingAnchor(memberId: string, anchorDate: Date): Promise<void> {
  // First, get or create financial settings
  const existing = await db.query.memberFinancialSettings.findFirst({
    where: (settings, { eq }) => eq(settings.memberId, memberId)
  });
  
  if (existing) {
    await db.update(memberFinancialSettings)
      .set({ billingAnchorAt: anchorDate.toISOString() })
      .where(eq(memberFinancialSettings.memberId, memberId));
  } else {
    await db.insert(memberFinancialSettings).values({
      memberId,
      billingAnchorAt: anchorDate.toISOString(),
      // Set default values for other required fields
      preferredMethod: 'SEPA',
      monthlyAmount: 0,
      yearlyAmount: 0
    });
  }
}

/**
 * Initialize billing anchor for new member if not already set
 */
export async function initializeBillingAnchor(memberId: string, joinDate?: Date): Promise<Date> {
  const anchorDate = joinDate || beNow();
  await setBillingAnchor(memberId, anchorDate);
  return anchorDate;
}