import { storage } from '../../storage';
import { nowBE, startOfDayBE, toBEDate } from '../time/beTime';
import { computeCardStatus } from '../card/status';

export interface RolloverSummary {
  processedAt: Date;
  tenantId?: string;
  expiredFeesCount: number;
  newPeriodsCreated: number;
  cardsUpdated: number;
  errors: Array<{
    memberId: string;
    error: string;
  }>;
}

/**
 * Daily rollover process to handle expired fees and create new periods
 * This should be run once per day, typically at midnight BE time
 */
export async function rolloverDaily(tenantId?: string): Promise<RolloverSummary> {
  const startTime = nowBE();
  const today = startOfDayBE(nowBE());
  
  console.log(`Starting daily rollover for ${tenantId ? `tenant ${tenantId}` : 'all tenants'} at ${startTime.toISOString()}`);
  
  const summary: RolloverSummary = {
    processedAt: startTime,
    tenantId,
    expiredFeesCount: 0,
    newPeriodsCreated: 0,
    cardsUpdated: 0,
    errors: [],
  };
  
  try {
    // Step 1: Get all open/outstanding fees that have passed their periodEnd
    const allFees = tenantId 
      ? await storage.getMembershipFeesByTenant(tenantId)
      : await storage.getAllMembershipFees();
    
    const expiredFees = allFees.filter(fee => {
      const periodEnd = toBEDate(fee.periodEnd);
      return fee.status === 'OPEN' && today > periodEnd;
    });
    
    console.log(`Found ${expiredFees.length} expired fees to mark as overdue`);
    
    // Step 2: Mark expired fees as OVERDUE
    for (const fee of expiredFees) {
      try {
        await storage.updateMembershipFee(fee.id, {
          status: 'OVERDUE',
        });
        summary.expiredFeesCount++;
      } catch (error) {
        summary.errors.push({
          memberId: fee.memberId,
          error: `Failed to mark fee ${fee.id} as overdue: ${error}`,
        });
      }
    }
    
    // Step 3: Update card statuses for affected members
    const affectedMemberIds = [...new Set(expiredFees.map(fee => fee.memberId))];
    
    for (const memberId of affectedMemberIds) {
      try {
        const newStatus = await computeCardStatus(memberId);
        const cardMeta = await storage.getCardMetaByMember(memberId);
        
        if (cardMeta && cardMeta.status !== newStatus) {
          await storage.updateCardMeta(cardMeta.id, {
            status: newStatus,
            version: (cardMeta.version || 1) + 1,
          });
          summary.cardsUpdated++;
          console.log(`Updated card status for member ${memberId}: ${cardMeta.status} -> ${newStatus}`);
        }
      } catch (error) {
        summary.errors.push({
          memberId,
          error: `Failed to update card status: ${error}`,
        });
      }
    }
    
    console.log(`Daily rollover completed: ${summary.expiredFeesCount} fees expired, ${summary.cardsUpdated} cards updated`);
    
  } catch (error) {
    console.error('Daily rollover failed:', error);
    summary.errors.push({
      memberId: 'SYSTEM',
      error: `Rollover process failed: ${error}`,
    });
  }
  
  return summary;
}

/**
 * Process rollover for a specific member (useful for testing or manual correction)
 */
export async function rolloverForMember(memberId: string): Promise<void> {
  const today = startOfDayBE(nowBE());
  
  // Get member's fees
  const fees = await storage.getMembershipFeesByMember(memberId);
  
  // Mark expired open fees as overdue
  for (const fee of fees) {
    if (fee.status === 'OPEN' && toBEDate(fee.periodEnd) < today) {
      await storage.updateMembershipFee(fee.id, {
        status: 'OVERDUE',
      });
    }
  }
  
  // Update card status
  const newStatus = await computeCardStatus(memberId);
  const cardMeta = await storage.getCardMetaByMember(memberId);
  
  if (cardMeta && cardMeta.status !== newStatus) {
    await storage.updateCardMeta(cardMeta.id, {
      status: newStatus,
      version: (cardMeta.version || 1) + 1,
    });
  }
}

/**
 * Check if rollover is needed (has overdue fees that haven't been processed)
 */
export async function checkRolloverNeeded(tenantId?: string): Promise<boolean> {
  const today = startOfDayBE(nowBE());
  
  const allFees = tenantId 
    ? await storage.getMembershipFeesByTenant(tenantId)
    : await storage.getAllMembershipFees();
  
  // Check if there are any OPEN fees past their periodEnd
  const needsRollover = allFees.some(fee => {
    const periodEnd = toBEDate(fee.periodEnd);
    return fee.status === 'OPEN' && today > periodEnd;
  });
  
  return needsRollover;
}