import { z } from 'zod'
import {
  BusinessOnboardingStatus,
  CountryCode,
  CurrencyCode,
  DiscountAmountType,
  DiscountDuration,
  Nullish,
  PaymentMethodType,
  PriceType,
  StripeConnectContractType,
} from '@/types'
import core from './core'
import Stripe from 'stripe'
import { Product } from '@/db/schema/products'
import { Variant } from '@/db/schema/variants'
import { Organization } from '@/db/schema/organizations'
import { InvoiceLineItem } from '@/db/schema/invoiceLineItems'
import { Invoice } from '@/db/schema/invoices'
import { CustomerBillingAddress } from '@/db/schema/customers'
import { Purchase } from '@/db/schema/purchases'
import { PurchaseSession } from '@/db/schema/purchaseSessions'
import { Discount } from '@/db/schema/discounts'
import { calculateTotalFeeAmount } from './bookkeeping/fees'
import { calculateTotalDueAmount } from './bookkeeping/fees'
import { FeeCalculation } from '@/db/schema/feeCalculations'
import { Country } from '@/db/schema/countries'

const DIGITAL_TAX_CODE = 'txcd_10000000'

export const cardPaymentsCountries = [
  'AU',
  'AT',
  'BE',
  'BG',
  'CA',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HK',
  'HU',
  'IE',
  'IT',
  'JP',
  'LV',
  'LI',
  'LT',
  'LU',
  'MT',
  'MX',
  'NL',
  'NZ',
  'NO',
  'PL',
  'PT',
  'RO',
  'SG',
  'SK',
  'SI',
  'ES',
  'SE',
  'CH',
  'TH',
  'AE',
  'GB',
]

export const transferCountries = [
  'AL',
  'DZ',
  'AO',
  'AG',
  'AR',
  'AM',
  'AZ',
  'BS',
  'BH',
  'BD',
  'BJ',
  'BT',
  'BO',
  'BA',
  'BW',
  'BN',
  'KH',
  'CL',
  'CO',
  'CR',
  'CI',
  'DO',
  'EC',
  'EG',
  'SV',
  'ET',
  'GA',
  'GM',
  'GH',
  'GT',
  'GY',
  'IS',
  'IN',
  'ID',
  'IL',
  'JM',
  'JO',
  'KZ',
  'KE',
  'KW',
  'LA',
  'MO',
  'MG',
  'MY',
  'MU',
  'MD',
  'MC',
  'MN',
  'MA',
  'MZ',
  'NA',
  'NE',
  'NG',
  'MK',
  'OM',
  'PK',
  'PA',
  'PY',
  'PE',
  'PH',
  'QA',
  'RW',
  'SM',
  'SA',
  'SN',
  'RS',
  'ZA',
  'KR',
  'LK',
  'LC',
  'TW',
  'TZ',
  'TT',
  'TN',
  'TR',
  'UY',
  'UZ',
  'VN',
]

export const zeroDecimalCurrencies = [
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]

export const stripeSupportedCurrencies: readonly CurrencyCode[] = [
  CurrencyCode.USD,
  CurrencyCode.AED,
  CurrencyCode.AFN,
  CurrencyCode.AMD,
  CurrencyCode.ANG,
  CurrencyCode.AUD,
  CurrencyCode.AWG,
  CurrencyCode.AZN,
  CurrencyCode.BAM,
  CurrencyCode.BBD,
  CurrencyCode.BDT,
  CurrencyCode.BGN,
  CurrencyCode.BIF,
  CurrencyCode.BMD,
  CurrencyCode.BND,
  CurrencyCode.BSD,
  CurrencyCode.BWP,
  CurrencyCode.BYN,
  CurrencyCode.BZD,
  CurrencyCode.CAD,
  CurrencyCode.CDF,
  CurrencyCode.CHF,
  CurrencyCode.CNY,
  CurrencyCode.CZK,
  CurrencyCode.DKK,
  CurrencyCode.DOP,
  CurrencyCode.DZD,
  CurrencyCode.EGP,
  CurrencyCode.ETB,
  CurrencyCode.EUR,
  CurrencyCode.FJD,
  CurrencyCode.GBP,
  CurrencyCode.GEL,
  CurrencyCode.GIP,
  CurrencyCode.GMD,
  CurrencyCode.GYD,
  CurrencyCode.HKD,
  CurrencyCode.HTG,
  CurrencyCode.HUF,
  CurrencyCode.IDR,
  CurrencyCode.ILS,
  CurrencyCode.INR,
  CurrencyCode.ISK,
  CurrencyCode.JMD,
  CurrencyCode.JPY,
  CurrencyCode.KES,
  CurrencyCode.KGS,
  CurrencyCode.KHR,
  CurrencyCode.KMF,
  CurrencyCode.KRW,
  CurrencyCode.KYD,
  CurrencyCode.KZT,
  CurrencyCode.LBP,
  CurrencyCode.LKR,
  CurrencyCode.LRD,
  CurrencyCode.LSL,
  CurrencyCode.MAD,
  CurrencyCode.MDL,
  CurrencyCode.MGA,
  CurrencyCode.MKD,
  CurrencyCode.MMK,
  CurrencyCode.MNT,
  CurrencyCode.MOP,
  CurrencyCode.MVR,
  CurrencyCode.MWK,
  CurrencyCode.MXN,
  CurrencyCode.MYR,
  CurrencyCode.MZN,
  CurrencyCode.NAD,
  CurrencyCode.NGN,
  CurrencyCode.NOK,
  CurrencyCode.NPR,
  CurrencyCode.NZD,
  CurrencyCode.PGK,
  CurrencyCode.PHP,
  CurrencyCode.PKR,
  CurrencyCode.PLN,
  CurrencyCode.QAR,
  CurrencyCode.RON,
  CurrencyCode.RSD,
  CurrencyCode.RUB,
  CurrencyCode.RWF,
  CurrencyCode.SAR,
  CurrencyCode.SBD,
  CurrencyCode.SCR,
  CurrencyCode.SEK,
  CurrencyCode.SGD,
  CurrencyCode.SLE,
  CurrencyCode.SOS,
  CurrencyCode.SZL,
  CurrencyCode.THB,
  CurrencyCode.TJS,
  CurrencyCode.TOP,
  CurrencyCode.TRY,
  CurrencyCode.TTD,
  CurrencyCode.TWD,
  CurrencyCode.TZS,
  CurrencyCode.UAH,
  CurrencyCode.UGX,
  CurrencyCode.UZS,
  CurrencyCode.VND,
  CurrencyCode.VUV,
  CurrencyCode.WST,
  CurrencyCode.XAF,
  CurrencyCode.XCD,
  CurrencyCode.YER,
  CurrencyCode.ZAR,
  CurrencyCode.ZMW,
]

