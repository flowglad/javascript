import {
  subscriptionWithoutTrialDummyPurchase,
  subscriptionWithTrialDummyPurchase,
} from '@/stubs/purchaseStubs'
import { dummyProduct } from '@/stubs/productStubs'
import { dummyOrganization } from '@/stubs/organizationStubs'
import { subscriptionDummyVariant } from '@/stubs/variantStubs'
import {
  CurrencyCode,
  IntervalUnit,
  PriceType,
  PurchaseSessionStatus,
} from '@/types'
import { CheckoutPageContextValues } from '@/app/contexts/checkoutPageContext'
import { PurchaseSession } from '@/db/schema/purchaseSessions'

const subscriptionDetails = {
  trialPeriodDays: 30,
  intervalUnit: IntervalUnit.Month,
  intervalCount: 1,
  pricePerBillingCycle: 100,
  currency: CurrencyCode.USD,
}

const purchaseSession: PurchaseSession.Record = {
  id: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  VariantId: '1',
  status: PurchaseSessionStatus.Pending,
  OrganizationId: '1',
  customerName: 'Test Customer',
  customerEmail: 'test@test.com',
  stripeSetupIntentId: null,
  stripePaymentIntentId: null,
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  billingAddress: null,
  PurchaseId: null,
  DiscountId: null,
  paymentMethodType: null,
  livemode: false,
  CustomerProfileId: null,
  quantity: 1,
  successUrl: null,
  cancelUrl: null,
}

const clearDiscountCode: CheckoutPageContextValues['clearDiscountCode'] =
  async () => false

const functionStubs = {
  editPurchaseSession: async () =>
    Promise.resolve({ purchaseSession }),
  attemptDiscountCode: async () => ({ isValid: true }),
  clearDiscountCode,
  feeCalculation: null,
}

export const subscriptionCheckoutPageContextValuesWithTrial: CheckoutPageContextValues =
  {
    product: dummyProduct,
    purchase: subscriptionWithTrialDummyPurchase,
    variant: subscriptionDummyVariant,
    sellerOrganization: dummyOrganization,
    priceType: PriceType.Subscription,
    redirectUrl: 'https://google.com',
    clientSecret: '123',
    purchaseSession,
    subscriptionDetails,
    ...functionStubs,
  }

export const subscriptionCheckoutPageContextValuesWithoutTrial: CheckoutPageContextValues =
  {
    product: dummyProduct,
    purchase: subscriptionWithoutTrialDummyPurchase,
    variant: subscriptionDummyVariant,
    sellerOrganization: dummyOrganization,
    priceType: PriceType.Subscription,
    redirectUrl: 'https://google.com',
    clientSecret: '123',
    purchaseSession,
    subscriptionDetails,
    ...functionStubs,
  }
