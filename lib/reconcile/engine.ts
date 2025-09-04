import { z } from "zod";
import { differenceInDays, format, parseISO } from "date-fns";
import type { 
  BankTransaction, 
  MembershipFee, 
  Member, 
  MatchRule 
} from "../../shared/schema";

// Matching resultaat schema
export const matchResultSchema = z.object({
  transactionId: z.string(),
  matchedFeeId: z.string().optional(),
  matchedMemberId: z.string().optional(),
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  matchScore: z.number().min(0).max(100),
  status: z.enum(['VOORGESTELD', 'GEDEELTELIJK_GEMATCHT', 'ONTVANGEN']),
  reasons: z.array(z.string()),
});

export type MatchResult = z.infer<typeof matchResultSchema>;

// Matching context voor database lookups
export interface MatchingContext {
  tenantId: string;
  fees: MembershipFee[];
  members: Member[];
  rules: MatchRule[];
  existingTransactions: BankTransaction[];
}

/**
 * Automatische matching engine voor banktransacties
 */
export class TransactionMatchingEngine {
  
  /**
   * Suggereer matches voor een transactie
   */
  suggestMatches(
    transaction: BankTransaction, 
    context: MatchingContext
  ): MatchResult {
    
    const reasons: string[] = [];
    let score = 0;
    let matchedFeeId: string | undefined;
    let matchedMemberId: string | undefined;
    let categoryId: string | undefined;
    let vendorId: string | undefined;
    
    // Skip als transactie al gematcht is
    if (transaction.status !== 'ONTVANGEN') {
      return {
        transactionId: transaction.id,
        matchScore: 0,
        status: 'ONTVANGEN',
        reasons: ['Transactie al verwerkt'],
      };
    }
    
    // 1. Duplicaat detectie
    if (this.isDuplicate(transaction, context.existingTransactions)) {
      reasons.push('Mogelijke duplicaat gedetecteerd');
      score -= 50; // Penalty voor duplicaten
    }
    
    // 2. Credit transacties (inkomsten) - match met lidgelden
    if (transaction.side === 'CREDIT') {
      const feeMatch = this.matchWithMembershipFee(transaction, context);
      if (feeMatch) {
        score += feeMatch.score;
        matchedFeeId = feeMatch.feeId;
        matchedMemberId = feeMatch.memberId;
        reasons.push(...feeMatch.reasons);
        categoryId = 'membership-fee'; // Default category voor lidgelden
      }
    }
    
    // 3. Debet transacties (uitgaven) - match met categorieën
    if (transaction.side === 'DEBET') {
      const expenseMatch = this.matchExpenseCategory(transaction, context);
      if (expenseMatch) {
        score += expenseMatch.score;
        categoryId = expenseMatch.categoryId;
        vendorId = expenseMatch.vendorId;
        reasons.push(...expenseMatch.reasons);
      }
    }
    
    // 4. Match rules toepassen
    const ruleMatch = this.applyMatchRules(transaction, context);
    if (ruleMatch) {
      score += ruleMatch.score;
      if (ruleMatch.categoryId) categoryId = ruleMatch.categoryId;
      if (ruleMatch.vendorId) vendorId = ruleMatch.vendorId;
      if (ruleMatch.feeId) matchedFeeId = ruleMatch.feeId;
      if (ruleMatch.memberId) matchedMemberId = ruleMatch.memberId;
      reasons.push(...ruleMatch.reasons);
    }
    
    // Bepaal status op basis van score
    let status: 'VOORGESTELD' | 'GEDEELTELIJK_GEMATCHT' | 'ONTVANGEN';
    if (score >= 70) {
      status = 'VOORGESTELD';
    } else if (score >= 40) {
      status = 'GEDEELTELIJK_GEMATCHT';
    } else {
      status = 'ONTVANGEN';
    }
    
    return {
      transactionId: transaction.id,
      matchedFeeId,
      matchedMemberId,
      categoryId,
      vendorId,
      matchScore: Math.max(0, Math.min(100, score)),
      status,
      reasons,
    };
  }
  
