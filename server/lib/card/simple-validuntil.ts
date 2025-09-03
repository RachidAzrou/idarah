import { storage } from '../../storage';
import { toBEDate } from '../time/beTime';

/**
 * Simplified validUntil service that works with existing data structures
 * Updates validUntil to the end date of the latest paid period
 */
export async function updateMemberValidUntil(memberId: string): Promise<Date | null> {
  try {
    // Get all membership fees for this member
    const fees = await storage.getMembershipFeesByMember(memberId);
    
    if (fees.length === 0) {
      return null;
    }
    
    // Find all paid periods
    const paidFees = fees.filter(fee => fee.status === 'PAID');
    
    if (paidFees.length === 0) {
      return null;
    }
    
    // Get the latest paid period
    const latestPaidPeriod = paidFees.reduce((latest, current) => 
      toBEDate(current.periodEnd) > toBEDate(latest.periodEnd) ? current : latest
    );
    
    const validUntilDate = toBEDate(latestPaidPeriod.periodEnd);
    
    // Try to update card meta if it exists
    try {
      const cardMeta = await storage.getCardMetaByMember(memberId);
      if (cardMeta) {
        await storage.updateCardMeta(cardMeta.id, {
          validUntil: validUntilDate,
          version: (cardMeta.version || 1) + 1,
        });
      }
    } catch (error) {
      console.warn('Could not update card meta:', error);
      // Continue, this is not critical for the validUntil calculation
    }
    
    return validUntilDate;
    
  } catch (error) {
    console.error('Error updating validUntil:', error);
    throw error;
  }
}

/**
 * Get the current validUntil date for a member based on their paid periods
 */
export async function getMemberValidUntil(memberId: string): Promise<Date | null> {
  try {
    const fees = await storage.getMembershipFeesByMember(memberId);
    const paidFees = fees.filter(fee => fee.status === 'PAID');
    
    if (paidFees.length === 0) {
      return null;
    }
    
    const latestPaidPeriod = paidFees.reduce((latest, current) => 
      toBEDate(current.periodEnd) > toBEDate(latest.periodEnd) ? current : latest
    );
    
    return toBEDate(latestPaidPeriod.periodEnd);
    
  } catch (error) {
    console.error('Error getting validUntil:', error);
    return null;
  }
}

/**
 * Check if a member's card is currently valid
 */
export async function isMemberCardValid(memberId: string): Promise<boolean> {
  const validUntil = await getMemberValidUntil(memberId);
  
  if (!validUntil) {
    return false;
  }
  
  const now = new Date();
  return now <= validUntil;
}