import { describe, it, expect, beforeEach } from 'vitest'
import { BillingPeriod } from '@/db/schema/billingPeriods'
import { BillingPeriodItem } from '@/db/schema/billingPeriodItems'
import { CustomerProfile } from '@/db/schema/customerProfiles'
import { PaymentMethod } from '@/db/schema/paymentMethods'
import { Subscription } from '@/db/schema/subscriptions'
import { BillingPeriodStatus } from '@/types'
import {
  setupBillingPeriod,
  setupBillingPeriodItems,
  setupBillingRun,
  setupCustomerProfile,
  setupPaymentMethod,
  setupSubscription,
  setupInvoice,
  setupOrg,
  setupPayment,
  setupMemberships,
} from '../../seedDatabase'

import { adminTransaction } from '@/db/databaseMethods'
import { processPaymentIntentEventForBillingRun } from './processBillingRunPaymentIntents'
import {
  BillingRunStatus,
  InvoiceStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@/types'
import Stripe from 'stripe'
import { BillingRun } from '@/db/schema/billingRuns'
import { selectPaymentById } from '@/db/tableMethods/paymentMethods'
import { selectSubscriptionById } from '@/db/tableMethods/subscriptionMethods'
import { selectInvoiceById } from '@/db/tableMethods/invoiceMethods'
import { selectBillingRunById } from '@/db/tableMethods/billingRunMethods'

/**
 * In our tests we assume that getStripeCharge (used inside processPaymentIntentEventForBillingRun)
 * is configured (or stubbed in the test environment) so that when called with a known charge id,
 * it returns a charge object with a predictable amount (for example, 1000 for 'ch_success', 500 for 'ch_failed', etc.).
 */
describe('processPaymentIntentEventForBillingRun integration tests', async () => {
  const { organization, variant } = await setupOrg()
  let customerProfile: CustomerProfile.Record
  let paymentMethod: PaymentMethod.Record
  let billingPeriod: BillingPeriod.Record
  let billingRun: BillingRun.Record
  let billingPeriodItems: BillingPeriodItem.Record[]
  let subscription: Subscription.Record
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
    billingPeriodItems = await setupBillingPeriodItems({
      BillingPeriodId: billingPeriod.id,
      quantity: 1,
      unitPrice: 100,
    })
  })
  it('throws an error when the billing run PaymentIntent id does not match the event id', async () => {
    const stripePaymentIntentId = `pi_correct_${new Date().getTime()}`
    const billingRun = await setupBillingRun({
      stripePaymentIntentId,
      lastPaymentIntentEventTimestamp: new Date(0),
      PaymentMethodId: paymentMethod.id,
      BillingPeriodId: billingPeriod.id,
      SubscriptionId: subscription.id,
      livemode: true,
    })
    const wrongStripePaymentIntentId = `pi_wrong_${new Date().getTime()}`
    await adminTransaction(async ({ transaction }) => {
      const event: Stripe.PaymentIntentSucceededEvent = {
        created: 1000,
        data: {
          object: {
            id: wrongStripePaymentIntentId,
            status: 'succeeded',
            metadata: {
              billingRunId: billingRun.id,
              type: 'billingRun',
              billingPeriodId: billingRun.BillingPeriodId,
            },
            latest_charge: `ch_test_${new Date().getTime()}`,
            livemode: true,
          },
        },
      } as any

      await expect(
        processPaymentIntentEventForBillingRun(event, transaction)
      ).rejects.toThrow(/different stripe payment intent id/)
    })
  })

  it('skips processing for out-of-order event', async () => {
    const stripePaymentIntentId = `pi_outoforder_${new Date().getTime()}`
    const stripeChargeId = `ch_outoforder_${new Date().getTime()}`
    const invoice = await setupInvoice({
      BillingPeriodId: billingPeriod.id,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      status: InvoiceStatus.Open,
      VariantId: variant.id,
    })
    // Seed a billing run whose lastPaymentIntentEventTimestamp is in the future
    const newBillingRun = await setupBillingRun({
      stripePaymentIntentId,
      // Set the last event timestamp to a time later than the event's created time.
      lastPaymentIntentEventTimestamp: new Date(200000),
      PaymentMethodId: paymentMethod.id,
      BillingPeriodId: billingPeriod.id,
      SubscriptionId: subscription.id,
      livemode: true,
    })

    await setupPayment({
      stripeChargeId,
      status: PaymentStatus.Processing,
      amount: 1000,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      InvoiceId: invoice.id,
    })

    await adminTransaction(async ({ transaction }) => {
      const event: Stripe.PaymentIntentSucceededEvent = {
        created: 1, // Earlier than the stored timestamp
        data: {
          object: {
            id: stripePaymentIntentId,
            status: 'succeeded',
            metadata: {
              billingRunId: newBillingRun.id,
              type: 'billingRun',
              billingPeriodId: newBillingRun.BillingPeriodId,
            },
            latest_charge: stripeChargeId,
            livemode: true,
          },
        },
      } as any

      // The function should simply skip processing and return undefined.
      const result = await processPaymentIntentEventForBillingRun(
        event,
        transaction
      )
      expect(result).toBeUndefined()
    })
  })

  // TODO: restore this test once we have a way to set up payment intents with associated charges
  // it('processes a PaymentIntentSucceeded event correctly', async () => {
  //   const stripePaymentIntentId = `pi_succeeded_${new Date().getTime()}`
  //   const stripeChargeId = `ch_${new Date().getTime()}__succeeded`
  //   const billingRun = await setupBillingRun({
  //     stripePaymentIntentId,
  //     lastPaymentIntentEventTimestamp: new Date(0),
  //     PaymentMethodId: paymentMethod.id,
  //     BillingPeriodId: billingPeriod.id,
  //     SubscriptionId: subscription.id,
  //     livemode: true,
  //   })

  //   const invoice = await setupInvoice({
  //     BillingPeriodId: billingPeriod.id,
  //     CustomerProfileId: customerProfile.id,
  //     OrganizationId: organization.id,
  //     status: InvoiceStatus.Open,
  //     VariantId: variant.id,
  //   })
  //   await setupPayment({
  //     stripeChargeId,
  //     status: PaymentStatus.Processing,
  //     amount: 1000,
  //     CustomerProfileId: customerProfile.id,
  //     OrganizationId: organization.id,
  //     InvoiceId: invoice.id,
  //   })
  //   await adminTransaction(async ({ transaction }) => {
  //     const event: Stripe.PaymentIntentSucceededEvent = {
  //       created: 3000,
  //       data: {
  //         object: {
  //           id: stripePaymentIntentId,
  //           status: 'succeeded',
  //           metadata: {
  //             billingRunId: billingRun.id,
  //             type: 'billingRun',
  //             billingPeriodId: billingRun.BillingPeriodId,
  //           },
  //           latest_charge: stripeChargeId,
  //           livemode: true,
  //         },
  //       },
  //     } as any

  //     // Call the function under test.
  //     const result = await processPaymentIntentEventForBillingRun(
  //       event,
  //       transaction
  //     )

  //     // Re-read updated records directly from the test database.
  //     const updatedBillingRun = await selectBillingRunById(
  //       billingRun.id,
  //       transaction
  //     )
  //     const updatedInvoice = await selectInvoiceById(
  //       invoice.id,
  //       transaction
  //     )

  //     expect(updatedBillingRun.status).toBe(
  //       BillingRunStatus.Succeeded
  //     )
  //     expect(
  //       updatedBillingRun.lastPaymentIntentEventTimestamp?.getTime()
  //       // remember - stripe timestamps are in seconds, so we multiply by 1000 to convert to milliseconds
  //     ).toBe(event.created * 1000)
  //     expect(updatedInvoice.status).toBe(InvoiceStatus.Paid)

  //     // Also verify that the returned object contains the updated records.
  //     expect(result?.billingRun.id).toBe(billingRun.id)
  //     expect(result?.invoice.id).toBe(invoice.id)
  //   })
  // })
  // TODO: restore this test once we have a way to set up payment intents with associated charges
  it('processes a PaymentIntentPaymentFailed event correctly', async () => {
    const stripePaymentIntentId = `pi_${new Date().getTime()}___canceled`
    const stripeChargeId = `ch_${new Date().getTime()}___failed`
    const failedBillingRun = await setupBillingRun({
      stripePaymentIntentId,
      lastPaymentIntentEventTimestamp: new Date(),
      PaymentMethodId: paymentMethod.id,
      BillingPeriodId: billingPeriod.id,
      SubscriptionId: subscription.id,
      livemode: true,
    })

    const failedInvoice = await setupInvoice({
      BillingPeriodId: billingPeriod.id,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      status: InvoiceStatus.Open,
      VariantId: variant.id,
    })
    const payment = await setupPayment({
      stripeChargeId,
      status: PaymentStatus.Processing,
      amount: 1000,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      InvoiceId: failedInvoice.id,
    })
    await adminTransaction(async ({ transaction }) => {
      const event: Stripe.PaymentIntentPaymentFailedEvent = {
        created: new Date().getTime() / 1000,
        data: {
          object: {
            id: stripePaymentIntentId,
            status: 'requires_payment_method',
            metadata: {
              billingRunId: failedBillingRun.id,
              type: 'billingRun',
              billingPeriodId: failedBillingRun.BillingPeriodId,
            },
            latest_charge: stripeChargeId,
            livemode: true,
          },
        },
      } as any

      await processPaymentIntentEventForBillingRun(event, transaction)

      const updatedBillingRun = await selectBillingRunById(
        failedBillingRun.id,
        transaction
      )
      const updatedInvoice = await selectInvoiceById(
        failedInvoice.id,
        transaction
      )

      expect(updatedBillingRun.status).toBe(BillingRunStatus.Failed)
      expect(updatedInvoice.status).toBe(InvoiceStatus.Open)
    })
  })

  // TODO: restore this test once we have a way to set up payment intents with associated charges
  it('processes a PaymentIntentCanceled event correctly', async () => {
    const stripePaymentIntentId = `pi_${new Date().getTime()}__canceled`
    const billingRun = await setupBillingRun({
      stripePaymentIntentId,
      lastPaymentIntentEventTimestamp: new Date(0),
      PaymentMethodId: paymentMethod.id,
      BillingPeriodId: billingPeriod.id,
      SubscriptionId: subscription.id,
      livemode: true,
    })
    await setupPaymentMethod({
      OrganizationId: organization.id,
      CustomerProfileId: customerProfile.id,
    })
    const invoice = await setupInvoice({
      BillingPeriodId: billingPeriod.id,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      status: InvoiceStatus.Open,
      VariantId: variant.id,
    })
    const stripeChargeId = `ch_${invoice.id}___failed`
    const payment = await setupPayment({
      stripeChargeId,
      status: PaymentStatus.Processing,
      amount: 1000,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      InvoiceId: invoice.id,
    })

    await adminTransaction(async ({ transaction }) => {
      const invoice = await setupInvoice({
        BillingPeriodId: billingPeriod.id,
        CustomerProfileId: customerProfile.id,
        OrganizationId: organization.id,
        status: InvoiceStatus.Open,
        VariantId: variant.id,
      })

      const event: Stripe.PaymentIntentCanceledEvent = {
        created: 5000,
        data: {
          object: {
            id: stripePaymentIntentId,
            status: 'canceled',
            metadata: {
              billingRunId: billingRun.id,
              type: 'billingRun',
              billingPeriodId: billingRun.BillingPeriodId,
            },
            latest_charge: stripeChargeId,
            livemode: true,
          },
        },
      } as any

      await processPaymentIntentEventForBillingRun(event, transaction)

      const updatedBillingRun = await selectBillingRunById(
        billingRun.id,
        transaction
      )
      const updatedInvoice = await selectInvoiceById(
        invoice.id,
        transaction
      )
      const updatedPayment = await selectPaymentById(
        payment.id,
        transaction
      )
      const updatedSubscription = await selectSubscriptionById(
        subscription.id,
        transaction
      )

      expect(updatedBillingRun.status).toBe(BillingRunStatus.Aborted)
      expect(updatedInvoice.status).toBe(InvoiceStatus.Open)
      expect(updatedPayment.status).toBe(PaymentStatus.Failed)
      expect(updatedSubscription.status).toBe(
        SubscriptionStatus.PastDue
      )
    })
  })

  // TODO: restore this test once we have a way to set up payment intents with associated charges
  it('processes a PaymentIntentProcessing event correctly', async () => {
    const stripePaymentIntentId = `pi_${new Date().getTime()}___processing`
    const billingRun = await setupBillingRun({
      stripePaymentIntentId,
      lastPaymentIntentEventTimestamp: new Date(0),
      PaymentMethodId: paymentMethod.id,
      BillingPeriodId: billingPeriod.id,
      SubscriptionId: subscription.id,
      livemode: true,
    })
    const invoice = await setupInvoice({
      BillingPeriodId: billingPeriod.id,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      status: InvoiceStatus.Open,
      VariantId: variant.id,
    })
    const payment = await setupPayment({
      stripeChargeId: `ch_${billingRun.id}___processing`,
      status: PaymentStatus.Processing,
      amount: 1000,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      InvoiceId: invoice.id,
    })
    await adminTransaction(async ({ transaction }) => {
      const event: Stripe.PaymentIntentProcessingEvent = {
        created: 6000,
        data: {
          object: {
            id: stripePaymentIntentId,
            status: 'processing',
            metadata: {
              billingRunId: billingRun.id,
              type: 'billingRun',
              billingPeriodId: billingRun.BillingPeriodId,
            },
            latest_charge: `ch_${billingRun.id}__processing`,
            livemode: true,
          },
        },
      } as any

      await processPaymentIntentEventForBillingRun(event, transaction)

      const updatedBillingRun = await selectBillingRunById(
        billingRun.id,
        transaction
      )
      const updatedInvoice = await selectInvoiceById(
        invoice.id,
        transaction
      )
      const updatedPayment = await selectPaymentById(
        payment.id,
        transaction
      )

      expect(updatedBillingRun.status).toBe(
        BillingRunStatus.AwaitingPaymentConfirmation
      )
      expect(updatedInvoice.status).toBe(
        InvoiceStatus.AwaitingPaymentConfirmation
      )
      expect(updatedPayment.status).toBe(PaymentStatus.Processing)
    })
  })

  // TODO: restore this test once we have a way to set up payment intents with associated charges
  // in pre-determined states.
  it('processes a PaymentIntentRequiresAction event correctly', async () => {
    const stripePaymentIntentId = `pi_${new Date().getTime()}___requires_action`
    const stripeChargeId = `ch_${new Date().getTime()}___processing`
    const billingRun = await setupBillingRun({
      stripePaymentIntentId,
      lastPaymentIntentEventTimestamp: new Date(0),
      PaymentMethodId: paymentMethod.id,
      BillingPeriodId: billingPeriod.id,
      livemode: true,
      SubscriptionId: subscription.id,
    })
    const invoice = await setupInvoice({
      BillingPeriodId: billingPeriod.id,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      status: InvoiceStatus.Open,
      VariantId: variant.id,
    })
    const payment = await setupPayment({
      stripeChargeId,
      status: PaymentStatus.Processing,
      amount: 1000,
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      InvoiceId: invoice.id,
    })
    await setupMemberships({
      OrganizationId: organization.id,
    })
    await adminTransaction(async ({ transaction }) => {
      const invoice = await setupInvoice({
        BillingPeriodId: billingPeriod.id,
        CustomerProfileId: customerProfile.id,
        OrganizationId: organization.id,
        status: InvoiceStatus.Open,
        VariantId: variant.id,
      })

      const event: Stripe.PaymentIntentRequiresActionEvent = {
        created: 7000,
        data: {
          object: {
            id: stripePaymentIntentId,
            status: 'requires_action',
            metadata: {
              billingRunId: billingRun.id,
              type: 'billingRun',
              billingPeriodId: billingPeriod.id,
            },
            latest_charge: stripeChargeId,
            livemode: true,
          },
        },
      } as any

      await processPaymentIntentEventForBillingRun(event, transaction)

      const updatedBillingRun = await selectBillingRunById(
        billingRun.id,
        transaction
      )
      const updatedInvoice = await selectInvoiceById(
        invoice.id,
        transaction
      )
      const updatedPayment = await selectPaymentById(
        payment.id,
        transaction
      )

      expect(updatedBillingRun.status).toBe(
        BillingRunStatus.InProgress
      )
      expect(updatedInvoice.status).toBe(InvoiceStatus.Open)
      expect(updatedPayment.status).toBe(PaymentStatus.Processing)
    })
  })

  it('throws an error if no invoice is found for the billing period', async () => {
    const paymentIntentId = `pi_${new Date().getTime()}_no_invoice`
    const billingRun = await setupBillingRun({
      stripePaymentIntentId: paymentIntentId,
      lastPaymentIntentEventTimestamp: new Date(0),
      PaymentMethodId: paymentMethod.id,
      BillingPeriodId: billingPeriod.id,
      SubscriptionId: subscription.id,
      livemode: true,
    })
    await adminTransaction(async ({ transaction }) => {
      // Do not seed any invoice for BillingPeriodId 'bp_no_invoice'
      const event: Stripe.PaymentIntentSucceededEvent = {
        created: 8000,
        data: {
          object: {
            id: paymentIntentId,
            status: 'succeeded',
            metadata: {
              billingRunId: billingRun.id,
              type: 'billingRun',
              billingPeriodId: billingRun.BillingPeriodId,
            },
            latest_charge: `ch_no_invoice_${billingRun.id}`,
            livemode: true,
          },
        },
      } as any

      await expect(
        processPaymentIntentEventForBillingRun(event, transaction)
      ).rejects.toThrow(
        `Invoice for billing period ${billingRun.BillingPeriodId} not found.`
      )
    })
  })

  it('throws an error if no latest charge is found in the event', async () => {
    const billingRun = await setupBillingRun({
      stripePaymentIntentId: 'pi_no_charge',
      lastPaymentIntentEventTimestamp: new Date(0),
      PaymentMethodId: paymentMethod.id,
      BillingPeriodId: billingPeriod.id,
      SubscriptionId: subscription.id,
      livemode: true,
    })
    await adminTransaction(async ({ transaction }) => {
      const invoice = await setupInvoice({
        BillingPeriodId: billingPeriod.id,
        CustomerProfileId: customerProfile.id,
        OrganizationId: organization.id,
        status: InvoiceStatus.Open,
        VariantId: variant.id,
      })

      const event: Stripe.PaymentIntentSucceededEvent = {
        created: 9000,
        data: {
          object: {
            id: 'pi_no_charge',
            status: 'succeeded',
            metadata: {
              billingRunId: billingRun.id,
              billingPeriodId: billingRun.BillingPeriodId,
              type: 'billingRun',
            },
            latest_charge: null,
            livemode: true,
          },
        },
      } as any

      await expect(
        processPaymentIntentEventForBillingRun(event, transaction)
      ).rejects.toThrow(
        /No latest charge found for payment intent pi_no_charge/
      )
    })
  })
  // TODO: restore this test once we have a way to set up payment intents with associated charges
  // in pre-determined states.

  // it('throws an error if no payment record is found for the latest charge', async () =>
  //   const paymentIntentId = `pi_no_payment_${new Date().getTime()}`
  //   const billingRun = await setupBillingRun({
  //     stripePaymentIntentId: paymentIntentId,
  //     lastPaymentIntentEventTimestamp: new Date(0),
  //     PaymentMethodId: paymentMethod.id,
  //     BillingPeriodId: billingPeriod.id,
  //     SubscriptionId: subscription.id,
  //     livemode: true,
  //   })

  //   await setupInvoice({
  //     BillingPeriodId: billingRun.BillingPeriodId,
  //     status: InvoiceStatus.Open,
  //     OrganizationId: organization.id,
  //     CustomerProfileId: customerProfile.id,
  //     VariantId: variant.id,
  //   })
  //   await adminTransaction(async ({ transaction }) => {
  //     // Do NOT seed a payment record for stripe charge 'ch_no_payment'
  //     const event: Stripe.PaymentIntentSucceededEvent = {
  //       created: 10000,
  //       data: {
  //         object: {
  //           id: paymentIntentId,
  //           status: 'succeeded',
  //           metadata: {
  //             billingRunId: billingRun.id,
  //             billingPeriodId: billingRun.BillingPeriodId,
  //             type: 'billingRun',
  //           },
  //           latest_charge: `ch_no_payment_${billingRun.id}`,
  //           livemode: true,
  //         },
  //       },
  //     } as any

  //     await expect(
  //       processPaymentIntentEventForBillingRun(event, transaction)
  //     ).rejects.toThrow(
  //       `Payment record not found for stripe charge ${event.data.object.latest_charge}`
  //     )
  //   })
  // })
})
