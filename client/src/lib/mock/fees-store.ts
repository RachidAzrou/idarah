export type FeeStatus = 'OPEN' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'SEPA' | 'OVERSCHRIJVING' | 'BANCONTACT' | 'CASH';

export type Fee = {
  id: string;
  memberId: string;
  memberNumber: string;
  memberName: string;
  periodStart: string; // ISO
  periodEnd: string;   // ISO
  amount: number;      // in € for mock
  method: PaymentMethod;
  status: FeeStatus;
  paidAt?: string;
  sepaEligible?: boolean;
  note?: string;
};

// In-memory store
let fees: Fee[] = [
  {
    id: 'f1',
    memberId: 'm1',
    memberNumber: '0001',
    memberName: 'Emma van der Berg',
    periodStart: '2024-01-01',
    periodEnd: '2024-12-31',
    amount: 120.00,
    method: 'SEPA',
    status: 'PAID',
    paidAt: '2024-01-15',
    sepaEligible: true
  },
  {
    id: 'f2', 
    memberId: 'm3',
    memberNumber: '0003',
    memberName: 'Fatima El Amrani',
    periodStart: '2024-06-01',
    periodEnd: '2024-06-30',
    amount: 25.00,
    method: 'OVERSCHRIJVING',
    status: 'OPEN',
    sepaEligible: false
  }
];

export function createFee(payload: {
  memberId: string;
  memberNumber: string;
  memberName: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  method: PaymentMethod;
  sepaEligible?: boolean;
  note?: string;
}): Fee {
  const newFee: Fee = {
    id: `f${Date.now()}`,
    ...payload,
    status: 'OPEN'
  };
  
  fees.push(newFee);
  return newFee;
}

export function markPaid(id: string, paidAt: string): void {
  const fee = fees.find(f => f.id === id);
  if (fee) {
    fee.status = 'PAID';
    fee.paidAt = paidAt;
  }
}

export function listFees(): Fee[] {
  return [...fees];
}

export function overlaps(memberId: string, startISO: string, endISO: string): boolean {
  const start = new Date(startISO);
  const end = new Date(endISO);
  
  return fees.some(fee => {
    if (fee.memberId !== memberId) return false;
    
    const feeStart = new Date(fee.periodStart);
    const feeEnd = new Date(fee.periodEnd);
    
    // Check if periods overlap
    return start <= feeEnd && end >= feeStart;
  });
}