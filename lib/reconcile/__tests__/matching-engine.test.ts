import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionMatchingEngine } from '../engine';
import type { BankTransaction, MembershipFee, Member, MatchRule, MatchingContext } from '../engine';

describe('TransactionMatchingEngine', () => {
  let engine: TransactionMatchingEngine;
  let mockContext: MatchingContext;

  beforeEach(() => {
    engine = new TransactionMatchingEngine();
    
    // Mock data voor tests
    mockContext = {
      tenantId: 'test-tenant',
      fees: [
        {
          id: 'fee-1',
          memberId: 'member-1',
          memberNumber: '001',
          memberName: 'Jan Janssen',
          amount: '25.00',
          status: 'OPEN',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-12-31'),
        } as MembershipFee,
        {
          id: 'fee-2',
          memberId: 'member-2',
          memberNumber: '002',
          memberName: 'Marie Peeters',
          amount: '30.00',
          status: 'OPEN',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-12-31'),
        } as MembershipFee,
      ],
      members: [
        {
          id: 'member-1',
          memberNumber: '001',
          firstName: 'Jan',
          lastName: 'Janssen',
        } as Member,
        {
          id: 'member-2',
          memberNumber: '002',
          firstName: 'Marie',
          lastName: 'Peeters',
        } as Member,
      ],
      rules: [
        {
          id: 'rule-1',
          name: 'Lidgeld matching',
          priority: 100,
          active: true,
          criteria: {
            contains: ['lidgeld'],
            amountToleranceCents: 50,
          },
          action: {
            linkTo: 'FEE',
            categoryId: 'membership',
          },
        } as MatchRule,
      ],
      existingTransactions: [],
    };
  });

  describe('Credit transaction matching (lidgelden)', () => {
    it('should match exact amount with membership fee', () => {
      const transaction: BankTransaction = {
        id: 'tx-1',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'CREDIT',
        amount: '25.00',
        currency: 'EUR',
        description: 'Lidgeld betaling',
        status: 'ONTVANGEN',
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(transaction, mockContext);

      expect(result.matchScore).toBeGreaterThan(70);
      expect(result.status).toBe('VOORGESTELD');
      expect(result.matchedFeeId).toBe('fee-1');
      expect(result.matchedMemberId).toBe('member-1');
    });

    it('should match transaction with member number in description', () => {
      const transaction: BankTransaction = {
        id: 'tx-2',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'CREDIT',
        amount: '25.50', // Slight difference
        currency: 'EUR',
        description: 'Betaling lid 001',
        status: 'ONTVANGEN',
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(transaction, mockContext);

      expect(result.matchScore).toBeGreaterThan(40);
      expect(result.status).toBeOneOf(['VOORGESTELD', 'GEDEELTELIJK_GEMATCHT']);
      expect(result.matchedFeeId).toBe('fee-1');
    });

    it('should match transaction with member name in description', () => {
      const transaction: BankTransaction = {
        id: 'tx-3',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'CREDIT',
        amount: '30.00',
        currency: 'EUR',
        description: 'Marie Peeters lidgeld',
        status: 'ONTVANGEN',
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(transaction, mockContext);

      expect(result.matchScore).toBeGreaterThan(40);
      expect(result.matchedFeeId).toBe('fee-2');
      expect(result.matchedMemberId).toBe('member-2');
    });

    it('should have lower score for large amount difference', () => {
      const transaction: BankTransaction = {
        id: 'tx-4',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'CREDIT',
        amount: '50.00', // Veel hoger dan verwacht
        currency: 'EUR',
        description: 'Betaling',
        status: 'ONTVANGEN',
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(transaction, mockContext);

      expect(result.matchScore).toBeLessThan(40);
      expect(result.status).toBe('ONTVANGEN');
    });
  });

  describe('Debit transaction matching (uitgaven)', () => {
    it('should categorize utility expenses', () => {
      const transaction: BankTransaction = {
        id: 'tx-5',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'DEBET',
        amount: '120.50',
        currency: 'EUR',
        description: 'Elektriciteit rekening maart',
        counterparty: 'EANDIS',
        status: 'ONTVANGEN',
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(transaction, mockContext);

      expect(result.matchScore).toBeGreaterThan(0);
      expect(result.categoryId).toBe('utilities');
      expect(result.reasons).toContain('Geclassificeerd als nutsvoorziening');
    });

    it('should categorize insurance expenses', () => {
      const transaction: BankTransaction = {
        id: 'tx-6',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'DEBET',
        amount: '85.00',
        currency: 'EUR',
        description: 'Verzekering brand',
        status: 'ONTVANGEN',
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(transaction, mockContext);

      expect(result.categoryId).toBe('insurance');
      expect(result.reasons).toContain('Geclassificeerd als verzekering');
    });
  });

  describe('Match rules application', () => {
    it('should apply match rules with keyword matching', () => {
      const contextWithRule: MatchingContext = {
        ...mockContext,
        rules: [
          {
            id: 'rule-2',
            name: 'Elektriciteit regel',
            priority: 90,
            active: true,
            criteria: {
              contains: ['elektriciteit', 'stroom'],
            },
            action: {
              categoryId: 'utilities',
              vendorId: 'eandis',
            },
          } as MatchRule,
        ],
      };

      const transaction: BankTransaction = {
        id: 'tx-7',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'DEBET',
        amount: '95.00',
        currency: 'EUR',
        description: 'Elektriciteit verbruik',
        status: 'ONTVANGEN',
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(transaction, contextWithRule);

      expect(result.categoryId).toBe('utilities');
      expect(result.vendorId).toBe('eandis');
      expect(result.reasons).toContainEqual('Match rule toegepast: Elektriciteit regel');
    });
  });

  describe('Duplicate detection', () => {
    it('should detect duplicate transactions', () => {
      const existingTransaction: BankTransaction = {
        id: 'existing-tx',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'CREDIT',
        amount: '25.00',
        currency: 'EUR',
        description: 'Lidgeld Jan',
        ref: 'REF123',
        status: 'GEBOEKT',
        createdAt: new Date(),
      } as BankTransaction;

      const contextWithExisting: MatchingContext = {
        ...mockContext,
        existingTransactions: [existingTransaction],
      };

      const duplicateTransaction: BankTransaction = {
        id: 'tx-8',
        tenantId: 'test-tenant',
        statementId: 'stmt-2',
        bookingDate: new Date('2024-03-15'), // Zelfde datum
        side: 'CREDIT',
        amount: '25.00', // Zelfde bedrag
        currency: 'EUR',
        description: 'Lidgeld Jan',
        ref: 'REF123', // Zelfde referentie
        status: 'ONTVANGEN',
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(duplicateTransaction, contextWithExisting);

      expect(result.reasons).toContain('Mogelijke duplicaat gedetecteerd');
      expect(result.matchScore).toBeLessThan(50); // Score penalty voor duplicaat
    });
  });

  describe('Batch processing', () => {
    it('should process multiple transactions', () => {
      const transactions: BankTransaction[] = [
        {
          id: 'tx-9',
          tenantId: 'test-tenant',
          statementId: 'stmt-1',
          bookingDate: new Date('2024-03-15'),
          side: 'CREDIT',
          amount: '25.00',
          currency: 'EUR',
          description: 'Lidgeld Jan Janssen',
          status: 'ONTVANGEN',
          createdAt: new Date(),
        } as BankTransaction,
        {
          id: 'tx-10',
          tenantId: 'test-tenant',
          statementId: 'stmt-1',
          bookingDate: new Date('2024-03-15'),
          side: 'DEBET',
          amount: '150.00',
          currency: 'EUR',
          description: 'Gas rekening',
          status: 'ONTVANGEN',
          createdAt: new Date(),
        } as BankTransaction,
      ];

      const results = engine.suggestBatchMatches(transactions, mockContext);

      expect(results).toHaveLength(2);
      expect(results[0].transactionId).toBe('tx-9');
      expect(results[1].transactionId).toBe('tx-10');
      
      // Eerste moet match hebben met lidgeld
      expect(results[0].matchedFeeId).toBe('fee-1');
      
      // Tweede moet utility categorie hebben
      expect(results[1].categoryId).toBe('utilities');
    });
  });

  describe('Edge cases', () => {
    it('should handle already processed transactions', () => {
      const processedTransaction: BankTransaction = {
        id: 'tx-11',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'CREDIT',
        amount: '25.00',
        currency: 'EUR',
        description: 'Lidgeld',
        status: 'GEMATCHT', // Al gematcht
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(processedTransaction, mockContext);

      expect(result.matchScore).toBe(0);
      expect(result.status).toBe('ONTVANGEN');
      expect(result.reasons).toContain('Transactie al verwerkt');
    });

    it('should handle transactions without context data', () => {
      const emptyContext: MatchingContext = {
        tenantId: 'test-tenant',
        fees: [],
        members: [],
        rules: [],
        existingTransactions: [],
      };

      const transaction: BankTransaction = {
        id: 'tx-12',
        tenantId: 'test-tenant',
        statementId: 'stmt-1',
        bookingDate: new Date('2024-03-15'),
        side: 'CREDIT',
        amount: '25.00',
        currency: 'EUR',
        description: 'Onbekende betaling',
        status: 'ONTVANGEN',
        createdAt: new Date(),
      } as BankTransaction;

      const result = engine.suggestMatches(transaction, emptyContext);

      expect(result.matchScore).toBeLessThan(40);
      expect(result.status).toBe('ONTVANGEN');
    });
  });
});