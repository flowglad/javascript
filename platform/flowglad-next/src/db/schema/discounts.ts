import {
  pgTable,
  pgPolicy,
  text,
  boolean,
  integer,
} from 'drizzle-orm/pg-core'
import { z } from 'zod'
import {
  enhancedCreateInsertSchema,
  pgEnumColumn,
  constructIndex,
  constructUniqueIndex,
  tableBase,
  notNullStringForeignKey,
  createSupabaseWebhookSchema,
  livemodePolicy,
  createPaginatedSelectSchema,
  createPaginatedListQuerySchema,
} from '@/db/tableUtils'
import { organizations } from '@/db/schema/organizations'
import core from '@/utils/core'
import { createSelectSchema } from 'drizzle-zod'
import { sql } from 'drizzle-orm'
import { DiscountAmountType, DiscountDuration } from '@/types'

const TABLE_NAME = 'Discounts'

export const discounts = pgTable(
  TABLE_NAME,
  {
    ...tableBase('discount'),
    OrganizationId: notNullStringForeignKey(
      'OrganizationId',
      organizations
    ),
    name: text('name').notNull(),
    code: text('code').notNull(),
    amount: integer('amount').notNull(),
    amountType: pgEnumColumn({
      enumName: 'DiscountAmountType',
      columnName: 'amountType',
      enumBase: DiscountAmountType,
    }).notNull(),
    active: boolean('active').notNull().default(true),
    duration: pgEnumColumn({
      enumName: 'DiscountDuration',
      columnName: 'duration',
      enumBase: DiscountDuration,
    }).notNull(),
    numberOfPayments: integer('numberOfPayments'),
    stripeCouponId: text('stripeCouponId'),
  },
  (table) => {
    return [
      constructIndex(TABLE_NAME, [table.OrganizationId]),
      constructIndex(TABLE_NAME, [table.code]),
      constructUniqueIndex(TABLE_NAME, [
        table.code,
        table.OrganizationId,
      ]),
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

const columnRefinements = {
  amount: core.safeZodPositiveInteger,
  amountType: core.createSafeZodEnum(DiscountAmountType),
  duration: core.createSafeZodEnum(DiscountDuration),
  numberOfPayments: core.safeZodPositiveInteger.nullable(),
  code: z
    .string()
    .min(3)
    .max(20)
    .transform((code) => code.toUpperCase()),
}

const baseDiscountSchema = enhancedCreateInsertSchema(
  discounts,
  columnRefinements
)

const supabaseSchemas = createSupabaseWebhookSchema({
  table: discounts,
  tableName: TABLE_NAME,
  refine: columnRefinements,
})

export const discountsSupabaseInsertPayloadSchema =
  supabaseSchemas.supabaseInsertPayloadSchema
export const discountsSupabaseUpdatePayloadSchema =
  supabaseSchemas.supabaseUpdatePayloadSchema

const defaultDiscountsRefinements = {
  duration: z.literal(DiscountDuration.Once),
  numberOfPayments: z.null(),
}

const foreverDiscountsRefinements = {
  duration: z.literal(DiscountDuration.Forever),
  numberOfPayments: z.null(),
}

const numberOfPaymentsDiscountsRefinements = {
  duration: z.literal(DiscountDuration.NumberOfPayments),
  numberOfPayments: core.safeZodPositiveInteger,
}

// Default discounts schema (once or forever duration)
export const defaultDiscountsInsertSchema = baseDiscountSchema.extend(
  defaultDiscountsRefinements
)

// Number of payments discounts schema
export const numberOfPaymentsDiscountsInsertSchema =
  baseDiscountSchema.extend(numberOfPaymentsDiscountsRefinements)

export const foreverDiscountsInsertSchema = baseDiscountSchema.extend(
  foreverDiscountsRefinements
)

// Combined insert schema
export const discountsInsertSchema = z.discriminatedUnion(
  'duration',
  [
    defaultDiscountsInsertSchema,
    numberOfPaymentsDiscountsInsertSchema,
    foreverDiscountsInsertSchema,
  ]
)

// Select schemas
const baseSelectSchema = createSelectSchema(
  discounts,
  columnRefinements
)

export const defaultDiscountsSelectSchema = baseSelectSchema.extend(
  defaultDiscountsRefinements
)

export const numberOfPaymentsDiscountsSelectSchema =
  baseSelectSchema.extend(numberOfPaymentsDiscountsRefinements)

export const foreverDiscountsSelectSchema = baseSelectSchema.extend(
  foreverDiscountsRefinements
)

export const discountsSelectSchema = z.discriminatedUnion(
  'duration',
  [
    defaultDiscountsSelectSchema,
    numberOfPaymentsDiscountsSelectSchema,
    foreverDiscountsSelectSchema,
  ]
)

// Update schemas
export const defaultDiscountsUpdateSchema =
  defaultDiscountsSelectSchema.partial().extend({
    id: z.string(),
    duration: z.literal(DiscountDuration.Once),
    numberOfPayments: z.null(),
  })

export const numberOfPaymentsDiscountsUpdateSchema =
  numberOfPaymentsDiscountsSelectSchema.partial().extend({
    id: z.string(),
    duration: z.literal(DiscountDuration.NumberOfPayments),
    numberOfPayments: core.safeZodPositiveInteger,
  })

export const foreverDiscountsUpdateSchema =
  foreverDiscountsSelectSchema.partial().extend({
    id: z.string(),
    duration: z.literal(DiscountDuration.Forever),
    numberOfPayments: z.null(),
  })

export const discountsUpdateSchema = z.discriminatedUnion(
  'duration',
  [
    defaultDiscountsUpdateSchema,
    numberOfPaymentsDiscountsUpdateSchema,
    foreverDiscountsUpdateSchema,
  ]
)

const hiddenColumns = {
  stripeCouponId: true,
} as const

const readOnlyColumns = {
  OrganizationId: true,
  livemode: true,
} as const

const nonClientEditableColumns = {
  ...hiddenColumns,
  ...readOnlyColumns,
} as const

export const defaultDiscountClientInsertSchema =
  defaultDiscountsInsertSchema.omit(nonClientEditableColumns)

export const numberOfPaymentsDiscountClientInsertSchema =
  numberOfPaymentsDiscountsInsertSchema.omit(nonClientEditableColumns)

export const foreverDiscountClientInsertSchema =
  foreverDiscountsInsertSchema.omit(nonClientEditableColumns)

export const discountClientInsertSchema = z.discriminatedUnion(
  'duration',
  [
    defaultDiscountClientInsertSchema,
    numberOfPaymentsDiscountClientInsertSchema,
    foreverDiscountClientInsertSchema,
  ]
)

export const defaultDiscountClientUpdateSchema =
  defaultDiscountsUpdateSchema.omit(nonClientEditableColumns)

export const numberOfPaymentsDiscountClientUpdateSchema =
  numberOfPaymentsDiscountsUpdateSchema.omit(nonClientEditableColumns)

export const foreverDiscountClientUpdateSchema =
  foreverDiscountsUpdateSchema.omit(nonClientEditableColumns)

export const discountClientUpdateSchema = z.discriminatedUnion(
  'duration',
  [
    defaultDiscountClientUpdateSchema,
    numberOfPaymentsDiscountClientUpdateSchema,
    foreverDiscountClientUpdateSchema,
  ]
)

export const defaultDiscountClientSelectSchema =
  defaultDiscountsSelectSchema

export const numberOfPaymentsDiscountClientSelectSchema =
  numberOfPaymentsDiscountsSelectSchema

export const foreverDiscountClientSelectSchema =
  foreverDiscountsSelectSchema

export const discountClientSelectSchema = z.discriminatedUnion(
  'duration',
  [
    defaultDiscountClientSelectSchema,
    numberOfPaymentsDiscountClientSelectSchema,
    foreverDiscountClientSelectSchema,
  ]
)

export const discountsPaginatedSelectSchema =
  createPaginatedSelectSchema(discountClientSelectSchema)

export const discountsPaginatedListSchema =
  createPaginatedListQuerySchema<
    z.infer<typeof discountClientSelectSchema>
  >(discountClientSelectSchema)

export namespace Discount {
  export type Insert = z.infer<typeof discountsInsertSchema>
  export type Update = z.infer<typeof discountsUpdateSchema>
  export type Record = z.infer<typeof discountsSelectSchema>
  export type ClientInsert = z.infer<
    typeof discountClientInsertSchema
  >
  export type ClientUpdate = z.infer<
    typeof discountClientUpdateSchema
  >
  export type ClientRecord = z.infer<
    typeof discountClientSelectSchema
  >
  export type PaginatedList = z.infer<
    typeof discountsPaginatedListSchema
  >
}

export const createDiscountInputSchema = z.object({
  discount: discountClientInsertSchema,
})
export type CreateDiscountInput = z.infer<
  typeof createDiscountInputSchema
>

export const editDiscountInputSchema = z.object({
  discount: discountClientUpdateSchema,
  id: z.string(),
})

export type EditDiscountInput = z.infer<
  typeof editDiscountInputSchema
>

export const productIdOrPurchaseIdSchema = z
  .object({
    productId: z.string(),
  })
  .or(
    z.object({
      purchaseId: z.string(),
    })
  )

export const attemptDiscountCodeInputSchema = z
  .object({
    code: z.string(),
  })
  .and(productIdOrPurchaseIdSchema)

export type AttemptDiscountCodeInput = z.infer<
  typeof attemptDiscountCodeInputSchema
>
