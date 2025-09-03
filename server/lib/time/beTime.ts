import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format, isValid } from 'date-fns';
import { nl } from 'date-fns/locale';

const BE_TIMEZONE = 'Europe/Brussels';

/**
 * Get current time in Belgium timezone
 */
export function nowBE(): Date {
  return toZonedTime(new Date(), BE_TIMEZONE);
}

/**
 * Convert any date to Belgium timezone
 */
export function toBEDate(date: Date): Date {
  if (!isValid(date)) {
    throw new Error('Invalid date provided');
  }
  return toZonedTime(date, BE_TIMEZONE);
}

/**
 * Format date in Belgian format (dd-mm-yyyy)
 */
export function formatDateBE(date: Date): string {
  if (!isValid(date)) {
    return '';
  }
  
  const beDate = toBEDate(date);
  return format(beDate, 'dd-MM-yyyy', { locale: nl });
}

/**
 * Format date and time in Belgian format
 */
export function formatDateTimeBE(date: Date): string {
  if (!isValid(date)) {
    return '';
  }
  
  const beDate = toBEDate(date);
  return format(beDate, 'dd-MM-yyyy HH:mm', { locale: nl });
}

/**
 * Convert local Belgium time to UTC for storage
 */
export function beTimeToUtc(beDate: Date): Date {
  if (!isValid(beDate)) {
    throw new Error('Invalid date provided');
  }
  return fromZonedTime(beDate, BE_TIMEZONE);
}

/**
 * Check if a date is today in Belgium timezone
 */
export function isTodayBE(date: Date): boolean {
  if (!isValid(date)) {
    return false;
  }
  
  const today = nowBE();
  const checkDate = toBEDate(date);
  
  return format(today, 'yyyy-MM-dd') === format(checkDate, 'yyyy-MM-dd');
}

/**
 * Get start of day in Belgium timezone
 */
export function startOfDayBE(date: Date): Date {
  if (!isValid(date)) {
    throw new Error('Invalid date provided');
  }
  
  const beDate = toBEDate(date);
  const startOfDay = new Date(beDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  return startOfDay;
}

/**
 * Get end of day in Belgium timezone
 */
export function endOfDayBE(date: Date): Date {
  if (!isValid(date)) {
    throw new Error('Invalid date provided');
  }
  
  const beDate = toBEDate(date);
  const endOfDay = new Date(beDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return endOfDay;
}