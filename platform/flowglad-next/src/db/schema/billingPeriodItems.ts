import { integer, pgTable, text, pgPolicy } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import {
  tableBase,
  notNullStringForeignKey,
  nullableStringForeignKey,
  constructIndex,
  enhancedCreateInsertSchema,
  createUpdateSchema,
} from '@/db/tableUtils'
import { billingPeriods } from '@/db/schema/billingPeriods'
import { subscriptionItems } from '@/db/schema/subscriptionItems'
import { discountRedemptions } from '@/db/schema/discountRedemptions'
import core from '@/utils/core'
import { createSelectSchema } from 'drizzle-zod'
import { sql } from 'drizzle-orm'

const TABLE_NAME = 'BillingPeriodItems'

export const billingPeriodItems = pgTable(
  TABLE_NAME,
  {
    ...tableBase('billingPeriodItem'),
    BillingPeriodId: notNullStringForeignKey(
      'BillingPeriodId',
      billingPeriods
    ),
    quantity: integer('quantity').notNull(),
    unitPrice: integer('unitPrice').notNull(),
    name: text('name').notNull(),
    DiscountRedemptionId: nullableStringForeignKey(
      'DiscountRedemptionId',
      discountRedemptions
    ),
    description: text('description').notNull(),
  },
  (table) => {
    return [
      constructIndex(TABLE_NAME, [table.BillingPeriodId]),
      constructIndex(TABLE_NAME, [table.DiscountRedemptionId]),
      pgPolicy('Enable read for own organizations', {
        as: 'permissive',
        to: 'authenticated',
        for: 'all',
        using: sql`"BillingPeriodId" in (select "id" from "BillingPeriods" where "SubscriptionId" in (select "id" from "Subscriptions" where "OrganizationId" in (select "OrganizationId" from "Memberships")))`,
      }),
    ]
  }
).enableRLS()

const columnRefinements = {
  quantity: core.safeZodPositiveInteger,
}

/*
 * database schemas
 */
export const billingPeriodItemsInsertSchema =
  enhancedCreateInsertSchema(billingPeriodItems, columnRefinements)

export const billingPeriodItemsSelectSchema = createSelectSchema(
  billingPeriodItems
).extend(columnRefinements)

export const billingPeriodItemsUpdateSchema = createUpdateSchema(
  billingPeriodItems,
  columnRefinements
)

const createOnlyColumns = {
  BillingPeriodId: true,
  DiscountRedemptionId: true,
} as const

const readOnlyColumns = {} as const

const hiddenColumns = {} as const

const nonClientEditableColumns = {
  ...hiddenColumns,
  ...readOnlyColumns,
  ...createOnlyColumns,
} as const

/*
 * client schemas
 */
export const billingPeriodItemClientInsertSchema =
  billingPeriodItemsInsertSchema.omit(nonClientEditableColumns)

export const billingPeriodItemClientUpdateSchema =
  billingPeriodItemsUpdateSchema.omit({
    ...nonClientEditableColumns,
    ...createOnlyColumns,
  })

export const billingPeriodItemClientSelectSchema =
  billingPeriodItemsSelectSchema.omit(hiddenColumns)

export namespace BillingPeriodItem {
  export type Insert = z.infer<typeof billingPeriodItemsInsertSchema>
  export type Update = z.infer<typeof billingPeriodItemsUpdateSchema>
  export type Record = z.infer<typeof billingPeriodItemsSelectSchema>
  export type ClientInsert = z.infer<
    typeof billingPeriodItemClientInsertSchema
  >
  export type ClientUpdate = z.infer<
    typeof billingPeriodItemClientUpdateSchema
  >
  export type ClientRecord = z.infer<
    typeof billingPeriodItemClientSelectSchema
  >
}

export const createBillingPeriodItemInputSchema = z.object({
  billingPeriodItem: billingPeriodItemClientInsertSchema,
})

export type CreateBillingPeriodItemInput = z.infer<
  typeof createBillingPeriodItemInputSchema
>

export const editBillingPeriodItemInputSchema = z.object({
  billingPeriodItem: billingPeriodItemClientUpdateSchema,
})

export type EditBillingPeriodItemInput = z.infer<
  typeof editBillingPeriodItemInputSchema
>
