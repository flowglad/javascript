import {
  pgTable,
  jsonb,
  integer,
  pgPolicy,
  timestamp,
  text,
} from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import {
  tableBase,
  notNullStringForeignKey,
  constructIndex,
  livemodePolicy,
} from '@/db/tableUtils'
import { subscriptions } from '@/db/schema/subscriptions'
import { variants } from '@/db/schema/variants'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import core from '@/utils/core'

const TABLE_NAME = 'SubscriptionItems'

const columns = {
  ...tableBase('si'),
  SubscriptionId: notNullStringForeignKey(
    'SubscriptionId',
    subscriptions
  ),
  name: text('name'),
  addedDate: timestamp('addedDate').notNull(),
  VariantId: notNullStringForeignKey('VariantId', variants),
  unitPrice: integer('unitPrice').notNull(),
  quantity: integer('quantity').notNull(),
  metadata: jsonb('metadata'),
}

export const subscriptionItems = pgTable(
  TABLE_NAME,
  columns,
  (table) => {
    return [
      constructIndex(TABLE_NAME, [table.SubscriptionId]),
      constructIndex(TABLE_NAME, [table.VariantId]),
      pgPolicy(
        'Enable actions for own organizations via subscriptions',
        {
          as: 'permissive',
          to: 'authenticated',
          for: 'all',
          using: sql`"SubscriptionId" in (select "id" from "Subscriptions")`,
        }
      ),
      livemodePolicy(),
    ]
  }
).enableRLS()

const columnRefinements = {
  unitPrice: core.safeZodPositiveIntegerOrZero,
  quantity: core.safeZodPositiveInteger,
  metadata: z.record(z.unknown()).nullable(),
}

/*
 * database schema
 */
export const subscriptionItemsInsertSchema = createSelectSchema(
  subscriptionItems,
  columnRefinements
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const subscriptionItemsSelectSchema =
  createSelectSchema(subscriptionItems).extend(columnRefinements)

export const subscriptionItemsUpdateSchema = createSelectSchema(
  subscriptionItems,
  columnRefinements
)
  .partial()
  .extend({
    id: z.string(),
  })

const createOnlyColumns = {
  SubscriptionId: true,
  VariantId: true,
} as const

const readOnlyColumns = {
  livemode: true,
} as const

const hiddenColumns = {} as const

const nonClientEditableColumns = {
  ...readOnlyColumns,
  ...hiddenColumns,
  ...createOnlyColumns,
} as const

/*
 * client schemas
 */
export const subscriptionItemClientInsertSchema =
  subscriptionItemsInsertSchema.omit(nonClientEditableColumns)

export const subscriptionItemClientUpdateSchema =
  subscriptionItemsUpdateSchema.omit(nonClientEditableColumns)

export const subscriptionItemClientSelectSchema =
  subscriptionItemsSelectSchema.omit(hiddenColumns)

export namespace SubscriptionItem {
  export type Insert = z.infer<typeof subscriptionItemsInsertSchema>
  export type Update = z.infer<typeof subscriptionItemsUpdateSchema>
  export type Record = z.infer<typeof subscriptionItemsSelectSchema>
  export type Upsert = Insert | Record
  export type ClientInsert = z.infer<
    typeof subscriptionItemClientInsertSchema
  >
  export type ClientUpdate = z.infer<
    typeof subscriptionItemClientUpdateSchema
  >
  export type ClientRecord = z.infer<
    typeof subscriptionItemClientSelectSchema
  >
}

export const createSubscriptionItemSchema = z.object({
  subscriptionItem: subscriptionItemClientInsertSchema,
})

export type CreateSubscriptionItemInput = z.infer<
  typeof createSubscriptionItemSchema
>

export const editSubscriptionItemSchema = z.object({
  subscriptionItem: subscriptionItemClientUpdateSchema,
  id: z.string(),
})

export type EditSubscriptionItemInput = z.infer<
  typeof editSubscriptionItemSchema
>
