import { storage } from '../../storage';
import { nowBE, toBEDate } from '../time/beTime';
import { isDateInPeriod, isPeriodActive, isPeriodExpired } from '../fees/periods';

export type CardStatus = 'ACTUEEL' | 'NIET_ACTUEEL' | 'VERLOPEN';

/**
 * Check if membership is expired based on validUntil date and payment timing rules
 * VERLOPEN = validUntil date has passed OR yearly member failed to pay within 1 month
 */
export async function isMembershipExpired(memberId: string): Promise<boolean> {
  try {
    const fees = await storage.getMembershipFeesByMember(memberId);
    const member = await storage.getMember(memberId);
    const memberFinancial = await storage.getMemberFinancialSettings(memberId);
    
    if (fees.length === 0 || !member || !memberFinancial) {
      return false; // No data = not expired
    }
    
    const now = nowBE();
    
    // Check yearly payment timing rules
    if (memberFinancial.paymentTerm === 'YEARLY') {
      // For yearly members: check if current period payment is overdue by more than 1 month
      const currentPeriod = fees.find(fee => {
        const periodStart = toBEDate(fee.periodStart);
        const periodEnd = toBEDate(fee.periodEnd);
        return now >= periodStart && now <= periodEnd;
      });
      
      if (currentPeriod && currentPeriod.status !== 'PAID') {
        const periodStart = toBEDate(currentPeriod.periodStart);
        const paymentDeadline = new Date(periodStart);
        paymentDeadline.setMonth(paymentDeadline.getMonth() + 1); // 1 month to pay
        
        // If payment deadline passed and still not paid, membership is expired
        if (now > paymentDeadline) {
          return true;
        }
      }
    }
    
    // Standard rule: check if validUntil date has passed
    const paidFees = fees.filter(fee => fee.status === 'PAID');
    
    if (paidFees.length === 0) {
      return false; // No paid periods = not expired, just unpaid
    }
    
    // Get the latest paid period end date as validUntil
    const latestPaidPeriod = paidFees.reduce((latest, current) => 
      current.periodEnd > latest.periodEnd ? current : latest
    );
    
    const validUntil = toBEDate(latestPaidPeriod.periodEnd);
    
    // Membership is expired if now is after validUntil date
    return now > validUntil;
    
  } catch (error) {
    console.error('Error checking membership expiry:', error);
    return false;
  }
}

/**
 * Compute the current card status for a member
 * Based on the correct domain rules:
 * - VERLOPEN: Membership expired (past validUntil date)
 * - ACTUEEL: Default status for valid memberships
 * 
 * Note: ACTUEEL/NIET_ACTUEEL connectivity status is handled in the PWA frontend
 */
export async function computeCardStatus(memberId: string): Promise<CardStatus> {
  try {
    // Check if membership is expired based on validUntil date
    const expired = await isMembershipExpired(memberId);
    if (expired) {
      return 'VERLOPEN';
    }
    
    // If not expired, default to ACTUEEL (frontend handles online/offline)
    return 'ACTUEEL';
    
  } catch (error) {
    console.error('Error computing card status:', error);
    return 'ACTUEEL'; // Default to valid when in doubt
  }
}

/**
 * Get detailed card status information including reason
 */
export async function getCardStatusDetails(memberId: string) {
  const status = await computeCardStatus(memberId);
  const fees = await storage.getMembershipFeesByMember(memberId);
  const now = nowBE();
  
  const periods = fees.map(fee => ({
    ...fee,
    periodStart: toBEDate(fee.periodStart),
    periodEnd: toBEDate(fee.periodEnd),
    paidAt: fee.paidAt ? toBEDate(fee.paidAt) : null,
  }));
  
  // Find current active period
  const activePeriod = periods.find(period => 
    isDateInPeriod(now, {
      start: period.periodStart,
      end: period.periodEnd
    })
  );
  
  // Find latest period
  const latestPeriod = periods.reduce((latest, current) => 
    current.periodEnd > latest.periodEnd ? current : latest
  );
  
  return {
    status,
    activePeriod: activePeriod || null,
    latestPeriod: latestPeriod || null,
    allPeriods: periods,
    computedAt: now,
    reason: getStatusReason(status, activePeriod, latestPeriod, now),
  };
}

/**
 * Get human readable reason for the status
 */
function getStatusReason(
  status: CardStatus, 
  activePeriod: any, 
  latestPeriod: any, 
  now: Date
): string {
  switch (status) {
    case 'ACTUEEL':
      return activePeriod 
        ? `Lopende periode betaald tot ${latestPeriod?.periodEnd?.toLocaleDateString('nl-BE')}`
        : 'Lidmaatschap is actief';
        
    case 'VERLOPEN':
      return latestPeriod
        ? `Verlopen sinds ${latestPeriod.periodEnd.toLocaleDateString('nl-BE')}`
        : 'Lidmaatschap is verlopen';
        
    case 'NIET_ACTUEEL':
      return 'Lidmaatschap status onduidelijk';
        
    default:
      return 'Onbekende status';
  }
}

/**
 * Check if member has any paid periods
 */
export async function memberHasPaidPeriods(memberId: string): Promise<boolean> {
  try {
    const fees = await storage.getMembershipFeesByMember(memberId);
    return fees.some(fee => fee.status === 'PAID');
  } catch (error) {
    console.error('Error checking paid periods:', error);
    return false;
  }
}

/**
 * Get the latest paid period for a member
 */
export async function getLatestPaidPeriod(memberId: string) {
  try {
    const fees = await storage.getMembershipFeesByMember(memberId);
    const paidFees = fees.filter(fee => fee.status === 'PAID');
    
    if (paidFees.length === 0) {
      return null;
    }
    
    return paidFees.reduce((latest, current) => 
      current.periodEnd > latest.periodEnd ? current : latest
    );
  } catch (error) {
    console.error('Error getting latest paid period:', error);
    return null;
  }
}