export const isCurrencyZeroDecimal = (currency: CurrencyCode) => {
  return zeroDecimalCurrencies.includes(currency)
}

export const isCurrencySupported = (currency: CurrencyCode) => {
  return stripeSupportedCurrencies.includes(currency)
}

export const humanReadableCurrencyAmountToStripeCurrencyAmount = (
  currency: CurrencyCode,
  amount: number
) => {
  if (!isCurrencyZeroDecimal(currency)) {
    return amount * 100
  }
  return amount
}

export const stripeCurrencyAmountToHumanReadableCurrencyAmount = (
  currency: CurrencyCode,
  amount: number
) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  })
  if (!isCurrencyZeroDecimal(currency)) {
    return formatter.format(Number((amount / 100).toFixed(2)))
  }
  return formatter.format(amount)
}

export const stripe = (livemode: boolean) => {
  return new Stripe(
    livemode
      ? core.envVariable('STRIPE_SECRET_KEY')
      : core.envVariable('STRIPE_TEST_MODE_SECRET_KEY') || '',
    {
      apiVersion: '2024-09-30.acacia',
      httpClient: core.IS_TEST
        ? Stripe.createFetchHttpClient()
        : undefined,
    }
  )
}

export const createConnectedAccount = async ({
  countryCode,
  organization,
  livemode,
}: {
  organization: Organization.Record
  countryCode: CountryCode
  livemode: boolean
}) => {
  /**
   * US accounts need to accept the full terms of service, even for MoR arrangements
   * @see https://docs.stripe.com/connect/cross-border-payouts#restrictions-and-requirements
   */
  const useRecipientAgreement =
    organization.stripeConnectContractType ===
      StripeConnectContractType.MerchantOfRecord &&
    countryCode !== CountryCode.US
  const tos_acceptance: Stripe.AccountCreateParams.TosAcceptance =
    useRecipientAgreement
      ? {
          service_agreement: 'recipient',
        }
      : {}
  /**
   * Delay payouts for merchant of record connections
   */
  const settings: Stripe.AccountCreateParams.Settings =
    organization.stripeConnectContractType ===
    StripeConnectContractType.MerchantOfRecord
      ? {
          payouts: {
            schedule: {
              delay_days: 7,
              interval: 'weekly',
              weekly_anchor: 'monday',
            },
          },
        }
      : {}
  /**
   * For merchant of record connections, we can only request transfers.
   *
   * For platform connections, we must also request card_payments to allow us to make
   * destination on_behalf_of payments.
   */
  const capabilities: Stripe.AccountCreateParams.Capabilities =
    organization.stripeConnectContractType ===
    StripeConnectContractType.MerchantOfRecord
      ? {
          transfers: {
            requested: true,
          },
        }
      : {
          transfers: {
            requested: true,
          },
          card_payments: {
            requested: true,
          },
        }
  const stripeAccount = await stripe(livemode).accounts.create({
    country: countryCode,
    capabilities,
    settings,
    controller: {
      stripe_dashboard: {
        type: 'express',
      },
      fees: {
        payer: 'application',
      },
      losses: {
        payments: 'application',
      },
      requirement_collection: 'stripe',
    },
    tos_acceptance,
  })
  return stripeAccount
}
export const createAccountOnboardingLink = async (
  account: string,
  livemode: boolean
) => {
  const accountLink = await stripe(livemode).accountLinks.create({
    account,
    /**
     * This is the "it failed" url
     */
    refresh_url: core.safeUrl(
      `/onboarding`,
      core.envVariable('NEXT_PUBLIC_APP_URL')
    ),
    /**
     * This is the "it's done" url
     */
    return_url: core.safeUrl(
      `/onboarding`,
      core.envVariable('NEXT_PUBLIC_APP_URL')
    ),
    type: 'account_onboarding',
    /**
     * Pre-emptively collect future_requirements
     * so that we don't have to collect them later.
     * In the future we should collect currently_due requirements
     * and do eventually_due requirements later. But that will
     * require us to track onboarding state which we don't need right now.
     */
    collection_options: {
      fields: 'eventually_due',
    },
  })
  return accountLink.url
}

