import { endOfMonth, endOfYear, addYears, subDays } from 'date-fns';

export function endOfMonthlyPeriod(date: Date): Date {
  return endOfMonth(date);
}

export function endOfYearlyPeriod(date: Date): Date {
  const nextYear = addYears(date, 1);
  return subDays(nextYear, 1);
}

export function toISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function fromISO(isoString: string): Date {
  return new Date(isoString);
}

export function calculateEndDate(startDate: Date, term: 'MONTHLY' | 'YEARLY'): Date {
  if (term === 'MONTHLY') {
    return endOfMonthlyPeriod(startDate);
  } else {
    return endOfYearlyPeriod(startDate);
  }
}

export function formatDateBE(date: Date): string {
  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  }).format(date);
}

export function formatCurrencyBE(amount: number): string {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export function euroInputMask(value: string): string {
  // Remove all non-digit characters except decimal separator
  const cleaned = value.replace(/[^\d,]/g, '');
  
  // Split on comma
  const parts = cleaned.split(',');
  
  if (parts.length > 2) {
    // More than one comma, keep only first two parts
    return `${parts[0]},${parts[1].slice(0, 2)}`;
  }
  
  if (parts.length === 2) {
    // Limit decimal places to 2
    return `${parts[0]},${parts[1].slice(0, 2)}`;
  }
  
  return cleaned;
}

export function parseEuroInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '');
  const normalized = cleaned.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}