  /**
   * Batch verwerking van meerdere transacties
   */
  suggestBatchMatches(
    transactions: BankTransaction[],
    context: MatchingContext
  ): MatchResult[] {
    return transactions.map(transaction => 
      this.suggestMatches(transaction, context)
    );
  }
  
  /**
   * Duplicaat detectie
   */
  private isDuplicate(
    transaction: BankTransaction, 
    existingTransactions: BankTransaction[]
  ): boolean {
    const tolerance = 1; // 1 dag tolerantie
    
    return existingTransactions.some(existing => {
      if (existing.id === transaction.id) return false;
      
      // Zelfde bedrag
      const sameAmount = Math.abs(
        parseFloat(existing.amount) - parseFloat(transaction.amount)
      ) < 0.01;
      
      // Zelfde datum (±1 dag)
      const daysDiff = Math.abs(differenceInDays(
        new Date(existing.bookingDate),
        new Date(transaction.bookingDate)
      ));
      const sameDate = daysDiff <= tolerance;
      
      // Zelfde referentie (indien aanwezig)
      const sameRef = existing.ref && transaction.ref && 
                     existing.ref === transaction.ref;
      
      return sameAmount && (sameDate || sameRef);
    });
  }
  
  /**
   * Match met lidgelden (voor credit transacties)
   */
  private matchWithMembershipFee(
    transaction: BankTransaction,
    context: MatchingContext
  ): { score: number; feeId: string; memberId: string; reasons: string[] } | null {
    
    let bestMatch: { fee: MembershipFee; score: number; reasons: string[] } | null = null;
    
    for (const fee of context.fees) {
      if (fee.status === 'PAID') continue; // Skip reeds betaalde fees
      
      const score = this.calculateFeeMatchScore(transaction, fee, context);
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { fee, score, reasons: [] };
      }
    }
    
    if (!bestMatch) return null;
    
