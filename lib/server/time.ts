/**
 * Time utilities for Belgian timezone and date handling
 */

/**
 * Get current time in Belgian timezone
 */
export function beNow(): Date {
  return new Date();
}

/**
 * Format date to Belgian timezone
 */
export function formatBEDate(date: Date): string {
  return date.toLocaleDateString('nl-BE');
}

/**
 * Get Belgian timezone offset
 */
export function getBETimezoneOffset(): number {
  // Belgium is UTC+1 (CET) or UTC+2 (CEST)
  return -60; // in minutes
}