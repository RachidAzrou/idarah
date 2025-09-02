/**
 * Period calculation utilities and format functions
 */

import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Calculate the end date for a given period
 */
export function calculateEndDate(startDate: Date, term: 'MONTHLY' | 'YEARLY'): Date {
  const endDate = new Date(startDate);
  
  if (term === 'MONTHLY') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  
  // Subtract 1 day to get the last day of the period
  endDate.setDate(endDate.getDate() - 1);
  
  return endDate;
}

/**
 * Convert date to ISO string format for database storage
 */
export function toISO(date: Date): string {
  return date.toISOString();
}

/**
 * Convert ISO string to Date object
 */
export function fromISO(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Get the current period for a given anchor date and term
 */
export function getCurrentPeriod(anchorDate: Date, term: 'MONTHLY' | 'YEARLY', asOfDate?: Date): { start: Date; end: Date } {
  const asOf = asOfDate || new Date();
  const start = new Date(anchorDate);
  
  // Find the current period by advancing from the anchor
  while (calculateEndDate(start, term) < asOf) {
    if (term === 'MONTHLY') {
      start.setMonth(start.getMonth() + 1);
    } else {
      start.setFullYear(start.getFullYear() + 1);
    }
  }
  
  return {
    start,
    end: calculateEndDate(start, term)
  };
}

/**
 * Format a date to Belgian format (dd-mm-jjjj)
 */
export function formatDateBE(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd-MM-yyyy', { locale: nl });
}

/**
 * Format currency to Belgian format (€ 1.234,56)
 */
export function formatCurrencyBE(amount: number): string {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Input mask for Euro amounts
 */
export function euroInputMask(value: string): string {
  // Remove all non-digit characters except comma and period
  const cleaned = value.replace(/[^\d,.-]/g, '');
  
  // Convert to standard number format
  const standardized = cleaned.replace(',', '.');
  
  // Parse as float and format back
  const num = parseFloat(standardized);
  if (isNaN(num)) return '';
  
  return num.toFixed(2).replace('.', ',');
}

/**
 * Parse Euro input to number
 */
export function parseEuroInput(value: string): number {
  if (!value) return 0;
  
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[€\s]/g, '');
  
  // Replace comma with period for parsing
  const standardized = cleaned.replace(',', '.');
  
  const num = parseFloat(standardized);
  return isNaN(num) ? 0 : num;
}