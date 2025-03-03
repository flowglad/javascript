import db from '@/db/client'
import { adminTransaction } from '@/db/databaseMethods'
import { countries } from '@/db/schema/countries'
import { organizations } from '@/db/schema/organizations'
import { insertCustomer } from '@/db/tableMethods/customerMethods'
import { insertCustomerProfile } from '@/db/tableMethods/customerProfileMethods'
import { insertOrganization } from '@/db/tableMethods/organizationMethods'
import { insertPaymentMethod } from '@/db/tableMethods/paymentMethodMethods'
import { insertProduct } from '@/db/tableMethods/productMethods'
import {
  insertSubscription,
  selectSubscriptionById,
} from '@/db/tableMethods/subscriptionMethods'
import {
  insertVariant,
  selectVariantById,
} from '@/db/tableMethods/variantMethods'
import { insertBillingPeriod } from '@/db/tableMethods/billingPeriodMethods'
import { insertBillingRun } from '@/db/tableMethods/billingRunMethods'
import { insertBillingPeriodItem } from '@/db/tableMethods/billingPeriodItemMethods'
import { insertInvoice } from '@/db/tableMethods/invoiceMethods'
import { selectBillingPeriodById } from '@/db/tableMethods/billingPeriodMethods'
import {
  PriceType,
  IntervalUnit,
  PaymentMethodType,
  SubscriptionStatus,
  BillingPeriodStatus,
  BillingRunStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentStatus,
  CurrencyCode,
  CountryCode,
} from '@/types'
import { core } from '@/utils/core'
import { sql } from 'drizzle-orm'
import { selectCountries } from '@/db/tableMethods/countryMethods'
import { insertPayment } from '@/db/tableMethods/paymentMethods'
import { BillingRun } from '@/db/schema/billingRuns'
import { insertUser } from '@/db/tableMethods/userMethods'
import { insertMembership } from '@/db/tableMethods/membershipMethods'
import { insertSubscriptionItem } from '@/db/tableMethods/subscriptionItemMethods'
import { BillingPeriod } from '@/db/schema/billingPeriods'
import { insertPurchase } from '@/db/tableMethods/purchaseMethods'
import { Variant } from '@/db/schema/variants'
import { Purchase } from '@/db/schema/purchases'
import { projectVariantFieldsOntoPurchaseFields } from '@/utils/purchaseHelpers'
import { insertInvoiceLineItem } from '@/db/tableMethods/invoiceLineItemMethods'
import { Payment } from '@/db/schema/payments'
const insertCountries = async () => {
  await db
    .insert(countries)
    .values([
      {
        id: core.nanoid(),
        name: 'United States',
        code: 'US',
      },
    ])
    .onConflictDoNothing()
}

export const seedDatabase = async () => {
  //   await migrateDb()
  await insertCountries()
}

export const dropDatabase = async () => {
  console.log('drop database....')
  await db.delete(countries)
}

export const setupOrg = async () => {
  await insertCountries()
  return adminTransaction(async ({ transaction }) => {
    const [country] = await selectCountries({}, transaction)
    const organization = await insertOrganization(
      {
        name: `Flowglad Test ${core.nanoid()}`,
        CountryId: country.id,
        defaultCurrency: CurrencyCode.USD,
      },
      transaction
    )
    const product = await insertProduct(
      {
        name: 'Flowglad Test Product',
        OrganizationId: organization.id,
        livemode: true,
        description: 'Flowglad Live Product',
        imageURL: 'https://flowglad.com/logo.png',
        stripeProductId: `prod_${core.nanoid()}`,
        active: true,
        displayFeatures: [],
      },
      transaction
    )
    const variant = await insertVariant(
      {
        ProductId: product.id,
        name: 'Flowglad Test Product Variant',
        priceType: PriceType.Subscription,
        intervalUnit: IntervalUnit.Month,
        intervalCount: 1,
        livemode: true,
        active: true,
        isDefault: true,
        unitPrice: 1000,
        setupFeeAmount: 0,
        trialPeriodDays: 0,
        stripePriceId: `price_${core.nanoid()}`,
        currency: CurrencyCode.USD,
      },
      transaction
    )
    return { organization, product, variant }
  })
}

