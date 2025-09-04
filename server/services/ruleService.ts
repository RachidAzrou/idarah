import { db } from '../db';
import { members, rules, ruleOutcomes, ruleOverrides } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { Member, Rule, RuleOverride } from '@shared/schema';

export interface RuleValidationResult {
  eligible: boolean;
  hasOverride: boolean;
  override?: RuleOverride;
  violatedRules?: Rule[];
  warnings?: string[];
}

export interface VotingRightsConfig {
  minAge?: number;
  maxAge?: number;
  allowedCategories?: string[];
  excludedCategories?: string[];
  requireActiveMembership?: boolean;
  requirePaidFees?: boolean;
}

export interface CandidacyConfig {
  minAge?: number;
  maxAge?: number;
  allowedCategories?: string[];
  excludedCategories?: string[];
  minMembershipDuration?: number; // in years
  requirePaidFees?: boolean;
}

export class RuleService {
  
  /**
   * Evaluate voting rights for a member
   */
  async evaluateVotingRights(memberId: string, tenantId: string): Promise<RuleValidationResult> {
    // Get member data
    const [member] = await db
      .select()
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.tenantId, tenantId)));

    if (!member) {
      return {
        eligible: false,
        hasOverride: false,
        warnings: ['Lid niet gevonden']
      };
    }

    // Check for existing override
    const [override] = await db
      .select()
      .from(ruleOverrides)
      .where(and(
        eq(ruleOverrides.memberId, memberId),
        eq(ruleOverrides.tenantId, tenantId),
        eq(ruleOverrides.ruleScope, 'STEMRECHT'),
        eq(ruleOverrides.active, true)
      ));

    if (override) {
      return {
        eligible: override.overrideValue,
        hasOverride: true,
        override,
        warnings: override.overrideValue ? ['Stemrecht handmatig toegekend'] : ['Stemrecht handmatig ingetrokken']
      };
    }

    // Get voting rights rules for this tenant
    const votingRules = await db
      .select()
      .from(rules)
      .where(and(
        eq(rules.tenantId, tenantId),
        eq(rules.scope, 'STEMRECHT'),
        eq(rules.active, true)
      ));

    const violatedRules: Rule[] = [];
    const warnings: string[] = [];

    // Apply default business rules if no custom rules exist
    if (votingRules.length === 0) {
      const defaultResult = this.applyDefaultVotingRules(member);
      if (!defaultResult.eligible) {
        warnings.push(...(defaultResult.warnings || []));
      }
      return defaultResult;
    }

    // Evaluate custom rules
    for (const rule of votingRules) {
      const config = rule.parameters as VotingRightsConfig;
      const ruleResult = this.evaluateVotingRule(member, config);
      
      if (!ruleResult.eligible) {
        violatedRules.push(rule);
        warnings.push(...(ruleResult.warnings || []));
      }
    }

    const eligible = violatedRules.length === 0;

    return {
      eligible,
      hasOverride: false,
      violatedRules,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Apply default voting rights rules (Dutch/Belgian mosque standards)
   */
  private applyDefaultVotingRules(member: Member): RuleValidationResult {
    const warnings: string[] = [];
    let eligible = true;

    // Must be active member
    if (!member.active) {
      eligible = false;
      warnings.push('Lid is niet actief');
    }

    // Age restrictions (18+ for voting)
    if (member.birthDate) {
      const age = this.calculateAge(member.birthDate);
      if (age < 18) {
        eligible = false;
        warnings.push('Lid is jonger dan 18 jaar');
      }
    }

    // Category restrictions (no students/youth voting typically)
    if (member.category === 'STUDENT' || member.category === 'JEUGD') {
      eligible = false;
      warnings.push('Studenten en jeugdleden hebben geen stemrecht');
    }

    return {
      eligible,
      hasOverride: false,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Evaluate a specific voting rule
   */
  private evaluateVotingRule(member: Member, config: VotingRightsConfig): RuleValidationResult {
    const warnings: string[] = [];
    let eligible = true;

    // Age checks
    if (member.birthDate) {
      const age = this.calculateAge(member.birthDate);
      
      if (config.minAge && age < config.minAge) {
        eligible = false;
        warnings.push(`Lid is jonger dan vereiste minimumleeftijd (${config.minAge})`);
      }
      
      if (config.maxAge && age > config.maxAge) {
        eligible = false;
        warnings.push(`Lid is ouder dan vereiste maximumleeftijd (${config.maxAge})`);
      }
    }

    // Category checks
    if (config.allowedCategories && !config.allowedCategories.includes(member.category)) {
      eligible = false;
      warnings.push(`Lidcategorie '${member.category}' heeft geen stemrecht`);
    }

    if (config.excludedCategories && config.excludedCategories.includes(member.category)) {
      eligible = false;
      warnings.push(`Lidcategorie '${member.category}' is uitgesloten van stemrecht`);
    }

    // Active membership check
    if (config.requireActiveMembership && !member.active) {
      eligible = false;
      warnings.push('Actief lidmaatschap is vereist voor stemrecht');
    }

    return {
      eligible,
      hasOverride: false,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Create or update a rule override
   */
  async createRuleOverride(
    memberId: string,
    tenantId: string,
    ruleScope: 'STEMRECHT' | 'VERKIESBAAR',
    overrideValue: boolean,
    reason: string,
    overriddenBy: string
  ): Promise<RuleOverride> {
    // Deactivate any existing overrides for this member and scope
    await db
      .update(ruleOverrides)
      .set({ active: false })
      .where(and(
        eq(ruleOverrides.memberId, memberId),
        eq(ruleOverrides.tenantId, tenantId),
        eq(ruleOverrides.ruleScope, ruleScope)
      ));

    // Create new override
    const [override] = await db
      .insert(ruleOverrides)
      .values({
        tenantId,
        memberId,
        ruleScope,
        overrideValue,
        reason,
        overriddenBy
      })
      .returning();

    return override;
  }

  /**
   * Check if member has voting rights (with override support)
   */
  async hasVotingRights(memberId: string, tenantId: string): Promise<boolean> {
    const result = await this.evaluateVotingRights(memberId, tenantId);
    return result.eligible;
  }

  /**
   * Get detailed voting rights status for display
   */
  async getVotingRightsStatus(memberId: string, tenantId: string): Promise<{
    eligible: boolean;
    hasOverride: boolean;
    reason: string;
    warnings: string[];
  }> {
    const result = await this.evaluateVotingRights(memberId, tenantId);
    
    let reason = '';
    if (result.hasOverride) {
      reason = result.override?.overrideValue 
        ? `Handmatig toegekend: ${result.override.reason}`
        : `Handmatig ingetrokken: ${result.override.reason}`;
    } else if (result.eligible) {
      reason = 'Voldoet aan alle voorwaarden';
    } else {
      reason = result.warnings?.join('; ') || 'Voldoet niet aan voorwaarden';
    }

    return {
      eligible: result.eligible,
      hasOverride: result.hasOverride,
      reason,
      warnings: result.warnings || []
    };
  }

  /**
   * Calculate age from birth date
   */
  private calculateAge(birthDate: Date | string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}

export const ruleService = new RuleService();