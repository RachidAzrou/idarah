export type Transaction = {
  id: string;
  date: string; // ISO
  type: 'INCOME' | 'EXPENSE';
  category: string;
  memberId?: string;
  memberName?: string;
  amount: number; // €
  method: 'SEPA' | 'OVERSCHRIJVING' | 'BANCONTACT' | 'CASH';
  description?: string;
};

export const categories = {
  INCOME: [
    'Lidgeld',
    'Donatie',
    'Evenement',
    'Verhuur',
    'Subsidie',
    'Verkoop',
    'Overig inkomen'
  ],
  EXPENSE: [
    'Huur',
    'Nutsvoorzieningen',
    'Onderhoud',
    'Evenement',
    'Administratie',
    'Verzekeringen',
    'Schoonmaak',
    'Overig uitgaven'
  ]
};

// Mock members voor selectie
export const mockMembers = [
  { id: 'm1', name: 'Emma van den Berg' },
  { id: 'm2', name: 'Ahmed Hassan' },
  { id: 'm3', name: 'Maria Santos' },
  { id: 'm4', name: 'Jan Peeters' },
  { id: 'm5', name: 'Fatima Al-Rashid' },
  { id: 'm6', name: 'Pieter Vandenberghe' },
  { id: 'm7', name: 'Layla Benali' },
  { id: 'm8', name: 'Thomas De Vries' },
  { id: 'm9', name: 'Zeinab Khalil' },
  { id: 'm10', name: 'Lucas Martens' }
];

