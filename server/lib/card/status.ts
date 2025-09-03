import { storage } from '../../storage';
import { nowBE, toBEDate } from '../time/beTime';
import { isDateInPeriod, isPeriodActive, isPeriodExpired } from '../fees/periods';

export type CardStatus = 'ACTUEEL' | 'NIET_ACTUEEL' | 'VERLOPEN';

interface PeriodWithStatus {
  id: string;
  memberId: string;
  status: 'OPEN' | 'PAID' | 'OVERDUE';
  periodStart: Date;
  periodEnd: Date;
  paidAt: Date | null;
}

/**
 * Compute the current card status for a member
 * Based on the domain rules:
 * - ACTUEEL: Current period exists and is paid
 * - VERLOPEN: No paid current period and now > latest period end
 * - NIET_ACTUEEL: Fallback for other cases (offline/temporary)
 */
export async function computeCardStatus(memberId: string): Promise<CardStatus> {
  try {
    // Get all membership fees for this member
    const fees = await storage.getMembershipFeesByMember(memberId);
    
    if (fees.length === 0) {
      return 'NIET_ACTUEEL';
    }
    
    const now = nowBE();
    const periods: PeriodWithStatus[] = fees.map(fee => ({
      id: fee.id,
      memberId: fee.memberId,
      status: fee.status,
      periodStart: toBEDate(fee.periodStart),
      periodEnd: toBEDate(fee.periodEnd),
      paidAt: fee.paidAt ? toBEDate(fee.paidAt) : null,
    }));
    
    // Find periods that are currently active (now is within [start, end))
    const activePeriods = periods.filter(period => 
      isDateInPeriod(now, {
        start: period.periodStart,
        end: period.periodEnd
      })
    );
    
    // If there's an active period and it's paid, status is ACTUEEL
    const paidActivePeriod = activePeriods.find(period => period.status === 'PAID');
    if (paidActivePeriod) {
      return 'ACTUEEL';
    }
    
    // Find the latest period to check if we're past all periods
    const latestPeriod = periods.reduce((latest, current) => 
      current.periodEnd > latest.periodEnd ? current : latest
    );
    
    // If now is after the latest period end and that period is not paid, status is VERLOPEN
    if (now >= latestPeriod.periodEnd && latestPeriod.status !== 'PAID') {
      return 'VERLOPEN';
    }
    
    // Check if there are any paid periods at all
    const hasPaidPeriods = periods.some(period => period.status === 'PAID');
    if (!hasPaidPeriods) {
      return 'NIET_ACTUEEL';
    }
    
    // Default fallback
    return 'NIET_ACTUEEL';
    
  } catch (error) {
    console.error('Error computing card status:', error);
    return 'NIET_ACTUEEL';
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