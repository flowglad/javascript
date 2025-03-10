import { text, pgTable, pgPolicy, index } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import {
  tableBase,
  notNullStringForeignKey,
  constructIndex,
  constructUniqueIndex,
  enhancedCreateInsertSchema,
  createUpdateSchema,
  livemodePolicy,
} from '@/db/tableUtils'
import { organizations } from '@/db/schema/organizations'
import { createSelectSchema } from 'drizzle-zod'
import { sql } from 'drizzle-orm'
import {
  productsSupabaseUpdatePayloadSchema,
  productsSupabaseInsertPayloadSchema,
} from './products'
import {
  variantsSupabaseUpdatePayloadSchema,
  variantsSupabaseInsertPayloadSchema,
} from './variants'
import {
  customerProfilesSupabaseInsertPayloadSchema,
  customerProfilesSupabaseUpdatePayloadSchema,
} from './customerProfiles'
import {
  discountsSupabaseInsertPayloadSchema,
  discountsSupabaseUpdatePayloadSchema,
} from './discounts'

const TABLE_NAME = 'ProperNouns'

export const properNouns = pgTable(
  TABLE_NAME,
  {
    ...tableBase('properNoun'),
    name: text('name').notNull(),
    EntityId: text('EntityId').notNull(),
    entityType: text('entityType').notNull(),
    OrganizationId: notNullStringForeignKey(
      'OrganizationId',
      organizations
    ),
  },
  (table) => {
    return [
      constructIndex(TABLE_NAME, [table.OrganizationId]),
      constructUniqueIndex(TABLE_NAME, [
        table.EntityId,
        table.entityType,
      ]),
      constructIndex(TABLE_NAME, [
        table.entityType,
        table.EntityId,
        table.OrganizationId,
      ]),
      constructIndex(TABLE_NAME, [table.name]),
      index('proper_noun_name_search_index').using(
        'gin',
        sql`to_tsvector('english', ${table.name})`
      ),
      constructIndex(TABLE_NAME, [table.EntityId]),
      pgPolicy('Enable read for own organizations', {
        as: 'permissive',
        to: 'authenticated',
        for: 'select',
        using: sql`"OrganizationId" in (select "OrganizationId" from "Memberships" where "UserId" = requesting_user_id())`,
      }),
      livemodePolicy(),
    ]
  }
).enableRLS()

// No column refinements needed since we only have string columns
const columnRefinements = {}

/*
 * database schemas
 */
export const properNounsInsertSchema = enhancedCreateInsertSchema(
  properNouns,
  columnRefinements
)

export const properNounsSelectSchema = createSelectSchema(properNouns)

export const properNounsUpdateSchema = createUpdateSchema(properNouns)

const createOnlyColumns = {} as const

const readOnlyColumns = {
  OrganizationId: true,
  EntityId: true,
  entityType: true,
  livemode: true,
} as const

/*
 * client schemas
 */
export const properNounClientInsertSchema =
  properNounsInsertSchema.omit(readOnlyColumns)

export const properNounClientUpdateSchema =
  properNounsUpdateSchema.omit({
    ...readOnlyColumns,
    ...createOnlyColumns,
  })

export const properNounClientSelectSchema = properNounsSelectSchema

export const properNounSupabaseWebhookInsertPayloadSchema =
  z.discriminatedUnion('table', [
    productsSupabaseInsertPayloadSchema,
    variantsSupabaseInsertPayloadSchema,
    customerProfilesSupabaseInsertPayloadSchema,
    discountsSupabaseInsertPayloadSchema,
  ])

export const properNounSupabaseWebhookUpdatePayloadSchema =
  z.discriminatedUnion('table', [
    productsSupabaseUpdatePayloadSchema,
    variantsSupabaseUpdatePayloadSchema,
    customerProfilesSupabaseUpdatePayloadSchema,
    discountsSupabaseUpdatePayloadSchema,
  ])

export namespace ProperNoun {
  export type Insert = z.infer<typeof properNounsInsertSchema>
  export type Update = z.infer<typeof properNounsUpdateSchema>
  export type Record = z.infer<typeof properNounsSelectSchema>
  export type ClientRecord = z.infer<
    typeof properNounClientSelectSchema
  >
}