/**
 * Calculate the platform application fee for a given subtotal.
 * Should be used for destination charges on behalf of, where
 * we aren't going to be collecting + remitting taxes.
 *
 * This should never be the FINAL calculation, as we will need
 * to confirm the payment method first.
 * @param params
 * @returns
 */
export const calculatePlatformApplicationFee = (params: {
  organization: Organization.Record
  subtotal: number
  currency: CurrencyCode
}) => {
  const { organization, subtotal } = params
  const takeRate = parseFloat(organization.feePercentage) / 100
  return Math.ceil(subtotal * (takeRate + 0.029) + 50)
}

export const stripeIdFromObjectOrId = (
  objectOrId: { id: string } | string
): string => {
  if (typeof objectOrId === 'string') {
    return objectOrId
  }
  return objectOrId.id
}

export const getConnectedAccount = async (
  accountId: string,
  livemode: boolean
) => {
  return stripe(livemode).accounts.retrieve(accountId)
}

export const upsertStripeProductFromProduct = async (
  product: Product.Record,
  livemode: boolean
): Promise<Stripe.Product> => {
  const stripeProductData: Stripe.ProductCreateParams = {
    name: product.name,
    description: product.description || undefined,
    active: product.active,
    metadata: {
      productId: product.id,
      OrganizationId: product.OrganizationId,
    },
    // url: product.url,
    // images: product.imageUrls ? [product.imageUrls] : undefined,
    // tax_code: product.taxCode,
    // shippable: product.shippable,
    // statement_descriptor: product.statementDescriptor,
    // unit_label: product.unitLabel,
  }

  if (product.stripeProductId) {
    return stripe(livemode).products.update(
      product.stripeProductId,
      stripeProductData
    )
  } else {
    return stripe(livemode).products.create(stripeProductData)
  }
}

/**
 * Creates a Stripe price from a variant.
 * If the variant already has a Stripe price, it will:
 * - Create a new price with the same product and new unit_amount.
 * - Deactivate the old price.
 *
 * If the variant does not have a Stripe price, it will be created.
 * @param params
 * @returns
 */
export const upsertStripePriceFromVariant = async ({
  variant,
  productStripeId,
  oldVariant,
  livemode,
}: {
  variant: Variant.Record
  productStripeId: string
  oldVariant?: Variant.Record
  livemode: boolean
}): Promise<Stripe.Price> => {
  const maybeRecurringPriceData: Pick<
    Stripe.PriceCreateParams,
    'recurring'
  > =
    variant.priceType === PriceType.Subscription
      ? {
          recurring: {
            interval:
              variant.intervalUnit as Stripe.PriceCreateParams.Recurring['interval'],
            interval_count: variant.intervalCount || undefined,
          },
        }
      : {}
  const stripePriceData: Stripe.PriceCreateParams = {
    product: productStripeId,
    unit_amount: variant.unitPrice,
    currency: variant.currency,
    ...maybeRecurringPriceData,
    metadata: {
      variantId: variant.id,
      ProductId: variant.ProductId,
    },
  }
  if (oldVariant?.stripePriceId) {
    return stripe(livemode).prices.update(oldVariant.stripePriceId, {
      active: false,
    })
  }
  return stripe(livemode).prices.create(stripePriceData)
}

export const unitedStatesBankAccountPaymentMethodOptions = (
  bankPaymentOnly: Nullish<boolean>
): Pick<
  Stripe.PaymentIntentCreateParams | Stripe.SetupIntentCreateParams,
  'payment_method_types' | 'payment_method_options'
> => {
  const bankOnlyParams: Pick<
    Stripe.PaymentIntentCreateParams | Stripe.SetupIntentCreateParams,
    'payment_method_types' | 'payment_method_options'
  > = {
    payment_method_types: ['us_bank_account'],
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          permissions: ['payment_method'],
        },
      },
    },
  }
  return bankPaymentOnly ? bankOnlyParams : {}
}

/**
 * First attempts to get the payment intent from the live mode Stripe API.
 * If that fails, attempts to get the payment intent from the test mode Stripe API.
 * @param paymentIntentId
 * @param livemode
 * @returns
 */
export const getPaymentIntent = async (paymentIntentId: string) => {
  let paymentIntent: Stripe.PaymentIntent
  try {
    paymentIntent =
      await stripe(true).paymentIntents.retrieve(paymentIntentId)
  } catch (err) {
    paymentIntent =
      await stripe(false).paymentIntents.retrieve(paymentIntentId)
  }
  return paymentIntent
}

export type StripeIntent = Stripe.PaymentIntent | Stripe.SetupIntent

export enum IntentMetadataType {
  Invoice = 'invoice',
  PurchaseSession = 'purchaseSession',
  BillingRun = 'billingRun',
}

export const invoiceIntentMetadataSchema = z.object({
  invoiceId: z.string(),
  type: z.literal(IntentMetadataType.Invoice),
})

export const purchaseSessionIntentMetadataSchema = z.object({
  purchaseSessionId: z.string(),
  type: z.literal(IntentMetadataType.PurchaseSession),
})

export const billingRunIntentMetadataSchema = z.object({
  billingRunId: z.string(),
  type: z.literal(IntentMetadataType.BillingRun),
  billingPeriodId: z.string(),
})

