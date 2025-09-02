export type Cell = 'PAID' | 'OPEN' | 'OVERDUE' | 'NA';

export interface MemberRow {
  memberId: string;
  name: string;
  category: 'Senior' | 'Standaard' | 'Student';
  months: Record<number, Cell>; // 1..12
}

export interface PaymentSnapshot {
  rows: MemberRow[];
  totals: {
    paid: number;
    open: number;
    overdue: number;
    na: number;
  };
  count: number;
}

const mockMembers: MemberRow[] = [
  {
    memberId: "1",
    name: "Ahmed Hassan",
    category: "Standaard",
    months: {
      1: 'PAID', 2: 'PAID', 3: 'PAID', 4: 'PAID',
      5: 'PAID', 6: 'OPEN', 7: 'OPEN', 8: 'OPEN',
      9: 'OPEN', 10: 'OPEN', 11: 'OPEN', 12: 'OPEN'
    }
  },
  {
    memberId: "2",
    name: "Fatima Al-Zahra",
    category: "Standaard", 
    months: {
      1: 'PAID', 2: 'PAID', 3: 'PAID', 4: 'PAID',
      5: 'PAID', 6: 'PAID', 7: 'PAID', 8: 'OPEN',
      9: 'OPEN', 10: 'OPEN', 11: 'OPEN', 12: 'OPEN'
    }
  },
  {
    memberId: "3",
    name: "Omar Ibrahim",
    category: "Student",
    months: {
      1: 'PAID', 2: 'PAID', 3: 'OVERDUE', 4: 'OVERDUE',
      5: 'OPEN', 6: 'OPEN', 7: 'OPEN', 8: 'OPEN',
      9: 'OPEN', 10: 'OPEN', 11: 'OPEN', 12: 'OPEN'
    }
  },
  {
    memberId: "4",
    name: "Khadija Benali",
    category: "Senior",
    months: {
      1: 'PAID', 2: 'PAID', 3: 'PAID', 4: 'PAID',
      5: 'PAID', 6: 'PAID', 7: 'PAID', 8: 'PAID',
      9: 'PAID', 10: 'OPEN', 11: 'OPEN', 12: 'OPEN'
    }
  },
  {
    memberId: "5",
    name: "Youssef Mansour",
    category: "Standaard",
    months: {
      1: 'PAID', 2: 'PAID', 3: 'PAID', 4: 'OVERDUE',
      5: 'OVERDUE', 6: 'OPEN', 7: 'OPEN', 8: 'OPEN',
      9: 'OPEN', 10: 'OPEN', 11: 'OPEN', 12: 'OPEN'
    }
  },
  {
    memberId: "6",
    name: "Aisha El-Khoury",
    category: "Student",
    months: {
      1: 'PAID', 2: 'PAID', 3: 'PAID', 4: 'PAID',
      5: 'PAID', 6: 'PAID', 7: 'OPEN', 8: 'OPEN',
      9: 'OPEN', 10: 'OPEN', 11: 'OPEN', 12: 'OPEN'
    }
  }
];

export function getPaymentSnapshot(
  year: number, 
  filters?: {
    categories?: string[];
    activeOnly?: boolean;
  }
): PaymentSnapshot {
  let filteredRows = [...mockMembers];

  if (filters?.categories && filters.categories.length > 0) {
    filteredRows = filteredRows.filter(row => 
      filters.categories!.includes(row.category)
    );
  }

  // Calculate totals
  let paid = 0, open = 0, overdue = 0, na = 0;
  
  filteredRows.forEach(row => {
    Object.values(row.months).forEach(status => {
      switch (status) {
        case 'PAID': paid++; break;
        case 'OPEN': open++; break;
        case 'OVERDUE': overdue++; break;
        case 'NA': na++; break;
      }
    });
  });

  return {
    rows: filteredRows,
    totals: { paid, open, overdue, na },
    count: filteredRows.length
  };
}

export const monthShortNl = [
  'Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
];