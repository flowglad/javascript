import { describe, it, expect, beforeEach } from 'vitest'
import {
  adjustSubscription,
  calculateSplitInBillingPeriodBasedOnAdjustmentDate,
} from '@/subscriptions/adjustSubscription'
import {
  BillingPeriodStatus,
  BillingRunStatus,
  SubscriptionAdjustmentTiming,
  SubscriptionStatus,
} from '@/types'
import { adminTransaction } from '@/db/databaseMethods'

// These seed methods (and the clearDatabase helper) come from our test support code.
// They create real records in our test database.
import {
  setupSubscription,
  setupSubscriptionItem,
  setupBillingPeriod,
  setupOrg,
  setupCustomerProfile,
  setupBillingRun,
  setupBillingPeriodItems,
  setupPaymentMethod,
} from '../../seedDatabase'

// Helpers to query the database after adjustments
import { selectSubscriptionItemsAndSubscriptionBySubscriptionId } from '@/db/tableMethods/subscriptionItemMethods'
import {
  selectCurrentBillingPeriodForSubscription,
  updateBillingPeriod,
} from '@/db/tableMethods/billingPeriodMethods'
import { selectBillingPeriodItems } from '@/db/tableMethods/billingPeriodItemMethods'
import { SubscriptionItem } from '@/db/schema/subscriptionItems'
import { CustomerProfile } from '@/db/schema/customerProfiles'
import { PaymentMethod } from '@/db/schema/paymentMethods'
import { BillingPeriod } from '@/db/schema/billingPeriods'
import { BillingRun } from '@/db/schema/billingRuns'
import { Subscription } from '@/db/schema/subscriptions'
import { selectBillingRuns } from '@/db/tableMethods/billingRunMethods'

