import {
  purchases,
  purchasesInsertSchema,
  purchasesSelectSchema,
  purchasesUpdateSchema,
  Purchase,
  singlePaymentPurchaseSelectSchema,
  subscriptionPurchaseSelectSchema,
  purchaseClientInsertSchema,
} from '@/db/schema/purchases'
import {
  createUpsertFunction,
  createSelectById,
  createSelectFunction,
  createInsertFunction,
  ORMMethodCreatorConfig,
  createUpdateFunction,
  whereClauseFromObject,
} from '@/db/tableUtils'
import { PriceType } from '@/types'
import { DbTransaction } from '@/db/types'
import { and, eq } from 'drizzle-orm'
import {
  otherVariantSelectSchema,
  subscriptionVariantSelectSchema,
  variants,
  variantsSelectSchema,
} from '../schema/variants'
import {
  customerProfileClientInsertSchema,
  customerProfiles,
  customerProfilesInsertSchema,
  customerProfilesSelectSchema,
} from '../schema/customerProfiles'
import {
  customerBillingAddressSchema,
  customers,
  customersInsertSchema,
  customersSelectSchema,
} from '../schema/customers'
import {
  organizations,
  organizationsSelectSchema,
} from '../schema/organizations'
import { products, productsSelectSchema } from '../schema/products'
import { z } from 'zod'
import {
  purchaseSessionClientSelectSchema,
  purchaseSessionsSelectSchema,
} from '../schema/purchaseSessions'
import { payments, paymentsSelectSchema } from '../schema/payments'
import { discountClientSelectSchema } from '../schema/discounts'
import { customerFacingFeeCalculationSelectSchema } from '../schema/feeCalculations'
import { ProperNoun } from '../schema/properNouns'

const config: ORMMethodCreatorConfig<
  typeof purchases,
  typeof purchasesSelectSchema,
  typeof purchasesInsertSchema,
  typeof purchasesUpdateSchema
> = {
  selectSchema: purchasesSelectSchema,
  insertSchema: purchasesInsertSchema,
  updateSchema: purchasesUpdateSchema,
}

export const selectPurchaseById = createSelectById(purchases, config)

export const selectPurchases = createSelectFunction(purchases, config)

export const insertPurchase = createInsertFunction(
  purchases,
  // @ts-expect-error
  config
) as (
  payload: Purchase.Insert,
  transaction: DbTransaction
) => Promise<Purchase.Record>

export const upsertPurchaseById = createUpsertFunction(
  purchases,
  purchases.id,
  config
)

export const updatePurchase = createUpdateFunction(purchases, config)

export const selectPurchasesForCustomerProfile = (
  CustomerProfileId: string,
  transaction: DbTransaction
) => {
  return transaction
    .select()
    .from(purchases)
    .where(and(eq(purchases.CustomerProfileId, CustomerProfileId)))
}

export const selectPurchasesAndAssociatedPaymentsByPurchaseWhere =
  async (
    selectConditions: Partial<Purchase.Record>,
    transaction: DbTransaction
  ) => {
    const result = await transaction
      .select({
        purchase: purchases,
        payment: payments,
      })
      .from(purchases)
      .innerJoin(payments, eq(payments.PurchaseId, purchases.id))
      .where(whereClauseFromObject(purchases, selectConditions))
    return result.map((item) => {
      return {
        purchase: purchasesSelectSchema.parse(item.purchase),
        payment: paymentsSelectSchema.parse(item.payment),
      }
    })
  }

export const selectPurchasesCustomerProfileAndCustomer = async (
  selectConditions: Partial<Purchase.Record>,
  transaction: DbTransaction
) => {
  const result = await transaction
    .select({
      purchase: purchases,
      customerProfile: customerProfiles,
      customer: customers,
    })
    .from(purchases)
    .innerJoin(
      customerProfiles,
      eq(customerProfiles.id, purchases.CustomerProfileId)
    )
    .innerJoin(
      customers,
      eq(customers.id, customerProfiles.CustomerId)
    )
    .where(whereClauseFromObject(purchases, selectConditions))
  return result.map((item) => {
    return {
      purchase: purchasesSelectSchema.parse(item.purchase),
      customerProfile: customerProfilesSelectSchema.parse(
        item.customerProfile
      ),
      customer: customersSelectSchema.parse(item.customer),
    }
  })
}

