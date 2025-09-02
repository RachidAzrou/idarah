import { storage } from "../storage";
import { createHash, randomBytes } from "crypto";
import type { Member, CardMeta, Tenant, CardVerifyResponse } from "@shared/schema";

export class CardService {
  /**
   * Generate a secure token for card operations
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Calculate ETag based on member data and tenant branding version
   */
  private calculateETag(member: Member, tenant: Tenant): string {
    const data = {
      memberNumber: member.memberNumber,
      firstName: member.firstName,
      lastName: member.lastName,
      category: member.category,
      active: member.active,
      // Add tenant branding version when available
      brandingVersion: 1, // tenant.brandingVersion || 1
    };
    
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Get or create card metadata for a member
   */
  async getOrCreateCardMeta(memberId: string): Promise<{ member: Member; cardMeta: CardMeta; tenant: Tenant } | null> {
    try {
      // Try to get existing card data
      let cardData = await storage.getMemberWithCardAndTenant(memberId);
      
      if (cardData) {
        // Check if ETag is still valid
        const currentETag = this.calculateETag(cardData.member, cardData.tenant);
        if (cardData.cardMeta.etag !== currentETag) {
          // ETag mismatch, need to bump version and rotate tokens
          const updatedCardMeta = await this.invalidateCard(cardData.cardMeta.id, currentETag);
          cardData.cardMeta = updatedCardMeta;
        }
        return cardData;
      }

      // No card exists, create one
      const member = await storage.getMember(memberId);
      if (!member) return null;

      const tenant = await storage.getTenant(member.tenantId);
      if (!tenant) return null;

      const etag = this.calculateETag(member, tenant);
      const newCardMeta = await storage.createCardMeta({
        tenantId: member.tenantId,
        memberId: member.id,
        version: 1,
        etag,
        secureToken: this.generateSecureToken(),
        qrToken: this.generateSecureToken(),
        status: 'ACTUEEL',
        validUntil: new Date(new Date().getFullYear(), 11, 31), // End of current year
      });

      return { member, cardMeta: newCardMeta, tenant };
    } catch (error) {
      console.error('Error in getOrCreateCardMeta:', error);
      return null;
    }
  }

  /**
   * Invalidate a card by bumping version and rotating tokens
   */
  async invalidateCard(cardId: string, newETag?: string): Promise<CardMeta> {
    // Find the card by ID - note: cardId parameter should be memberId for this function
    const existingCard = await storage.getCardMetaByMember(cardId);
    if (!existingCard) {
      throw new Error('Card not found');
    }

    const updates = {
      version: existingCard.version + 1,
      etag: newETag || existingCard.etag,
      secureToken: this.generateSecureToken(),
      qrToken: this.generateSecureToken(),
      status: 'ACTUEEL' as const,
      lastRenderedAt: new Date(),
    };

    return await storage.updateCardMeta(existingCard.id, updates);
  }

  /**
   * Verify card using QR token
   */
  async verifyCardByQrToken(qrToken: string): Promise<CardVerifyResponse | null> {
    try {
      const cardMeta = await storage.getCardMetaByQrToken(qrToken);
      if (!cardMeta) return null;

      const member = await storage.getMember(cardMeta.memberId);
      if (!member) return null;

      const tenant = await storage.getTenant(cardMeta.tenantId);
      if (!tenant) return null;

      // Check if member has paid for current year (simplified logic)
      const currentYear = new Date().getFullYear();
      const memberFees = await storage.getMembershipFeesByMember(member.id);
      const currentYearFees = memberFees.filter(fee => {
        const feeYear = new Date(fee.periodStart).getFullYear();
        return feeYear === currentYear;
      });
      const currentYearPaid = currentYearFees.some(fee => fee.status === 'PAID');

      return {
        ok: true,
        member: {
          naam: `${member.firstName} ${member.lastName}`,
          nummer: member.memberNumber,
        },
        status: {
          actief: member.active,
          betaaldDitJaar: currentYearPaid,
          geldigTot: cardMeta.validUntil?.toISOString().split('T')[0] || null,
        },
        tenant: {
          naam: tenant.name,
          slug: tenant.slug,
        },
        ts: Date.now(),
      };
    } catch (error) {
      console.error('Error in verifyCardByQrToken:', error);
      return null;
    }
  }

  /**
   * Get card data for display
   */
  async getCardData(memberId: string): Promise<{ member: Member; cardMeta: CardMeta; tenant: Tenant } | null> {
    return await this.getOrCreateCardMeta(memberId);
  }
}

export const cardService = new CardService();