import {
  boolean,
  text,
  timestamp,
  pgTable,
  pgPolicy,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import {
  tableBase,
  notNullStringForeignKey,
  constructIndex,
  enhancedCreateInsertSchema,
  createUpdateSchema,
  livemodePolicy,
  idInputSchema,
  pgEnumColumn,
  ommittedColumnsForInsertSchema,
} from '@/db/tableUtils'
import { organizations } from '@/db/schema/organizations'
import { FlowgladApiKeyType } from '@/types'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import core from '@/utils/core'

const TABLE_NAME = 'ApiKeys'

export const apiKeys = pgTable(
  TABLE_NAME,
  {
    ...tableBase('apiKey'),
    OrganizationId: notNullStringForeignKey(
      'OrganizationId',
      organizations
    ),
    name: text('name').notNull(),
    token: text('token').notNull(),
    active: boolean('active').notNull().default(true),
    unkeyId: text('unkeyId').notNull(),
    type: pgEnumColumn({
      enumName: 'apiKeyType',
      columnName: 'type',
      enumBase: FlowgladApiKeyType,
    }).notNull(),
  },
  (table) => {
    return [
      constructIndex(TABLE_NAME, [table.OrganizationId]),
      pgPolicy('Enable all actions for own organizations', {
        as: 'permissive',
        to: 'authenticated',
        for: 'all',
        using: sql`"OrganizationId" in (select "OrganizationId" from "Memberships")`,
      }),
      livemodePolicy(),
    ]
  }
).enableRLS()

const columnRefinements = {
  type: core.createSafeZodEnum(FlowgladApiKeyType),
}

/*
 * database schemas
 */
export const apiKeysInsertSchema = createInsertSchema(
  apiKeys,
  columnRefinements
).omit(ommittedColumnsForInsertSchema)

export const apiKeysSelectSchema = createSelectSchema(
  apiKeys,
  columnRefinements
).extend(columnRefinements)

export const apiKeysUpdateSchema = createUpdateSchema(
  apiKeys,
  columnRefinements
)

const readOnlyColumns = {
  OrganizationId: true,
  livemode: true,
  token: true,
} as const

const hiddenColumns = {
  unkeyId: true,
} as const

const nonClientEditableColumns = {
  ...hiddenColumns,
  ...readOnlyColumns,
} as const

/*
 * client schemas
 */
export const apiKeyClientInsertSchema = apiKeysInsertSchema.omit(
  nonClientEditableColumns
)

export const apiKeyClientUpdateSchema = apiKeysUpdateSchema.omit(
  nonClientEditableColumns
)

export const apiKeyClientSelectSchema =
  apiKeysSelectSchema.omit(hiddenColumns)

export const apiKeyClientWhereClauseSchema =
  apiKeyClientSelectSchema.partial()

export namespace ApiKey {
  export type Insert = z.infer<typeof apiKeysInsertSchema>
  export type Update = z.infer<typeof apiKeysUpdateSchema>
  export type Record = z.infer<typeof apiKeysSelectSchema>
  export type ClientInsert = z.infer<typeof apiKeyClientInsertSchema>
  export type ClientUpdate = z.infer<typeof apiKeyClientUpdateSchema>
  export type ClientRecord = z.infer<typeof apiKeyClientSelectSchema>
  export type ClientWhereClause = z.infer<
    typeof apiKeyClientWhereClauseSchema
  >
}

export const createApiKeyInputSchema = z.object({
  apiKey: apiKeyClientInsertSchema,
})

export type CreateApiKeyInput = z.infer<
  typeof createApiKeyInputSchema
>

export const editApiKeyInputSchema = z.object({
  apiKey: apiKeyClientUpdateSchema,
})

export type EditApiKeyInput = z.infer<typeof editApiKeyInputSchema>

export const revealApiKeySchema = idInputSchema

export type RevealApiKeyInput = z.infer<typeof revealApiKeySchema>

export const rotateApiKeySchema = idInputSchema

export type RotateApiKeyInput = z.infer<typeof rotateApiKeySchema>
