import {
  DbTransaction,
  FeeCalculationType,
  PurchaseSessionStatus,
  PurchaseStatus,
} from '@/types'
import {
  createStripeCustomer,
  getStripeCharge,
  stripeIdFromObjectOrId,
  updatePaymentIntent,
} from '@/utils/stripe'
import { Purchase } from '@/db/schema/purchases'
import {
  selectPurchaseById,
  updatePurchase,
  upsertPurchaseById,
} from '@/db/tableMethods/purchaseMethods'
import {
  EditPurchaseSessionInput,
  feeReadyPurchaseSessionSelectSchema,
  PurchaseSession,
} from '@/db/schema/purchaseSessions'
import {
  selectPurchaseSessionById,
  updatePurchaseSession,
} from '@/db/tableMethods/purchaseSessionMethods'
import { selectVariantProductAndOrganizationByVariantWhere } from '@/db/tableMethods/variantMethods'
import { selectDiscountById } from '@/db/tableMethods/discountMethods'
import {
  FeeCalculation,
  purchaseSessionFeeCalculationParametersChanged,
} from '@/db/schema/feeCalculations'
import {
  calculateTotalFeeAmount,
  createPurchaseSessionFeeCalculation,
} from './fees'
import { calculateTotalDueAmount } from './fees'
import { upsertDiscountRedemptionForPurchaseAndDiscount } from '@/db/tableMethods/discountRedemptionMethods'
import {
  selectLatestFeeCalculation,
  updateFeeCalculation,
} from '@/db/tableMethods/feeCalculationMethods'
import { selectCountryById } from '@/db/tableMethods/countryMethods'
import {
  selectCustomerProfiles,
  upsertCustomerProfileByCustomerIdAndOrganizationId,
} from '@/db/tableMethods/customerProfileMethods'
import { selectCustomerProfileById } from '@/db/tableMethods/customerProfileMethods'
import { CustomerProfile } from '@/db/schema/customerProfiles'
import {
  selectCustomers,
  upsertCustomerByEmail,
} from '@/db/tableMethods/customerMethods'
import { core } from '../core'
import { projectVariantFieldsOntoPurchaseFields } from '../purchaseHelpers'
import { Discount } from '@/db/schema/discounts'
import { DiscountRedemption } from '@/db/schema/discountRedemptions'
import { createInitialInvoiceForPurchase } from '../bookkeeping'
import { Invoice } from '@/db/schema/invoices'
import Stripe from 'stripe'

export const createFeeCalculationForPurchaseSession = async (
  purchaseSession: PurchaseSession.FeeReadyRecord,
  transaction: DbTransaction
): Promise<FeeCalculation.Record> => {
  const discount = purchaseSession.DiscountId
    ? await selectDiscountById(
        purchaseSession.DiscountId,
        transaction
      )
    : undefined
  const [{ variant, product, organization }] =
    await selectVariantProductAndOrganizationByVariantWhere(
      { id: purchaseSession.VariantId },
      transaction
    )
  const organizationCountryId = organization.CountryId
  if (!organizationCountryId) {
    throw new Error('Organization country id is required')
  }
  const organizationCountry = await selectCountryById(
    organizationCountryId,
    transaction
  )
  return createPurchaseSessionFeeCalculation(
    {
      organization,
      product,
      variant,
      discount,
      PurchaseSessionId: purchaseSession.id,
      billingAddress: purchaseSession.billingAddress,
      paymentMethodType: purchaseSession.paymentMethodType,
      organizationCountry,
    },
    transaction
  )
}

