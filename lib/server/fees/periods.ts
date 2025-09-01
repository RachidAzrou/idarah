import { addMonths, addYears, isAfter, subMilliseconds } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const TZ = 'Europe/Brussels';

/**
 * Clamp day to valid day in target month (handles edge cases like Jan 31 -> Feb 28/29)
 */
function clampDay(year: number, monthIndex0: number, day: number): Date {
  // Create date; JS auto-clamps overflow days (31 → next month),
  // so build on the 1st, then set day min(lastDay, desired).
  const base = new Date(Date.UTC(year, monthIndex0 + 1, 0, 0, 0, 0, 0)); // last day of month in UTC
  const last = base.getUTCDate();
  const d = Math.min(last, day);
  return new Date(Date.UTC(year, monthIndex0, d, 0, 0, 0, 0));
}

/**
 * Add months to a Brussels-anchored date, clamping day if necessary
 */
export function addMonthsClamped(beAnchor: Date, months: number): Date {
  // Keep local wall-clock day/hour/min/sec of anchor in Brussels.
  const z = toZonedTime(beAnchor, TZ);
  const y = z.getFullYear();
  const m = z.getMonth();
  const d = z.getDate();
  const hh = z.getHours(), mm = z.getMinutes(), ss = z.getSeconds(), ms = z.getMilliseconds();

  const target = clampDay(y, m + months, d);
  target.setUTCHours(hh, mm, ss, ms);
  return fromZonedTime(target, TZ);
}

/**
 * Add years to a Brussels-anchored date, clamping day if necessary (leap year Feb 29 -> Feb 28)
 */
export function addYearsClamped(beAnchor: Date, years: number): Date {
  const z = toZonedTime(beAnchor, TZ);
  const y = z.getFullYear();
  const m = z.getMonth();
  const d = z.getDate();
  const hh = z.getHours(), mm = z.getMinutes(), ss = z.getSeconds(), ms = z.getMilliseconds();

  const target = clampDay(y + years, m, d);
  target.setUTCHours(hh, mm, ss, ms);
  return fromZonedTime(target, TZ);
}

/**
 * Find the rolling period start that contains asOf date
 */
export function floorToRollingStart(anchor: Date, asOf: Date, term: 'MONTHLY' | 'YEARLY'): Date {
  let start = anchor;
  if (isAfter(start, asOf)) {
    // If anchor is in the future, current period is [anchor, anchor+term)
    return anchor;
  }
  
  if (term === 'MONTHLY') {
    // Compute how many months between anchor and asOf approximately, then correct.
    let s = anchor;
    const zA = utcToZonedTime(anchor, TZ);
    const zB = utcToZonedTime(asOf, TZ);
    const approxMonths = (zB.getFullYear() - zA.getFullYear()) * 12 + (zB.getMonth() - zA.getMonth());
    s = addMonthsClamped(anchor, approxMonths);
    if (isAfter(s, asOf)) s = addMonthsClamped(anchor, approxMonths - 1);
    // Walk forward until next > asOf
    while (!isAfter(addMonthsClamped(s, 1), asOf)) {
      s = addMonthsClamped(s, 1);
    }
    return s;
  } else {
    let s = anchor;
    const zA = utcToZonedTime(anchor, TZ);
    const zB = utcToZonedTime(asOf, TZ);
    const approxYears = (zB.getFullYear() - zA.getFullYear());
    s = addYearsClamped(anchor, approxYears);
    if (isAfter(s, asOf)) s = addYearsClamped(anchor, approxYears - 1);
    while (!isAfter(addYearsClamped(s, 1), asOf)) {
      s = addYearsClamped(s, 1);
    }
    return s;
  }
}

/**
 * Calculate monthly rolling period that contains asOf date
 */
export function rollingMonthly(anchor: Date, asOf: Date) {
  const start = floorToRollingStart(anchor, asOf, 'MONTHLY');
  const nextStart = addMonthsClamped(start, 1);
  const end = subMilliseconds(nextStart, 1);
  return { start, end, nextStart };
}

/**
 * Calculate yearly rolling period that contains asOf date
 */
export function rollingYearly(anchor: Date, asOf: Date) {
  const start = floorToRollingStart(anchor, asOf, 'YEARLY');
  const nextStart = addYearsClamped(start, 1);
  const end = subMilliseconds(nextStart, 1);
  return { start, end, nextStart };
}

/**
 * Calculate the next rolling period after the given start
 */
export function nextRollingPeriod(start: Date, term: 'MONTHLY' | 'YEARLY') {
  const nextStart = term === 'MONTHLY' ? addMonthsClamped(start, 1) : addYearsClamped(start, 1);
  const end = subMilliseconds(nextStart, 1);
  return { start: nextStart, end };
}

/**
 * Calculate rolling period for given anchor, asOf date and term
 */
export function getRollingPeriod(anchor: Date, asOf: Date, term: 'MONTHLY' | 'YEARLY') {
  return term === 'MONTHLY' ? rollingMonthly(anchor, asOf) : rollingYearly(anchor, asOf);
}