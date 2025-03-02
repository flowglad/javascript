import { dateFromStripeTimestamp } from './stripe'
import { safelyUpdatePaymentForRefund } from '@/db/tableMethods/paymentMethods'
import { selectPaymentById } from '@/db/tableMethods/paymentMethods'
import { PaymentStatus } from '@/types'
import { DbTransaction } from '@/db/types'
import {
  getPaymentIntent,
  getStripeCharge,
  listRefundsForCharge,
  refundPayment,
  stripeIdFromObjectOrId,
} from '@/utils/stripe'
import Stripe from 'stripe'

export const refundPaymentTransaction = async (
  {
    id,
    partialAmount,
    livemode,
  }: { id: string; partialAmount: number | null; livemode: boolean },
  transaction: DbTransaction
) => {
  const payment = await selectPaymentById(id, transaction)

  if (!payment) {
    throw new Error('Payment not found')
  }

  if (payment.status === PaymentStatus.Refunded) {
    throw new Error('Payment has already been refunded')
  }

  if (payment.status === PaymentStatus.Processing) {
    throw new Error(
      'Cannot refund a payment that is still processing'
    )
  }
  if (partialAmount && partialAmount > payment.amount) {
    throw new Error(
      'Partial amount cannot be greater than the payment amount'
    )
  }
  let refund: Stripe.Refund | null = null
  try {
    refund = await refundPayment(
      payment.stripePaymentIntentId,
      partialAmount,
      livemode
    )
  } catch (error) {
    const alreadyRefundedError =
      error instanceof Stripe.errors.StripeError &&
      (error.raw as { code: string }).code ===
        'charge_already_refunded'
    if (!alreadyRefundedError) {
      throw error
    }
    const paymentIntent = await getPaymentIntent(
      payment.stripePaymentIntentId
    )
    if (!paymentIntent.latest_charge) {
      throw new Error(
        `Payment ${payment.id} has no associated Stripe charge`
      )
    }

    const charge = await getStripeCharge(
      stripeIdFromObjectOrId(paymentIntent.latest_charge!)
    )
    if (!charge.refunded) {
      throw new Error(
        `Payment ${payment.id} has a charge ${charge.id} that has not been refunded`
      )
    }
    const refunds = await listRefundsForCharge(charge.id, livemode)
    refund = refunds.data[0]
  }

  const updatedPayment = await safelyUpdatePaymentForRefund(
    {
      id: payment.id,
      status: PaymentStatus.Refunded,
      refunded: true,
      refundedAmount: payment.amount,
      refundedAt: dateFromStripeTimestamp(refund.created),
    },
    transaction
  )

  return updatedPayment
}