    return {
      score: bestMatch.score,
      feeId: bestMatch.fee.id,
      memberId: bestMatch.fee.memberId,
      reasons: [`Gematcht met lidgeld voor ${bestMatch.fee.memberName}`],
    };
  }
  
  /**
   * Bereken match score voor een lidgeld
   */
  private calculateFeeMatchScore(
    transaction: BankTransaction,
    fee: MembershipFee,
    context: MatchingContext
  ): number {
    let score = 0;
    
    // 1. Bedrag matching (±€0,50 tolerantie)
    const transactionAmount = parseFloat(transaction.amount);
    const feeAmount = parseFloat(fee.amount);
    const amountDiff = Math.abs(transactionAmount - feeAmount);
    
    if (amountDiff <= 0.50) {
      score += 40; // Exacte bedrag match
    } else if (amountDiff <= 2.00) {
      score += 20; // Ongeveer bedrag match
    }
    
    // 2. Beschrijving bevat lidnummer of naam
    const description = transaction.description?.toLowerCase() || '';
    const ref = transaction.ref?.toLowerCase() || '';
    const memberNumber = fee.memberNumber.toLowerCase();
    const memberName = fee.memberName.toLowerCase();
    
    if (description.includes(memberNumber) || ref.includes(memberNumber)) {
      score += 25;
    }
    
    if (description.includes(memberName) || ref.includes(memberName)) {
      score += 15;
    }
    
    // 3. IBAN matching met lid
    if (transaction.iban) {
      const member = context.members.find(m => m.id === fee.memberId);
      // Hier zou je member financial settings moeten checken voor IBAN
      // Voor nu simpele check
      score += 10;
    }
    
    // 4. Periode hint in beschrijving
    const currentYear = new Date().getFullYear();
    const feeYear = new Date(fee.periodStart).getFullYear();
    
    if (description.includes(feeYear.toString()) || 
        ref.includes(feeYear.toString())) {
      score += 10;
    }
    
    return score;
  }
  
  /**
   * Match uitgaven met categorieën
   */
  private matchExpenseCategory(
    transaction: BankTransaction,
    context: MatchingContext
  ): { score: number; categoryId?: string; vendorId?: string; reasons: string[] } | null {
    
    // Basis categorisatie op basis van beschrijving
    const description = transaction.description?.toLowerCase() || '';
    const counterparty = transaction.counterparty?.toLowerCase() || '';
    
    let score = 0;
    let categoryId: string | undefined;
    let reasons: string[] = [];
    
    // Eenvoudige keyword matching
    if (description.includes('elektriciteit') || description.includes('stroom')) {
      categoryId = 'utilities';
      score += 30;
      reasons.push('Geclassificeerd als nutsvoorziening');
    } else if (description.includes('water') || description.includes('gas')) {
      categoryId = 'utilities';
      score += 30;
      reasons.push('Geclassificeerd als nutsvoorziening');
    } else if (description.includes('verzekering')) {
      categoryId = 'insurance';
      score += 30;
      reasons.push('Geclassificeerd als verzekering');
    } else if (description.includes('onderhoud') || description.includes('reparatie')) {
      categoryId = 'maintenance';
      score += 25;
      reasons.push('Geclassificeerd als onderhoud');
    }
    
    if (score > 0) {
      return { score, categoryId, reasons };
    }
    
    return null;
  }
  
  /**
   * Pas match rules toe
   */
  private applyMatchRules(
    transaction: BankTransaction,
    context: MatchingContext
  ): { 
    score: number; 
    categoryId?: string; 
    vendorId?: string; 
    feeId?: string; 
    memberId?: string; 
    reasons: string[] 
  } | null {
    
    // Sorteer rules op prioriteit
    const sortedRules = context.rules
      .filter(rule => rule.active)
      .sort((a, b) => (b.priority || 100) - (a.priority || 100));
    
    for (const rule of sortedRules) {
      if (this.ruleMatches(transaction, rule)) {
        const action = rule.action as any;
        return {
          score: 15, // Match rule bonus
          categoryId: action.categoryId,
          vendorId: action.vendorId,
          feeId: action.linkTo === 'FEE' ? action.targetId : undefined,
          memberId: action.linkTo === 'MEMBER' ? action.targetId : undefined,
          reasons: [`Match rule toegepast: ${rule.name}`],
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check of een regel matched met de transactie
   */
  private ruleMatches(transaction: BankTransaction, rule: MatchRule): boolean {
    const criteria = rule.criteria as any;
    
    // Contains check
    if (criteria.contains && Array.isArray(criteria.contains)) {
      const description = transaction.description?.toLowerCase() || '';
      const hasKeyword = criteria.contains.some((keyword: string) => 
        description.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }
    
    // IBAN check
    if (criteria.iban && transaction.iban) {
      if (!transaction.iban.includes(criteria.iban)) return false;
    }
    
    // Amount tolerance check
    if (criteria.amountToleranceCents && criteria.targetAmount) {
      const transactionCents = Math.round(parseFloat(transaction.amount) * 100);
      const targetCents = criteria.targetAmount;
      const tolerance = criteria.amountToleranceCents;
      
      if (Math.abs(transactionCents - targetCents) > tolerance) return false;
    }
    
    return true;
  }
  
  /**
   * Update transactie met match resultaat
   */
  async applyMatch(
    transactionId: string,
    matchResult: MatchResult
  ): Promise<void> {
    // Hier zou je de database update implementeren
    // Voor nu alleen logging
    console.log(`Applying match for transaction ${transactionId}:`, matchResult);
  }
}

/**
 * Utility functies
 */
export function createMatchingEngine(): TransactionMatchingEngine {
  return new TransactionMatchingEngine();
}

export function formatMatchScore(score: number): string {
  if (score >= 70) return 'Hoge match';
  if (score >= 40) return 'Gemiddelde match';
  return 'Lage match';
}