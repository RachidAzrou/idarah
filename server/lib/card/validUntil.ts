import { storage } from '../../storage';
import { nowBE, toBEDate } from '../time/beTime';
import { getLatestPaidPeriod } from './status';
import { makeCardETag } from './etag';
import { randomBytes } from 'crypto';

/**
 * Update the validUntil date for a member's card
 * This is the core lifecycle function that determines when a card expires
 * 
 * Rules:
 * - validUntil = periodEnd of the latest PAID period
 * - If no paid periods, validUntil = null
 * - Updates version and ETag after changes
 */
export async function updateValidUntil(memberId: string): Promise<Date | null> {
  try {
    // Get the latest paid period for this member
    const latestPaidPeriod = await getLatestPaidPeriod(memberId);
    
    let newValidUntil: Date | null = null;
    
    if (latestPaidPeriod) {
      // validUntil is the end date of the latest paid period
      newValidUntil = toBEDate(latestPaidPeriod.periodEnd);
    }
    
    // Get or create card meta for this member
    let cardMeta = await storage.getCardMetaByMember(memberId);
    
    if (!cardMeta) {
      // Create initial card meta if it doesn't exist
      const member = await storage.getMember(memberId);
      if (!member) {
        throw new Error(`Member ${memberId} not found`);
      }
      
      const tenant = await storage.getTenant(member.tenantId);
      if (!tenant) {
        throw new Error(`Tenant ${member.tenantId} not found`);
      }
      
      // Generate tokens for new card
      const qrToken = generateSecureToken(32);
      const secureToken = generateSecureToken(64);
      
      // Create initial ETag
      const initialETag = makeCardETag(
        {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          memberNumber: member.memberNumber,
          category: member.category,
          votingRights: member.votingRights || false,
        },
        {
          name: tenant.name,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor || '#bb2e2e',
        },
        'NIET_ACTUEEL', // Initial status
        newValidUntil,
        [], // No badges initially
        1
      );
      
      cardMeta = await storage.createCardMeta({
        memberId,
        tenantId: member.tenantId,
        qrToken,
        secureToken,
        status: 'NIET_ACTUEEL',
        validUntil: newValidUntil,
        etag: initialETag,
        version: 1,
      });
    } else {
      // Update existing card meta
      const member = await storage.getMember(memberId);
      const tenant = await storage.getTenant(member!.tenantId);
      
      // Check if validUntil actually changed
      const currentValidUntil = cardMeta.validUntil ? toBEDate(cardMeta.validUntil) : null;
      const validUntilChanged = (
        (currentValidUntil === null && newValidUntil !== null) ||
        (currentValidUntil !== null && newValidUntil === null) ||
        (currentValidUntil && newValidUntil && currentValidUntil.getTime() !== newValidUntil.getTime())
      );
      
      if (validUntilChanged) {
        // Increment version and regenerate ETag
        const newVersion = (cardMeta.version || 1) + 1;
        
        const badges = [];
        if (member!.votingRights) {
          badges.push('Stemgerechtigd');
        }
        
        const newETag = makeCardETag(
          {
            id: member!.id,
            firstName: member!.firstName,
            lastName: member!.lastName,
            memberNumber: member!.memberNumber,
            category: member!.category,
            votingRights: member!.votingRights || false,
          },
          {
            name: tenant!.name,
            logoUrl: tenant!.logoUrl,
            primaryColor: tenant!.primaryColor || '#bb2e2e',
          },
          cardMeta.status,
          newValidUntil,
          badges,
          newVersion
        );
        
        // Update card meta with new validUntil, version, and ETag
        await storage.updateCardMeta(cardMeta.id, {
          validUntil: newValidUntil,
          version: newVersion,
          etag: newETag,
          updatedAt: nowBE(),
        });
        
        console.log(`Updated validUntil for member ${memberId}: ${newValidUntil?.toISOString() || 'null'} (version ${newVersion})`);
      }
    }
    
    return newValidUntil;
    
  } catch (error) {
    console.error('Error updating validUntil:', error);
    throw error;
  }
}

/**
 * Update validUntil for multiple members in batch
 * Useful for bulk operations and rollover processes
 */
export async function updateValidUntilBatch(memberIds: string[]): Promise<Map<string, Date | null>> {
  const results = new Map<string, Date | null>();
  
  for (const memberId of memberIds) {
    try {
      const validUntil = await updateValidUntil(memberId);
      results.set(memberId, validUntil);
    } catch (error) {
      console.error(`Error updating validUntil for member ${memberId}:`, error);
      results.set(memberId, null);
    }
  }
  
  return results;
}

/**
 * Force refresh of card meta (regenerate tokens and ETag)
 * Used for security purposes or when card needs to be invalidated
 */
export async function refreshCardMeta(memberId: string, regenerateTokens: boolean = false): Promise<void> {
  try {
    const cardMeta = await storage.getCardMetaByMemberId(memberId);
    if (!cardMeta) {
      throw new Error(`No card meta found for member ${memberId}`);
    }
    
    const member = await storage.getMember(memberId);
    const tenant = await storage.getTenant(member!.tenantId);
    
    const newVersion = (cardMeta.version || 1) + 1;
    const updateData: any = {
      version: newVersion,
      updatedAt: nowBE(),
    };
    
    // Regenerate tokens if requested
    if (regenerateTokens) {
      updateData.qrToken = generateSecureToken(32);
      updateData.secureToken = generateSecureToken(64);
    }
    
    // Generate new ETag
    const badges = [];
    if (member!.votingRights) {
      badges.push('Stemgerechtigd');
    }
    
    const newETag = makeCardETag(
      {
        id: member!.id,
        firstName: member!.firstName,
        lastName: member!.lastName,
        memberNumber: member!.memberNumber,
        category: member!.category,
        votingRights: member!.votingRights || false,
      },
      {
        name: tenant!.name,
        logoUrl: tenant!.logoUrl,
        primaryColor: tenant!.primaryColor || '#bb2e2e',
      },
      cardMeta.status,
      cardMeta.validUntil,
      badges,
      newVersion
    );
    
    updateData.etag = newETag;
    
    await storage.updateCardMeta(cardMeta.id, updateData);
    
    console.log(`Refreshed card meta for member ${memberId} (version ${newVersion})`);
    
  } catch (error) {
    console.error('Error refreshing card meta:', error);
    throw error;
  }
}

/**
 * Generate a cryptographically secure token
 */
function generateSecureToken(length: number): string {
  return randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
}

/**
 * Get the effective valid until date for a member
 * This is what should be displayed on the card
 */
export async function getEffectiveValidUntil(memberId: string): Promise<Date | null> {
  try {
    const cardMeta = await storage.getCardMetaByMemberId(memberId);
    
    if (!cardMeta || !cardMeta.validUntil) {
      return null;
    }
    
    return toBEDate(cardMeta.validUntil);
    
  } catch (error) {
    console.error('Error getting effective validUntil:', error);
    return null;
  }
}