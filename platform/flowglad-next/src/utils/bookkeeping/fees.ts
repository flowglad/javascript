import { BillingAddress } from '@/db/schema/customers'
import { Discount } from '@/db/schema/discounts'
import { FeeCalculation } from '@/db/schema/feeCalculations'
import { Organization } from '@/db/schema/organizations'
import { Product } from '@/db/schema/products'
import { Purchase } from '@/db/schema/purchases'
import { Variant } from '@/db/schema/variants'
import {
  CountryCode,
  CurrencyCode,
  DiscountAmountType,
  FeeCalculationType,
  PaymentMethodType,
  PriceType,
  StripeConnectContractType,
} from '@/types'
import { DbTransaction } from '@/db/types'
import Stripe from 'stripe'
import {
  createStripeTaxCalculationByPurchase,
  createStripeTaxCalculationByVariant,
} from '../stripe'
import { isNil, nanoid } from '../core'
import {
  insertFeeCalculation,
  updateFeeCalculation,
} from '@/db/tableMethods/feeCalculationMethods'
import { BillingPeriod } from '@/db/schema/billingPeriods'
import { BillingPeriodItem } from '@/db/schema/billingPeriodItems'
import { DiscountRedemption } from '@/db/schema/discountRedemptions'
import { Country } from '@/db/schema/countries'
import { PaymentMethod } from '@/db/schema/paymentMethods'
import { selectResolvedPaymentsMonthToDate } from '@/db/tableMethods/paymentMethods'

export const calculateVariantBaseAmount = (
  variant: Variant.Record,
  purchase?: Purchase.Record | null
) => {
  if (!purchase) {
    return variant.unitPrice
  }
  if (
    isNil(purchase.firstInvoiceValue) &&
    isNil(purchase.pricePerBillingCycle)
  ) {
    return variant.unitPrice
  }
  if (
    purchase.priceType === PriceType.SinglePayment &&
    purchase.firstInvoiceValue
  ) {
    return purchase.firstInvoiceValue
  } else if (
    purchase.priceType === PriceType.Subscription &&
    purchase.pricePerBillingCycle
  ) {
    return purchase.pricePerBillingCycle
  }

  return variant.unitPrice
}

export const calculateDiscountAmount = (
  basePrice: number,
  discount?: Discount.Record | null
): number => {
  if (!discount) {
    return 0
  }

  if (discount.amountType === DiscountAmountType.Fixed) {
    return discount.amount
  } else if (discount.amountType === DiscountAmountType.Percent) {
    return Math.round(
      basePrice * (Math.min(discount.amount, 100) / 100)
    )
  }

  return 0
}

export const calculateDiscountAmountFromRedemption = (
  baseAmount: number,
  redemption?: DiscountRedemption.Record
) => {
  if (!redemption) {
    return 0
  }

  if (redemption.discountAmountType === DiscountAmountType.Fixed) {
    return redemption.discountAmount
  }

  return Math.round(
    baseAmount * (Math.min(redemption.discountAmount, 100) / 100)
  )
}

export const calculateFlowgladFeePercentage = ({
  organization,
}: {
  organization: Organization.Record
}) => {
  return parseFloat(organization.feePercentage)
}

export const calculateInternationalFeePercentage = ({
  paymentMethod,
  paymentMethodCountry,
  organization,
  organizationCountry,
}: {
  paymentMethod: PaymentMethodType
  paymentMethodCountry: CountryCode
  organization: Organization.Record
  organizationCountry: Country.Record
}): number => {
  /**
   * Always charge 0 for Merchant of Record transactions with US billing addresses
   */
  if (
    organization.stripeConnectContractType ===
      StripeConnectContractType.MerchantOfRecord &&
    paymentMethodCountry.toUpperCase() === 'US'
  ) {
    return 0
  }

  const organizationCountryCode =
    organizationCountry.code.toUpperCase()

  const billingAddressCountryCode = paymentMethodCountry.toUpperCase()
  const billingAddressCountryInCountryCodes = Object.values(
    CountryCode
  )
    .map((paymentMethodCountry) => paymentMethodCountry.toUpperCase())
    .some(
      (paymentMethodCountry) =>
        paymentMethodCountry === billingAddressCountryCode
    )
  if (!billingAddressCountryInCountryCodes) {
    throw Error(
      `Billing address country ${billingAddressCountryCode} is not in the list of country codes`
    )
  }
  if (organizationCountryCode === billingAddressCountryCode) {
    return 0
  }

  const baseInternationalFeePercentage = 1

  if (
    paymentMethod !== PaymentMethodType.Card &&
    paymentMethod !== PaymentMethodType.SEPADebit
  ) {
    return baseInternationalFeePercentage
  }

  return baseInternationalFeePercentage + 1.5
}

