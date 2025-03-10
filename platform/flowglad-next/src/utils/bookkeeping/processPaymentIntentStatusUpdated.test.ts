import { describe, it, expect, beforeEach } from 'vitest'
import {
  CurrencyCode,
  InvoiceStatus,
  PaymentStatus,
  PurchaseStatus,
} from '@/types'
import {
  chargeStatusToPaymentStatus,
  updatePaymentToReflectLatestChargeStatus,
  upsertPaymentForStripeCharge,
  processPaymentIntentStatusUpdated,
} from '@/utils/bookkeeping/processPaymentIntentStatusUpdated'
import { Payment } from '@/db/schema/payments'
import {
  setupBillingPeriod,
  setupBillingRun,
  setupCustomerProfile,
  setupInvoice,
  setupOrg,
  setupPayment,
  setupPaymentMethod,
  setupPurchase,
  setupSubscription,
} from '../../../seedDatabase'
import { CustomerProfile } from '@/db/schema/customerProfiles'
import { Invoice } from '@/db/schema/invoices'
import { adminTransaction } from '@/db/databaseMethods'
import { selectPurchaseById } from '@/db/tableMethods/purchaseMethods'
import {
  safelyUpdateInvoiceStatus,
  selectInvoiceById,
} from '@/db/tableMethods/invoiceMethods'
import { IntentMetadataType, StripeIntentMetadata } from '../stripe'
import core from '../core'

/**
 * TODO: many test cases in this file are commented out
 * because we do not have an easy way to set up payment intents with associated charges
 * in pre-determined states.
 */