// Generate comprehensive mock transaction data
export const transactions: Transaction[] = [
  // Januari 2025 - Inkomsten
  { id: 't1', date: '2025-01-12', type: 'INCOME', category: 'Lidgeld', memberId: 'm1', memberName: 'Emma van den Berg', amount: 120, method: 'SEPA', description: 'Lidgeld 2025' },
  { id: 't2', date: '2025-01-13', type: 'INCOME', category: 'Lidgeld', memberId: 'm2', memberName: 'Ahmed Hassan', amount: 120, method: 'SEPA', description: 'Lidgeld 2025' },
  { id: 't3', date: '2025-01-14', type: 'INCOME', category: 'Lidgeld', memberId: 'm3', memberName: 'Maria Santos', amount: 120, method: 'OVERSCHRIJVING', description: 'Lidgeld 2025' },
  { id: 't4', date: '2025-01-15', type: 'INCOME', category: 'Lidgeld', memberId: 'm4', memberName: 'Jan Peeters', amount: 120, method: 'SEPA', description: 'Lidgeld 2025' },
  { id: 't5', date: '2025-01-16', type: 'INCOME', category: 'Lidgeld', memberId: 'm5', memberName: 'Fatima Al-Rashid', amount: 120, method: 'SEPA', description: 'Lidgeld 2025' },
  { id: 't6', date: '2025-01-20', type: 'INCOME', category: 'Donatie', amount: 250, method: 'CASH', description: 'Vrijwillige gift ramadan' },
  { id: 't7', date: '2025-01-22', type: 'INCOME', category: 'Donatie', amount: 500, method: 'OVERSCHRIJVING', description: 'Donatie moskee renovatie' },
  { id: 't8', date: '2025-01-25', type: 'INCOME', category: 'Evenement', amount: 1250, method: 'BANCONTACT', description: 'Nieuwjaarsbijeenkomst inschrijvingen' },
  { id: 't9', date: '2025-01-28', type: 'INCOME', category: 'Verhuur', amount: 300, method: 'OVERSCHRIJVING', description: 'Zaalhuur bruiloft weekend' },

  // Januari 2025 - Uitgaven
  { id: 't10', date: '2025-01-15', type: 'EXPENSE', category: 'Huur', amount: 1200, method: 'OVERSCHRIJVING', description: 'Zaalhuur januari 2025' },
  { id: 't11', date: '2025-01-18', type: 'EXPENSE', category: 'Nutsvoorzieningen', amount: 180, method: 'OVERSCHRIJVING', description: 'Elektriciteit januari' },
  { id: 't12', date: '2025-01-20', type: 'EXPENSE', category: 'Nutsvoorzieningen', amount: 85, method: 'OVERSCHRIJVING', description: 'Gas verwarming januari' },
  { id: 't13', date: '2025-01-22', type: 'EXPENSE', category: 'Onderhoud', amount: 320, method: 'BANCONTACT', description: 'Loodgieter sanitair reparatie' },
  { id: 't14', date: '2025-01-24', type: 'EXPENSE', category: 'Schoonmaak', amount: 150, method: 'CASH', description: 'Schoonmaakproducten en materiaal' },
  { id: 't15', date: '2025-01-26', type: 'EXPENSE', category: 'Administratie', amount: 45, method: 'OVERSCHRIJVING', description: 'Bankkosten en administratie' },
  { id: 't16', date: '2025-01-30', type: 'EXPENSE', category: 'Evenement', amount: 280, method: 'CASH', description: 'Catering nieuwjaarsbijeenkomst' },

  // December 2024 - Voor historische data
  { id: 't17', date: '2024-12-12', type: 'INCOME', category: 'Lidgeld', memberId: 'm6', memberName: 'Pieter Vandenberghe', amount: 120, method: 'SEPA', description: 'Lidgeld december 2024' },
  { id: 't18', date: '2024-12-15', type: 'INCOME', category: 'Lidgeld', memberId: 'm7', memberName: 'Layla Benali', amount: 120, method: 'SEPA', description: 'Lidgeld december 2024' },
  { id: 't19', date: '2024-12-18', type: 'INCOME', category: 'Subsidie', amount: 2500, method: 'OVERSCHRIJVING', description: 'Gemeentelijke subsidie religieuze activiteiten' },
  { id: 't20', date: '2024-12-22', type: 'INCOME', category: 'Donatie', amount: 800, method: 'OVERSCHRIJVING', description: 'Eid al-Mawlid donaties' },
  
  { id: 't21', date: '2024-12-15', type: 'EXPENSE', category: 'Huur', amount: 1200, method: 'OVERSCHRIJVING', description: 'Zaalhuur december 2024' },
  { id: 't22', date: '2024-12-20', type: 'EXPENSE', category: 'Nutsvoorzieningen', amount: 220, method: 'OVERSCHRIJVING', description: 'Elektriciteit december (verwarming)' },
  { id: 't23', date: '2024-12-25', type: 'EXPENSE', category: 'Evenement', amount: 450, method: 'CASH', description: 'Eid al-Mawlid viering kosten' },

  // November 2024
  { id: 't24', date: '2024-11-10', type: 'INCOME', category: 'Lidgeld', memberId: 'm8', memberName: 'Thomas De Vries', amount: 120, method: 'SEPA', description: 'Lidgeld november 2024' },
  { id: 't25', date: '2024-11-12', type: 'INCOME', category: 'Lidgeld', memberId: 'm9', memberName: 'Zeinab Khalil', amount: 120, method: 'SEPA', description: 'Lidgeld november 2024' },
  { id: 't26', date: '2024-11-18', type: 'INCOME', category: 'Verkoop', amount: 320, method: 'BANCONTACT', description: 'Verkoop islamitische boeken en materiaal' },
  
  { id: 't27', date: '2024-11-15', type: 'EXPENSE', category: 'Huur', amount: 1200, method: 'OVERSCHRIJVING', description: 'Zaalhuur november 2024' },
  { id: 't28', date: '2024-11-22', type: 'EXPENSE', category: 'Verzekeringen', amount: 180, method: 'OVERSCHRIJVING', description: 'Gebouwverzekering kwartaal' },
  { id: 't29', date: '2024-11-25', type: 'EXPENSE', category: 'Onderhoud', amount: 125, method: 'CASH', description: 'Kleine herstellingen en onderhoud' },

  // Oktober 2024
  { id: 't30', date: '2024-10-08', type: 'INCOME', category: 'Lidgeld', memberId: 'm10', memberName: 'Lucas Martens', amount: 120, method: 'SEPA', description: 'Lidgeld oktober 2024' },
  { id: 't31', date: '2024-10-12', type: 'INCOME', category: 'Evenement', amount: 890, method: 'BANCONTACT', description: 'Islamitische cursussen inschrijvingen' },
  { id: 't32', date: '2024-10-20', type: 'INCOME', category: 'Donatie', amount: 650, method: 'OVERSCHRIJVING', description: 'Donaties gebedsruimte uitbreiding' },
  
  { id: 't33', date: '2024-10-15', type: 'EXPENSE', category: 'Huur', amount: 1200, method: 'OVERSCHRIJVING', description: 'Zaalhuur oktober 2024' },
  { id: 't34', date: '2024-10-18', type: 'EXPENSE', category: 'Nutsvoorzieningen', amount: 145, method: 'OVERSCHRIJVING', description: 'Elektriciteit oktober' },
  { id: 't35', date: '2024-10-25', type: 'EXPENSE', category: 'Administratie', amount: 85, method: 'OVERSCHRIJVING', description: 'Boekhouding en administratieve kosten' },

  // Extra transacties voor completere dataset
  { id: 't36', date: '2024-09-15', type: 'EXPENSE', category: 'Huur', amount: 1200, method: 'OVERSCHRIJVING', description: 'Zaalhuur september 2024' },
  { id: 't37', date: '2024-09-20', type: 'INCOME', category: 'Verhuur', amount: 450, method: 'OVERSCHRIJVING', description: 'Zaalhuur evenement weekend' },
  { id: 't38', date: '2024-08-15', type: 'EXPENSE', category: 'Huur', amount: 1200, method: 'OVERSCHRIJVING', description: 'Zaalhuur augustus 2024' },
  { id: 't39', date: '2024-08-25', type: 'INCOME', category: 'Donatie', amount: 1500, method: 'OVERSCHRIJVING', description: 'Eid al-Adha donaties' },
  { id: 't40', date: '2024-07-15', type: 'EXPENSE', category: 'Huur', amount: 1200, method: 'OVERSCHRIJVING', description: 'Zaalhuur juli 2024' },

  // Meer recente transacties voor uitgebreidere data
  { id: 't41', date: '2025-01-31', type: 'INCOME', category: 'Lidgeld', memberId: 'm1', memberName: 'Emma van den Berg', amount: 120, method: 'SEPA', description: 'Lidgeld februari vooruitbetaling' },
  { id: 't42', date: '2025-01-29', type: 'EXPENSE', category: 'Schoonmaak', amount: 200, method: 'CASH', description: 'Extra schoonmaak na evenement' },
  { id: 't43', date: '2025-01-27', type: 'INCOME', category: 'Donatie', amount: 75, method: 'CASH', description: 'Vrijdaggebed collecte' },
  { id: 't44', date: '2025-01-26', type: 'EXPENSE', category: 'Onderhoud', amount: 95, method: 'BANCONTACT', description: 'Vervangingslampen LED verlichting' },
  { id: 't45', date: '2025-01-24', type: 'INCOME', category: 'Donatie', amount: 150, method: 'CASH', description: 'Vrijdaggebed collecte' }
];

export function generateTransactionId(): string {
  return 't' + Date.now() + Math.random().toString(36).substr(2, 9);
}

export function getTransactionsByDateRange(startDate: string, endDate: string): Transaction[] {
  return transactions.filter(t => t.date >= startDate && t.date <= endDate);
}

export function getTransactionsByType(type: 'INCOME' | 'EXPENSE'): Transaction[] {
  return transactions.filter(t => t.type === type);
}

export function getTransactionsByCategory(category: string): Transaction[] {
  return transactions.filter(t => t.category === category);
}

export function getTotalByType(type: 'INCOME' | 'EXPENSE'): number {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlyTotals(): { month: string; income: number; expense: number }[] {
  const monthlyData: { [key: string]: { income: number; expense: number } } = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    
    if (t.type === 'INCOME') {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expense += t.amount;
    }
  });
  
  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      ...data
    }));
}

export function getCategoryTotals(type: 'INCOME' | 'EXPENSE'): { category: string; amount: number }[] {
  const categoryData: { [key: string]: number } = {};
  
  transactions
    .filter(t => t.type === type)
    .forEach(t => {
      categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });
  
  return Object.entries(categoryData)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}