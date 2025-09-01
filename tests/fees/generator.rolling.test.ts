import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ensureCurrentRollingFeeForMember, generateTenantFees } from '../../lib/server/fees/generator';

// Mock dependencies
vi.mock('../../lib/server/db', () => ({
  db: {
    query: {
      members: {
        findFirst: vi.fn(),
        findMany: vi.fn()
      },
      membershipFees: {
        findFirst: vi.fn()
      }
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn()
    })
  }
}));

vi.mock('../../lib/server/fees/anchor', () => ({
  getBillingAnchor: vi.fn()
}));

vi.mock('../../lib/server/time', () => ({
  beNow: vi.fn(),
  toUtcISO: vi.fn((date) => date.toISOString())
}));

import { db } from '../../lib/server/db';
import { getBillingAnchor } from '../../lib/server/fees/anchor';
import { beNow } from '../../lib/server/time';

describe('Fee Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureCurrentRollingFeeForMember', () => {
    it('should create fee for active member with no existing fee', async () => {
      const memberId = 'member-123';
      const anchor = new Date('2025-01-15T10:00:00.000Z');
      const asOf = new Date('2025-06-01T12:00:00.000Z');

      // Mock getBillingAnchor
      (getBillingAnchor as any).mockResolvedValue(anchor);

      // Mock member with financial settings
      (db.query.members.findFirst as any).mockResolvedValue({
        id: memberId,
        tenantId: 'tenant-123',
        memberNumber: 'M001',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        financialSettings: {
          preferredTerm: 'MONTHLY',
          preferredMethod: 'SEPA',
          monthlyAmount: 25.00,
          yearlyAmount: 300.00,
          sepaMandate: 'MANDATE-123'
        }
      });

      // Mock no existing fee
      (db.query.membershipFees.findFirst as any).mockResolvedValue(null);

      // Mock insert
      const mockInsert = {
        values: vi.fn()
      };
      (db.insert as any).mockReturnValue(mockInsert);

      await ensureCurrentRollingFeeForMember(memberId, asOf);

      expect(getBillingAnchor).toHaveBeenCalledWith(memberId);
      expect(db.query.members.findFirst).toHaveBeenCalled();
      expect(db.query.membershipFees.findFirst).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          memberId,
          memberNumber: 'M001',
          memberName: 'John Doe',
          amount: 25.00,
          method: 'SEPA',
          status: 'OPEN',
          sepaEligible: true
        })
      );
    });

    it('should skip inactive members', async () => {
      const memberId = 'member-456';
      
      (getBillingAnchor as any).mockResolvedValue(new Date());
      (db.query.members.findFirst as any).mockResolvedValue({
        id: memberId,
        isActive: false
      });

      await ensureCurrentRollingFeeForMember(memberId);

      expect(db.query.membershipFees.findFirst).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should skip members with zero amount', async () => {
      const memberId = 'member-789';
      
      (getBillingAnchor as any).mockResolvedValue(new Date());
      (db.query.members.findFirst as any).mockResolvedValue({
        id: memberId,
        isActive: true,
        financialSettings: {
          preferredTerm: 'MONTHLY',
          monthlyAmount: 0,
          yearlyAmount: 0
        }
      });

      await ensureCurrentRollingFeeForMember(memberId);

      expect(db.query.membershipFees.findFirst).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should not duplicate existing fees', async () => {
      const memberId = 'member-existing';
      
      (getBillingAnchor as any).mockResolvedValue(new Date('2025-01-15T10:00:00.000Z'));
      (db.query.members.findFirst as any).mockResolvedValue({
        id: memberId,
        isActive: true,
        financialSettings: {
          preferredTerm: 'MONTHLY',
          monthlyAmount: 25.00
        }
      });

      // Mock existing fee
      (db.query.membershipFees.findFirst as any).mockResolvedValue({
        id: 'fee-123',
        memberId
      });

      await ensureCurrentRollingFeeForMember(memberId);

      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('generateTenantFees', () => {
    it('should process all active members in tenant', async () => {
      const tenantId = 'tenant-abc';
      const members = [
        {
          id: 'member-1',
          isActive: true,
          financialSettings: { preferredTerm: 'MONTHLY', monthlyAmount: 25 }
        },
        {
          id: 'member-2',
          isActive: true,
          financialSettings: { preferredTerm: 'YEARLY', yearlyAmount: 300 }
        }
      ];

      (db.query.members.findMany as any).mockResolvedValue(members);
      (beNow as any).mockReturnValue(new Date('2025-06-01T12:00:00.000Z'));

      // Mock the other calls for each member
      (getBillingAnchor as any).mockResolvedValue(new Date('2025-01-15T10:00:00.000Z'));
      (db.query.members.findFirst as any).mockImplementation(({ where }) => {
        const memberId = where.toString(); // Simplified for test
        return Promise.resolve(members.find(m => m.id.includes(memberId.slice(-1))));
      });
      (db.query.membershipFees.findFirst as any).mockResolvedValue(null);

      const mockInsert = { values: vi.fn() };
      (db.insert as any).mockReturnValue(mockInsert);

      await generateTenantFees(tenantId, undefined, 'current');

      expect(db.query.members.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
          with: { financialSettings: true }
        })
      );
    });

    it('should handle errors gracefully and continue with other members', async () => {
      const tenantId = 'tenant-error';
      const members = [
        { id: 'member-1', isActive: true, financialSettings: {} },
        { id: 'member-2', isActive: true, financialSettings: {} }
      ];

      (db.query.members.findMany as any).mockResolvedValue(members);
      (getBillingAnchor as any).mockImplementation((memberId) => {
        if (memberId === 'member-1') {
          throw new Error('Test error');
        }
        return Promise.resolve(new Date());
      });

      // Should not throw, but continue processing
      await expect(generateTenantFees(tenantId)).resolves.toBeUndefined();
    });
  });

  describe('Idempotency', () => {
    it('should not create duplicate fees when run multiple times', async () => {
      const memberId = 'member-idempotent';
      const anchor = new Date('2025-01-15T10:00:00.000Z');
      
      (getBillingAnchor as any).mockResolvedValue(anchor);
      (db.query.members.findFirst as any).mockResolvedValue({
        id: memberId,
        isActive: true,
        financialSettings: {
          preferredTerm: 'MONTHLY',
          monthlyAmount: 25.00
        }
      });

      let callCount = 0;
      (db.query.membershipFees.findFirst as any).mockImplementation(() => {
        callCount++;
        // First call: no existing fee, second call: fee exists
        return callCount === 1 ? null : { id: 'fee-123', memberId };
      });

      const mockInsert = { values: vi.fn() };
      (db.insert as any).mockReturnValue(mockInsert);

      // First run - should create fee
      await ensureCurrentRollingFeeForMember(memberId);
      expect(mockInsert.values).toHaveBeenCalledTimes(1);

      // Second run - should not create duplicate
      await ensureCurrentRollingFeeForMember(memberId);
      expect(mockInsert.values).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });
});