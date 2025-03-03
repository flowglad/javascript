import { text, pgTable, pgPolicy } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import {
  tableBase,
  notNullStringForeignKey,
  constructIndex,
  constructUniquenessIndex,
  enhancedCreateInsertSchema,
  createUpdateSchema,
} from '@/db/tableUtils'
import { organizations } from '@/db/schema/organizations'
import { createSelectSchema } from 'drizzle-zod'
import { sql } from 'drizzle-orm'

const TABLE_NAME = 'DisplayFeatures'

export const displayFeatures = pgTable(
  TABLE_NAME,
  {
    ...tableBase('dispf'),
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
      constructUniquenessIndex(TABLE_NAME, [
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
export const displayFeaturesInsertSchema = enhancedCreateInsertSchema(
  displayFeatures,
  columnRefinements
)

export const displayFeaturesSelectSchema =
  createSelectSchema(displayFeatures).extend(columnRefinements)

export const displayFeaturesUpdateSchema = createUpdateSchema(
  displayFeatures,
  columnRefinements
)

const readOnlyColumns = {
  OrganizationId: true,
} as const

/*
 * client schemas
 */
export const displayFeatureClientInsertSchema =
  displayFeaturesInsertSchema.omit(readOnlyColumns)

export const displayFeatureClientUpdateSchema =
  displayFeaturesUpdateSchema.omit(readOnlyColumns)

export const displayFeatureClientSelectSchema =
  displayFeaturesSelectSchema

export namespace DisplayFeature {
  export type Insert = z.infer<typeof displayFeaturesInsertSchema>
  export type Update = z.infer<typeof displayFeaturesUpdateSchema>
  export type Record = z.infer<typeof displayFeaturesSelectSchema>
  export type ClientInsert = z.infer<
    typeof displayFeatureClientInsertSchema
  >
  export type ClientUpdate = z.infer<
    typeof displayFeatureClientUpdateSchema
  >
  export type ClientRecord = z.infer<
    typeof displayFeatureClientSelectSchema
  >
}

export const createDisplayFeatureInputSchema = z.object({
  displayFeature: displayFeatureClientInsertSchema,
})

export type CreateDisplayFeatureInput = z.infer<
  typeof createDisplayFeatureInputSchema
>

export const editDisplayFeatureInputSchema = z.object({
  displayFeature: displayFeatureClientUpdateSchema,
})

export type EditDisplayFeatureInput = z.infer<
  typeof editDisplayFeatureInputSchema
>