export const stripeIntentMetadataSchema = z
  .discriminatedUnion('type', [
    invoiceIntentMetadataSchema,
    purchaseSessionIntentMetadataSchema,
    billingRunIntentMetadataSchema,
  ])
  .or(z.undefined())

export type InvoiceStripeIntentMetadata = z.infer<
  typeof invoiceIntentMetadataSchema
>

export type StripeIntentMetadata = z.infer<
  typeof stripeIntentMetadataSchema
>

export type PurchaseSessionStripeIntentMetadata = z.infer<
  typeof purchaseSessionIntentMetadataSchema
>

export type BillingRunStripeIntentMetadata = z.infer<
  typeof billingRunIntentMetadataSchema
>
const stripeConnectTransferDataForOrganization = ({
  organization,
  livemode,
}: {
  organization: Organization.Record
  livemode: boolean
}): {
  on_behalf_of: string | undefined
  transfer_data:
    | Stripe.PaymentIntentCreateParams['transfer_data']
    | undefined
} => {
  const stripeAccountId = organization.stripeAccountId
  let on_behalf_of: string | undefined
  let transfer_data:
    | Stripe.PaymentIntentCreateParams['transfer_data']
    | undefined
  if (livemode) {
    if (!stripeAccountId) {
      throw new Error(
        `Organization ${organization.id} does not have a Stripe account ID. Stripe account setup is a prerequisite for live mode payments.`
      )
    }
    if (!organization.payoutsEnabled) {
      throw new Error(
        `Organization ${organization.id} has payouts enabled but the invoice is not in livemode. This is a configuration error.`
      )
    }
    if (
      organization.stripeConnectContractType ===
      StripeConnectContractType.Platform
    ) {
      on_behalf_of = stripeAccountId
    }
    transfer_data = {
      destination: stripeAccountId,
    }
  }
  return {
    on_behalf_of,
    transfer_data,
  }
}
/**
 * We must always create, not update, a payment intent for an invoice.
 * This is because we cannot send new automatic_payment_methods in an update.
 * @param params
 * @returns
 */
export const createPaymentIntentForInvoice = async (params: {
  invoice: Invoice.Record
  invoiceLineItems: InvoiceLineItem.Record[]
  organization: Organization.Record
  stripeCustomerId: string
}) => {
  const {
    invoice,
    invoiceLineItems,
    organization,
    stripeCustomerId,
  } = params
  const amount = invoiceLineItems.reduce((acc, item) => {
    return acc + item.price * item.quantity
  }, 0)
  const livemode = invoice.livemode
  const { on_behalf_of, transfer_data } =
    stripeConnectTransferDataForOrganization({
      organization,
      livemode,
    })

  const achOnlyParams = unitedStatesBankAccountPaymentMethodOptions(
    invoice.bankPaymentOnly
  ) as Partial<Stripe.PaymentIntentCreateParams>

  const metadata: InvoiceStripeIntentMetadata = {
    invoiceId: invoice.id,
    type: IntentMetadataType.Invoice,
  }
  const applicationFeeAmount = livemode
    ? calculatePlatformApplicationFee({
        organization,
        subtotal: amount,
        currency: invoice.currency,
      })
    : undefined
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount,
    currency: invoice.currency,
    customer: stripeCustomerId,
    application_fee_amount: applicationFeeAmount,
    on_behalf_of,
    transfer_data,
    ...achOnlyParams,
    metadata,
  }

  return stripe(livemode).paymentIntents.create(paymentIntentParams)
}

export const selectInvoiceIdFromMetadata = (
  metadata: Stripe.Metadata
) => {
  return metadata.invoiceId
}

export const constructStripeWebhookEvent = (params: {
  payload: string | Buffer
  signature: string
  signingSecret: string
  livemode: boolean
}) => {
  return stripe(params.livemode).webhooks.constructEvent(
    params.payload,
    params.signature,
    params.signingSecret
  )
}

export const getStripeInvoiceAndInvoiceLineItemsForPaymentIntent =
  async (
    paymentIntent: Stripe.PaymentIntent,
    livemode: boolean
  ): Promise<{
    invoice: Stripe.Invoice | null
    lineItems: Stripe.InvoiceLineItem[] | null
  }> => {
    if (!paymentIntent.invoice) {
      return { invoice: null, lineItems: null }
    }

    const invoiceId = stripeIdFromObjectOrId(paymentIntent.invoice)
    const invoice = await stripe(livemode).invoices.retrieve(
      invoiceId,
      {
        expand: ['lines'],
      }
    )

    return {
      invoice,
      lineItems: invoice.lines.data,
    }
  }

export const updateStripeProductFromProduct = async (
  product: Product.Record,
  livemode: boolean
): Promise<Stripe.Product> => {
  if (!product.stripeProductId) {
    throw new Error('Product does not have a Stripe product ID')
  }

  const stripeProductData: Stripe.ProductUpdateParams = {
    name: product.name,
    images: product.imageURL ? [product.imageURL] : undefined,
    // Add any other fields you want to update
  }

  return stripe(livemode).products.update(
    product.stripeProductId,
    stripeProductData
  )
}

export const createStripeCustomer = async (params: {
  email: string
  name: string
  livemode: boolean
}) => {
  return stripe(params.livemode).customers.create({
    email: params.email,
    name: params.name,
  })
}

