'use client'
// Generated with Ion on 10/1/2024, 2:36:06 PM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=640:29776
import * as React from 'react'
import clsx from 'clsx'
import { useCheckoutPageContext } from '@/app/contexts/checkoutPageContext'
import { CurrencyCode, PriceType } from '@/types'
import { stripeCurrencyAmountToHumanReadableCurrencyAmount } from '@/utils/stripe'
import { FallbackSkeleton } from './Skeleton'
import {
  calculateVariantBaseAmount,
  calculateDiscountAmount,
  calculateTotalDueAmount,
} from '@/utils/bookkeeping/fees'
import { isNil } from '@/utils/core'

export interface TotalBillingDetailsProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const PurchasSessionDependentLine = ({
  label,
  amount,
  currency,
  editPurchaseSessionLoading,
}: {
  label: string
  amount: number
  currency: CurrencyCode
  editPurchaseSessionLoading?: boolean
}) => {
  return (
    <div className="w-full relative flex justify-between">
      <div className="relative flex">
        <div className="relative">
          <span className="text-sm leading-tight opacity-50 text-white">
            Discount
          </span>
        </div>
      </div>
      <FallbackSkeleton showSkeleton={editPurchaseSessionLoading}>
        <p className="text-sm leading-tight text-white">
          {stripeCurrencyAmountToHumanReadableCurrencyAmount(
            currency,
            amount
          )}
        </p>
      </FallbackSkeleton>
    </div>
  )
}

const TotalBillingDetails = React.forwardRef<
  HTMLDivElement,
  TotalBillingDetailsProps
>(({ className, ...props }, ref) => {
  const {
    variant,
    discount,
    editPurchaseSessionLoading,
    subscriptionDetails,
    feeCalculation,
    purchase,
  } = useCheckoutPageContext()

  let afterwardsTotal: number | null = null
  let afterwardsTotalLabel = ''
  const baseAmount = calculateVariantBaseAmount(variant, purchase)
  if (subscriptionDetails?.trialPeriodDays) {
    afterwardsTotalLabel = 'Total After Trial'
    afterwardsTotal = subscriptionDetails.pricePerBillingCycle
  }
  let subtotalAmount: number | null = baseAmount
  let discountAmount: number | null = calculateDiscountAmount(
    baseAmount,
    discount
  )
  let taxAmount: number | null = null
  let totalDueAmount: number | null =
    subtotalAmount - (discountAmount ?? 0)
  if (feeCalculation) {
    subtotalAmount = feeCalculation.baseAmount
    discountAmount = feeCalculation.discountAmountFixed
    taxAmount = feeCalculation.taxAmountFixed
    totalDueAmount = calculateTotalDueAmount(feeCalculation)
  }
  return (
    <div
      ref={ref}
      className={clsx('relative flex flex-col pb-4 gap-2', className)}
      {...props}
    >
      <div className="w-full relative flex justify-between border-opacity-10 border-white py-4 gap-4 text-sm leading-tight text-white">
        <div>Subtotal</div>
        <div
          className="font-bold"
          data-testid="billing-info-subtotal-amount"
        >
          {stripeCurrencyAmountToHumanReadableCurrencyAmount(
            variant.currency,
            baseAmount
          )}
        </div>
      </div>
      {discount ? (
        <PurchasSessionDependentLine
          label="Discount"
          amount={discountAmount ?? 0}
          currency={variant.currency}
          editPurchaseSessionLoading={editPurchaseSessionLoading}
        />
      ) : null}
      {taxAmount ? (
        <PurchasSessionDependentLine
          label="Tax"
          amount={taxAmount ?? 0}
          currency={variant.currency}
          editPurchaseSessionLoading={editPurchaseSessionLoading}
        />
      ) : null}
      {afterwardsTotal && (
        <div className="flex items-center justify-between gap-2 text-sm text-foreground pb-4">
          <span data-testid="billing-info-total-afterwards-label">
            {afterwardsTotalLabel}
          </span>
          <span data-testid="billing-info-total-afterwards-amount">
            {stripeCurrencyAmountToHumanReadableCurrencyAmount(
              variant.currency,
              afterwardsTotal
            )}
          </span>
        </div>
      )}

      <div className="w-full relative flex justify-between items-end border-opacity-10 border-t border-white pt-8 text-white">
        <div
          className="text-sm font-bold leading-tight pt-[1px] pb-0.5"
          data-testid="billing-info-total-due-label"
        >
          {`Total Due${
            variant.priceType === PriceType.SinglePayment
              ? ''
              : ' Today'
          }`}
        </div>
        <FallbackSkeleton showSkeleton={editPurchaseSessionLoading}>
          <div
            className="text-base leading-5 font-bold"
            data-testid="billing-info-total-due-amount"
          >
            {isNil(totalDueAmount)
              ? ''
              : stripeCurrencyAmountToHumanReadableCurrencyAmount(
                  variant.currency,
                  totalDueAmount
                )}
          </div>
        </FallbackSkeleton>
      </div>
    </div>
  )
})

TotalBillingDetails.displayName = 'TotalBillingDetails'

export default TotalBillingDetails
