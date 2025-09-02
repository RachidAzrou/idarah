/**
 * Fee generation logic for all tenants and members
 */

import { db } from '../../../server/db';
import { members, memberFinancialSettings, membershipFees } from '../../../shared/schema';
import { eq, and, or, lt } from 'drizzle-orm';

/**
 * Generate fees for all members of a tenant
 */
export async function generateTenantFees(
  tenantId: string, 
  asOf: Date, 
  strategy: 'current' | 'catchup' = 'current'
): Promise<void> {
  console.log(`Generating fees for tenant ${tenantId} as of ${asOf.toISOString()} with strategy: ${strategy}`);

  try {
    // Get all active members with their financial settings
    const membersWithSettings = await db
      .select({
        member: members,
        settings: memberFinancialSettings
      })
      .from(members)
      .leftJoin(memberFinancialSettings, eq(members.id, memberFinancialSettings.memberId))
      .where(and(
        eq(members.tenantId, tenantId),
        eq(members.active, true)
      ));

    let feesGenerated = 0;

    for (const { member, settings } of membersWithSettings) {
      if (!settings) {
        console.log(`Skipping member ${member.id} - no financial settings`);
        continue;
      }

      try {
        const generated = await generateMemberFees(member.id, settings, asOf, strategy);
        feesGenerated += generated;
      } catch (error) {
        console.error(`Error generating fees for member ${member.id}:`, error);
        // Continue with next member
      }
    }

    console.log(`Generated ${feesGenerated} fees for tenant ${tenantId}`);

  } catch (error) {
    console.error('Error in generateTenantFees:', error);
    throw error;
  }
}

/**
 * Generate fees for a specific member
 */
async function generateMemberFees(
  memberId: string,
  settings: any,
  asOf: Date,
  strategy: 'current' | 'catchup'
): Promise<number> {
  
  // Get the member's billing anchor date
  const billingAnchor = new Date(settings.billingAnchorAt);
  const amount = settings.preferredTerm === 'YEARLY' 
    ? parseFloat(settings.yearlyAmount) 
    : parseFloat(settings.monthlyAmount);

  if (amount <= 0) {
    console.log(`Skipping member ${memberId} - zero amount`);
    return 0;
  }

  // Get existing fees to avoid duplicates
  const existingFees = await db
    .select()
    .from(membershipFees)
    .where(eq(membershipFees.memberId, memberId));

  const periodsToGenerate = calculatePeriodsToGenerate(
    billingAnchor, 
    asOf, 
    settings.preferredTerm, 
    existingFees, 
    strategy
  );

  let generated = 0;

  for (const period of periodsToGenerate) {
    // Get member details for the fee record
    const [member] = await db.select().from(members).where(eq(members.id, memberId));
    if (!member) throw new Error(`Member ${memberId} not found`);

    await db.insert(membershipFees).values({
      tenantId: member.tenantId,
      memberId,
      memberNumber: member.memberNumber,
      memberName: `${member.firstName} ${member.lastName}`,
      amount: amount.toString(),
      status: 'OPEN',
      periodStart: period.start,
      periodEnd: period.end
    });
    generated++;
  }

  return generated;
}

/**
 * Calculate which periods need fees generated
 */
function calculatePeriodsToGenerate(
  anchor: Date,
  asOf: Date,
  term: 'MONTHLY' | 'YEARLY',
  existingFees: any[],
  strategy: 'current' | 'catchup'
): { start: Date; end: Date }[] {
  
  const periods: { start: Date; end: Date }[] = [];
  const current = new Date(anchor);

  // Find existing period starts to avoid duplicates
  const existingStarts = new Set(
    existingFees.map(fee => new Date(fee.periodStart).getTime())
  );

  while (current <= asOf) {
    const periodStart = new Date(current);
    const periodEnd = new Date(current);
    
    if (term === 'MONTHLY') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }
    
    periodEnd.setDate(periodEnd.getDate() - 1);

    // Only add if we don't already have a fee for this period
    if (!existingStarts.has(periodStart.getTime())) {
      periods.push({ start: periodStart, end: periodEnd });
    }

    // Move to next period
    if (term === 'MONTHLY') {
      current.setMonth(current.getMonth() + 1);
    } else {
      current.setFullYear(current.getFullYear() + 1);
    }
  }

  return periods;
}