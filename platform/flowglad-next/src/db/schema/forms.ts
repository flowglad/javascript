import { z } from 'zod'
import { pgPolicy, pgTable, text } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import {
  enhancedCreateInsertSchema,
  constructIndex,
  constructUniqueIndex,
  tableBase,
  newBaseZodSelectSchemaColumns,
  createUpdateSchema,
  nullableStringForeignKey,
  notNullStringForeignKey,
  livemodePolicy,
} from '@/db/tableUtils'
import { organizations } from '@/db/schema/organizations'
import { products } from './products'
import { sql } from 'drizzle-orm'

const TABLE_NAME = 'Forms'

export const forms = pgTable(
  TABLE_NAME,
  {
    ...tableBase('form'),
    title: text('title').notNull(),
    OrganizationId: notNullStringForeignKey(
      'OrganizationId',
      organizations
    ),
    ProductId: nullableStringForeignKey('ProductId', products),
  },
  (table) => {
    return [
      constructIndex(TABLE_NAME, [table.OrganizationId]),
      constructUniqueIndex(TABLE_NAME, [table.ProductId]),
      pgPolicy('Enable all for own organizations', {
        as: 'permissive',
        to: 'authenticated',
        for: 'all',
        using: sql`"OrganizationId" in (select "OrganizationId" from "Memberships")`,
        withCheck: sql`"ProductId" is null OR "ProductId" in (select "id" from "Products")`,
      }),
      livemodePolicy(),
    ]
  }
).enableRLS()

const columnRefinements = {}

export const formsSelectSchema = createSelectSchema(forms, {
  ...newBaseZodSelectSchemaColumns,
  ...columnRefinements,
})

export const formsInsertSchema = enhancedCreateInsertSchema(
  forms,
  columnRefinements
)

export const formsUpdateSchema = createUpdateSchema(forms, {
  ...newBaseZodSelectSchemaColumns,
  ...columnRefinements,
})

const createOnlyColumns = {} as const
const readOnlyColumns = {
  OrganizationId: true,
  livemode: true,
} as const

const hiddenColumns = {} as const

const nonClientEditableColumns = {
  ...hiddenColumns,
  ...readOnlyColumns,
} as const

export const formsClientSelectSchema =
  formsSelectSchema.omit(hiddenColumns)
export const formsClientInsertSchema =
  formsInsertSchema.omit(createOnlyColumns)

export const formsClientUpdateSchema = formsClientInsertSchema.omit(
  nonClientEditableColumns
)

export namespace Form {
  export type Insert = z.infer<typeof formsInsertSchema>
  export type Update = z.infer<typeof formsUpdateSchema>
  export type Record = z.infer<typeof formsSelectSchema>
  export type ClientRecord = z.infer<typeof formsClientSelectSchema>
  export type ClientInsert = z.infer<typeof formsClientInsertSchema>
  export type ClientUpdate = z.infer<typeof formsClientUpdateSchema>
}