export const setupPaymentMethod = async (params: {
  OrganizationId: string
  CustomerProfileId: string
  livemode?: boolean
  paymentMethodData?: Record<string, any>
  type?: PaymentMethodType
}) => {
  return adminTransaction(async ({ transaction }) => {
    return insertPaymentMethod(
      {
        CustomerProfileId: params.CustomerProfileId,
        type: params.type ?? PaymentMethodType.Card,
        livemode: params.livemode ?? true,
        billingDetails: {
          name: 'Test',
          email: 'test@test.com',
          address: {
            name: 'Test',
            address: {
              line1: '123 Test St',
              line2: 'Apt 1',
              country: 'US',
              city: 'Test City',
              state: 'Test State',
              postal_code: '12345',
            },
          },
        },
        paymentMethodData: params.paymentMethodData ?? {},
        metadata: {},
        stripePaymentMethodId: `pm_${core.nanoid()}`,
      },
      transaction
    )
  })
}

export const setupCustomerProfile = async (params: {
  OrganizationId: string
  livemode?: boolean
}) => {
  return adminTransaction(async ({ transaction }) => {
    const email = `test+${core.nanoid()}@test.com`
    const customer = await insertCustomer(
      {
        name: 'Test',
        email,
        livemode: params.livemode ?? true,
      },
      transaction
    )
    return insertCustomerProfile(
      {
        OrganizationId: params.OrganizationId,
        CustomerId: customer.id,
        email,
        externalId: core.nanoid(),
        livemode: params.livemode ?? true,
      },
      transaction
    )
  })
}

export const teardownOrg = async ({
  OrganizationId,
}: {
  OrganizationId: string
}) => {
  await sql`DELETE FROM "BillingPeriodItems" WHERE BillingPeriodId IN (SELECT id FROM "BillingPeriods" WHERE SubscriptionId IN (SELECT id FROM "Subscriptions" WHERE OrganizationId = ${OrganizationId}))`
  await sql`DELETE FROM "BillingRuns" WHERE BillingPeriodId IN (SELECT id FROM "BillingPeriods" WHERE SubscriptionId IN (SELECT id FROM "Subscriptions" WHERE OrganizationId = ${OrganizationId}))`
  await sql`DELETE FROM "Invoices" WHERE BillingPeriodId IN (SELECT id FROM "BillingPeriods" WHERE SubscriptionId IN (SELECT id FROM "Subscriptions" WHERE OrganizationId = ${OrganizationId}))`
  await sql`DELETE FROM "SubscriptionItems" WHERE SubscriptionId IN (SELECT id FROM "Subscriptions" WHERE OrganizationId = ${OrganizationId})`
  await sql`DELETE FROM "BillingPeriods" WHERE SubscriptionId IN (SELECT id FROM "Subscriptions" WHERE OrganizationId = ${OrganizationId})`
  await sql`DELETE FROM "Subscriptions" WHERE OrganizationId = ${OrganizationId}`
  await sql`DELETE FROM "CustomerProfiles" WHERE OrganizationId = ${OrganizationId}`
  await sql`DELETE FROM "Variants" WHERE OrganizationId = ${OrganizationId}`
  await sql`DELETE FROM "Products" WHERE OrganizationId = ${OrganizationId}`
  await sql`DELETE FROM "Organizations" WHERE id = ${OrganizationId} CASCADE`
}