describe('Process payment intent status updated', async () => {
  let payment: Payment.Record
  const { organization, variant } = await setupOrg()
  let customerProfile: CustomerProfile.Record
  let invoice: Invoice.Record
  beforeEach(async () => {
    customerProfile = await setupCustomerProfile({
      OrganizationId: organization.id,
    })
    invoice = await setupInvoice({
      CustomerProfileId: customerProfile.id,
      OrganizationId: organization.id,
      VariantId: variant.id,
    })
    payment = await setupPayment({
      stripeChargeId: `ch123_${invoice.id}`,
      status: PaymentStatus.Processing,
      amount: 1000,
      livemode: true,
      OrganizationId: organization.id,
      CustomerProfileId: customerProfile.id,
      InvoiceId: invoice.id,
    })
  })

  describe('chargeStatusToPaymentStatus', () => {
    it('converts a Stripe "succeeded" status to an internal Succeeded status', () => {
      const result = chargeStatusToPaymentStatus('succeeded')
      expect(result).toEqual(PaymentStatus.Succeeded)
    })

    it('converts a Stripe "failed" status to an internal Failed status', () => {
      const result = chargeStatusToPaymentStatus('failed')
      expect(result).toEqual(PaymentStatus.Failed)
    })

    it('defaults unknown Stripe charge statuses to Processing', () => {
      const result = chargeStatusToPaymentStatus('pending' as any)
      expect(result).toEqual(PaymentStatus.Processing)
    })
  })

  describe('updatePaymentToReflectLatestChargeStatus', () => {
    let fakePayment: Payment.Record

    beforeEach(async () => {
      fakePayment = await setupPayment({
        stripeChargeId: `ch123_${core.nanoid()}`,
        status: PaymentStatus.Processing,
        amount: 1000,
        livemode: true,
        OrganizationId: organization.id,
        CustomerProfileId: customerProfile.id,
        InvoiceId: invoice.id,
      })
    })

    it('updates the payment status when the charge status differs from the current payment status', async () => {
      const updatedPayment = {
        ...fakePayment,
        status: PaymentStatus.Succeeded,
      }

      const result = await adminTransaction(
        async ({ transaction }) => {
          return updatePaymentToReflectLatestChargeStatus(
            fakePayment,
            'succeeded',
            transaction
          )
        }
      )
      expect(result.status).toEqual(PaymentStatus.Succeeded)
    })

    it('does not update the payment status if the current status already matches the charge status', async () => {
      fakePayment.status = PaymentStatus.Succeeded
      const result = await adminTransaction(async ({ transaction }) =>
        updatePaymentToReflectLatestChargeStatus(
          fakePayment,
          'succeeded',
          transaction
        )
      )
      expect(result.status).toEqual(PaymentStatus.Succeeded)
    })

    it('updates the associated invoice status when an InvoiceId exists', async () => {
      const updatedPayment = {
        ...fakePayment,
        status: PaymentStatus.Succeeded,
      }
      await adminTransaction(async ({ transaction }) => {
        await updatePaymentToReflectLatestChargeStatus(
          fakePayment,
          'succeeded',
          transaction
        )
        const invoice = await selectInvoiceById(
          fakePayment.InvoiceId,
          transaction
        )
        expect(invoice.status).toEqual(InvoiceStatus.Paid)
      })
    })

    it('updates the associated purchase status when a PurchaseId exists', async () => {
      const purchase = await setupPurchase({
        CustomerProfileId: customerProfile.id,
        OrganizationId: organization.id,
        livemode: true,
        VariantId: variant.id,
      })
      const updatedPayment = {
        ...fakePayment,
        status: PaymentStatus.Succeeded,
        PurchaseId: purchase.id,
      }
      await adminTransaction(async ({ transaction }) => {
        await updatePaymentToReflectLatestChargeStatus(
          updatedPayment,
          'succeeded',
          transaction
        )
        const updatedPurchase = await selectPurchaseById(
          purchase.id,
          transaction
        )
        expect(updatedPurchase.status).toEqual(PurchaseStatus.Paid)
      })
    })

    it('throws an error if there is no associated invoice', async () => {
      // @ts-expect-error - no invoice id
      fakePayment.InvoiceId = null
      await expect(
        adminTransaction(async ({ transaction }) =>
          updatePaymentToReflectLatestChargeStatus(
            fakePayment,
            'succeeded',
            transaction
          )
        )
      ).rejects.toThrow()
    })

    it('handles cases gracefully when there is no associated purchase', async () => {
      fakePayment.PurchaseId = null
      const updatedPayment = {
        ...fakePayment,
        status: PaymentStatus.Succeeded,
      }
      await adminTransaction(async ({ transaction }) => {
        const result = await updatePaymentToReflectLatestChargeStatus(
          fakePayment,
          'succeeded',
          transaction
        )
        expect(result.status).toEqual(PaymentStatus.Succeeded)
      })
    })

    it('maintains idempotency when called multiple times with the same charge status', async () => {
      fakePayment.status = PaymentStatus.Succeeded
      await adminTransaction(async ({ transaction }) => {
        const result1 =
          await updatePaymentToReflectLatestChargeStatus(
            fakePayment,
            'succeeded',
            transaction
          )
        const result2 =
          await updatePaymentToReflectLatestChargeStatus(
            fakePayment,
            'succeeded',
            transaction
          )
        expect(result1).toEqual(result2)
      })
    })
  })

  describe('upsertPaymentForStripeCharge', () => {
    it('throws an error if the charge does not include a payment_intent', async () => {
      const fakeCharge: any = {
        id: 'ch_no_pi',
        payment_intent: null,
        created: 123456,
        status: 'succeeded',
        metadata: {
          invoiceId: invoice.id,
          type: IntentMetadataType.Invoice,
        },
        billing_details: { address: { country: 'US' } },
      }
      const fakeMetadata: any = { billingRunId: 'br_123' }
      await expect(
        adminTransaction(async ({ transaction }) =>
          upsertPaymentForStripeCharge(
            {
              charge: fakeCharge,
              paymentIntentMetadata: fakeMetadata,
            },
            transaction
          )
        )
      ).rejects.toThrow(/No payment intent id found/)
    })

    it('throws an error if payment intent metadata is missing', async () => {
      const fakeCharge: any = {
        id: 'ch1',
        payment_intent: 'pi_1',
        created: 123456,
        status: 'succeeded',
        billing_details: { address: { country: 'US' } },
      }
      await expect(
        adminTransaction(async ({ transaction }) =>
          upsertPaymentForStripeCharge(
            {
              charge: fakeCharge,
              paymentIntentMetadata: null as any,
            },
            transaction
          )
        )
      ).rejects.toThrow()
    })

    it('throws an error if metadata does not contain any of billingRunId, invoiceId, or purchaseSessionId', async () => {
      const fakeCharge: any = {
        id: 'ch1',
        payment_intent: 'pi_1',
        created: 123456,
        status: 'succeeded',
        metadata: {
          _: invoice.id,
          type: IntentMetadataType.Invoice,
        },
        billing_details: { address: { country: 'US' } },
      }
      const fakeMetadata: any = {}
      await expect(
        adminTransaction(async ({ transaction }) =>
          upsertPaymentForStripeCharge(
            {
              charge: fakeCharge,
              paymentIntentMetadata: fakeMetadata,
            },
            transaction
          )
        )
      ).rejects.toThrow()
    })

    it('throws an error if the invoice ID cannot be determined', async () => {
      const fakeCharge: any = {
        id: 'ch1',
        payment_intent: 'pi_1',
        created: 123456,
        status: 'succeeded',
        billing_details: { address: { country: 'US' } },
      }
      const fakeMetadata: any = { invoiceId: 'inv_missing' }
      await expect(
        adminTransaction(async ({ transaction }) =>
          upsertPaymentForStripeCharge(
            {
              charge: fakeCharge,
              paymentIntentMetadata: fakeMetadata,
            },
            transaction
          )
        )
      ).rejects.toThrow()
    })

    it('correctly maps payment record fields in a valid invoice flow', async () => {
      const paymentMethod = await setupPaymentMethod({
        OrganizationId: organization.id,
        CustomerProfileId: customerProfile.id,
      })
      const fakeCharge: any = {
        id: 'ch1',
        payment_intent: 'pi_1',
        created: 1610000000,
        amount: 5000,
        status: 'succeeded',
        metadata: {
          invoiceId: invoice.id,
          type: IntentMetadataType.Invoice,
        },
        payment_method_details: {
          id: paymentMethod.stripePaymentMethodId,
          type: paymentMethod.type,
        },
        billing_details: { address: { country: 'US' } },
      }
      const fakeMetadata: StripeIntentMetadata = {
        invoiceId: invoice.id,
        type: IntentMetadataType.Invoice,
      }
      const fakeInvoice = {
        id: 'inv_123',
        OrganizationId: 'org123',
        PurchaseId: 'pur123',
        taxCountry: 'US',
        CustomerProfileId: 'cp123',
      }
      const fakePayment = {
        id: 'payment1',
        status: PaymentStatus.Processing,
        InvoiceId: 'inv_123',
        PurchaseId: 'pur123',
      }

      const result = await adminTransaction(async ({ transaction }) =>
        upsertPaymentForStripeCharge(
          { charge: fakeCharge, paymentIntentMetadata: fakeMetadata },
          transaction
        )
      )
      expect(result.amount).toBe(5000)
      expect(result.stripeChargeId).toBe('ch1')
    })

    it('maintains idempotency by not creating duplicate payment records', async () => {
      const paymentMethod = await setupPaymentMethod({
        OrganizationId: organization.id,
        CustomerProfileId: customerProfile.id,
      })
      const fakeCharge: any = {
        id: 'ch1',
        payment_intent: 'pi_1',
        created: 1610000000,
        amount: 5000,
        status: 'succeeded',
        payment_method_details: {
          id: paymentMethod.stripePaymentMethodId,
          type: paymentMethod.type,
        },
        billing_details: { address: { country: 'US' } },
      }
      const fakeMetadata: StripeIntentMetadata = {
        invoiceId: invoice.id,
        type: IntentMetadataType.Invoice,
      }
      const result1 = await adminTransaction(
        async ({ transaction }) =>
          upsertPaymentForStripeCharge(
            {
              charge: fakeCharge,
              paymentIntentMetadata: fakeMetadata,
            },
            transaction
          )
      )
      const result2 = await adminTransaction(
        async ({ transaction }) =>
          upsertPaymentForStripeCharge(
            {
              charge: fakeCharge,
              paymentIntentMetadata: fakeMetadata,
            },
            transaction
          )
      )
      expect(result2.id).toEqual(result1.id)
      expect(result2.amount).toEqual(result1.amount)
      expect(result2.stripeChargeId).toEqual(result1.stripeChargeId)
      expect(result2.PaymentMethodId).toEqual(result1.PaymentMethodId)
      expect(result2.InvoiceId).toEqual(result1.InvoiceId)
      expect(result2.PurchaseId).toEqual(result1.PurchaseId)
      expect(result2.status).toEqual(result1.status)
    })

    it('handles zero amount charges', async () => {
      const paymentMethod = await setupPaymentMethod({
        OrganizationId: organization.id,
        CustomerProfileId: customerProfile.id,
      })
      const fakeCharge: any = {
        id: 'ch_zero',
        payment_intent: 'pi_zero',
        created: 1610000000,
        amount: 0,
        status: 'succeeded',
        payment_method_details: {
          id: paymentMethod.stripePaymentMethodId,
          type: paymentMethod.type,
        },
        billing_details: { address: { country: 'US' } },
      }
      const fakeMetadata: StripeIntentMetadata = {
        invoiceId: invoice.id,
        type: IntentMetadataType.Invoice,
      }
      const result = await adminTransaction(async ({ transaction }) =>
        upsertPaymentForStripeCharge(
          { charge: fakeCharge, paymentIntentMetadata: fakeMetadata },
          transaction
        )
      )
      expect(result.amount).toBe(0)
    })

    it('handles charges with missing billing details gracefully', async () => {
      const fakeCharge: any = {
        id: 'ch_nobilling',
        payment_intent: 'pi_nobilling',
        created: 1610000000,
        amount: 3000,
        status: 'succeeded',
        billing_details: {}, // missing address
      }
      const fakeMetadata: any = { invoiceId: 'inv_nobilling' }
      await expect(
        adminTransaction(async ({ transaction }) =>
          upsertPaymentForStripeCharge(
            {
              charge: fakeCharge,
              paymentIntentMetadata: fakeMetadata,
            },
            transaction
          )
        )
      ).rejects.toThrow()
      // TODO: test that it fails when there's no taxCountry
    })

    it('handles partially refunded charges', async () => {
      const paymentMethod = await setupPaymentMethod({
        OrganizationId: organization.id,
        CustomerProfileId: customerProfile.id,
      })
      const fakeCharge: any = {
        id: 'ch_partial',
        payment_intent: 'pi_partial',
        created: 1610000000,
        amount: 4000,
        status: 'succeeded',
        metadata: {
          invoiceId: invoice.id,
          type: IntentMetadataType.Invoice,
        },
        payment_method_details: {
          id: paymentMethod.stripePaymentMethodId,
          type: paymentMethod.type,
        },
        billing_details: { address: { country: 'US' } },
      }
      const fakeMetadata: any = {
        invoiceId: invoice.id,
        type: IntentMetadataType.Invoice,
      }
      const result = await adminTransaction(async ({ transaction }) =>
        upsertPaymentForStripeCharge(
          { charge: fakeCharge, paymentIntentMetadata: fakeMetadata },
          transaction
        )
      )
      expect(result.refunded).toBe(false)
    })
    it('marks the invoice as paid when the charge is successful and the invoice total is met', async () => {
      const invoice = await setupInvoice({
        OrganizationId: organization.id,
        CustomerProfileId: customerProfile.id,
        VariantId: variant.id,
      })
      const paymentMethod = await setupPaymentMethod({
        OrganizationId: organization.id,
        CustomerProfileId: customerProfile.id,
      })
      const fakeCharge: any = {
        id: 'ch_paid',
        payment_intent: 'pi_paid',
        created: new Date().getTime() / 1000,
        amount: 5000,
        status: 'succeeded',
        metadata: {
          invoiceId: invoice.id,
          type: IntentMetadataType.Invoice,
        },
        payment_method_details: {
          id: paymentMethod.stripePaymentMethodId,
          type: paymentMethod.type,
        },
      }
      const fakeMetadata: StripeIntentMetadata = {
        invoiceId: invoice.id,
        type: IntentMetadataType.Invoice,
      }
      const updatedInvoice = await adminTransaction(
        async ({ transaction }) => {
          await upsertPaymentForStripeCharge(
            {
              charge: fakeCharge,
              paymentIntentMetadata: fakeMetadata,
            },
            transaction
          )
          return selectInvoiceById(invoice.id, transaction)
        }
      )
      expect(updatedInvoice.status).toBe(InvoiceStatus.Paid)
    })
  })

  describe('processPaymentIntentStatusUpdated', () => {
    it('throws an error when the PaymentIntent has no metadata', async () => {
      const fakePI: any = {
        id: 'pi_test',
        metadata: null,
        latest_charge: 'ch_test',
        status: 'succeeded',
      }
      await expect(
        adminTransaction(async ({ transaction }) =>
          processPaymentIntentStatusUpdated(fakePI, transaction)
        )
      ).rejects.toThrow(/No metadata found/)
    })

    it('throws an error when the PaymentIntent has no latest_charge', async () => {
      const fakePI: any = {
        id: 'pi_test',
        metadata: { invoiceId: 'inv_test' },
        latest_charge: null,
        status: 'succeeded',
      }
      await expect(
        adminTransaction(async ({ transaction }) =>
          processPaymentIntentStatusUpdated(fakePI, transaction)
        )
      ).rejects.toThrow(/No latest charge/)
    })

    describe('Billing Run Flow', async () => {
      it('correctly processes a payment when metadata contains a billingRunId and a valid subscription', async () => {
        const paymentMethod = await setupPaymentMethod({
          OrganizationId: organization.id,
          CustomerProfileId: customerProfile.id,
        })
        const subscription = await setupSubscription({
          OrganizationId: organization.id,
          livemode: true,
          CustomerProfileId: customerProfile.id,
          PaymentMethodId: paymentMethod.id,
          VariantId: variant.id,
        })
        const billingPeriod = await setupBillingPeriod({
          SubscriptionId: subscription.id,
          livemode: true,
          startDate: new Date(),
          endDate: new Date(
            new Date().getTime() + 1000 * 60 * 60 * 24 * 30
          ),
        })
        const billingRun = await setupBillingRun({
          SubscriptionId: subscription.id,
          livemode: true,
          BillingPeriodId: billingPeriod.id,
          PaymentMethodId: paymentMethod.id,
        })
        await setupInvoice({
          OrganizationId: organization.id,
          BillingPeriodId: billingPeriod.id,
          livemode: true,
          CustomerProfileId: customerProfile.id,
          VariantId: variant.id,
        })
        const fakePI: any = {
          id: 'pi_br',
          metadata: {
            billingRunId: billingRun.id,
            billingPeriodId: billingPeriod.id,
            type: IntentMetadataType.BillingRun,
          },
          latest_charge: 'ch_br',
          status: 'succeeded',
        }
        const fakeCharge: any = {
          id: 'ch_br',
          payment_intent: 'pi_br',
          created: 1610000000,
          amount: 6000,
          status: 'succeeded',
          billing_details: { address: { country: 'US' } },
        }
        const fakeBillingRun = {
          id: 'br_123',
          SubscriptionId: 'sub_br',
          BillingPeriodId: 'bp_br',
          livemode: true,
        }
        const fakeSubscription = {
          id: 'sub_br',
          OrganizationId: 'org_br',
          CustomerProfileId: 'cp_br',
          livemode: true,
        }
        const fakeInvoice = { id: 'inv_br' }
        const fakePayment = {
          id: 'payment_br',
          status: PaymentStatus.Processing,
          InvoiceId: 'inv_br',
          PurchaseId: null,
        }
        const result = await adminTransaction(
          async ({ transaction }) =>
            processPaymentIntentStatusUpdated(fakePI, transaction)
        )
        expect(result.payment).toBeDefined()
      })
      it('throws an error when no invoice exists for the billing run', async () => {
        const fakePI: any = {
          id: 'pi_br_err',
          metadata: {
            billingRunId: 'br_err',
            billingPeriodId: 'bp_br_err',
            type: IntentMetadataType.BillingRun,
          },
          currency: CurrencyCode.USD,
          latest_charge: 'ch_br_err',
          status: 'succeeded',
        }
        const fakeCharge: any = {
          id: 'ch_br_err',
          payment_intent: 'pi_br_err',
          created: 1610000000,
          amount: 6000,
          status: 'succeeded',
          billing_details: { address: { country: 'US' } },
        }
        const fakeBillingRun = {
          id: 'br_err',
          SubscriptionId: 'sub_br_err',
          BillingPeriodId: 'bp_br_err',
          livemode: true,
        }
        const fakeSubscription = {
          id: 'sub_br_err',
          OrganizationId: 'org_br_err',
          CustomerProfileId: 'cp_br_err',
          livemode: true,
        }
        await expect(
          adminTransaction(async ({ transaction }) =>
            processPaymentIntentStatusUpdated(fakePI, transaction)
          )
        ).rejects.toThrow(/Cannot read properties of undefined/)
      })
    })

    // describe('Invoice Flow', () => {
    // it('correctly processes a payment when metadata contains an invoiceId', async () => {
    //   const fakePI: any = {
    //     id: 'pi_inv',
    //     metadata: {
    //       invoiceId: invoice.id,
    //       type: IntentMetadataType.Invoice,
    //     },
    //     latest_charge: 'ch_inv',
    //     status: 'succeeded',
    //   }
    //   const fakeCharge: any = {
    //     id: 'ch_inv',
    //     payment_intent: 'pi_inv',
    //     created: 1610000000,
    //     amount: 7000,
    //     status: 'succeeded',
    //     billing_details: { address: { country: 'CA' } },
    //   }
    //   const fakeInvoice = {
    //     id: 'inv_123',
    //     OrganizationId: 'org_inv',
    //     PurchaseId: null,
    //     taxCountry: 'CA',
    //     CustomerProfileId: 'cp_inv',
    //   }
    //   const fakePayment = {
    //     id: 'payment_inv',
    //     status: PaymentStatus.Processing,
    //     InvoiceId: 'inv_123',
    //     PurchaseId: null,
    //   }
    //   const result = await adminTransaction(
    //     async ({ transaction }) =>
    //       processPaymentIntentStatusUpdated(fakePI, transaction)
    //   )
    //   expect(result.payment).toBeDefined()
    //   expect(result.payment.taxCountry).toBe('CA')
    // })
    // })

    // describe('Purchase Session Flow', () => {
    //   // it('correctly processes a payment when metadata contains a purchaseSessionId', async () => {
    //   //   const fakePI: any = {
    //   //     id: 'pi_ps',
    //   //     metadata: {
    //   //       purchaseSessionId: 'ps_123',
    //   //       type: IntentMetadataType.PurchaseSession,
    //   //     },
    //   //     latest_charge: 'ch_ps',
    //   //     status: 'succeeded',
    //   //   }
    //   //   const fakeCharge: any = {
    //   //     id: 'ch_ps',
    //   //     payment_intent: 'pi_ps',
    //   //     created: 1610000000,
    //   //     amount: 8000,
    //   //     status: 'succeeded',
    //   //     metadata: {
    //   //       purchaseSessionId: 'ps_123',
    //   //       type: IntentMetadataType.PurchaseSession,
    //   //     },
    //   //     billing_details: { address: { country: 'US' } },
    //   //   }
    //   //   const fakePurchase = { id: 'pur_123' }
    //   //   const fakeInvoice = {
    //   //     id: 'inv_ps',
    //   //     OrganizationId: 'org_ps',
    //   //     taxCountry: 'US',
    //   //   }
    //   //   const fakePayment = {
    //   //     id: 'payment_ps',
    //   //     status: PaymentStatus.Processing,
    //   //     InvoiceId: 'inv_ps',
    //   //     PurchaseId: 'pur_123',
    //   //   }

    //   //   const result = await adminTransaction(
    //   //     async ({ transaction }) =>
    //   //       processPaymentIntentStatusUpdated(fakePI, transaction)
    //   //   )
    //   //   expect(result.payment).toBeDefined()
    //   //   expect(result.payment.PurchaseId).toBe('pur_123')
    //   // })
    // })

    // it('emits a payment canceled event when the PaymentIntent status is "canceled"', async () => {
    //   const fakePI: any = {
    //     id: 'pi_cancel',
    //     metadata: { invoiceId: 'inv_can' },
    //     latest_charge: 'ch_can',
    //     status: 'canceled',
    //   }
    //   const fakeCharge: any = {
    //     id: 'ch_can',
    //     payment_intent: 'pi_cancel',
    //     created: 1610000000,
    //     amount: 9000,
    //     status: 'failed',
    //     billing_details: { address: { country: 'US' } },
    //   }
    //   const fakeInvoice = {
    //     id: 'inv_can',
    //     OrganizationId: 'org_can',
    //     PurchaseId: null,
    //     taxCountry: 'US',
    //     CustomerProfileId: 'cp_can',
    //   }
    //   const fakePayment = {
    //     id: 'payment_can',
    //     status: PaymentStatus.Processing,
    //     InvoiceId: 'inv_can',
    //     PurchaseId: null,
    //   }

    //   const result = await adminTransaction(async ({ transaction }) =>
    //     processPaymentIntentStatusUpdated(fakePI, transaction)
    //   )
    //   expect(result.payment).toBeDefined()
    // })

    // it('does not emit any events for PaymentIntent statuses other than "succeeded" or "canceled"', async () => {
    //   const fakePI: any = {
    //     id: 'pi_other',
    //     metadata: {
    //       invoiceId: invoice.id,
    //       type: IntentMetadataType.Invoice,
    //     },
    //     latest_charge: 'ch_other',
    //     status: 'processing',
    //   }
    //   const fakeCharge: any = {
    //     id: 'ch_other',
    //     payment_intent: 'pi_other',
    //     created: 1610000000,
    //     amount: 10000,
    //     status: 'pending',
    //     metadata: {
    //       invoiceId: invoice.id,
    //       type: IntentMetadataType.Invoice,
    //     },
    //     billing_details: { address: { country: 'US' } },
    //   }
    //   const fakeInvoice = {
    //     id: 'inv_other',
    //     OrganizationId: 'org_other',
    //     PurchaseId: null,
    //     taxCountry: 'US',
    //     CustomerProfileId: 'cp_other',
    //   }
    //   const fakePayment = {
    //     id: 'payment_other',
    //     status: PaymentStatus.Processing,
    //     InvoiceId: 'inv_other',
    //     PurchaseId: null,
    //   }

    //   const result = await adminTransaction(async ({ transaction }) =>
    //     processPaymentIntentStatusUpdated(fakePI, transaction)
    //   )
    //   expect(result.payment).toBeDefined()
    // })

    // it('is idempotent when processing the same PaymentIntent update more than once, returning a consistent payment record', async () => {
    //   const fakePI: any = {
    //     id: 'pi_idempotent',
    //     metadata: {
    //       invoiceId: invoice.id,
    //       type: IntentMetadataType.Invoice,
    //     },
    //     latest_charge: 'ch_idemp',
    //     status: 'succeeded',
    //   }
    //   const fakeCharge: any = {
    //     id: 'ch_idemp',
    //     payment_intent: 'pi_idempotent',
    //     created: 1610000000,
    //     amount: 11000,
    //     status: 'succeeded',
    //     metadata: {
    //       invoiceId: invoice.id,
    //       type: IntentMetadataType.Invoice,
    //     },
    //     billing_details: { address: { country: 'US' } },
    //   }
    //   const fakeInvoice = {
    //     id: 'inv_idemp',
    //     OrganizationId: 'org_idemp',
    //     PurchaseId: null,
    //     taxCountry: 'US',
    //     CustomerProfileId: 'cp_idemp',
    //   }
    //   const fakePayment = {
    //     id: 'payment_idemp',
    //     status: PaymentStatus.Processing,
    //     InvoiceId: 'inv_idemp',
    //     PurchaseId: null,
    //   }
    //   const result1 = await adminTransaction(
    //     async ({ transaction }) =>
    //       processPaymentIntentStatusUpdated(fakePI, transaction)
    //   )
    //   const result2 = await adminTransaction(
    //     async ({ transaction }) =>
    //       processPaymentIntentStatusUpdated(fakePI, transaction)
    //   )
    //   expect(result2.payment).toEqual(result1.payment)
    // })
  })

  // describe('System Integration & Transaction Management', () => {
  //   it('handles valid state transitions and prevents invalid ones', async () => {
  //     let fakePayment: any = {
  //       id: 'state',
  //       status: PaymentStatus.Processing,
  //       InvoiceId: invoice.id,
  //       PurchaseId: null,
  //     }
  //     const validTransition = await adminTransaction(
  //       async ({ transaction }) =>
  //         updatePaymentToReflectLatestChargeStatus(
  //           fakePayment,
  //           'succeeded',
  //           transaction
  //         )
  //     )
  //     expect(validTransition.status).toEqual(PaymentStatus.Succeeded)
  //   })
  // })
})
