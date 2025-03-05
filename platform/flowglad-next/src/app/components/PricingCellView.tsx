import { RotateCw } from 'lucide-react'
import { PriceType } from '@/types'
import { Variant } from '@/db/schema/variants'
import { stripeCurrencyAmountToHumanReadableCurrencyAmount } from '@/utils/stripe'

const PricingCellView = ({
  variants,
}: {
  variants: Variant.Record[]
}) => {
  if (variants.length === 0) {
    return <div>-</div>
  }

  if (variants.length === 1) {
    const variant = variants[0]
    return (
      <div className="flex items-center gap-3">
        {variant.priceType === PriceType.Subscription ? (
          <RotateCw size={16} strokeWidth={2} />
        ) : (
          <></>
        )}
        <div className="w-fit flex flex-col justify-center text-sm font-medium text-foreground">
          {stripeCurrencyAmountToHumanReadableCurrencyAmount(
            variant.currency,
            variant.unitPrice
          )}{' '}
          {variant.priceType === PriceType.Subscription
            ? `/ ${variant.intervalUnit}`
            : null}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3">
      {variants.length} Prices
    </div>
  )
}

export default PricingCellView