export const editPurchaseSession = async (
  input: EditPurchaseSessionInput,
  transaction: DbTransaction
) => {
  const { purchaseSession, purchaseId } = input
  const previousPurchaseSession = await selectPurchaseSessionById(
    purchaseSession.id,
    transaction
  )

  if (!previousPurchaseSession) {
    throw new Error('Purchase session not found')
  }

  if (previousPurchaseSession.status !== PurchaseSessionStatus.Open) {
    throw new Error('Purchase session is not open')
  }
  /**
   * If the tax calculation has changed,
   * update the purchase session with the new tax calculation.
   */
  const updatedPurchaseSession = await updatePurchaseSession(
    purchaseSession,
    transaction
  )
  let feeCalculation: FeeCalculation.Record | null = null
  const result = feeReadyPurchaseSessionSelectSchema.safeParse(
    updatedPurchaseSession
  )

  const isFeeReady = result.success
  if (isFeeReady) {
    const feeReadySession = result.data
    const feeParametersChanged =
      purchaseSessionFeeCalculationParametersChanged({
        previousSession: previousPurchaseSession,
        currentSession: feeReadySession,
      })
    if (feeParametersChanged) {
      feeCalculation = await createFeeCalculationForPurchaseSession(
        feeReadySession,
        transaction
      )
    } else {
      feeCalculation = await selectLatestFeeCalculation(
        {
          PurchaseSessionId: purchaseSession.id,
        },
        transaction
      )
    }
  } else {
  }
  let purchase: Purchase.Record | null = null
  if (purchaseId) {
    purchase = await selectPurchaseById(purchaseId, transaction)
    if (!purchase) {
      throw new Error('Purchase not found')
    }
    if (purchase.status !== PurchaseStatus.Pending) {
      throw new Error('Purchase is not pending')
    }
    await updatePurchase(
      {
        id: purchase.id,
        billingAddress: purchaseSession.billingAddress,
      },
      transaction
    )
  }

  const stripePaymentIntentId =
    updatedPurchaseSession.stripePaymentIntentId
  /**
   * Only update the payment intent if the tax calculation has changed.
   * there's no need to update the payment intent before that.
   */
  if (stripePaymentIntentId && feeCalculation) {
    const totalDue = await calculateTotalDueAmount(feeCalculation)
    if (totalDue > 0) {
      const totalFeeAmount = calculateTotalFeeAmount(feeCalculation)
      await updatePaymentIntent(
        stripePaymentIntentId,
        {
          amount: totalDue,
          application_fee_amount: feeCalculation.livemode
            ? totalFeeAmount
            : undefined,
        },
        feeCalculation.livemode
      )
    }
  }
  return {
    purchaseSession: updatedPurchaseSession,
  }
}