export const calculatePaymentMethodFeeAmount = (
  totalAmountToCharge: number,
  paymentMethod: PaymentMethodType
) => {
  if (totalAmountToCharge <= 0) {
    return 0
  }
  switch (paymentMethod) {
    case PaymentMethodType.Card:
      return Math.round(totalAmountToCharge * 0.029 + 30)
    case PaymentMethodType.USBankAccount:
      return Math.round(Math.min(totalAmountToCharge * 0.008, 500))
    case PaymentMethodType.SEPADebit:
      return Math.round(Math.min(totalAmountToCharge * 0.008, 600))
    default:
      return 0
  }
}

export const calculateTaxes = async ({
  discountInclusiveAmount,
  product,
  billingAddress,
  variant,
  purchase,
}: {
  discountInclusiveAmount: number
  product: Product.Record
  billingAddress: BillingAddress
  variant: Variant.Record
  purchase?: Purchase.Record
}): Promise<
  Pick<
    FeeCalculation.Record,
    | 'taxAmountFixed'
    | 'stripeTaxCalculationId'
    | 'stripeTaxTransactionId'
  >
> => {
  let taxCalculation: Stripe.Tax.Calculation | null = null
  if (discountInclusiveAmount === 0) {
    return {
      taxAmountFixed: 0,
      stripeTaxCalculationId: `notaxoverride_${nanoid()}`,
      stripeTaxTransactionId: null,
    }
  }
  if (purchase) {
    taxCalculation = await createStripeTaxCalculationByPurchase({
      purchase,
      billingAddress,
      discountInclusiveAmount,
      variant,
      product,
      livemode: product.livemode,
    })
  } else {
    taxCalculation = await createStripeTaxCalculationByVariant({
      variant,
      billingAddress,
      discountInclusiveAmount,
      product,
      livemode: product.livemode,
    })
  }

  return {
    taxAmountFixed: taxCalculation.tax_amount_exclusive,
    stripeTaxCalculationId: taxCalculation.id!,
    stripeTaxTransactionId: null,
  }
}

export const calculateTotalFeeAmount = (
  feeCalculation: FeeCalculation.Record
) => {
  const {
    baseAmount,
    discountAmountFixed,
    flowgladFeePercentage,
    internationalFeePercentage,
    paymentMethodFeeFixed,
    taxAmountFixed,
  } = feeCalculation
  if (isNaN(baseAmount)) {
    throw Error('Base amount is NaN')
  }

  if (isNaN(discountAmountFixed)) {
    throw Error('Discount amount fixed is NaN')
  }

  if (isNaN(parseFloat(internationalFeePercentage))) {
    throw Error('International fee percentage is NaN')
  }
  const safeDiscountAmount = discountAmountFixed
    ? Math.max(discountAmountFixed, 0)
    : 0
  const discountInclusiveAmount = baseAmount - safeDiscountAmount
  const flowgladFeeFixed =
    (discountInclusiveAmount * parseFloat(flowgladFeePercentage!)) /
    100
  const internationalFeeFixed =
    (discountInclusiveAmount *
      parseFloat(internationalFeePercentage!)) /
    100
  const totalFee =
    flowgladFeeFixed +
    internationalFeeFixed +
    paymentMethodFeeFixed +
    taxAmountFixed
  return Math.round(totalFee)
}

interface PurchaseSessionFeeCalculationParams {
  organization: Organization.Record
  product: Product.Record
  variant: Variant.Record
  purchase?: Purchase.Record
  discount?: Discount.Record
  billingAddress: BillingAddress
  paymentMethodType: PaymentMethodType
  PurchaseSessionId: string
  organizationCountry: Country.Record
}

