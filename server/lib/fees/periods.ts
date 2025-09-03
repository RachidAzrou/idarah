import { addMonths, addYears, startOfDay } from 'date-fns';
import { toBEDate, nowBE } from '../time/beTime';

export type PaymentTerm = 'MONTHLY' | 'YEARLY';

export interface Period {
  start: Date;
  end: Date;
}

/**
 * Create a monthly period starting from the given date
 * No prorata - full month period
 */
export function monthlyFrom(start: Date): Period {
  const startDate = startOfDay(toBEDate(start));
  const endDate = addMonths(startDate, 1);
  
  return {
    start: startDate,
    end: endDate,
  };
}

/**
 * Create a yearly period starting from the given date
 * No prorata - full year period, handles leap years correctly
 */
export function yearlyFrom(start: Date): Period {
  const startDate = startOfDay(toBEDate(start));
  const endDate = addYears(startDate, 1);
  
  return {
    start: startDate,
    end: endDate,
  };
}

/**
 * Generate the next period based on the end date of the previous period
 * Next period starts exactly where the previous one ended
 */
export function nextFrom(end: Date, term: PaymentTerm): Period {
  const startDate = startOfDay(toBEDate(end));
  
  if (term === 'MONTHLY') {
    return monthlyFrom(startDate);
  } else {
    return yearlyFrom(startDate);
  }
}

/**
 * Create period based on payment term
 */
export function createPeriod(start: Date, term: PaymentTerm): Period {
  if (term === 'MONTHLY') {
    return monthlyFrom(start);
  } else {
    return yearlyFrom(start);
  }
}

/**
 * Check if a date is within the given period (inclusive start, exclusive end)
 * Uses Belgium timezone for comparison
 */
export function isDateInPeriod(date: Date, period: Period): boolean {
  const checkDate = toBEDate(date);
  const periodStart = toBEDate(period.start);
  const periodEnd = toBEDate(period.end);
  
  return checkDate >= periodStart && checkDate < periodEnd;
}

/**
 * Check if the current period is active (current date is within the period)
 */
export function isPeriodActive(period: Period): boolean {
  return isDateInPeriod(nowBE(), period);
}

/**
 * Check if a period has expired (current date is after period end)
 */
export function isPeriodExpired(period: Period): boolean {
  const now = nowBE();
  const periodEnd = toBEDate(period.end);
  
  return now >= periodEnd;
}

/**
 * Get the number of days until period expires
 * Returns negative if already expired
 */
export function daysUntilExpiry(period: Period): number {
  const now = nowBE();
  const periodEnd = toBEDate(period.end);
  
  const diffMs = periodEnd.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generate a sequence of periods starting from a date
 * Useful for creating multiple periods in advance
 */
export function generatePeriods(startDate: Date, term: PaymentTerm, count: number): Period[] {
  const periods: Period[] = [];
  let currentStart = startOfDay(toBEDate(startDate));
  
  for (let i = 0; i < count; i++) {
    const period = createPeriod(currentStart, term);
    periods.push(period);
    currentStart = period.end;
  }
  
  return periods;
}

/**
 * Find the current active period from a list of periods
 */
export function findActivePeriod(periods: Period[]): Period | null {
  const now = nowBE();
  
  return periods.find(period => isDateInPeriod(now, period)) || null;
}

/**
 * Find the latest period from a list of periods
 */
export function findLatestPeriod(periods: Period[]): Period | null {
  if (periods.length === 0) return null;
  
  return periods.reduce((latest, current) => 
    current.end > latest.end ? current : latest
  );
}