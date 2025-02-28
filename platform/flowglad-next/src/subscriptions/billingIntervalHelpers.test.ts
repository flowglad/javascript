import { describe, it, expect } from 'vitest'
import { generateNextBillingPeriod } from './billingIntervalHelpers'
import { IntervalUnit } from '@/types'

describe('generateNextBillingPeriod', () => {
  describe('monthly billing', () => {
    it('handles 31 -> 30 day month transition', () => {
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2024-01-31T10:00:00Z'),
        interval: IntervalUnit.Month,
        intervalCount: 1,
        lastBillingPeriodEndDate: null,
      })

      expect(result.startDate).toEqual(
        new Date('2024-01-31T10:00:00Z')
      )
      expect(result.endDate).toEqual(new Date('2024-02-29T10:00:00Z')) // Leap year
    })

    it('handles 31 -> 28 day month transition', () => {
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2023-01-31T10:00:00Z'),
        interval: IntervalUnit.Month,
        intervalCount: 1,
        lastBillingPeriodEndDate: null,
      })

      expect(result.startDate).toEqual(
        new Date('2023-01-31T10:00:00Z')
      )
      expect(result.endDate).toEqual(new Date('2023-02-28T10:00:00Z'))
    })

    it('handles multiple month intervals', () => {
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2024-01-31T10:00:00Z'),
        interval: IntervalUnit.Month,
        intervalCount: 3,
        lastBillingPeriodEndDate: null,
      })

      expect(result.startDate).toEqual(
        new Date('2024-01-31T10:00:00Z')
      )
      expect(result.endDate).toEqual(new Date('2024-04-30T10:00:00Z'))
    })

    it('preserves time of day', () => {
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2024-01-31T23:59:59.999Z'),
        interval: IntervalUnit.Month,
        intervalCount: 1,
        lastBillingPeriodEndDate: null,
      })

      expect(result.startDate).toEqual(
        new Date('2024-01-31T23:59:59.999Z')
      )
      expect(result.endDate).toEqual(
        new Date('2024-02-29T23:59:59.999Z')
      )
    })
  })

  describe('yearly billing', () => {
    it('handles leap year to non-leap year transition', () => {
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2024-02-29T10:00:00Z'),
        interval: IntervalUnit.Year,
        intervalCount: 1,
        lastBillingPeriodEndDate: null,
      })

      expect(result.startDate).toEqual(
        new Date('2024-02-29T10:00:00Z')
      )
      expect(result.endDate).toEqual(new Date('2025-02-28T10:00:00Z'))
    })

    it('handles non-leap year to leap year transition', () => {
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2023-02-28T10:00:00Z'),
        interval: IntervalUnit.Year,
        intervalCount: 1,
        lastBillingPeriodEndDate: new Date('2024-02-29T10:00:00Z'),
      })

      expect(result.startDate).toEqual(
        new Date('2024-02-29T10:00:00Z')
      )
      expect(result.endDate).toEqual(new Date('2025-02-28T10:00:00Z'))
    })

    it('handles multiple year intervals', () => {
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2024-02-29T10:00:00Z'),
        interval: IntervalUnit.Year,
        intervalCount: 2,
        lastBillingPeriodEndDate: null,
      })

      expect(result.startDate).toEqual(
        new Date('2024-02-29T10:00:00Z')
      )
      expect(result.endDate).toEqual(new Date('2026-02-28T10:00:00Z'))
    })
  })

  describe('error cases', () => {
    it('throws error for unsupported intervals', () => {
      expect(() => {
        generateNextBillingPeriod({
          billingCycleAnchorDate: new Date('2024-01-01T00:00:00Z'),
          interval: 'decade' as IntervalUnit,
          intervalCount: 1,
          lastBillingPeriodEndDate: null,
        })
      }).toThrow('Unsupported interval: decade')
    })
  })

  // --------------------------------------
  // NEW TESTS: ADDITIONAL COVERAGE
  // --------------------------------------
  describe('additional coverage', () => {
    it('handles mid-month anchor date for monthly interval (no leap transition)', () => {
      // e.g. 2024-03-15 + 1 month => 2024-04-15
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2024-03-15T12:00:00Z'),
        interval: IntervalUnit.Month,
        intervalCount: 1,
        lastBillingPeriodEndDate: null,
      })

      expect(result.startDate).toEqual(
        new Date('2024-03-15T12:00:00Z')
      )
      expect(result.endDate).toEqual(new Date('2024-04-15T12:00:00Z'))
    })

    it('handles large monthly interval crossing multiple months including a leap boundary', () => {
      // e.g. 2023-11-15 + 5 months => 2024-04-15 (covers leap day in 2024)
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2023-11-15T09:30:00Z'),
        interval: IntervalUnit.Month,
        intervalCount: 5,
        lastBillingPeriodEndDate: null,
      })

      expect(result.startDate).toEqual(
        new Date('2023-11-15T09:30:00Z')
      )
      expect(result.endDate).toEqual(new Date('2024-04-15T09:30:00Z'))
    })

    it('handles multiple year intervals from a non-edge day', () => {
      // e.g. 2023-05-15 + 2 years => 2025-05-15
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2023-05-15T00:00:00Z'),
        interval: IntervalUnit.Year,
        intervalCount: 2,
        lastBillingPeriodEndDate: null,
      })

      expect(result.startDate).toEqual(
        new Date('2023-05-15T00:00:00Z')
      )
      expect(result.endDate).toEqual(new Date('2025-05-15T00:00:00Z'))
    })

    it('allows contiguous billing where new start date == last end date', () => {
      // e.g. last cycle ended on 2023-09-10; new cycle starts exactly 2023-09-10
      const lastEnd = new Date('2023-09-10T10:00:00Z')
      const result = generateNextBillingPeriod({
        billingCycleAnchorDate: new Date('2023-09-01T00:00:00Z'), // anchor is different but time is copied over
        interval: IntervalUnit.Month,
        intervalCount: 1,
        lastBillingPeriodEndDate: lastEnd,
      })

      // The code might copy time from anchorDate to lastEnd,
      // so the new start could be exactly lastEnd's date/time.
      expect(result.startDate).toEqual(lastEnd)
      expect(result.endDate).toEqual(new Date('2023-10-10T10:00:00Z'))
    })

    it('throws error if intervalCount is zero', () => {
      expect(() => {
        generateNextBillingPeriod({
          billingCycleAnchorDate: new Date('2024-01-01T00:00:00Z'),
          interval: IntervalUnit.Month,
          intervalCount: 0, // Invalid scenario
          lastBillingPeriodEndDate: null,
        })
      }).toThrow()
    })

    it('throws error if intervalCount is negative', () => {
      expect(() => {
        generateNextBillingPeriod({
          billingCycleAnchorDate: new Date('2024-01-01T00:00:00Z'),
          interval: IntervalUnit.Year,
          intervalCount: -1, // Invalid scenario
          lastBillingPeriodEndDate: null,
        })
      }).toThrow()
    })
  })
})
