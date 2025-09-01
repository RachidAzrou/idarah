import { describe, it, expect } from 'vitest';
import {
  rollingMonthly,
  rollingYearly,
  addMonthsClamped,
  addYearsClamped,
  nextRollingPeriod,
  floorToRollingStart
} from '../../lib/server/fees/periods';

describe('Rolling Period Calculations', () => {
  describe('addMonthsClamped', () => {
    it('should handle month overflow correctly', () => {
      // January 31 + 1 month should clamp to February 28/29
      const anchor = new Date('2025-01-31T10:00:00.000Z');
      const result = addMonthsClamped(anchor, 1);
      
      // Should be February 28, 2025 (not a leap year)
      expect(result.getUTCDate()).toBe(28);
      expect(result.getUTCMonth()).toBe(1); // February (0-indexed)
      expect(result.getUTCFullYear()).toBe(2025);
    });

    it('should handle leap year correctly', () => {
      // January 31, 2024 + 1 month should clamp to February 29 (leap year)
      const anchor = new Date('2024-01-31T10:00:00.000Z');
      const result = addMonthsClamped(anchor, 1);
      
      expect(result.getUTCDate()).toBe(29);
      expect(result.getUTCMonth()).toBe(1); // February
      expect(result.getUTCFullYear()).toBe(2024);
    });
  });

  describe('addYearsClamped', () => {
    it('should handle leap year to non-leap year', () => {
      // February 29, 2024 + 1 year should clamp to February 28, 2025
      const anchor = new Date('2024-02-29T10:00:00.000Z');
      const result = addYearsClamped(anchor, 1);
      
      expect(result.getUTCDate()).toBe(28);
      expect(result.getUTCMonth()).toBe(1); // February
      expect(result.getUTCFullYear()).toBe(2025);
    });

    it('should preserve normal dates', () => {
      const anchor = new Date('2025-03-15T10:00:00.000Z');
      const result = addYearsClamped(anchor, 1);
      
      expect(result.getUTCDate()).toBe(15);
      expect(result.getUTCMonth()).toBe(2); // March
      expect(result.getUTCFullYear()).toBe(2026);
    });
  });

  describe('rollingMonthly', () => {
    it('should calculate current monthly period correctly', () => {
      const anchor = new Date('2025-03-15T10:00:00.000Z');
      const asOf = new Date('2025-06-01T12:00:00.000Z');
      
      const result = rollingMonthly(anchor, asOf);
      
      // Current period should be 2025-05-15 10:00 to 2025-06-14 09:59:59.999
      expect(result.start.getUTCDate()).toBe(15);
      expect(result.start.getUTCMonth()).toBe(4); // May (0-indexed)
      expect(result.start.getUTCFullYear()).toBe(2025);
      
      expect(result.end.getUTCDate()).toBe(14);
      expect(result.end.getUTCMonth()).toBe(5); // June
      expect(result.end.getUTCFullYear()).toBe(2025);
    });

    it('should handle anchor clamping in February', () => {
      const anchor = new Date('2025-01-31T09:00:00.000Z');
      const asOf = new Date('2025-02-15T12:00:00.000Z');
      
      const result = rollingMonthly(anchor, asOf);
      
      // Should clamp to Feb 28 for the February period
      expect(result.start.getUTCDate()).toBe(28);
      expect(result.start.getUTCMonth()).toBe(1); // February
    });
  });

  describe('rollingYearly', () => {
    it('should calculate yearly period correctly', () => {
      const anchor = new Date('2025-03-10T10:00:00.000Z');
      const asOf = new Date('2025-06-01T12:00:00.000Z');
      
      const result = rollingYearly(anchor, asOf);
      
      // Period should be 2025-03-10 10:00 to 2026-03-09 09:59:59.999
      expect(result.start.getUTCDate()).toBe(10);
      expect(result.start.getUTCMonth()).toBe(2); // March
      expect(result.start.getUTCFullYear()).toBe(2025);
      
      expect(result.end.getUTCDate()).toBe(9);
      expect(result.end.getUTCMonth()).toBe(2); // March
      expect(result.end.getUTCFullYear()).toBe(2026);
    });
  });

  describe('nextRollingPeriod', () => {
    it('should calculate next monthly period', () => {
      const start = new Date('2025-03-15T10:00:00.000Z');
      const result = nextRollingPeriod(start, 'MONTHLY');
      
      expect(result.start.getUTCDate()).toBe(15);
      expect(result.start.getUTCMonth()).toBe(3); // April
      expect(result.start.getUTCFullYear()).toBe(2025);
    });

    it('should calculate next yearly period', () => {
      const start = new Date('2025-03-15T10:00:00.000Z');
      const result = nextRollingPeriod(start, 'YEARLY');
      
      expect(result.start.getUTCDate()).toBe(15);
      expect(result.start.getUTCMonth()).toBe(2); // March
      expect(result.start.getUTCFullYear()).toBe(2026);
    });
  });

  describe('Period Contiguity', () => {
    it('should ensure periods are contiguous', () => {
      const anchor = new Date('2025-03-15T10:00:00.000Z');
      const firstPeriod = rollingMonthly(anchor, anchor);
      const secondPeriod = nextRollingPeriod(firstPeriod.start, 'MONTHLY');
      
      // End of first period + 1ms should equal start of second period
      const endPlusOne = new Date(firstPeriod.end.getTime() + 1);
      expect(endPlusOne.getTime()).toBe(secondPeriod.start.getTime());
    });
  });

  describe('Edge Cases', () => {
    it('should handle future anchor date', () => {
      const anchor = new Date('2025-12-01T10:00:00.000Z');
      const asOf = new Date('2025-06-01T12:00:00.000Z');
      
      const result = rollingMonthly(anchor, asOf);
      
      // Current period should be the anchor itself
      expect(result.start.getTime()).toBe(anchor.getTime());
    });

    it('should handle DST transitions correctly', () => {
      // Test around DST transition in Brussels (last Sunday in March)
      const anchor = new Date('2025-03-15T10:00:00.000Z');
      const asOf = new Date('2025-04-01T12:00:00.000Z');
      
      const result = rollingMonthly(anchor, asOf);
      
      // Should maintain the same local time despite DST
      expect(result.start.getUTCDate()).toBe(15);
      expect(result.start.getUTCMonth()).toBe(2); // March
    });
  });
});