export const createStripeTaxCalculationByVariant = async ({
  variant,
  billingAddress,
  discountInclusiveAmount,
  product,
  livemode,
}: {
  variant: Variant.Record
  billingAddress: CustomerBillingAddress
  discountInclusiveAmount: number
  product: Product.Record
  livemode: boolean
}) => {
  const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = [
    {
      quantity: 1,
      amount: discountInclusiveAmount,
      reference: `${variant.id}`,
      tax_code: DIGITAL_TAX_CODE,
    },
  ]

  return stripe(livemode).tax.calculations.create({
    customer_details: {
      address: billingAddress.address,
      address_source: 'billing',
    },
    currency: variant.currency,
    line_items: lineItems,
  })
}

export const createStripeTaxCalculationByPurchase = async ({
  purchase,
  billingAddress,
  discountInclusiveAmount,
  variant,
  livemode,
}: {
  purchase: Purchase.Record
  billingAddress: CustomerBillingAddress
  discountInclusiveAmount: number
  variant: Variant.Record
  product: Product.Record
  livemode: boolean
}) => {
  const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = [
    {
      quantity: 1,
      amount: discountInclusiveAmount,
      reference: `${purchase.id}`,
      tax_code: DIGITAL_TAX_CODE,
    },
  ]
  return stripe(livemode).tax.calculations.create({
    customer_details: {
      address: billingAddress.address,
      address_source: 'billing',
    },
    currency: variant.currency,
    line_items: lineItems,
  })
}

export const getStripeTaxCalculation = async (
  id: string,
  livemode: boolean
) => {
  return stripe(livemode).tax.calculations.retrieve(id)
}

export const getConnectedAccountOnboardingStatus = async (
  accountId: string,
  livemode: boolean
) => {
  const account = await stripe(livemode).accounts.retrieve(accountId)

  const requirements = account.requirements
  const remainingFields = requirements?.currently_due || []
  const pastDueFields = requirements?.past_due || []
  const pendingVerificationFields =
    requirements?.pending_verification || []
  const eventuallyDueFields = requirements?.eventually_due || []
  const isFullyOnboarded =
    remainingFields.length === 0 &&
    pastDueFields.length === 0 &&
    pendingVerificationFields.length === 0 &&
    eventuallyDueFields.length === 0
  const payoutsEnabled = account.capabilities?.transfers === 'active'
  let onboardingStatus = BusinessOnboardingStatus.FullyOnboarded
  if (!isFullyOnboarded) {
    onboardingStatus = BusinessOnboardingStatus.PartiallyOnboarded
  } else if (!payoutsEnabled) {
    onboardingStatus = BusinessOnboardingStatus.Unauthorized
  }
  return {
    requirements,
    eventuallyDueFields,
    onboardingStatus,
    remainingFields,
    pastDueFields,
    pendingVerificationFields,
    payoutsEnabled,
  }
}

export type StripeAccountOnboardingStatus = Awaited<
  ReturnType<typeof getConnectedAccountOnboardingStatus>
> | null

export const createPaymentIntentForPurchaseSession = async (params: {
  variant: Variant.Record
  organization: Organization.Record
  product: Product.Record
  purchase?: Purchase.Record
  purchaseSession: PurchaseSession.Record
  feeCalculation?: FeeCalculation.Record
}) => {
  const { variant, organization, purchaseSession, feeCalculation } =
    params
  const livemode = purchaseSession.livemode
  const { on_behalf_of, transfer_data } =
    stripeConnectTransferDataForOrganization({
      organization,
      livemode,
    })
  const metadata: PurchaseSessionStripeIntentMetadata = {
    purchaseSessionId: purchaseSession.id,
    type: IntentMetadataType.PurchaseSession,
  }
  const totalDue = feeCalculation
    ? await calculateTotalDueAmount(feeCalculation)
    : variant.unitPrice * purchaseSession.quantity
  const totalFeeAmount = feeCalculation
    ? calculateTotalFeeAmount(feeCalculation)
    : calculatePlatformApplicationFee({
        organization,
        subtotal: variant.unitPrice,
        currency: variant.currency,
      })

  return stripe(livemode).paymentIntents.create({
    amount: totalDue,
    currency: variant.currency,
    application_fee_amount: livemode ? totalFeeAmount : undefined,
    on_behalf_of,
    transfer_data,
    metadata,
  })
}

export const getLatestChargeForPaymentIntent = async (
  paymentIntent: Stripe.PaymentIntent,
  livemode: boolean
): Promise<Stripe.Charge | null> => {
  const { latest_charge } = paymentIntent
  if (!latest_charge) {
    return null
  }
  if (typeof latest_charge === 'string') {
    return stripe(livemode).charges.retrieve(latest_charge)
  }
  return latest_charge
}

export const dateFromStripeTimestamp = (timestamp: number) => {
  return new Date(timestamp * 1000)
}

export const paymentMethodFromStripeCharge = (
  charge: Stripe.Charge
) => {
  const paymentMethodDetails = charge.payment_method_details
  if (!paymentMethodDetails) {
    throw new Error('No payment method details found for charge')
  }
  switch (paymentMethodDetails.type) {
    case 'card':
      return PaymentMethodType.Card
    case 'card_present':
      return PaymentMethodType.Card
    case 'ach_debit':
      return PaymentMethodType.USBankAccount
    case 'sepa_debit':
      return PaymentMethodType.SEPADebit
    default:
      throw new Error(
        `Unknown payment method type: ${paymentMethodDetails.type}`
      )
  }
}

