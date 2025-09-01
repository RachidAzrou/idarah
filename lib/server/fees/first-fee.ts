import { setBillingAnchor, getBillingAnchor } from './anchor';
import { ensureCurrentRollingFeeForMember } from './generator';
import { beNow } from '../time';

/**
 * Create first fee for a new member
 * Sets the billing anchor and creates the first rolling fee
 */
export async function createFirstFeeForMember(memberId: string, asOf?: Date): Promise<void> {
  const anchorDate = asOf || beNow();
  
  // Set the billing anchor
  await setBillingAnchor(memberId, anchorDate);
  
  // Create the first rolling fee for the current period
  await ensureCurrentRollingFeeForMember(memberId, anchorDate);
}

/**
 * Initialize first fee for member with optional join date
 */
export async function initializeFirstFee(memberId: string, joinDate?: Date): Promise<Date> {
  const anchorDate = joinDate || beNow();
  await createFirstFeeForMember(memberId, anchorDate);
  return anchorDate;
}