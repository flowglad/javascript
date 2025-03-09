import { z } from 'zod'
import {
  jsonb,
  pgPolicy,
  pgTable,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import {
  tableBase,
  enhancedCreateInsertSchema,
  pgEnumColumn,
  constructIndex,
  newBaseZodSelectSchemaColumns,
  notNullStringForeignKey,
  nullableStringForeignKey,
  livemodePolicy,
  createPaginatedSelectSchema,
  createPaginatedListQuerySchema,
} from '@/db/tableUtils'
import { billingAddressSchema } from '@/db/schema/customers'
import core from '@/utils/core'
import { variants } from './variants'
import {
  PaymentMethodType,
  PurchaseSessionStatus,
  PurchaseSessionType,
} from '@/types'
import { organizations } from './organizations'
import { purchases } from './purchases'
import { discounts } from './discounts'
import { customerProfiles } from './customerProfiles'
import { sql } from 'drizzle-orm'
import { invoices } from './invoices'

const TABLE_NAME = 'PurchaseSessions'

const columns = {
  ...tableBase('pses'),
  status: pgEnumColumn({
    enumName: 'PurchaseSessionStatus',
    columnName: 'status',
    enumBase: PurchaseSessionStatus,
  }).notNull(),
  billingAddress: jsonb('billingAddress'),
  VariantId: nullableStringForeignKey('VariantId', variants),
  PurchaseId: nullableStringForeignKey('PurchaseId', purchases),
  InvoiceId: nullableStringForeignKey('InvoiceId', invoices),
  /**
   * Should only be non-1 in the case of VariantId is not null.
   */
  quantity: integer('quantity').notNull().default(1),
  OrganizationId: notNullStringForeignKey(
    'OrganizationId',
    organizations
  ),
  customerName: text('customerName'),
  customerEmail: text('customerEmail'),
  stripeSetupIntentId: text('stripeSetupIntentId'),
  stripePaymentIntentId: text('stripePaymentIntentId'),
  CustomerProfileId: nullableStringForeignKey(
    'CustomerProfileId',
    customerProfiles
  ),
  /**
   * Default to 24 hours from now
   */
  expires: timestamp('expires')
    .notNull()
    .$defaultFn(() => new Date(Date.now() + 1000 * 60 * 60 * 24)),
  paymentMethodType: pgEnumColumn({
    enumName: 'PaymentMethodType',
    columnName: 'paymentMethodType',
    enumBase: PaymentMethodType,
  }),
  DiscountId: nullableStringForeignKey('DiscountId', discounts),
  successUrl: text('successUrl'),
  cancelUrl: text('cancelUrl'),
  type: pgEnumColumn({
    enumName: 'PurchaseSessionType',
    columnName: 'type',
    enumBase: PurchaseSessionType,
  }).notNull(),
}

export const purchaseSessions = pgTable(
  TABLE_NAME,
  columns,
  (table) => {
    return [
      constructIndex(TABLE_NAME, [table.VariantId]),
      constructIndex(TABLE_NAME, [table.stripePaymentIntentId]),
      constructIndex(TABLE_NAME, [table.OrganizationId]),
      constructIndex(TABLE_NAME, [table.status]),
      constructIndex(TABLE_NAME, [table.stripeSetupIntentId]),
      constructIndex(TABLE_NAME, [table.PurchaseId]),
      constructIndex(TABLE_NAME, [table.DiscountId]),
      constructIndex(TABLE_NAME, [table.CustomerProfileId]),
      livemodePolicy(),
      pgPolicy(
        'Enable all actions for discounts in own organization',
        {
          as: 'permissive',
          to: 'authenticated',
          for: 'all',
          using: sql`"OrganizationId" in (select "OrganizationId" from "Memberships")`,
        }
      ),
    ]
  }
).enableRLS()

const refinement = {
  ...newBaseZodSelectSchemaColumns,
  billingAddress: billingAddressSchema.nullable(),
  status: core.createSafeZodEnum(PurchaseSessionStatus),
  successUrl: z.string().url().nullable(),
  cancelUrl: z.string().url().nullable(),
  paymentMethodType: core
    .createSafeZodEnum(PaymentMethodType)
    .nullable(),
}

const purchasePurchaseSessionRefinement = {
  PurchaseId: z.string(),
  ProductId: z.string(),
  VariantId: z.string(),
  type: z.literal(PurchaseSessionType.Purchase),
}

const invoicePurchaseSessionRefinement = {
  InvoiceId: z.string(),
  VariantId: z.null(),
  PurchaseId: z.null(),
  ProductId: z.null(),
  type: z.literal(PurchaseSessionType.Invoice),
}

const productPurchaseSessionRefinement = {
  VariantId: z.string(),
  InvoiceId: z.null(),
  ProductId: z.string(),
  type: z.literal(PurchaseSessionType.Product),
}

export const corePurchaseSessionsSelectSchema = createSelectSchema(
  purchaseSessions,
  refinement
)

const purchasePurchaseSessionsSelectSchema =
  corePurchaseSessionsSelectSchema.extend(
    purchasePurchaseSessionRefinement
  )
const invoicePurchaseSessionsSelectSchema =
  corePurchaseSessionsSelectSchema.extend(
    invoicePurchaseSessionRefinement
  )
const productPurchaseSessionsSelectSchema =
  corePurchaseSessionsSelectSchema.extend(
    productPurchaseSessionRefinement
  )

export const purchaseSessionsSelectSchema = z.discriminatedUnion(
  'type',
  [
    purchasePurchaseSessionsSelectSchema,
    invoicePurchaseSessionsSelectSchema,
    productPurchaseSessionsSelectSchema,
  ]
)

export const corePurchaseSessionsInsertSchema =
  enhancedCreateInsertSchema(purchaseSessions, refinement)
export const purchasePurchaseSessionsInsertSchema =
  corePurchaseSessionsInsertSchema.extend(
    purchasePurchaseSessionRefinement
  )
export const invoicePurchaseSessionsInsertSchema =
  corePurchaseSessionsInsertSchema.extend(
    invoicePurchaseSessionRefinement
  )
export const productPurchaseSessionsInsertSchema =
  corePurchaseSessionsInsertSchema.extend(
    productPurchaseSessionRefinement
  )
export const purchaseSessionsInsertSchema = z.discriminatedUnion(
  'type',
  [
    purchasePurchaseSessionsInsertSchema,
    invoicePurchaseSessionsInsertSchema,
    productPurchaseSessionsInsertSchema,
  ]
)

export const corePurchaseSessionsUpdateSchema =
  corePurchaseSessionsInsertSchema.partial().extend({
    id: z.string(),
  })

const purchasePurchaseSessionUpdateSchema =
  corePurchaseSessionsUpdateSchema.extend(
    purchasePurchaseSessionRefinement
  )
const invoicePurchaseSessionUpdateSchema =
  corePurchaseSessionsUpdateSchema.extend(
    invoicePurchaseSessionRefinement
  )
const productPurchaseSessionUpdateSchema =
  corePurchaseSessionsUpdateSchema.extend(
    productPurchaseSessionRefinement
  )

export const purchaseSessionsUpdateSchema = z.discriminatedUnion(
  'type',
  [
    purchasePurchaseSessionUpdateSchema,
    invoicePurchaseSessionUpdateSchema,
    productPurchaseSessionUpdateSchema,
  ]
)

export const createPurchaseSessionInputSchema = z.object({
  purchaseSession: purchaseSessionsInsertSchema,
})

export type CreatePurchaseSessionInput = z.infer<
  typeof createPurchaseSessionInputSchema
>

const readOnlyColumns = {
  expires: true,
  status: true,
  stripePaymentIntentId: true,
  stripeSetupIntentId: true,
  PurchaseId: true,
} as const

const purchasePurchaseSessionClientUpdateSchema =
  purchasePurchaseSessionUpdateSchema.omit(readOnlyColumns).extend({
    id: z.string(),
  })
const invoicePurchaseSessionClientUpdateSchema =
  invoicePurchaseSessionUpdateSchema.omit(readOnlyColumns).extend({
    id: z.string(),
  })
const productPurchaseSessionClientUpdateSchema =
  productPurchaseSessionUpdateSchema.omit(readOnlyColumns).extend({
    id: z.string(),
  })

const purchaseSessionClientUpdateSchema = z.discriminatedUnion(
  'type',
  [
    purchasePurchaseSessionClientUpdateSchema,
    invoicePurchaseSessionClientUpdateSchema,
    productPurchaseSessionClientUpdateSchema,
  ]
)

export const editPurchaseSessionInputSchema = z.object({
  purchaseSession: purchaseSessionClientUpdateSchema,
  purchaseId: z.string().nullish(),
})

export type EditPurchaseSessionInput = z.infer<
  typeof editPurchaseSessionInputSchema
>
const hiddenColumns = {
  expires: true,
  status: true,
  stripePaymentIntentId: true,
  stripeSetupIntentId: true,
} as const

export const purchasePurchaseSessionClientSelectSchema =
  purchasePurchaseSessionsSelectSchema.omit(hiddenColumns)
export const invoicePurchaseSessionClientSelectSchema =
  invoicePurchaseSessionsSelectSchema.omit(hiddenColumns)
export const productPurchaseSessionClientSelectSchema =
  productPurchaseSessionsSelectSchema.omit(hiddenColumns)

export const purchaseSessionClientSelectSchema = z.discriminatedUnion(
  'type',
  [
    purchasePurchaseSessionClientSelectSchema,
    invoicePurchaseSessionClientSelectSchema,
    productPurchaseSessionClientSelectSchema,
  ]
)

const feeReadyColumns = {
  billingAddress: billingAddressSchema,
  paymentMethodType: core.createSafeZodEnum(PaymentMethodType),
} as const

export const feeReadyPurchasePurchaseSessionSelectSchema =
  purchasePurchaseSessionClientSelectSchema.extend(feeReadyColumns)
export const feeReadyInvoicePurchaseSessionSelectSchema =
  invoicePurchaseSessionClientSelectSchema.extend(feeReadyColumns)
export const feeReadyProductPurchaseSessionSelectSchema =
  productPurchaseSessionClientSelectSchema.extend(feeReadyColumns)

export const feeReadyPurchaseSessionSelectSchema =
  z.discriminatedUnion('type', [
    feeReadyPurchasePurchaseSessionSelectSchema,
    feeReadyInvoicePurchaseSessionSelectSchema,
    feeReadyProductPurchaseSessionSelectSchema,
  ])

export const purchaseSessionsPaginatedSelectSchema =
  createPaginatedSelectSchema(purchaseSessionClientSelectSchema)

export const purchaseSessionsPaginatedListSchema =
  createPaginatedListQuerySchema(purchaseSessionClientSelectSchema)

export namespace PurchaseSession {
  export type Insert = z.infer<typeof purchaseSessionsInsertSchema>
  export type PurchaseInsert = z.infer<
    typeof purchasePurchaseSessionsInsertSchema
  >
  export type InvoiceInsert = z.infer<
    typeof invoicePurchaseSessionsInsertSchema
  >
  export type ProductInsert = z.infer<
    typeof productPurchaseSessionsInsertSchema
  >

  export type Update = z.infer<typeof purchaseSessionsUpdateSchema>

  export type PurchaseUpdate = z.infer<
    typeof purchasePurchaseSessionUpdateSchema
  >
  export type InvoiceUpdate = z.infer<
    typeof invoicePurchaseSessionUpdateSchema
  >
  export type ProductUpdate = z.infer<
    typeof productPurchaseSessionUpdateSchema
  >

  export type PurchaseRecord = z.infer<
    typeof purchasePurchaseSessionsSelectSchema
  >
  export type InvoiceRecord = z.infer<
    typeof invoicePurchaseSessionsSelectSchema
  >
  export type ProductRecord = z.infer<
    typeof productPurchaseSessionsSelectSchema
  >

  export type Record = z.infer<typeof purchaseSessionsSelectSchema>

  export type PurchaseClientRecord = z.infer<
    typeof purchasePurchaseSessionClientSelectSchema
  >

  export type InvoiceClientRecord = z.infer<
    typeof invoicePurchaseSessionClientSelectSchema
  >

  export type ProductClientRecord = z.infer<
    typeof productPurchaseSessionClientSelectSchema
  >

  export type ClientRecord = z.infer<
    typeof purchaseSessionClientSelectSchema
  >

  export type PurchaseClientUpdate = z.infer<
    typeof purchasePurchaseSessionClientUpdateSchema
  >

  export type InvoiceClientUpdate = z.infer<
    typeof invoicePurchaseSessionClientUpdateSchema
  >

  export type ProductClientUpdate = z.infer<
    typeof productPurchaseSessionClientUpdateSchema
  >

  export type ClientUpdate = z.infer<
    typeof purchaseSessionClientUpdateSchema
  >
  /**
   * A Purchase Session that has all the parameters necessary to create a FeeCalcuation
   */
  export type FeeReadyRecord = z.infer<
    typeof feeReadyPurchaseSessionSelectSchema
  >
  export type PaginatedList = z.infer<
    typeof purchaseSessionsPaginatedListSchema
  >
}
