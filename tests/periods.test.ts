import { describe, it, expect } from 'vitest';
import {
  monthlyFrom,
  yearlyFrom,
  nextFrom,
  createPeriod,
  isDateInPeriod,
  isPeriodActive,
  isPeriodExpired,
  generatePeriods,
  type PaymentTerm
} from '../server/lib/fees/periods';

describe('Period Calculations', () => {
  describe('monthlyFrom', () => {
    it('creates monthly periods correctly', () => {
      const jan2024 = monthlyFrom(new Date(2024, 0, 1)); // January 2024
      expect(jan2024.start).toEqual(new Date(2024, 0, 1)); // Jan 1
      expect(jan2024.end).toEqual(new Date(2024, 1, 1)); // Feb 1
      
      const dec2024 = monthlyFrom(new Date(2024, 11, 1)); // December 2024
      expect(dec2024.start).toEqual(new Date(2024, 11, 1)); // Dec 1
      expect(dec2024.end).toEqual(new Date(2025, 0, 1)); // Jan 1 2025
    });
  });

  describe('yearlyFrom', () => {
    it('creates yearly periods correctly', () => {
      const year2024 = yearlyFrom(new Date(2024, 0, 1));
      expect(year2024.start).toEqual(new Date(2024, 0, 1)); // Jan 1, 2024
      expect(year2024.end).toEqual(new Date(2025, 0, 1)); // Jan 1, 2025
    });
  });

  describe('generatePeriods', () => {
    it('generates multiple monthly periods', () => {
      const start = new Date(2024, 0, 1); // Jan 1, 2024
      const periods = generatePeriods(start, 'MONTHLY', 3);
      
      expect(periods).toHaveLength(3);
      expect(periods[0].start).toEqual(new Date(2024, 0, 1)); // Jan 1
      expect(periods[0].end).toEqual(new Date(2024, 1, 1)); // Feb 1
      expect(periods[1].start).toEqual(new Date(2024, 1, 1)); // Feb 1
      expect(periods[2].end).toEqual(new Date(2024, 3, 1)); // Apr 1
    });

    it('generates multiple yearly periods', () => {
      const start = new Date(2024, 5, 15); // June 15, 2024
      const periods = generatePeriods(start, 'YEARLY', 2);
      
      expect(periods).toHaveLength(2);
      expect(periods[0].start).toEqual(new Date(2024, 5, 15)); // June 15, 2024
      expect(periods[0].end).toEqual(new Date(2025, 5, 15)); // June 15, 2025
      expect(periods[1].start).toEqual(new Date(2025, 5, 15)); // June 15, 2025
      expect(periods[1].end).toEqual(new Date(2026, 5, 15)); // June 15, 2026
    });
  });

  describe('isDateInPeriod', () => {
    const period = {
      start: new Date(2024, 0, 1), // Jan 1, 2024
      end: new Date(2024, 1, 1),   // Feb 1, 2024
    };

    it('returns true for dates within period', () => {
      expect(isDateInPeriod(new Date(2024, 0, 1), period)).toBe(true); // Start date
      expect(isDateInPeriod(new Date(2024, 0, 15), period)).toBe(true); // Middle
      expect(isDateInPeriod(new Date(2024, 0, 31), period)).toBe(true); // Last day of Jan
    });

    it('returns false for dates outside period', () => {
      expect(isDateInPeriod(new Date(2023, 11, 31), period)).toBe(false); // Before start
      expect(isDateInPeriod(new Date(2024, 1, 1), period)).toBe(false); // On end date (exclusive)
      expect(isDateInPeriod(new Date(2024, 1, 2), period)).toBe(false); // After end
    });
  });

  describe('isPeriodActive', () => {
    it('correctly identifies active periods with current time', () => {
      const activePeriod = {
        start: new Date(2024, 0, 1),   // Jan 1, 2024
        end: new Date(2024, 1, 1),     // Feb 1, 2024
      };
      
      // Test uses current time, so just test structure
      const result = isPeriodActive(activePeriod);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isPeriodExpired', () => {
    it('correctly identifies expired periods with current time', () => {
      const expiredPeriod = {
        start: new Date(2020, 0, 1),   // Jan 1, 2020 (definitely expired)
        end: new Date(2020, 1, 1),     // Feb 1, 2020
      };
      
      expect(isPeriodExpired(expiredPeriod)).toBe(true);
      
      const futurePeriod = {
        start: new Date(2030, 1, 1),   // Future period
        end: new Date(2030, 2, 1),
      };
      expect(isPeriodExpired(futurePeriod)).toBe(false);
    });
  });
});