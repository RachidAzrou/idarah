/**
 * Mock fee store for development
 */

import { NewFeeFormData } from "../zod-fee";

// Mock function to create a fee
export function createFee(feeData: NewFeeFormData): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `fee_${Date.now()}`,
        ...feeData,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      });
    }, 500);
  });
}

// Mock function to mark fee as paid
export function markPaid(feeId: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: feeId,
        status: 'PAID',
        paidAt: new Date().toISOString(),
      });
    }, 300);
  });
}

// Mock function to get fees
export function getFees(): Promise<any[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'fee_1',
          memberNumber: 'M001',
          memberName: 'Jan Janssens',
          amount: '25.00',
          term: 'MONTHLY',
          status: 'OPEN',
          method: 'SEPA',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          createdAt: '2024-01-01T00:00:00.000Z',
        }
      ]);
    }, 300);
  });
}

/**
 * Check if two date periods overlap
 */
export function overlaps(
  start1: Date | string, 
  end1: Date | string, 
  start2: Date | string, 
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? new Date(start1) : start1;
  const e1 = typeof end1 === 'string' ? new Date(end1) : end1;
  const s2 = typeof start2 === 'string' ? new Date(start2) : start2;
  const e2 = typeof end2 === 'string' ? new Date(end2) : end2;
  
  return s1 <= e2 && s2 <= e1;
}