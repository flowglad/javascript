import { describe, it, expect } from 'vitest'
import { adminTransaction } from '@/db/databaseMethods'
import {
  setupOrg,
  setupCustomerProfile,
  setupPaymentMethod,
} from '../../seedDatabase'
import { createSubscriptionWorkflow } from './createSubscription'
import {
  BillingPeriodStatus,
  BillingRunStatus,
  IntervalUnit,
  SubscriptionStatus,
} from '@/types'
import { updateSubscription } from '@/db/tableMethods/subscriptionMethods'
import { selectBillingPeriodById } from '@/db/tableMethods/billingPeriodMethods'
import { selectBillingPeriodItems } from '@/db/tableMethods/billingPeriodItemMethods'

describe('createSubscription', async () => {
  const { organization, product, variant } = await setupOrg()
  const customerProfile = await setupCustomerProfile({
    OrganizationId: organization.id,
  })
  const paymentMethod = await setupPaymentMethod({
    OrganizationId: organization.id,
    CustomerProfileId: customerProfile.id,
  })
  const {
    subscription,
    subscriptionItems,
    billingPeriod,
    billingRun,
  } = await adminTransaction(async ({ transaction }) => {
    return createSubscriptionWorkflow(
      {
        organization,
        product,
        variant,
        quantity: 1,
        livemode: true,
        startDate: new Date(),
        interval: IntervalUnit.Month,
        intervalCount: 1,
        defaultPaymentMethod: paymentMethod,
        customerProfile,
      },
      transaction
    )
  })

  it('creates a subscription with correct priced items, and billing run', async () => {
    expect(subscription).toBeDefined()
    expect(
      subscriptionItems[0].unitPrice * subscriptionItems[0].quantity
    ).toBe(variant.unitPrice * 1)
    expect(billingPeriod.status).toBe(BillingPeriodStatus.Active)
    expect(billingRun.status).toBe(BillingRunStatus.Scheduled)
  })
  it('throws an error if the customer profile already has an active subscription', async () => {
    await adminTransaction(async ({ transaction }) => {
      await updateSubscription(
        {
          id: subscription.id,
          status: SubscriptionStatus.Active,
        },
        transaction
      )
    })
    await expect(
      adminTransaction(async ({ transaction }) => {
        return createSubscriptionWorkflow(
          {
            organization,
            product,
            variant,
            quantity: 1,
            livemode: true,
            startDate: new Date(),
            interval: IntervalUnit.Month,
            intervalCount: 1,
            defaultPaymentMethod: paymentMethod,
            customerProfile,
          },
          transaction
        )
      })
    ).rejects.toThrow()
  })
  it('does not throw an error if creating a subscription for a customer with no active subscriptions, but past non-active subscriptions', async () => {
    const newCustomerProfile = await setupCustomerProfile({
      OrganizationId: organization.id,
    })
    const newPaymentMethod = await setupPaymentMethod({
      OrganizationId: organization.id,
      CustomerProfileId: customerProfile.id,
    })
    // Create a past subscription that is now cancelled
    const pastSubscription = await adminTransaction(
      async ({ transaction }) => {
        const sub = await createSubscriptionWorkflow(
          {
            organization,
            product,
            variant,
            quantity: 1,
            livemode: true,
            startDate: new Date('2023-01-01'),
            interval: IntervalUnit.Month,
            intervalCount: 1,
            defaultPaymentMethod: newPaymentMethod,
            customerProfile: newCustomerProfile,
          },
          transaction
        )

        await updateSubscription(
          {
            id: sub.subscription.id,
            status: SubscriptionStatus.Canceled,
            canceledAt: new Date('2023-02-01'),
          },
          transaction
        )

        return sub
      }
    )

    // Should be able to create a new subscription since the past one is cancelled
    await expect(
      adminTransaction(async ({ transaction }) => {
        return createSubscriptionWorkflow(
          {
            organization,
            product,
            variant,
            quantity: 1,
            livemode: true,
            startDate: new Date(),
            interval: IntervalUnit.Month,
            intervalCount: 1,
            defaultPaymentMethod: newPaymentMethod,
            customerProfile: newCustomerProfile,
          },
          transaction
        )
      })
    ).resolves.toBeDefined()
  })
  it('creates billing periods correctly for trial subscriptions', async () => {
    const { organization, product, variant } = await setupOrg()
    const newCustomerProfile = await setupCustomerProfile({
      OrganizationId: organization.id,
    })
    const newPaymentMethod = await setupPaymentMethod({
      OrganizationId: organization.id,
      CustomerProfileId: newCustomerProfile.id,
    })

    const startDate = new Date()
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const { subscription, billingPeriod } = await adminTransaction(
      async ({ transaction }) => {
        return createSubscriptionWorkflow(
          {
            organization,
            product,
            variant,
            quantity: 1,
            livemode: true,
            startDate,
            interval: IntervalUnit.Month,
            intervalCount: 1,
            defaultPaymentMethod: newPaymentMethod,
            customerProfile: newCustomerProfile,
            trialEnd,
          },
          transaction
        )
      }
    )

    // Verify subscription details
    expect(subscription.trialEnd?.getTime()).toBe(trialEnd.getTime())

    // Verify billing period was created
    expect(billingPeriod).toBeDefined()
    expect(billingPeriod.startDate.getTime()).toBe(
      startDate.getTime()
    )
    expect(billingPeriod.endDate.getTime()).toBe(trialEnd.getTime())

    // Verify no billing period items exist for trial period
    await adminTransaction(async ({ transaction }) => {
      const billingPeriodItems = await selectBillingPeriodItems(
        {
          BillingPeriodId: billingPeriod.id,
        },
        transaction
      )
      expect(billingPeriodItems).toHaveLength(0)
    })
  })
})