export const setupSubscription = async (params: {
  OrganizationId: string
  CustomerProfileId: string
  PaymentMethodId: string
  VariantId: string
  interval?: IntervalUnit
  intervalCount?: number
  livemode?: boolean
  currentBillingPeriodEnd?: Date
  currentBillingPeriodStart?: Date
  status?: SubscriptionStatus
  trialEnd?: Date
}) => {
  return adminTransaction(async ({ transaction }) => {
    return insertSubscription(
      {
        OrganizationId: params.OrganizationId,
        CustomerProfileId: params.CustomerProfileId,
        defaultPaymentMethodId: params.PaymentMethodId,
        status: params.status ?? SubscriptionStatus.Active,
        livemode: params.livemode ?? true,
        billingCycleAnchorDate: new Date(),
        currentBillingPeriodEnd:
          params.currentBillingPeriodEnd ??
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentBillingPeriodStart:
          params.currentBillingPeriodStart ?? new Date(),
        canceledAt: null,
        cancelScheduledAt: null,
        trialEnd: params.trialEnd ?? null,
        backupPaymentMethodId: null,
        VariantId: params.VariantId,
        interval: params.interval ?? IntervalUnit.Month,
        intervalCount: params.intervalCount ?? 1,
        metadata: {},
      },
      transaction
    )
  })
}

export const setupBillingPeriod = async ({
  SubscriptionId,
  startDate,
  endDate,
  status = BillingPeriodStatus.Active,
  livemode = true,
}: {
  SubscriptionId: string
  startDate: Date
  endDate: Date
  status?: BillingPeriodStatus
  livemode?: boolean
}) => {
  return adminTransaction(async ({ transaction }) => {
    return insertBillingPeriod(
      {
        SubscriptionId,
        startDate,
        endDate,
        status,
        livemode,
      },
      transaction
    )
  })
}

export const setupBillingRun = async ({
  BillingPeriodId,
  PaymentMethodId,
  status = BillingRunStatus.Scheduled,
  scheduledFor = new Date(),
  SubscriptionId,
  livemode = true,
  stripePaymentIntentId,
  lastPaymentIntentEventTimestamp,
}: Partial<BillingRun.Insert> & {
  BillingPeriodId: string
  PaymentMethodId: string
  SubscriptionId: string
}) => {
  return adminTransaction(async ({ transaction }) => {
    return insertBillingRun(
      {
        BillingPeriodId,
        PaymentMethodId,
        status,
        scheduledFor,
        livemode,
        SubscriptionId,
        stripePaymentIntentId,
        lastPaymentIntentEventTimestamp,
      },
      transaction
    )
  })
}

export const setupBillingPeriodItems = async ({
  BillingPeriodId,
  quantity,
  unitPrice,
  name = 'Test Item',
  description = 'Test Description',
  livemode = true,
}: {
  BillingPeriodId: string
  quantity: number
  unitPrice: number
  name?: string
  description?: string
  livemode?: boolean
}) => {
  return adminTransaction(async ({ transaction }) => {
    const item = await insertBillingPeriodItem(
      {
        BillingPeriodId,
        quantity,
        unitPrice,
        name,
        description,
        livemode,
      },
      transaction
    )
    return [item]
  })
}

export const setupPurchase = async ({
  CustomerProfileId,
  OrganizationId,
  livemode,
  VariantId,
}: {
  CustomerProfileId: string
  OrganizationId: string
  livemode?: boolean
  VariantId: string
}) => {
  return adminTransaction(async ({ transaction }) => {
    const variant = await selectVariantById(VariantId, transaction)
    const purchaseFields =
      projectVariantFieldsOntoPurchaseFields(variant)
    return insertPurchase(
      {
        CustomerProfileId,
        OrganizationId,
        livemode: livemode ?? variant.livemode,
        name: 'Test Purchase',
        VariantId: variant.id,
        priceType: variant.priceType,
        totalPurchaseValue: variant.unitPrice,
        quantity: 1,
        firstInvoiceValue: 1000,
        ...purchaseFields,
      } as Purchase.Insert,
      transaction
    )
  })
}

