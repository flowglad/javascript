import { pgPolicy, pgTable, text, boolean } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import {
  pgEnumColumn,
  constructIndex,
  newBaseZodSelectSchemaColumns,
  tableBase,
  notNullStringForeignKey,
  createSupabaseWebhookSchema,
  livemodePolicy,
  ommittedColumnsForInsertSchema,
  createPaginatedSelectSchema,
  createPaginatedListQuerySchema,
} from '@/db/tableUtils'
import { organizations } from '@/db/schema/organizations'
import core from '@/utils/core'
import { ProductType } from '@/types'
import { z } from 'zod'
import { sql } from 'drizzle-orm'

const PRODUCTS_TABLE_NAME = 'Products'

const columns = {
  ...tableBase('prod'),
  name: text('name').notNull(),
  type: pgEnumColumn({
    enumName: 'productType',
    columnName: 'type',
    enumBase: ProductType,
  }).notNull(),
  description: text('description'),
  imageURL: text('imageURL'),
  stripeProductId: text('stripeProductId').unique(),
  OrganizationId: notNullStringForeignKey(
    'OrganizationId',
    organizations
  ),
  active: boolean('active').notNull().default(true),
}

export const products = pgTable(
  PRODUCTS_TABLE_NAME,
  columns,
  (table) => {
    return [
      constructIndex(PRODUCTS_TABLE_NAME, [table.OrganizationId]),
      constructIndex(PRODUCTS_TABLE_NAME, [table.active]),
      constructIndex(PRODUCTS_TABLE_NAME, [table.stripeProductId]),
      constructIndex(PRODUCTS_TABLE_NAME, [table.type]),
      pgPolicy('Enable read for own organizations', {
        as: 'permissive',
        to: 'authenticated',
        for: 'all',
        using: sql`"OrganizationId" in (select "OrganizationId" from "Memberships")`,
      }),
      livemodePolicy(),
    ]
  }
).enableRLS()

const refinement = {
  ...newBaseZodSelectSchemaColumns,
  name: z.string(),
  type: core.createSafeZodEnum(ProductType),
  active: z.boolean(),
}

export const rawProductsSelectSchema = createSelectSchema(
  products,
  refinement
)

export const productsSelectSchema =
  rawProductsSelectSchema.extend(refinement)

export const productsInsertSchema = productsSelectSchema.omit(
  ommittedColumnsForInsertSchema
)

export const productsUpdateSchema = productsInsertSchema
  .partial()
  .extend({
    id: z.string(),
  })

const readOnlyColumns = {
  OrganizationId: true,
  livemode: true,
} as const

const hiddenColumns = {
  stripeProductId: true,
} as const

const nonClientEditableColumns = {
  ...readOnlyColumns,
  ...hiddenColumns,
} as const

export const productsClientSelectSchema =
  productsSelectSchema.omit(hiddenColumns)

export const productsClientInsertSchema = productsInsertSchema.omit(
  nonClientEditableColumns
)

export const productsClientUpdateSchema = productsUpdateSchema.omit(
  nonClientEditableColumns
)

const { supabaseInsertPayloadSchema, supabaseUpdatePayloadSchema } =
  createSupabaseWebhookSchema({
    table: products,
    tableName: PRODUCTS_TABLE_NAME,
    refine: refinement,
  })

export const productsSupabaseInsertPayloadSchema =
  supabaseInsertPayloadSchema
export const productsSupabaseUpdatePayloadSchema =
  supabaseUpdatePayloadSchema

export const productsPaginatedSelectSchema =
  createPaginatedSelectSchema(productsClientSelectSchema)

export const productsPaginatedListSchema =
  createPaginatedListQuerySchema(productsClientSelectSchema)

export namespace Product {
  export type Insert = z.infer<typeof productsInsertSchema>
  export type Update = z.infer<typeof productsUpdateSchema>
  export type Record = z.infer<typeof productsSelectSchema>
  export type ClientInsert = z.infer<
    typeof productsClientInsertSchema
  >
  export type ClientUpdate = z.infer<
    typeof productsClientUpdateSchema
  >
  export type ClientRecord = z.infer<
    typeof productsClientSelectSchema
  >
  export type PaginatedList = z.infer<
    typeof productsPaginatedListSchema
  >
}
