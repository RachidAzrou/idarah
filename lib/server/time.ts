import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const TZ = 'Europe/Brussels';

/**
 * Get current date/time in Brussels timezone
 */
export function beNow(): Date {
  return new Date();
}

/**
 * Convert a Date to Brussels timezone
 */
export function toBeZoned(date: Date): Date {
  return toZonedTime(date, TZ);
}

/**
 * Convert a Brussels-zoned date to UTC ISO string for persistence
 */
export function toUtcISO(date: Date): string {
  return date.toISOString();
}

/**
 * Convert a Date from Brussels local time to UTC
 */
export function fromBeZoned(date: Date): Date {
  return fromZonedTime(date, TZ);
}

/**
 * Parse an ISO string and convert to Brussels timezone
 */
export function parseBeZoned(isoString: string): Date {
  return toZonedTime(new Date(isoString), TZ);
}

/**
 * Get timezone for Brussels
 */
export function getBrusselsTimezone(): string {
  return TZ;
}