export const setupInvoice = async ({
  BillingPeriodId,
  CustomerProfileId,
  OrganizationId,
  status = InvoiceStatus.Draft,
  livemode = true,
  VariantId,
}: {
  BillingPeriodId?: string
  CustomerProfileId: string
  OrganizationId: string
  status?: InvoiceStatus
  livemode?: boolean
  type?: InvoiceType
  VariantId: string
}) => {
  return adminTransaction(async ({ transaction }) => {
    let billingPeriod: BillingPeriod.Record | null = null
    let PurchaseId: string | null = null
    if (BillingPeriodId) {
      billingPeriod = await selectBillingPeriodById(
        BillingPeriodId,
        transaction
      )
    } else {
      const purchase = await setupPurchase({
        CustomerProfileId,
        OrganizationId,
        livemode,
        VariantId,
      })
      PurchaseId = purchase.id
    }

    const invoice = await insertInvoice(
      // @ts-expect-error
      {
        BillingPeriodId: billingPeriod?.id ?? null,
        CustomerProfileId,
        OrganizationId,
        status,
        livemode,
        invoiceNumber: `TEST-001-${core.nanoid()}`,
        invoiceDate: new Date(),
        dueDate: new Date(),
        billingPeriodStartDate: billingPeriod?.startDate ?? null,
        billingPeriodEndDate: billingPeriod?.endDate ?? null,
        type: billingPeriod
          ? InvoiceType.Subscription
          : InvoiceType.Purchase,
        PurchaseId,
        currency: CurrencyCode.USD,
      },
      transaction
    )
    await insertInvoiceLineItem(
      {
        InvoiceId: invoice.id,
        description: 'Test Description',
        price: 1000,
        quantity: 1,
        livemode: invoice.livemode,
      },
      transaction
    )
    return invoice
  })
}

export const setupPayment = async ({
  stripeChargeId,
  status,
  amount,
  livemode = true,
  CustomerProfileId,
  OrganizationId,
  stripePaymentIntentId,
  InvoiceId,
  paymentMethod,
  BillingPeriodId,
}: {
  stripeChargeId: string
  status: PaymentStatus
  amount: number
  livemode?: boolean
  CustomerProfileId: string
  OrganizationId: string
  stripePaymentIntentId?: string
  paymentMethod?: PaymentMethodType
  InvoiceId: string
  BillingPeriodId?: string
}): Promise<Payment.Record> => {
  return adminTransaction(async ({ transaction }) => {
    const payment = await insertPayment(
      {
        stripeChargeId,
        status,
        amount,
        livemode,
        CustomerProfileId,
        OrganizationId,
        stripePaymentIntentId: stripePaymentIntentId ?? core.nanoid(),
        InvoiceId,
        BillingPeriodId,
        currency: CurrencyCode.USD,
        paymentMethod: paymentMethod ?? PaymentMethodType.Card,
        chargeDate: new Date(),
        refunded: false,
        refundedAt: null,
        refundedAmount: 0,
        taxCountry: CountryCode.US,
      },
      transaction
    )
    return payment
  })
}

export const setupMemberships = async ({
  OrganizationId,
}: {
  OrganizationId: string
}) => {
  return adminTransaction(async ({ transaction }) => {
    const nanoid = core.nanoid()
    const user = await insertUser(
      {
        email: `test+${nanoid}@test.com`,
        name: `Test ${nanoid}`,
        id: core.nanoid(),
      },
      transaction
    )
    return insertMembership(
      {
        OrganizationId,
        UserId: user.id,
        focused: true,
        livemode: true,
      },
      transaction
    )
  })
}

export const setupSubscriptionItem = async ({
  SubscriptionId,
  name,
  quantity,
  unitPrice,
  VariantId,
  addedDate,
  removedDate,
  metadata,
}: {
  SubscriptionId: string
  name: string
  quantity: number
  unitPrice: number
  VariantId?: string
  addedDate?: Date
  removedDate?: Date
  metadata?: Record<string, any>
}) => {
  return adminTransaction(async ({ transaction }) => {
    const subscription = await selectSubscriptionById(
      SubscriptionId,
      transaction
    )
    if (!subscription) {
      throw new Error('Subscription not found')
    }
    return insertSubscriptionItem(
      {
        SubscriptionId,
        name,
        quantity,
        unitPrice,
        livemode: subscription.livemode,
        VariantId: VariantId ?? subscription.VariantId,
        addedDate: addedDate ?? new Date(),
        metadata: metadata ?? {},
      },
      transaction
    )
  })
}
