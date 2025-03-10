import { CustomerProfile } from '@/db/schema/customerProfiles'
import { Organization } from '@/db/schema/organizations'
import { Product } from '@/db/schema/products'
import { Subscription } from '@/db/schema/subscriptions'
import { Variant } from '@/db/schema/variants'
import {
  insertSubscription,
  selectSubscriptions,
} from '@/db/tableMethods/subscriptionMethods'
import { IntervalUnit, SubscriptionStatus } from '@/types'
import { DbTransaction } from '@/db/types'
import { generateNextBillingPeriod } from './billingIntervalHelpers'
import { SubscriptionItem } from '@/db/schema/subscriptionItems'
import { bulkInsertSubscriptionItems } from '@/db/tableMethods/subscriptionItemMethods'
import { PaymentMethod } from '@/db/schema/paymentMethods'
import { createBillingPeriodAndItems } from './billingPeriodHelpers'
import { createBillingRun } from './billingRunHelpers'
import { attemptBillingRunTask } from '@/trigger/attempt-billing-run'

export interface CreateSubscriptionParams {
  organization: Organization.Record
  customerProfile: CustomerProfile.Record
  product: Product.Record
  variant: Variant.Record
  quantity: number
  livemode: boolean
  startDate: Date
  interval: IntervalUnit
  intervalCount: number
  trialEnd?: Date
  defaultPaymentMethod: PaymentMethod.Record
  backupPaymentMethod?: PaymentMethod.Record
}

export const insertSubscriptionAndItems = async (
  {
    organization,
    customerProfile,
    variant,
    quantity,
    livemode,
    startDate,
    interval,
    intervalCount,
    defaultPaymentMethod,
    backupPaymentMethod,
    trialEnd,
  }: CreateSubscriptionParams,
  transaction: DbTransaction
) => {
  const currentBillingPeriod = generateNextBillingPeriod({
    billingCycleAnchorDate: startDate,
    interval,
    intervalCount,
    lastBillingPeriodEndDate: null,
    trialEnd,
  })

  const subscriptionInsert: Subscription.Insert = {
    OrganizationId: organization.id,
    CustomerProfileId: customerProfile.id,
    VariantId: variant.id,
    livemode,
    status: SubscriptionStatus.Incomplete,
    defaultPaymentMethodId: defaultPaymentMethod.id,
    backupPaymentMethodId: backupPaymentMethod?.id ?? null,
    cancelScheduledAt: null,
    canceledAt: null,
    metadata: {},
    trialEnd: trialEnd ?? null,
    currentBillingPeriodStart: currentBillingPeriod.startDate,
    currentBillingPeriodEnd: currentBillingPeriod.endDate,
    billingCycleAnchorDate: startDate,
    interval,
    intervalCount,
  }

  const subscription = await insertSubscription(
    subscriptionInsert,
    transaction
  )

  const subscriptionItemInsert: SubscriptionItem.Insert = {
    name: `${variant.name} x ${quantity}`,
    SubscriptionId: subscription.id,
    VariantId: variant.id,
    addedDate: startDate,
    quantity,
    livemode,
    unitPrice: variant.unitPrice,
    metadata: null,
  }

  const subscriptionItems = await bulkInsertSubscriptionItems(
    [subscriptionItemInsert],
    transaction
  )

  return { subscription, subscriptionItems }
}

export const createSubscriptionWorkflow = async (
  params: CreateSubscriptionParams,
  transaction: DbTransaction
) => {
  const activeSubscriptionsForCustomerProfile =
    await selectSubscriptions(
      {
        CustomerProfileId: params.customerProfile.id,
        status: SubscriptionStatus.Active,
      },
      transaction
    )
  if (activeSubscriptionsForCustomerProfile.length > 0) {
    throw new Error(
      'Customer profile already has an active subscription'
    )
  }
  const { subscription, subscriptionItems } =
    await insertSubscriptionAndItems(params, transaction)

  const { billingPeriod, billingPeriodItems } =
    await createBillingPeriodAndItems(
      {
        subscription,
        subscriptionItems,
        trialPeriod: !!subscription.trialEnd,
        isInitialBillingPeriod: true,
      },
      transaction
    )
  /**
   * create a billing run, set to to execute
   */
  const billingRun = await createBillingRun(
    {
      billingPeriod,
      PaymentMethodId: params.defaultPaymentMethod.id,
      scheduledFor: subscription.currentBillingPeriodStart,
    },
    transaction
  )

  await attemptBillingRunTask.trigger({
    billingRun,
  })

  return {
    subscription,
    subscriptionItems,
    billingPeriod,
    billingPeriodItems,
    billingRun,
  }
}