export const createPurchaseSessionFeeCalculationInsert = async ({
  organization,
  product,
  variant,
  purchase,
  discount,
  billingAddress,
  paymentMethodType,
  organizationCountry,
  PurchaseSessionId,
}: PurchaseSessionFeeCalculationParams) => {
  const baseAmount = calculateVariantBaseAmount(variant, purchase)
  const discountAmount = calculateDiscountAmount(baseAmount, discount)
  const flowgladFeePercentage = calculateFlowgladFeePercentage({
    organization,
  })
  const discountInclusiveAmount = Math.max(
    baseAmount - (discountAmount ?? 0),
    0
  )

  const internationalFeePercentage =
    calculateInternationalFeePercentage({
      paymentMethod: paymentMethodType,
      paymentMethodCountry: billingAddress.address
        .country as CountryCode,
      organization,
      organizationCountry,
    })
  const paymentMethodFeeFixed = calculatePaymentMethodFeeAmount(
    discountInclusiveAmount,
    paymentMethodType
  )
  let taxAmountFixed = 0
  let stripeTaxCalculationId = null
  let stripeTaxTransactionId = null
  if (
    organization.stripeConnectContractType ===
    StripeConnectContractType.MerchantOfRecord
  ) {
    const taxCalculation = await calculateTaxes({
      discountInclusiveAmount,
      product,
      billingAddress,
      variant,
      purchase,
    })
    taxAmountFixed = taxCalculation.taxAmountFixed
    stripeTaxCalculationId = taxCalculation.stripeTaxCalculationId
    stripeTaxTransactionId = taxCalculation.stripeTaxTransactionId
  }
  const feeCalculationInsert: FeeCalculation.Insert = {
    baseAmount,
    discountAmountFixed: discountAmount,
    pretaxTotal: discountInclusiveAmount,
    PurchaseSessionId,
    flowgladFeePercentage: flowgladFeePercentage.toString(),
    internationalFeePercentage: internationalFeePercentage.toString(),
    paymentMethodFeeFixed,
    taxAmountFixed,
    currency: variant.currency,
    stripeTaxCalculationId,
    stripeTaxTransactionId,
    OrganizationId: organization.id,
    PurchaseId: purchase?.id,
    VariantId: variant.id,
    DiscountId: discount?.id,
    paymentMethodType,
    billingAddress,
    BillingPeriodId: null,
    type: FeeCalculationType.PurchaseSessionPayment,
    livemode: variant.livemode,
  }
  return feeCalculationInsert
}

interface SubscriptionFeeCalculationParams {
  organization: Organization.Record
  billingPeriod: BillingPeriod.Record
  billingPeriodItems: BillingPeriodItem.Record[]
  discountRedemption?: DiscountRedemption.Record
  paymentMethod: PaymentMethod.Record
  organizationCountry: Country.Record
  livemode: boolean
  currency: CurrencyCode
}

const calculateBillingItemBaseAmount = (
  billingPeriodItems: BillingPeriodItem.Record[]
) => {
  return billingPeriodItems.reduce((acc, item) => {
    return acc + item.unitPrice * item.quantity
  }, 0)
}