describe('adjustSubscription Integration Tests', async () => {
  const { organization, variant } = await setupOrg()
  let customerProfile: CustomerProfile.Record
  let paymentMethod: PaymentMethod.Record
  let billingPeriod: BillingPeriod.Record
  let billingRun: BillingRun.Record
  let subscription: Subscription.Record
  let subscriptionItemCore: Pick<
    SubscriptionItem.Record,
    | 'SubscriptionId'
    | 'VariantId'
    | 'name'
    | 'quantity'
    | 'unitPrice'
    | 'livemode'
    | 'createdAt'
    | 'updatedAt'
    | 'metadata'
    | 'addedDate'
  >
  beforeEach(async () => {
    customerProfile = await setupCustomerProfile({
      OrganizationId: organization.id,
    })
    paymentMethod = await setupPaymentMethod({
      OrganizationId: organization.id,
      CustomerProfileId: customerProfile.id,
    })

    subscription = await setupSubscription({
      OrganizationId: organization.id,
      CustomerProfileId: customerProfile.id,
      VariantId: variant.id,
      PaymentMethodId: paymentMethod.id,
      currentBillingPeriodEnd: new Date(Date.now() - 3000),
      currentBillingPeriodStart: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ),
    })
    billingPeriod = await setupBillingPeriod({
      SubscriptionId: subscription.id,
      startDate: subscription.currentBillingPeriodStart,
      endDate: subscription.currentBillingPeriodEnd,
      status: BillingPeriodStatus.Active,
    })
    billingRun = await setupBillingRun({
      BillingPeriodId: billingPeriod.id,
      PaymentMethodId: paymentMethod.id,
      SubscriptionId: subscription.id,
      status: BillingRunStatus.Scheduled,
    })
    await setupBillingPeriodItems({
      BillingPeriodId: billingPeriod.id,
      quantity: 1,
      unitPrice: 100,
    })
    subscriptionItemCore = {
      SubscriptionId: subscription.id,
      VariantId: variant.id,
      name: 'Item 1',
      quantity: 1,
      unitPrice: 100,
      livemode: subscription.livemode,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: null,
      addedDate: new Date(),
    }
  })

  /* ==========================================================================
     Error Conditions
  ========================================================================== */
  describe('Error Conditions', () => {
    it('should throw "Subscription is in terminal state" if the subscription is terminal', async () => {
      // Create a subscription already in a terminal state.
      const canceledSubscription = await setupSubscription({
        status: SubscriptionStatus.Canceled,
        OrganizationId: organization.id,
        CustomerProfileId: customerProfile.id,
        PaymentMethodId: paymentMethod.id,
        VariantId: variant.id,
      })
      await adminTransaction(async ({ transaction }) => {
        // Create a billing period so that later steps have data.
        await updateBillingPeriod(
          {
            id: billingPeriod.id,
            startDate: new Date(Date.now() - 10 * 60 * 1000),
            endDate: new Date(Date.now() + 10 * 60 * 1000),
            status: BillingPeriodStatus.Active,
          },
          transaction
        )

        await expect(
          adjustSubscription(
            {
              id: canceledSubscription.id,
              adjustment: {
                newSubscriptionItems: [],
                timing: SubscriptionAdjustmentTiming.Immediately,
                prorateCurrentBillingPeriod: false,
              },
            },
            transaction
          )
        ).rejects.toThrow('Subscription is in terminal state')
      })
    })

    it('should throw "Invalid timing" if an unrecognized timing value is provided', async () => {
      await setupSubscriptionItem({
        SubscriptionId: subscription.id,
        name: 'Item 1',
        quantity: 1,
        unitPrice: 100,
      })
      await adminTransaction(async ({ transaction }) => {
        await updateBillingPeriod(
          {
            id: billingPeriod.id,
            startDate: new Date(Date.now() - 10 * 60 * 1000),
            endDate: new Date(Date.now() + 10 * 60 * 1000),
            status: BillingPeriodStatus.Active,
          },
          transaction
        )
        await expect(
          adjustSubscription(
            {
              id: subscription.id,
              adjustment: {
                newSubscriptionItems: [],
                // @ts-expect-error – intentionally passing an invalid timing value
                timing: 'invalid',
                prorateCurrentBillingPeriod: false,
              },
            },
            transaction
          )
        ).rejects.toThrow('Invalid timing')
      })
    })
  })

  /* ==========================================================================
     Immediate Adjustments
  ========================================================================== */
  describe('Immediate Adjustments', () => {
    describe('when prorateCurrentBillingPeriod is true', () => {
      it('should create proration adjustments, remove deleted items, and execute a billing run', async () => {
        // Create two existing subscription items.
        const item1 = await setupSubscriptionItem({
          SubscriptionId: subscription.id,
          name: 'Item 1',
          quantity: 1,
          unitPrice: 100,
        })
        const item2 = await setupSubscriptionItem({
          SubscriptionId: subscription.id,
          name: 'Item 2',
          quantity: 2,
          unitPrice: 200,
        })
        await setupBillingPeriod({
          SubscriptionId: subscription.id,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: BillingPeriodStatus.Active,
        })
        await adminTransaction(async ({ transaction }) => {
          // New subscription items: keep item1 and add a new item.
          const newItems: SubscriptionItem.Upsert[] = [
            {
              ...item1,
              id: item1.id,
              name: 'Item 1',
              quantity: 1,
              unitPrice: 100,
            },
            {
              ...subscriptionItemCore,
              name: 'Item 3',
              quantity: 3,
              unitPrice: 300,
              livemode: subscription.livemode,
            },
          ]

          await adjustSubscription(
            {
              id: subscription.id,
              adjustment: {
                newSubscriptionItems: newItems,
                timing: SubscriptionAdjustmentTiming.Immediately,
                prorateCurrentBillingPeriod: true,
              },
            },
            transaction
          )

          // Verify that subscription items were updated with addedDate/removedDate.
          const result =
            await selectSubscriptionItemsAndSubscriptionBySubscriptionId(
              subscription.id,
              transaction
            )
          expect(result).not.toBeNull()
          if (!result) {
            throw new Error('Result is null')
          }
          // Expect that the item not present in newItems (item2) was “removed” and new items were added.
          expect(result?.subscriptionItems.length).toBe(3)
          result?.subscriptionItems.forEach((item) => {
            expect(item.addedDate).toBeInstanceOf(Date)
          })

          // Verify proration adjustments were inserted.
          const bpItems = await selectBillingPeriodItems(
            { BillingPeriodId: billingPeriod.id },
            transaction
          )

          expect(bpItems.length).toBeGreaterThan(0)
          bpItems.forEach((adj) => {
            // Unit prices should be rounded to whole numbers.
            expect(adj.unitPrice % 1).toEqual(0)
          })
          // Verify that a billing run was executed.
          const billingRuns = await selectBillingRuns(
            { BillingPeriodId: billingPeriod.id },
            transaction
          )
          const approximatelyImmediateBillingRuns =
            billingRuns.filter((run) => {
              return (
                Math.abs(
                  run.scheduledFor.getTime() - new Date().getTime()
                ) < 10000
              )
            })
          expect(approximatelyImmediateBillingRuns.length).toBe(1)
        })
      })
    })

    describe('when prorateCurrentBillingPeriod is false', () => {
      it('should update subscription items without creating proration adjustments', async () => {
        const item1 = await setupSubscriptionItem({
          SubscriptionId: subscription.id,
          name: 'Item 1',
          quantity: 1,
          unitPrice: 100,
        })
        await adminTransaction(async ({ transaction }) => {
          await updateBillingPeriod(
            {
              id: billingPeriod.id,
              startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
              status: BillingPeriodStatus.Active,
            },
            transaction
          )
          const billingPeriodItemsBeforeAdjustment =
            await selectBillingPeriodItems(
              { BillingPeriodId: billingPeriod.id },
              transaction
            )

          const newItems = [
            {
              ...item1,
              name: 'Item 1',
              quantity: 1,
              unitPrice: 100,
            },
            {
              ...subscriptionItemCore,
              name: 'Item 3',
              quantity: 3,
              unitPrice: 300,
            },
          ]

          await adjustSubscription(
            {
              id: subscription.id,
              adjustment: {
                newSubscriptionItems: newItems,
                timing: SubscriptionAdjustmentTiming.Immediately,
                prorateCurrentBillingPeriod: false,
              },
            },
            transaction
          )

          const result =
            await selectSubscriptionItemsAndSubscriptionBySubscriptionId(
              subscription.id,
              transaction
            )
          expect(result).not.toBeNull()
          if (!result) {
            throw new Error('Result is null')
          }
          expect(result.subscriptionItems.length).toBe(3)

          // Verify that no proration adjustments were made.
          const bp = await selectCurrentBillingPeriodForSubscription(
            subscription.id,
            transaction
          )
          expect(bp).not.toBeNull()
          if (!bp) {
            throw new Error('Billing period is null')
          }
          const billingPeriodItemsAfterAdjustment =
            await selectBillingPeriodItems(
              { BillingPeriodId: bp.id },
              transaction
            )
          expect(billingPeriodItemsAfterAdjustment.length).toEqual(
            billingPeriodItemsBeforeAdjustment.length
          )
          // Verify that the billing period items have the same values as before
          expect(
            billingPeriodItemsAfterAdjustment
              .map((item) => ({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                name: item.name,
                description: item.description,
              }))
              .sort((a, b) => a.name.localeCompare(b.name))
          ).toEqual(
            billingPeriodItemsBeforeAdjustment
              .map((item) => ({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                name: item.name,
                description: item.description,
              }))
              .sort((a, b) => a.name.localeCompare(b.name))
          )
        })
      })
    })
  })

  /* ==========================================================================
     Adjustments at End of Current Billing Period
  ========================================================================== */
  describe('Adjustments at End of Current Billing Period', () => {
    it('should update subscription items with dates equal to the billing period end and not create proration adjustments', async () => {
      // Set a specific billing period end date.
      const item1 = await setupSubscriptionItem({
        SubscriptionId: subscription.id,
        name: 'Item 1',
        quantity: 1,
        unitPrice: 100,
      })
      const item2 = await setupSubscriptionItem({
        SubscriptionId: subscription.id,
        name: 'Item 2',
        quantity: 2,
        unitPrice: 200,
      })
      billingPeriod = await setupBillingPeriod({
        SubscriptionId: subscription.id,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: BillingPeriodStatus.Active,
      })
      await adminTransaction(async ({ transaction }) => {
        const newItems = [
          {
            ...item1,
            id: item1.id,
            name: 'Item 1',
            quantity: 1,
            unitPrice: 100,
          },
          {
            name: 'Item 3',
            SubscriptionId: subscription.id,
            quantity: 3,
            unitPrice: 300,
            livemode: subscription.livemode,
            metadata: null,
            addedDate: new Date(),
            VariantId: subscription.VariantId,
          },
        ]

        await adjustSubscription(
          {
            id: subscription.id,
            adjustment: {
              newSubscriptionItems: newItems,
              timing:
                SubscriptionAdjustmentTiming.AtEndOfCurrentBillingPeriod,
            },
          },
          transaction
        )

        const result =
          await selectSubscriptionItemsAndSubscriptionBySubscriptionId(
            subscription.id,
            transaction
          )
        expect(result).not.toBeNull()
        if (!result) {
          throw new Error('Result is null')
        }
        const bpItems = await selectBillingPeriodItems(
          { BillingPeriodId: billingPeriod.id },
          transaction
        )
        expect(bpItems.length).toEqual(0)
      })
    })
  })

  /* ==========================================================================
     Calculation Helper Function
  ========================================================================== */
  describe('calculateSplitInBillingPeriodBasedOnAdjustmentDate', () => {
    it('should return correct percentages when adjustment date is at start, middle, and end', () => {
      let adjustmentDate = new Date(billingPeriod.startDate)
      let split = calculateSplitInBillingPeriodBasedOnAdjustmentDate(
        adjustmentDate,
        billingPeriod
      )
      expect(split.beforePercentage).toBe(0)
      expect(split.afterPercentage).toBe(1)

      adjustmentDate = new Date(billingPeriod.endDate)
      split = calculateSplitInBillingPeriodBasedOnAdjustmentDate(
        adjustmentDate,
        billingPeriod
      )
      expect(split.beforePercentage).toBe(1)
      expect(split.afterPercentage).toBe(0)

      adjustmentDate = new Date(
        billingPeriod.startDate.getTime() +
          (billingPeriod.endDate.getTime() -
            billingPeriod.startDate.getTime()) /
            2
      )
      split = calculateSplitInBillingPeriodBasedOnAdjustmentDate(
        adjustmentDate,
        billingPeriod
      )
      expect(split.beforePercentage).toBeCloseTo(0.5, 1)
      expect(split.afterPercentage).toBeCloseTo(0.5, 1)
    })

    it('should throw an error if the adjustment date is outside the billing period', () => {
      const tooEarlyAdjustmentDate = new Date(
        billingPeriod.startDate.getTime() - 1000
      )
      expect(() => {
        calculateSplitInBillingPeriodBasedOnAdjustmentDate(
          tooEarlyAdjustmentDate,
          billingPeriod
        )
      }).toThrow()
      const tooLateAdjustmentDate = new Date(
        billingPeriod.endDate.getTime() + 1000
      )
      expect(() => {
        calculateSplitInBillingPeriodBasedOnAdjustmentDate(
          tooLateAdjustmentDate,
          billingPeriod
        )
      }).toThrow()
    })
  })

  /* ==========================================================================
     Edge Cases and Error Handling
  ========================================================================== */
  describe('Edge Cases and Error Handling', () => {
    it('should handle a zero-duration billing period', async () => {
      const zeroDurationBillingPeriod = await setupBillingPeriod({
        SubscriptionId: subscription.id,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-01T00:00:00Z'),
        status: BillingPeriodStatus.Active,
      })
      const item = await setupSubscriptionItem({
        SubscriptionId: subscription.id,
        name: 'Item Zero',
        quantity: 1,
        unitPrice: 100,
      })
      await adminTransaction(async ({ transaction }) => {
        const newItems = [
          {
            id: item.id,
            name: 'Item Zero',
            quantity: 1,
            unitPrice: 100,
            livemode: subscription.livemode,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: null,
            addedDate: new Date(),
            SubscriptionId: subscription.id,
            VariantId: subscription.VariantId,
          },
        ]

        await expect(
          adjustSubscription(
            {
              id: subscription.id,
              adjustment: {
                newSubscriptionItems: newItems,
                timing: SubscriptionAdjustmentTiming.Immediately,
                prorateCurrentBillingPeriod: true,
              },
            },
            transaction
          )
        ).rejects.toThrow()
      })
    })

    it('should handle the case where there are no existing subscription items', async () => {
      await adminTransaction(async ({ transaction }) => {
        await updateBillingPeriod(
          {
            id: billingPeriod.id,
            startDate: new Date(Date.now() - 3600000),
            endDate: new Date(Date.now() + 3600000),
            status: BillingPeriodStatus.Active,
          },
          transaction
        )

        // No subscription items are set up.
        const newItems = [
          {
            ...subscriptionItemCore,
            name: 'New Item 1',
            quantity: 2,
            unitPrice: 150,
          },
        ]

        await adjustSubscription(
          {
            id: subscription.id,
            adjustment: {
              newSubscriptionItems: newItems,
              timing: SubscriptionAdjustmentTiming.Immediately,
              prorateCurrentBillingPeriod: false,
            },
          },
          transaction
        )

        const result =
          await selectSubscriptionItemsAndSubscriptionBySubscriptionId(
            subscription.id,
            transaction
          )
        expect(result).not.toBeNull()
        if (!result) {
          throw new Error('Result is null')
        }
        expect(result.subscriptionItems.length).toBe(newItems.length)
      })
    })

    it('should throw an error when subscription items have zero quantity', async () => {
      await setupBillingPeriod({
        SubscriptionId: subscription.id,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 3600000),
        status: BillingPeriodStatus.Active,
      })

      await adminTransaction(async ({ transaction }) => {
        const newItems = [
          {
            ...subscriptionItemCore,
            name: 'Zero Quantity Item',
            quantity: 0, // Invalid quantity
            unitPrice: 100,
            livemode: false,
          },
        ]

        await expect(
          adjustSubscription(
            {
              id: subscription.id,
              adjustment: {
                newSubscriptionItems: newItems,
                timing: SubscriptionAdjustmentTiming.Immediately,
                prorateCurrentBillingPeriod: true,
              },
            },
            transaction
          )
        ).rejects.toThrow()
      })
    })

    it('should handle subscription items with zero unit price', async () => {
      await setupBillingPeriod({
        SubscriptionId: subscription.id,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 3600000),
        status: BillingPeriodStatus.Active,
      })
      await adminTransaction(async ({ transaction }) => {
        const newItems = [
          {
            ...subscriptionItemCore,
            name: 'Free Item',
            quantity: 1,
            unitPrice: 0,
            livemode: false,
          },
        ]

        await adjustSubscription(
          {
            id: subscription.id,
            adjustment: {
              newSubscriptionItems: newItems,
              timing: SubscriptionAdjustmentTiming.Immediately,
              prorateCurrentBillingPeriod: true,
            },
          },
          transaction
        )

        const bp = await selectCurrentBillingPeriodForSubscription(
          subscription.id,
          transaction
        )
        if (!bp) {
          throw new Error('Billing period is null')
        }
        const bpItems = await selectBillingPeriodItems(
          { BillingPeriodId: bp.id },
          transaction
        )
        expect(bpItems.length).toBeGreaterThan(0)
      })
    })

    it('should handle subscription items with negative unit price or quantity', async () => {
      const negativeItem = await setupSubscriptionItem({
        SubscriptionId: subscription.id,
        name: 'Negative Item',
        quantity: 1,
        unitPrice: 100,
      })
      await expect(
        adminTransaction(async ({ transaction }) => {
          await updateBillingPeriod(
            {
              id: billingPeriod.id,
              startDate: new Date(Date.now() - 3600000),
              endDate: new Date(Date.now() + 3600000),
            },
            transaction
          )

          const newItems = [
            {
              ...negativeItem,
              name: 'Negative Item',
              quantity: -1,
              unitPrice: -100,
            },
          ]

          await adjustSubscription(
            {
              id: subscription.id,
              adjustment: {
                newSubscriptionItems: newItems,
                timing: SubscriptionAdjustmentTiming.Immediately,
                prorateCurrentBillingPeriod: true,
              },
            },
            transaction
          )
        })
      ).rejects.toThrow()
    })

    it('should handle billing periods in the past appropriately', async () => {
      await adminTransaction(async ({ transaction }) => {
        // Create a past billing period.
        const pastBP = await updateBillingPeriod(
          {
            id: billingPeriod.id,
            SubscriptionId: subscription.id,
            startDate: new Date(Date.now() - 7200000),
            endDate: new Date(Date.now() - 3600000),
            status: BillingPeriodStatus.Active,
          },
          transaction
        )
        const pastItem = await setupSubscriptionItem({
          SubscriptionId: subscription.id,
          name: 'Past Item',
          quantity: 1,
          unitPrice: 100,
        })
        const newPastItems = [
          {
            ...pastItem,
            name: 'Past Item',
            quantity: 1,
            unitPrice: 100,
            livemode: false,
          },
        ]
        await expect(
          adjustSubscription(
            {
              id: subscription.id,
              adjustment: {
                newSubscriptionItems: newPastItems,
                timing: SubscriptionAdjustmentTiming.Immediately,
                prorateCurrentBillingPeriod: true,
              },
            },
            transaction
          )
        ).rejects.toThrow()
      })
    })
  })

  /* ==========================================================================
     Bulk Operations
  ========================================================================== */
  describe('Bulk Operations', () => {
    it('should correctly bulk update subscription items and insert proration adjustments', async () => {
      await adminTransaction(async ({ transaction }) => {
        const item1 = await setupSubscriptionItem({
          SubscriptionId: subscription.id,
          name: 'Item 1',
          quantity: 1,
          unitPrice: 100,
        })
        billingPeriod = await updateBillingPeriod(
          {
            id: billingPeriod.id,
            startDate: new Date(Date.now() - 3600000),
            endDate: new Date(Date.now() + 3600000),
            status: BillingPeriodStatus.Active,
          },
          transaction
        )
        const newItems = [
          {
            ...item1,
            name: 'Item 1',
            quantity: 1,
            unitPrice: 100,
          },
          {
            ...subscriptionItemCore,
            name: 'Item 2',
            quantity: 2,
            unitPrice: 200,
          },
        ]
        await adjustSubscription(
          {
            id: subscription.id,
            adjustment: {
              newSubscriptionItems: newItems,
              timing: SubscriptionAdjustmentTiming.Immediately,
              prorateCurrentBillingPeriod: true,
            },
          },
          transaction
        )
        const result =
          await selectSubscriptionItemsAndSubscriptionBySubscriptionId(
            subscription.id,
            transaction
          )
        if (!result) {
          throw new Error('Result is null')
        }
        expect(result.subscriptionItems.length).toBe(3)
        const bpItems = await selectBillingPeriodItems(
          { BillingPeriodId: billingPeriod.id },
          transaction
        )
        expect(bpItems.length).toBeGreaterThan(0)
      })
    })

    it('should handle errors during bulk operations gracefully and rollback', async () => {
      const item = await setupSubscriptionItem({
        SubscriptionId: subscription.id,
        name: 'Item',
        quantity: 1,
        unitPrice: 100,
      })
      await adminTransaction(async ({ transaction }) => {
        await updateBillingPeriod(
          {
            id: billingPeriod.id,
            startDate: new Date(Date.now() - 3600000),
            endDate: new Date(Date.now() + 3600000),
            status: BillingPeriodStatus.Active,
          },
          transaction
        )
        await expect(
          adminTransaction(async ({ transaction }) => {
            // Pass invalid data (e.g. unitPrice is null) to simulate an error.
            const invalidItems = [
              {
                ...subscriptionItemCore,
                id: item.id,
                name: 'Item',
                quantity: 1,
                unitPrice: 100,
                VariantId: 'invalid_variant_id',
              },
            ]
            await adjustSubscription(
              {
                id: subscription.id,
                adjustment: {
                  newSubscriptionItems: invalidItems,
                  timing: SubscriptionAdjustmentTiming.Immediately,
                  prorateCurrentBillingPeriod: false,
                },
              },
              transaction
            )
          })
        ).rejects.toThrow()
      })
    })
  })
})