/**
 * First attempts to get the setup intent from the live mode Stripe API.
 * If that fails, attempts to get the setup intent from the test mode Stripe API.
 * @param setupIntentId
 * @returns
 */
export const getSetupIntent = async (setupIntentId: string) => {
  let setupIntent: Stripe.SetupIntent
  try {
    setupIntent =
      await stripe(true).setupIntents.retrieve(setupIntentId)
  } catch (err) {
    setupIntent =
      await stripe(false).setupIntents.retrieve(setupIntentId)
  }
  return setupIntent
}

export const updateSetupIntent = async (
  setupIntentId: string,
  params: Pick<Stripe.SetupIntentUpdateParams, 'customer'>,
  livemode: boolean
) => {
  return stripe(livemode).setupIntents.update(setupIntentId, params)
}

export const updatePaymentIntent = async (
  paymentIntentId: string,
  params: Pick<
    Stripe.PaymentIntentUpdateParams,
    'customer' | 'amount' | 'metadata' | 'application_fee_amount'
  >,
  livemode: boolean
) => {
  const applicationFeeAmount = livemode
    ? params.application_fee_amount
    : undefined
  return stripe(livemode).paymentIntents.update(paymentIntentId, {
    ...params,
    application_fee_amount: applicationFeeAmount,
  })
}

export const getStripeCharge = async (chargeId: string) => {
  let charge: Stripe.Charge
  try {
    charge = await stripe(true).charges.retrieve(chargeId)
  } catch (err) {
    charge = await stripe(false).charges.retrieve(chargeId)
  }
  return charge
}

export const getStripeSubscription = async (
  subscriptionId: string,
  livemode: boolean
) => {
  return stripe(livemode).subscriptions.retrieve(subscriptionId)
}

const discountInsertToCouponParams = (
  discountInsert: Discount.ClientInsert
): Stripe.CouponCreateParams => {
  const duration =
    discountInsert.duration === DiscountDuration.NumberOfPayments
      ? 'repeating'
      : discountInsert.duration

  const amountOrPercentOff =
    discountInsert.amountType === DiscountAmountType.Percent
      ? { percent_off: discountInsert.amount }
      : { amount_off: discountInsert.amount }

  return {
    currency: CurrencyCode.USD,
    name: discountInsert.name,
    duration,
    ...amountOrPercentOff,
  }
}

export const createStripeCouponFromDiscountInsert = (
  discountInsert: Discount.ClientInsert,
  livemode: boolean
) => {
  return stripe(livemode).coupons.create(
    discountInsertToCouponParams(discountInsert)
  )
}

export const updateStripeCouponFromDiscountRecord = async (
  discount: Discount.Record,
  livemode: boolean
) => {
  if (!discount.stripeCouponId) {
    throw new Error('Discount does not have a Stripe coupon ID')
  }

  return stripe(livemode).coupons.update(
    discount.stripeCouponId,
    discountInsertToCouponParams(discount)
  )
}

export const refundPayment = async (
  stripePaymentIntentId: string,
  partialAmount: number | null,
  livemode: boolean
) => {
  const paymentIntent = await stripe(
    livemode
  ).paymentIntents.retrieve(stripePaymentIntentId)
  if (!paymentIntent.latest_charge) {
    throw new Error('No charge found for payment intent')
  }

  const chargeId =
    typeof paymentIntent.latest_charge === 'string'
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge.id

  return stripe(livemode).refunds.create({
    charge: chargeId,
    amount: partialAmount ?? undefined,
  })
}

export const listRefundsForCharge = async (
  chargeId: string,
  livemode: boolean
) => {
  return stripe(livemode).refunds.list({
    charge: chargeId,
  })
}

/**
 * To be used for subscription payments executed during the billing
 * run workflow
 * @param param0
 * @returns
 */
export const createAndConfirmPaymentIntent = async ({
  amount,
  currency,
  stripeCustomerId,
  stripePaymentMethodId,
  billingPeriodId,
  billingRunId,
  feeCalculation,
  organization,
  livemode,
}: {
  amount: number
  currency: CurrencyCode
  stripeCustomerId: string
  stripePaymentMethodId: string
  billingPeriodId: string
  billingRunId: string
  feeCalculation: FeeCalculation.Record
  organization: Organization.Record
  livemode: boolean
}) => {
  if (!organization.stripeAccountId && livemode) {
    throw new Error(
      `createAndConfirmPaymentIntent: Organization ${organization.id} does not have a Stripe account ID`
    )
  }
  const totalFeeAmount = calculateTotalFeeAmount(feeCalculation)
  const metadata: BillingRunStripeIntentMetadata = {
    billingRunId,
    type: IntentMetadataType.BillingRun,
    billingPeriodId,
  }

  const transferData = organization.stripeAccountId
    ? {
        destination: organization.stripeAccountId,
      }
    : undefined
  const onBehalfOf =
    livemode && organization.stripeAccountId
      ? organization.stripeAccountId
      : undefined
  const applicationFeeAmount = livemode ? totalFeeAmount : undefined
  return stripe(livemode).paymentIntents.create({
    amount,
    currency,
    customer: stripeCustomerId,
    payment_method: stripePaymentMethodId,
    confirm: true,
    off_session: true,
    application_fee_amount: applicationFeeAmount,
    metadata,
    on_behalf_of: onBehalfOf,
    transfer_data: transferData,
  })
}