export const selectPurchaseCheckoutParametersById = async (
  id: string,
  transaction: DbTransaction
) => {
  const [result] = await transaction
    .select({
      purchase: purchases,
      variant: variants,
      customerProfile: customerProfiles,
      customer: customers,
      organization: organizations,
      product: products,
    })
    .from(purchases)
    .innerJoin(variants, eq(purchases.VariantId, variants.id))
    .innerJoin(
      customerProfiles,
      eq(customerProfiles.id, purchases.CustomerProfileId)
    )
    .innerJoin(
      customers,
      eq(customers.id, customerProfiles.CustomerId)
    )
    .innerJoin(
      organizations,
      eq(organizations.id, customerProfiles.OrganizationId)
    )
    .innerJoin(products, eq(products.id, variants.ProductId))
    .where(and(eq(purchases.id, id)))
  return {
    purchase: purchasesSelectSchema.parse(result.purchase),
    variant: variantsSelectSchema.parse(result.variant),
    product: productsSelectSchema.parse(result.product),
    customerProfile: customerProfilesSelectSchema.parse(
      result.customerProfile
    ),
    customer: customersSelectSchema.parse(result.customer),
    organization: organizationsSelectSchema.parse(
      result.organization
    ),
  }
}

const subscriptionBillingInfoSchema = z.object({
  purchase: subscriptionPurchaseSelectSchema.nullish(),
  variant: subscriptionVariantSelectSchema,
  priceType: z.literal(PriceType.Subscription),
})

export type SubscriptionBillingInfoCore = z.infer<
  typeof subscriptionBillingInfoSchema
>

const singlePaymentBillingInfoSchema = z.object({
  purchase: singlePaymentPurchaseSelectSchema.nullish(),
  variant: otherVariantSelectSchema,
  priceType: z.literal(PriceType.SinglePayment),
})

export const billingInfoSchema = z
  .discriminatedUnion('priceType', [
    subscriptionBillingInfoSchema,
    singlePaymentBillingInfoSchema,
  ])
  .and(
    z.object({
      /**
       * Only present for open purchases
       */
      customerProfile: customerProfilesSelectSchema.nullish(),
      sellerOrganization: organizationsSelectSchema,
      product: productsSelectSchema,
      redirectUrl: z.string().url(),
      cancelUrl: z.string().url().nullish(),
      clientSecret: z.string().nullable(),
      purchaseSession: purchaseSessionClientSelectSchema,
      discount: discountClientSelectSchema.nullish(),
      /**
       * Only present when purchaseSession.CustomerProfileId is not null
       */
      readonlyCustomerEmail: z.string().email().nullish(),
      feeCalculation:
        customerFacingFeeCalculationSelectSchema.nullable(),
    })
  )

export type BillingInfoCore = z.infer<typeof billingInfoSchema>

export const createCustomerProfileInputSchema = z.object({
  customerProfile: customerProfileClientInsertSchema,
})

export type CreateCustomerProfileInputSchema = z.infer<
  typeof createCustomerProfileInputSchema
>

export const purchaseToProperNounUpsert = (
  purchase: Purchase.Record
): ProperNoun.Insert => {
  return {
    EntityId: purchase.id,
    entityType: 'purchase',
    name: purchase.name,
    OrganizationId: purchase.OrganizationId,
    livemode: purchase.livemode,
  }
}

export const bulkInsertPurchases = async (
  purchaseInserts: Purchase.Insert[],
  transaction: DbTransaction
) => {
  const result = await transaction
    .insert(purchases)
    .values(purchaseInserts)
  return result.map((item) => purchasesSelectSchema.parse(item))
}

export const selectPurchaseRowDataForOrganization = async (
  OrganizationId: string,
  transaction: DbTransaction
): Promise<Purchase.PurchaseTableRowData[]> => {
  const result = await transaction
    .select({
      purchase: purchases,
      product: products,
      customerProfile: customerProfiles,
    })
    .from(purchases)
    .innerJoin(variants, eq(purchases.VariantId, variants.id))
    .innerJoin(products, eq(variants.ProductId, products.id))
    .innerJoin(
      customerProfiles,
      eq(purchases.CustomerProfileId, customerProfiles.id)
    )
    .where(eq(purchases.OrganizationId, OrganizationId))

  return result.map((item) => ({
    purchase: purchasesSelectSchema.parse(item.purchase),
    product: productsSelectSchema.parse(item.product),
    customerProfile: customerProfilesSelectSchema.parse(
      item.customerProfile
    ),
  }))
}