const createSubscriptionFeeCalculationInsert = (
  params: SubscriptionFeeCalculationParams
) => {
  const {
    organization,
    billingPeriod,
    billingPeriodItems,
    discountRedemption,
    paymentMethod,
    organizationCountry,
    livemode,
    currency,
  } = params

  const baseAmount = calculateBillingItemBaseAmount(
    billingPeriodItems
  )
  const discountAmount = calculateDiscountAmountFromRedemption(
    baseAmount,
    discountRedemption
  )
  const flowgladFeePercentage = calculateFlowgladFeePercentage({
    organization,
  })
  const discountInclusiveAmount = Math.max(
    baseAmount - (discountAmount ?? 0),
    0
  )

  const internationalFeePercentage =
    calculateInternationalFeePercentage({
      paymentMethod: paymentMethod.type,
      paymentMethodCountry: (paymentMethod.billingDetails.address
        ?.address?.country ??
        paymentMethod.paymentMethodData?.country) as CountryCode,
      organization,
      organizationCountry,
    })
  const paymentMethodFeeFixed = calculatePaymentMethodFeeAmount(
    discountInclusiveAmount,
    paymentMethod.type
  )
  let taxAmountFixed = 0
  let stripeTaxCalculationId = null
  let stripeTaxTransactionId = null
  if (
    organization.stripeConnectContractType ===
    StripeConnectContractType.MerchantOfRecord
  ) {
    // const taxCalculation = await calculateTaxes({
    //   discountInclusiveAmount,
    //   product,
    //   billingAddress,
    //   variant,
    //   purchase,
    // })
    taxAmountFixed = 0
    stripeTaxCalculationId = null
    stripeTaxTransactionId = null
  }

  const feeCalculationInsert: FeeCalculation.Insert = {
    type: FeeCalculationType.SubscriptionPayment,
    OrganizationId: organization.id,
    billingAddress: paymentMethod.billingDetails.address,
    VariantId: null,
    PurchaseSessionId: null,
    paymentMethodType: paymentMethod.type,
    discountAmountFixed: discountAmount,
    pretaxTotal: discountInclusiveAmount,
    BillingPeriodId: billingPeriod.id,
    baseAmount,
    currency,
    flowgladFeePercentage: flowgladFeePercentage.toString(),
    internationalFeePercentage: internationalFeePercentage.toString(),
    paymentMethodFeeFixed,
    taxAmountFixed,
    stripeTaxCalculationId,
    stripeTaxTransactionId,
    livemode,
  }
  return feeCalculationInsert
}

export const createPurchaseSessionFeeCalculation = async (
  params: PurchaseSessionFeeCalculationParams,
  transaction: DbTransaction
) => {
  const feeCalculationInsert =
    await createPurchaseSessionFeeCalculationInsert(params)
  return insertFeeCalculation(feeCalculationInsert, transaction)
}

export const createAndFinalizeSubscriptionFeeCalculation = async (
  params: SubscriptionFeeCalculationParams,
  transaction: DbTransaction
): Promise<FeeCalculation.Record> => {
  const feeCalculationInsert =
    createSubscriptionFeeCalculationInsert(params)
  const initialFeeCalculation = await insertFeeCalculation(
    feeCalculationInsert,
    transaction
  )
  return finalizeFeeCalculation(initialFeeCalculation, transaction)
}

export const calculateTotalDueAmount = (
  feeCalculation: FeeCalculation.CustomerRecord
) => {
  const { baseAmount, discountAmountFixed, taxAmountFixed } =
    feeCalculation
  return Math.max(
    baseAmount - (discountAmountFixed ?? 0) + taxAmountFixed,
    0
  )
}

/**
 * Determine whether to charge a flowglad processing fee.
 * If the customer has not paid enough in the month, do not charge the fee.
 *
 * This method has many assumptions that need to be worked out.
 * 1) When do we count a payment? For slow payments, like bank settlements, when do we count it towards the balance?
 * 2) Do we include refunded? Yes, those don't get removed from the balance.
 * @param feeCalculation
 * @param transaction
 * @returns
 */
export const finalizeFeeCalculation = async (
  feeCalculation: FeeCalculation.Record,
  transaction: DbTransaction
) => {
  const monthToDateResolvedPayments =
    await selectResolvedPaymentsMonthToDate(
      {
        OrganizationId: feeCalculation.OrganizationId,
      },
      transaction
    )
  /**
   * Hard assume that the payments are processed in pennies.
   * We accept imprecision for Euros, and for other currencies.
   */
  const totalProcessedMonthToDatePennies =
    monthToDateResolvedPayments.reduce(
      (acc, payment) => acc + payment.amount,
      0
    )
  let flowgladFeePercentage = feeCalculation.flowgladFeePercentage
  if (totalProcessedMonthToDatePennies < 100000) {
    flowgladFeePercentage = '0.00'
  }
  const feeCalculationUpdate = {
    id: feeCalculation.id,
    flowgladFeePercentage,
    type: feeCalculation.type,
    VariantId: feeCalculation.VariantId,
    BillingPeriodId: feeCalculation.BillingPeriodId,
    PurchaseSessionId: feeCalculation.PurchaseSessionId,
    internalNotes: `Total processed month to date: ${totalProcessedMonthToDatePennies}; Calculated time: ${new Date().toISOString()}`,
  } as FeeCalculation.Update
  return updateFeeCalculation(feeCalculationUpdate, transaction)
}