export const getStripePaymentMethod = async (
  paymentMethodId: string,
  livemode: boolean
) => {
  return stripe(livemode).paymentMethods.retrieve(paymentMethodId)
}

export const getStripeProduct = async (
  productId: string,
  livemode: boolean
) => {
  return stripe(livemode).products.retrieve(productId)
}

export const getStripePrice = async (
  priceId: string,
  livemode: boolean
) => {
  return stripe(livemode).prices.retrieve(priceId)
}

/**
 * Used to create a setup intent for a purchase session,
 * meaning to create an intent for an anonymized customer to create a subscription.
 */
export const createSetupIntentForPurchaseSession = async (params: {
  variant: Variant.SubscriptionRecord
  product: Product.Record
  organization: Organization.Record
  purchaseSession: PurchaseSession.Record
  purchase?: Purchase.Record
}) => {
  const { purchaseSession } = params
  const metadata: PurchaseSessionStripeIntentMetadata = {
    purchaseSessionId: purchaseSession.id,
    type: IntentMetadataType.PurchaseSession,
  }
  const bankOnly = params.purchase?.bankPaymentOnly
  const bankOnlyParams = unitedStatesBankAccountPaymentMethodOptions(
    bankOnly
  ) as Partial<Stripe.SetupIntentCreateParams>
  const bankPaymentOnlyParams = bankOnly
    ? bankOnlyParams
    : {
        automatic_payment_methods: {
          enabled: true,
        },
      }

  return stripe(params.purchaseSession.livemode).setupIntents.create({
    ...bankPaymentOnlyParams,
    metadata,
  })
}

