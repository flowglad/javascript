'use client'
import { forwardRef } from 'react'
import clsx from 'clsx'
import { useCheckoutPageContext } from '@/contexts/checkoutPageContext'
import BillingLineItem from '@/components/ion/BillingLineItem'
import { stripeCurrencyAmountToHumanReadableCurrencyAmount } from '@/utils/stripe'
import { CurrencyCode, PriceType } from '@/types'
import { intervalLabel } from './BillingHeader'
import { Purchase } from '@/db/schema/purchases'
import { Variant } from '@/db/schema/variants'
import core from '@/utils/core'

export interface BillingLineItemsProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const billingFrequencyLabel = (
  variant: Variant.SubscriptionRecord,
  purchase?: Purchase.SubscriptionPurchaseRecord
) => {
  let label = ` ${intervalLabel(purchase ?? variant)}`
  const trialPeriodDays = core.isNil(purchase?.trialPeriodDays)
    ? variant.trialPeriodDays
    : purchase?.trialPeriodDays
  if (trialPeriodDays) {
    label =
      stripeCurrencyAmountToHumanReadableCurrencyAmount(
        variant.currency,
        purchase?.pricePerBillingCycle ?? variant.unitPrice
      ) + label
    label += ` after`
  } else {
    label = `Billed` + label
  }
  return label
}

const BillingLineItems = forwardRef<
  HTMLDivElement,
  BillingLineItemsProps
>(({ className, ...props }, ref) => {
  const { purchase, product, variant, priceType } =
    useCheckoutPageContext()
  const defaultPrice = variant.unitPrice
  let numberPrice = variant.unitPrice
  if (priceType === PriceType.SinglePayment) {
    numberPrice = purchase?.firstInvoiceValue ?? defaultPrice
  } else if (priceType === PriceType.Subscription) {
    numberPrice = purchase?.pricePerBillingCycle ?? defaultPrice
  }
  return (
    <div
      ref={ref}
      className={clsx('flex flex-col w-full', className)}
      {...props}
    >
      <BillingLineItem
        imageSrc={product?.imageURL ?? ''}
        title={product?.name ?? ''}
        price={`${stripeCurrencyAmountToHumanReadableCurrencyAmount(
          variant.currency,
          numberPrice
        )}`}
        billingFrequency={
          priceType === PriceType.Subscription
            ? billingFrequencyLabel(
                variant,
                purchase as Purchase.SubscriptionPurchaseRecord
              )
            : null
        }
        data-testid={`billing-line-item:${product?.id}`}
        isLast={true}
      />
    </div>
  )
})

BillingLineItems.displayName = 'BillingLineItems'

export default BillingLineItems
