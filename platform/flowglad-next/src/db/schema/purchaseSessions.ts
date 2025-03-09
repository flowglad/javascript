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
import { PaymentMethodType, PurchaseSessionStatus } from '@/types'
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
  VariantId: notNullStringForeignKey('VariantId', variants),
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

export const purchaseSessionsSelectSchema = createSelectSchema(
  purchaseSessions,
  refinement
)

export const purchaseSessionsInsertSchema =
  enhancedCreateInsertSchema(purchaseSessions, refinement)

export const purchaseSessionsUpdateSchema =
  purchaseSessionsInsertSchema.partial().extend({
    id: z.string(),
  })

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

export const editPurchaseSessionInputSchema = z.object({
  purchaseSession: purchaseSessionsUpdateSchema
    .omit(readOnlyColumns)
    .extend({
      id: z.string(),
    }),
  purchaseId: z.string().nullish(),
})

export type EditPurchaseSessionInput = z.infer<
  typeof editPurchaseSessionInputSchema
>

export const purchaseSessionClientSelectSchema =
  purchaseSessionsSelectSchema.omit({
    expires: true,
    status: true,
    stripePaymentIntentId: true,
    stripeSetupIntentId: true,
  })

export const feeReadyPurchaseSessionSelectSchema =
  purchaseSessionsSelectSchema.extend({
    billingAddress: billingAddressSchema,
    paymentMethodType: core.createSafeZodEnum(PaymentMethodType),
  })

export const purchaseSessionsPaginatedSelectSchema =
  createPaginatedSelectSchema(purchaseSessionClientSelectSchema)

export const purchaseSessionsPaginatedListSchema =
  createPaginatedListQuerySchema(purchaseSessionClientSelectSchema)

export namespace PurchaseSession {
  export type Insert = z.infer<typeof purchaseSessionsInsertSchema>
  export type Update = z.infer<typeof purchaseSessionsUpdateSchema>
  export type Record = z.infer<typeof purchaseSessionsSelectSchema>
  export type ClientRecord = z.infer<
    typeof purchaseSessionClientSelectSchema
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