export const defaultCurrencyForCountry = (
  country: Country.Record
) => {
  switch (country.code) {
    case CountryCode.AE:
      return CurrencyCode.AED
    case CountryCode.AF:
      return CurrencyCode.AFN
    case CountryCode.AL:
      return CurrencyCode.ALL
    case CountryCode.AM:
      return CurrencyCode.AMD
    case CountryCode.AO:
      return CurrencyCode.AOA
    case CountryCode.AR:
      return CurrencyCode.ARS
    case CountryCode.AU:
      return CurrencyCode.AUD
    case CountryCode.AZ:
      return CurrencyCode.AZN
    case CountryCode.BA:
      return CurrencyCode.BAM
    case CountryCode.BB:
      return CurrencyCode.BBD
    case CountryCode.BD:
      return CurrencyCode.BDT
    case CountryCode.BG:
      return CurrencyCode.BGN
    case CountryCode.BI:
      return CurrencyCode.BIF
    case CountryCode.BM:
      return CurrencyCode.BMD
    case CountryCode.BN:
      return CurrencyCode.BND
    case CountryCode.BO:
      return CurrencyCode.BOB
    case CountryCode.BR:
      return CurrencyCode.BRL
    case CountryCode.BS:
      return CurrencyCode.BSD
    case CountryCode.BW:
      return CurrencyCode.BWP
    case CountryCode.BY:
      return CurrencyCode.BYN
    case CountryCode.BZ:
      return CurrencyCode.BZD
    case CountryCode.CA:
      return CurrencyCode.CAD
    case CountryCode.CD:
      return CurrencyCode.CDF
    case CountryCode.CH:
      return CurrencyCode.CHF
    case CountryCode.CL:
      return CurrencyCode.CLP
    case CountryCode.CN:
      return CurrencyCode.CNY
    case CountryCode.CO:
      return CurrencyCode.COP
    case CountryCode.CR:
      return CurrencyCode.CRC
    case CountryCode.CV:
      return CurrencyCode.CVE
    case CountryCode.CZ:
      return CurrencyCode.CZK
    case CountryCode.DJ:
      return CurrencyCode.DJF
    case CountryCode.DK:
      return CurrencyCode.DKK
    case CountryCode.DO:
      return CurrencyCode.DOP
    case CountryCode.DZ:
      return CurrencyCode.DZD
    case CountryCode.EG:
      return CurrencyCode.EGP
    case CountryCode.ET:
      return CurrencyCode.ETB
    /**
     * EU Countries
     */
    case CountryCode.AT:
    case CountryCode.BE:
    case CountryCode.DE:
    case CountryCode.EE:
    case CountryCode.ES:
    case CountryCode.FI:
    case CountryCode.FR:
    case CountryCode.GR:
    case CountryCode.IE:
    case CountryCode.IT:
    case CountryCode.LT:
    case CountryCode.LU:
    case CountryCode.LV:
    case CountryCode.MT:
    case CountryCode.NL:
    case CountryCode.PT:
    case CountryCode.SI:
    case CountryCode.SK:
      return CurrencyCode.EUR
    case CountryCode.FJ:
      return CurrencyCode.FJD
    case CountryCode.FK:
      return CurrencyCode.FKP
    case CountryCode.GB:
      return CurrencyCode.GBP
    case CountryCode.GE:
      return CurrencyCode.GEL
    case CountryCode.GI:
      return CurrencyCode.GIP
    case CountryCode.GM:
      return CurrencyCode.GMD
    case CountryCode.GN:
      return CurrencyCode.GNF
    case CountryCode.GT:
      return CurrencyCode.GTQ
    case CountryCode.GY:
      return CurrencyCode.GYD
    case CountryCode.HK:
      return CurrencyCode.HKD
    case CountryCode.HN:
      return CurrencyCode.HNL
    case CountryCode.HT:
      return CurrencyCode.HTG
    case CountryCode.HU:
      return CurrencyCode.HUF
    case CountryCode.ID:
      return CurrencyCode.IDR
    case CountryCode.IL:
      return CurrencyCode.ILS
    case CountryCode.IN:
      return CurrencyCode.INR
    case CountryCode.IS:
      return CurrencyCode.ISK
    case CountryCode.JM:
      return CurrencyCode.JMD
    case CountryCode.JP:
      return CurrencyCode.JPY
    case CountryCode.KE:
      return CurrencyCode.KES
    case CountryCode.KG:
      return CurrencyCode.KGS
    case CountryCode.KH:
      return CurrencyCode.KHR
    case CountryCode.KM:
      return CurrencyCode.KMF
    case CountryCode.KR:
      return CurrencyCode.KRW
    case CountryCode.KY:
      return CurrencyCode.KYD
    case CountryCode.KZ:
      return CurrencyCode.KZT
    case CountryCode.LA:
      return CurrencyCode.LAK
    case CountryCode.LB:
      return CurrencyCode.LBP
    case CountryCode.LK:
      return CurrencyCode.LKR
    case CountryCode.LR:
      return CurrencyCode.LRD
    case CountryCode.LS:
      return CurrencyCode.LSL
    case CountryCode.MA:
      return CurrencyCode.MAD
    case CountryCode.MD:
      return CurrencyCode.MDL
    case CountryCode.MG:
      return CurrencyCode.MGA
    case CountryCode.MK:
      return CurrencyCode.MKD
    case CountryCode.MM:
      return CurrencyCode.MMK
    case CountryCode.MN:
      return CurrencyCode.MNT
    case CountryCode.MO:
      return CurrencyCode.MOP
    case CountryCode.MU:
      return CurrencyCode.MUR
    case CountryCode.MV:
      return CurrencyCode.MVR
    case CountryCode.MW:
      return CurrencyCode.MWK
    case CountryCode.MX:
      return CurrencyCode.MXN
    case CountryCode.MY:
      return CurrencyCode.MYR
    case CountryCode.MZ:
      return CurrencyCode.MZN
    case CountryCode.NA:
      return CurrencyCode.NAD
    case CountryCode.NG:
      return CurrencyCode.NGN
    case CountryCode.NI:
      return CurrencyCode.NIO
    case CountryCode.NO:
      return CurrencyCode.NOK
    case CountryCode.NP:
      return CurrencyCode.NPR
    case CountryCode.NZ:
      return CurrencyCode.NZD
    case CountryCode.PA:
      return CurrencyCode.PAB
    case CountryCode.PE:
      return CurrencyCode.PEN
    case CountryCode.PG:
      return CurrencyCode.PGK
    case CountryCode.PH:
      return CurrencyCode.PHP
    case CountryCode.PK:
      return CurrencyCode.PKR
    case CountryCode.PL:
      return CurrencyCode.PLN
    case CountryCode.PY:
      return CurrencyCode.PYG
    case CountryCode.QA:
      return CurrencyCode.QAR
    case CountryCode.RO:
      return CurrencyCode.RON
    case CountryCode.RS:
      return CurrencyCode.RSD
    case CountryCode.RU:
      return CurrencyCode.RUB
    case CountryCode.RW:
      return CurrencyCode.RWF
    case CountryCode.SA:
      return CurrencyCode.SAR
    case CountryCode.SB:
      return CurrencyCode.SBD
    case CountryCode.SC:
      return CurrencyCode.SCR
    case CountryCode.SE:
      return CurrencyCode.SEK
    case CountryCode.SG:
      return CurrencyCode.SGD
    case CountryCode.SH:
      return CurrencyCode.SHP
    case CountryCode.SO:
      return CurrencyCode.SOS
    case CountryCode.SR:
      return CurrencyCode.SRD
    case CountryCode.ST:
      return CurrencyCode.STD
    case CountryCode.SZ:
      return CurrencyCode.SZL
    case CountryCode.TH:
      return CurrencyCode.THB
    case CountryCode.TJ:
      return CurrencyCode.TJS
    case CountryCode.TO:
      return CurrencyCode.TOP
    case CountryCode.TR:
      return CurrencyCode.TRY
    case CountryCode.TT:
      return CurrencyCode.TTD
    case CountryCode.TW:
      return CurrencyCode.TWD
    case CountryCode.TZ:
      return CurrencyCode.TZS
    case CountryCode.UA:
      return CurrencyCode.UAH
    case CountryCode.UG:
      return CurrencyCode.UGX
    case CountryCode.US:
      return CurrencyCode.USD
    case CountryCode.UY:
      return CurrencyCode.UYU
    case CountryCode.UZ:
      return CurrencyCode.UZS
    case CountryCode.VN:
      return CurrencyCode.VND
    case CountryCode.VU:
      return CurrencyCode.VUV
    case CountryCode.WS:
      return CurrencyCode.WST
    case CountryCode.YE:
      return CurrencyCode.YER
    case CountryCode.ZA:
      return CurrencyCode.ZAR
    case CountryCode.ZM:
      return CurrencyCode.ZMW
    default:
      return CurrencyCode.USD
  }
}
