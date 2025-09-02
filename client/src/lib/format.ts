import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Format a date to Belgian format (dd-mm-jjjj)
 */
export function formatDateBE(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd-MM-yyyy', { locale: nl });
}

/**
 * Format a date to Belgian short format (dd-mm)
 */
export function formatDateShortBE(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd-MM', { locale: nl });
}

/**
 * Format a date to month year format (januari 2025)
 */
export function formatMonthYearBE(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMMM yyyy', { locale: nl });
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
 * Format currency without symbol (1.234,56)
 */
export function formatAmountBE(amount: number): string {
  return new Intl.NumberFormat('nl-BE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse Belgian date format (dd-mm-jjjj) to ISO string
 */
export function parseDateBE(dateString: string): string {
  const [day, month, year] = dateString.split('-');
  return new Date(`${year}-${month}-${day}`).toISOString().split('T')[0];
}

/**
 * Get relative time in Dutch
 */
export function getRelativeTimeBE(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Vandaag';
  if (diffInDays === 1) return 'Gisteren';
  if (diffInDays < 7) return `${diffInDays} dagen geleden`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weken geleden`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} maanden geleden`;
  return `${Math.floor(diffInDays / 365)} jaar geleden`;
}

// Legacy exports for backward compatibility
export const formatDate = formatDateBE;
export const formatCurrency = formatCurrencyBE;
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd-MM-yyyy HH:mm', { locale: nl });
};

// Additional helper functions
export function getMemberCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'STANDAARD': 'Standaard',
    'KIND': 'Kind',
    'STUDENT': 'Student',
    'SENIOR': 'Senior',
    'GEZIN': 'Gezin'
  };
  return labels[category] || category;
}

/**
 * Format percentage (0.15 -> 15%)
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('nl-BE', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format period range (start date - end date)
 */
export function formatPeriodBE(startDate: string | Date, endDate: string | Date): string {
  const start = formatDateBE(startDate);
  const end = formatDateBE(endDate);
  return `${start} - ${end}`;
}