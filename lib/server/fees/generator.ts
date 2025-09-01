import { db } from '../../../server/db';
import { membershipFees, members } from '../../../shared/schema';
import { getBillingAnchor } from './anchor';
import { getRollingPeriod, nextRollingPeriod } from './periods';
import { beNow, toUtcISO } from '../time';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface GenerateFeeOptions {
  asOf?: Date;
  strategy?: 'current' | 'catchup';
  tenantId?: string;
}

/**
 * Ensure current rolling fee exists for a member
 */
export async function ensureCurrentRollingFeeForMember(memberId: string, asOf?: Date): Promise<void> {
  const currentTime = asOf || beNow();
  const anchor = await getBillingAnchor(memberId);
  
  // Get member details
  const member = await db.query.members.findFirst({
    where: (members, { eq }) => eq(members.id, memberId),
    with: {
      financialSettings: true
    }
  });
  
  if (!member || !member.isActive) {
    return; // Skip inactive members
  }
  
  if (!member.financialSettings) {
    throw new Error(`Member ${memberId} has no financial settings`);
  }
  
  const term = member.financialSettings.preferredTerm || 'YEARLY';
  const amount = term === 'MONTHLY' 
    ? member.financialSettings.monthlyAmount 
    : member.financialSettings.yearlyAmount;
  
  if (amount <= 0) {
    return; // Skip members with no fee amount
  }
  
  const period = getRollingPeriod(anchor, currentTime, term);
  
  // Check if fee already exists for this period
  const existingFee = await db.query.membershipFees.findFirst({
    where: and(
      eq(membershipFees.memberId, memberId),
      eq(membershipFees.periodStart, toUtcISO(period.start)),
      eq(membershipFees.periodEnd, toUtcISO(period.end))
    )
  });
  
  if (existingFee) {
    return; // Fee already exists
  }
  
  // Create the fee
  await db.insert(membershipFees).values({
    tenantId: member.tenantId,
    memberId,
    memberNumber: member.memberNumber,
    memberName: `${member.firstName} ${member.lastName}`,
    periodStart: toUtcISO(period.start),
    periodEnd: toUtcISO(period.end),
    amount,
    method: member.financialSettings.preferredMethod,
    status: 'OPEN',
    sepaEligible: member.financialSettings.preferredMethod === 'SEPA' && !!member.financialSettings.sepaMandate
  });
}

/**
 * Backfill rolling fees for a member from a date range
 */
export async function backfillRollingFeesForMember(
  memberId: string, 
  fromDate?: Date, 
  toDate?: Date
): Promise<void> {
  const anchor = await getBillingAnchor(memberId);
  const startDate = fromDate || anchor;
  const endDate = toDate || beNow();
  
  // Get member details
  const member = await db.query.members.findFirst({
    where: (members, { eq }) => eq(members.id, memberId),
    with: {
      financialSettings: true
    }
  });
  
  if (!member || !member.isActive || !member.financialSettings) {
    return;
  }
  
  const term = member.financialSettings.preferredTerm || 'YEARLY';
  const amount = term === 'MONTHLY' 
    ? member.financialSettings.monthlyAmount 
    : member.financialSettings.yearlyAmount;
  
  if (amount <= 0) {
    return;
  }
  
  let currentPeriod = getRollingPeriod(anchor, startDate, term);
  
  while (currentPeriod.start <= endDate) {
    // Check if fee already exists
    const existingFee = await db.query.membershipFees.findFirst({
      where: and(
        eq(membershipFees.memberId, memberId),
        eq(membershipFees.periodStart, toUtcISO(currentPeriod.start)),
        eq(membershipFees.periodEnd, toUtcISO(currentPeriod.end))
      )
    });
    
    if (!existingFee) {
      await db.insert(membershipFees).values({
        tenantId: member.tenantId,
        memberId,
        memberNumber: member.memberNumber,
        memberName: `${member.firstName} ${member.lastName}`,
        periodStart: toUtcISO(currentPeriod.start),
        periodEnd: toUtcISO(currentPeriod.end),
        amount,
        method: member.financialSettings.preferredMethod,
        status: 'OPEN',
        sepaEligible: member.financialSettings.preferredMethod === 'SEPA' && !!member.financialSettings.sepaMandate
      });
    }
    
    // Move to next period
    const next = nextRollingPeriod(currentPeriod.start, term);
    currentPeriod = { start: next.start, end: next.end, nextStart: getRollingPeriod(anchor, next.start, term).nextStart };
  }
}

/**
 * Generate fees for all members in a tenant
 */
export async function generateTenantFees(
  tenantId: string, 
  asOf?: Date, 
  strategy: 'current' | 'catchup' = 'current'
): Promise<void> {
  const currentTime = asOf || beNow();
  
  // Get all active members for the tenant
  const activeMembers = await db.query.members.findMany({
    where: and(
      eq(members.tenantId, tenantId),
      eq(members.isActive, true)
    ),
    with: {
      financialSettings: true
    }
  });
  
  for (const member of activeMembers) {
    if (!member.financialSettings) {
      continue; // Skip members without financial settings
    }
    
    try {
      if (strategy === 'current') {
        await ensureCurrentRollingFeeForMember(member.id, currentTime);
      } else {
        // Catchup strategy - backfill from anchor to current time
        const anchor = await getBillingAnchor(member.id);
        await backfillRollingFeesForMember(member.id, anchor, currentTime);
      }
    } catch (error) {
      console.error(`Failed to generate fees for member ${member.id}:`, error);
      // Continue with other members
    }
  }
}