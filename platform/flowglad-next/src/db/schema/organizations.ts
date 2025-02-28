import * as R from 'ramda'
import { z } from 'zod'
import { pgTable, text, boolean } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import {
  enhancedCreateInsertSchema,
  pgEnumColumn,
  constructIndex,
  constructUniqueIndex,
  tableBase,
  newBaseZodSelectSchemaColumns,
  nullableStringForeignKey,
  notNullStringForeignKey,
} from '@/db/tableUtils'
import { countries } from '@/db/schema/countries'
import core from '@/utils/core'
import {
  BusinessOnboardingStatus,
  CurrencyCode,
  StripeConnectContractType,
} from '@/types'

const TABLE_NAME = 'Organizations'

export const organizations = pgTable(
  TABLE_NAME,
  {
    ...R.omit(['livemode'], tableBase('org')),
    name: text('name').notNull(),
    stripeAccountId: text('stripeAccountId').unique(),
    domain: text('domain').unique(),
    CountryId: notNullStringForeignKey('CountryId', countries),
    logoURL: text('logoURL'),
    tagline: text('tagline'),
    subdomainSlug: text('subdomainSlug').unique(),
    payoutsEnabled: boolean('payoutsEnabled')
      .notNull()
      .default(false),
    onboardingStatus: pgEnumColumn({
      enumName: 'BusinessOnboardingStatus',
      columnName: 'onboardingStatus',
      enumBase: BusinessOnboardingStatus,
    }),
    feePercentage: text('feePercentage').notNull().default('3.00'),
    defaultCurrency: pgEnumColumn({
      enumName: 'CurrencyCode',
      columnName: 'defaultCurrency',
      enumBase: CurrencyCode,
    }).notNull(),
    stripeConnectContractType: pgEnumColumn({
      enumName: 'StripeConnectContractType',
      columnName: 'stripeConnectContractType',
      enumBase: StripeConnectContractType,
    })
      .notNull()
      .default(StripeConnectContractType.Platform),
  },
  (table) => {
    return [
      constructIndex(TABLE_NAME, [table.name]),
      constructUniqueIndex(TABLE_NAME, [table.stripeAccountId]),
      constructUniqueIndex(TABLE_NAME, [table.domain]),
      constructIndex(TABLE_NAME, [table.CountryId]),
    ]
  }
).enableRLS()

const columnRefinements = {
  onboardingStatus: core.createSafeZodEnum(BusinessOnboardingStatus),
  defaultCurrency: core.createSafeZodEnum(CurrencyCode),
}

export const organizationsSelectSchema = createSelectSchema(
  organizations,
  {
    ...newBaseZodSelectSchemaColumns,
    ...columnRefinements,
  }
)

export const organizationsInsertSchema = enhancedCreateInsertSchema(
  organizations,
  columnRefinements
)

export const organizationsUpdateSchema = organizationsInsertSchema
  .partial()
  .extend({
    id: z.string(),
  })

const hiddenColumns = {
  feePercentage: true,
  stripeAccountId: true,
  stripeConnectContractType: true,
} as const

const readOnlyColumns = {
  stripeAccountId: true,
  payoutsEnabled: true,
  onboardingStatus: true,
  subdomainSlug: true,
  domain: true,
  tagline: true,
  defaultCurrency: true,
} as const

export const organizationsClientSelectSchema =
  organizationsSelectSchema.omit(hiddenColumns)

export const organizationsClientUpdateSchema =
  organizationsUpdateSchema.omit({
    ...hiddenColumns,
    ...readOnlyColumns,
  })

export const organizationsClientInsertSchema =
  organizationsInsertSchema.omit({
    ...hiddenColumns,
    ...readOnlyColumns,
  })

export namespace Organization {
  export type Insert = z.infer<typeof organizationsInsertSchema>
  export type Update = z.infer<typeof organizationsUpdateSchema>
  export type Record = z.infer<typeof organizationsSelectSchema>
  export type ClientInsert = z.infer<
    typeof organizationsClientInsertSchema
  >
  export type ClientRecord = z.infer<
    typeof organizationsClientSelectSchema
  >
  export type ClientUpdate = z.infer<
    typeof organizationsClientUpdateSchema
  >
}

export const createOrganizationSchema = z.object({
  organization: organizationsClientInsertSchema,
})

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationSchema
>

export const editOrganizationSchema = z.object({
  organization: organizationsClientUpdateSchema,
})

export type EditOrganizationInput = z.infer<
  typeof editOrganizationSchema
>