export const processPurchaseBookkeepingForPurchaseSession = async (
  {
    purchaseSession,
    stripeCustomerId: providedStripeCustomerId,
  }: {
    purchaseSession: PurchaseSession.Record
    stripeCustomerId: string | null
  },
  transaction: DbTransaction
) => {
  const [{ variant, product }] =
    await selectVariantProductAndOrganizationByVariantWhere(
      { id: purchaseSession.VariantId },
      transaction
    )
  let customerProfile: CustomerProfile.Record | null = null
  let purchase: Purchase.Record | null = null
  if (purchaseSession.PurchaseId) {
    purchase = await selectPurchaseById(
      purchaseSession.PurchaseId,
      transaction
    )
    customerProfile = await selectCustomerProfileById(
      purchase.CustomerProfileId!,
      transaction
    )
  } else {
    // First try to find existing customer profile
    const result = await selectCustomerProfiles(
      {
        email: purchaseSession.customerEmail!,
        OrganizationId: product.OrganizationId,
      },
      transaction
    )
    customerProfile = result[0]
  }
  if (!customerProfile) {
    // First find if customer exists
    let [customer] = await selectCustomers(
      { email: purchaseSession.customerEmail! },
      transaction
    )

    // If customer exists, use that customer's ID
    if (!customer) {
      const customerUpsertResult = await upsertCustomerByEmail(
        {
          email: purchaseSession.customerEmail!,
          name:
            purchaseSession.customerName! ??
            `Customer ${new Date().getTime()}`,
          billingAddress: purchaseSession.billingAddress,
          livemode: purchaseSession.livemode,
        },
        transaction
      )
      customer = customerUpsertResult[0]
    }
    const customerProfileUpsert =
      await upsertCustomerProfileByCustomerIdAndOrganizationId(
        {
          CustomerId: customer.id,
          email: purchaseSession.customerEmail!,
          name: purchaseSession.customerName!,
          OrganizationId: product.OrganizationId,
          billingAddress: purchaseSession.billingAddress,
          externalId: core.nanoid(),
          livemode: purchaseSession.livemode,
        },
        transaction
      )
    customerProfile = customerProfileUpsert[0]
    let stripeCustomerId: string | null = providedStripeCustomerId
    if (!stripeCustomerId) {
      stripeCustomerId = customerProfile.stripeCustomerId
    }
    // If no existing customer, create new customer and profile
    if (!stripeCustomerId) {
      const stripeCustomer = await createStripeCustomer({
        email: purchaseSession.customerEmail!,
        name: purchaseSession.customerName!,
        livemode: purchaseSession.livemode,
      })
      stripeCustomerId = stripeCustomer.id
    }
    const upsertResult =
      await upsertCustomerProfileByCustomerIdAndOrganizationId(
        {
          CustomerId: customer.id,
          email: purchaseSession.customerEmail!,
          name: purchaseSession.customerName!,
          OrganizationId: product.OrganizationId,
          billingAddress: purchaseSession.billingAddress,
          stripeCustomerId,
          externalId: core.nanoid(),
          livemode: purchaseSession.livemode,
        },
        transaction
      )
    customerProfile = upsertResult[0]
  }
  if (!purchase) {
    const purchaseVariantFields =
      projectVariantFieldsOntoPurchaseFields(variant)
    const purchaseInsert = {
      ...purchaseVariantFields,
      name: product.name,
      OrganizationId: product.OrganizationId,
      CustomerProfileId: customerProfile.id,
      VariantId: variant.id,
      quantity: 1,
      billingAddress: purchaseSession.billingAddress,
      livemode: purchaseSession.livemode,
    } as Purchase.Insert

    const results = await upsertPurchaseById(
      purchaseInsert,
      transaction
    )
    purchase = results[0]
  }
  let discount: Discount.Record | null = null
  let discountRedemption: DiscountRedemption.Record | null = null
  let feeCalculation: FeeCalculation.Record | null = null
  feeCalculation = await selectLatestFeeCalculation(
    {
      PurchaseSessionId: purchaseSession.id,
    },
    transaction
  )
  if (!feeCalculation) {
    throw new Error(
      `No fee calculation found for purchase session ${purchaseSession.id}`
    )
  }
  feeCalculation = await updateFeeCalculation(
    {
      id: feeCalculation.id,
      PurchaseId: purchase.id,
      type: FeeCalculationType.PurchaseSessionPayment,
      VariantId: variant.id,
      BillingPeriodId: null,
    },
    transaction
  )
  if (feeCalculation.DiscountId) {
    discount = await selectDiscountById(
      feeCalculation.DiscountId,
      transaction
    )
    await upsertDiscountRedemptionForPurchaseAndDiscount(
      purchase,
      discount,
      transaction
    )
  }
  return {
    purchase,
    customerProfile,
    discount,
    feeCalculation,
    discountRedemption,
  }
}

export const processStripeChargeForPurchaseSession = async (
  {
    purchaseSessionId,
    charge,
  }: {
    purchaseSessionId: string
    charge: Stripe.Charge
  },
  transaction: DbTransaction
) => {
  let purchase: Purchase.Record | null = null
  let purchaseSession = await selectPurchaseSessionById(
    purchaseSessionId,
    transaction
  )
  let invoice: Invoice.Record | null = null
  if (!purchaseSession) {
    throw new Error('No purchase session found for payment intent')
  }
  let purchaseSessionStatus = PurchaseSessionStatus.Succeeded
  if (charge.status === 'pending') {
    purchaseSessionStatus = PurchaseSessionStatus.Pending
  } else if (charge.status !== 'succeeded') {
    purchaseSessionStatus = PurchaseSessionStatus.Failed
  }
  if (
    purchaseSessionStatus === PurchaseSessionStatus.Succeeded ||
    purchaseSessionStatus === PurchaseSessionStatus.Pending
  ) {
    const purchaseBookkeepingResult =
      await processPurchaseBookkeepingForPurchaseSession(
        {
          purchaseSession,
          stripeCustomerId: charge.customer
            ? stripeIdFromObjectOrId(charge.customer)
            : null,
        },
        transaction
      )
    purchase = purchaseBookkeepingResult.purchase
    const invoiceForPurchase = await createInitialInvoiceForPurchase(
      {
        purchase,
      },
      transaction
    )
    invoice = invoiceForPurchase.invoice
  }
  purchaseSession = await updatePurchaseSession(
    {
      id: purchaseSession.id,
      status: purchaseSessionStatus,
      customerName: charge.billing_details?.name,
      customerEmail: charge.billing_details?.email,
      PurchaseId: purchase?.id,
    },
    transaction
  )
  return { purchase, invoice, purchaseSession }
}
