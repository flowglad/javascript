import { text, pgTable, pgPolicy } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import {
  tableBase,
  notNullStringForeignKey,
  constructIndex,
  newConstructUniquenessIndex,
  enhancedCreateInsertSchema,
  createUpdateSchema,
} from '@/db/tableUtils'
import { organizations } from '@/db/schema/organizations'
import core from '@/utils/core'
import { createSelectSchema } from 'drizzle-zod'

const TABLE_NAME = 'ProductFeatures'

export const productFeatures = pgTable(
  TABLE_NAME,
  {
    ...tableBase('productFeature'),
    OrganizationId: notNullStringForeignKey(
      'OrganizationId',
      organizations
    ),
    label: text('label').notNull(),
    description: text('description').notNull(),
    key: text('key').notNull(),
  },
  (table) => {
    return [
      constructIndex(TABLE_NAME, [table.OrganizationId]),
      newConstructUniquenessIndex(TABLE_NAME, [
        table.key,
        table.OrganizationId,
      ]),
      pgPolicy('Enable read for own organizations', {
        as: 'permissive',
        to: 'authenticated',
        for: 'all',
        using: sql`"OrganizationId" in (select "OrganizationId" from "Memberships")`,
      }),
    ]
  }
).enableRLS()

const columnRefinements = {}

/*
 * database schema
 */
export const productFeaturesInsertSchema = enhancedCreateInsertSchema(
  productFeatures,
  columnRefinements
)

export const productFeaturesSelectSchema =
  createSelectSchema(productFeatures).extend(columnRefinements)

export const productFeaturesUpdateSchema = createUpdateSchema(
  productFeatures,
  columnRefinements
)

const readOnlyColumns = {
  OrganizationId: true,
} as const

/*
 * client schemas
 */
export const productFeatureClientInsertSchema =
  productFeaturesInsertSchema.omit(readOnlyColumns)

export const productFeatureClientUpdateSchema =
  productFeaturesUpdateSchema.omit(readOnlyColumns)

export const productFeatureClientSelectSchema =
  productFeaturesSelectSchema

export namespace ProductFeature {
  export type Insert = z.infer<typeof productFeaturesInsertSchema>
  export type Update = z.infer<typeof productFeaturesUpdateSchema>
  export type Record = z.infer<typeof productFeaturesSelectSchema>
  export type ClientInsert = z.infer<
    typeof productFeatureClientInsertSchema
  >
  export type ClientUpdate = z.infer<
    typeof productFeatureClientUpdateSchema
  >
  export type ClientRecord = z.infer<
    typeof productFeatureClientSelectSchema
  >
}

export const createProductFeatureInputSchema = z.object({
  productFeature: productFeatureClientInsertSchema,
})

export type CreateProductFeatureInput = z.infer<
  typeof createProductFeatureInputSchema
>

export const editProductFeatureInputSchema = z.object({
  productFeature: productFeatureClientUpdateSchema,
})

export type EditProductFeatureInput = z.infer<
  typeof editProductFeatureInputSchema
>
