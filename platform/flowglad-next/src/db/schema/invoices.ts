import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { createSelectSchema } from 'drizzle-zod'
import {
  pgEnumColumn,
  enhancedCreateInsertSchema,
  taxColumns,
  taxSchemaColumns,
  tableBase,
  constructIndex,
  constructUniqueIndex,
  createUpdateSchema,
  notNullStringForeignKey,
  livemodePolicy,
  nullableStringForeignKey,
  createPaginatedListQuerySchema,
  createPaginatedSelectSchema,
} from '@/db/tableUtils'
import { purchases } from './purchases'
import {
  IntervalUnit,
  InvoiceStatus,
  IdNumberParam,
  InvoiceType,
  CurrencyCode,
} from '@/types'
import core from '@/utils/core'
import { customerProfiles } from './customerProfiles'
import { organizations } from './organizations'
import { billingPeriods } from './billingPeriods'
import { memberships } from './memberships'

export const TABLE_NAME = 'Invoices'

export const invoices = pgTable(
  TABLE_NAME,
  {
    ...tableBase('inv'),
    PurchaseId: nullableStringForeignKey('PurchaseId', purchases),
    invoiceNumber: text('invoiceNumber').notNull().unique(),
    invoiceDate: timestamp('invoiceDate').notNull().defaultNow(),
    BillingPeriodId: nullableStringForeignKey(
      'BillingPeriodId',
      billingPeriods
    ),
    /**
     * If this is null, the invoice is due upon receipt
     */
    dueDate: timestamp('dueDate'),
    stripePaymentIntentId: text('stripePaymentIntentId'),
    CustomerProfileId: notNullStringForeignKey(
      'CustomerProfileId',
      customerProfiles
    ).notNull(),
    OrganizationId: notNullStringForeignKey(
      'OrganizationId',
      organizations
    ),
    status: pgEnumColumn({
      enumName: 'InvoiceStatus',
      columnName: 'status',
      enumBase: InvoiceStatus,
    })
      .notNull()
      .default(InvoiceStatus.Draft),
    billingInterval: pgEnumColumn({
      enumName: 'interval',
      columnName: 'billingInterval',
      enumBase: IntervalUnit,
    }),
    billingPeriodStartDate: timestamp('billingPeriodStartDate'),
    billingPeriodEndDate: timestamp('billingPeriodEndDate'),
    billingIntervalCount: integer('billingIntervalCount'),
    billingAnchorDate: timestamp('billingAnchorDate'),
    ownerMembershipId: nullableStringForeignKey(
      'ownerMembershipId',
      memberships
    ),
    pdfURL: text('pdfURL'),
    memo: text('memo'),
    bankPaymentOnly: boolean('bankPaymentOnly').default(false),
    type: pgEnumColumn({
      enumName: 'InvoiceType',
      columnName: 'type',
      enumBase: InvoiceType,
    }),
    currency: pgEnumColumn({
      enumName: 'CurrencyCode',
      columnName: 'currency',
      enumBase: CurrencyCode,
    }).notNull(),
    ...taxColumns(),
  },
  (table) => {
    return [
      constructUniqueIndex(TABLE_NAME, [table.invoiceNumber]),
      constructIndex(TABLE_NAME, [table.PurchaseId]),
      constructIndex(TABLE_NAME, [table.status]),
      constructIndex(TABLE_NAME, [table.CustomerProfileId]),
      constructIndex(TABLE_NAME, [table.stripePaymentIntentId]),
      constructIndex(TABLE_NAME, [table.OrganizationId]),
      livemodePolicy(),
    ]
  }
).enableRLS()

const refineColumns = {
  status: core.createSafeZodEnum(InvoiceStatus),
  type: core.createSafeZodEnum(InvoiceType),
  currency: core.createSafeZodEnum(CurrencyCode),
  ...taxSchemaColumns,
}

const coreInvoicesInsertSchema = enhancedCreateInsertSchema(
  invoices,
  refineColumns
)

const purchaseInvoiceColumnExtensions = {
  type: z.literal(InvoiceType.Purchase),
  PurchaseId: z.string(),
  BillingPeriodId: z.null(),
}

const subscriptionInvoiceColumnExtensions = {
  type: z.literal(InvoiceType.Subscription),
  PurchaseId: z.null(),
  BillingPeriodId: z.string(),
}

const purchaseInvoiceInsertSchema = coreInvoicesInsertSchema.extend(
  purchaseInvoiceColumnExtensions
)

const subscriptionInvoiceInsertSchema =
  coreInvoicesInsertSchema.extend(subscriptionInvoiceColumnExtensions)

export const invoicesInsertSchema = z.discriminatedUnion('type', [
  purchaseInvoiceInsertSchema,
  subscriptionInvoiceInsertSchema,
])

const coreInvoicesSelectSchema = createSelectSchema(
  invoices,
  refineColumns
)

export const purchaseInvoiceSelectSchema =
  coreInvoicesSelectSchema.extend(purchaseInvoiceColumnExtensions)

export const subscriptionInvoiceSelectSchema =
  coreInvoicesSelectSchema.extend(subscriptionInvoiceColumnExtensions)

export const invoicesSelectSchema = z.discriminatedUnion('type', [
  purchaseInvoiceSelectSchema,
  subscriptionInvoiceSelectSchema,
])

const coreInvoicesUpdateSchema = createUpdateSchema(
  invoices,
  refineColumns
)

export const purchaseInvoiceUpdateSchema =
  coreInvoicesUpdateSchema.extend(purchaseInvoiceColumnExtensions)

export const subscriptionInvoiceUpdateSchema =
  coreInvoicesUpdateSchema.extend(subscriptionInvoiceColumnExtensions)

export const invoicesUpdateSchema = z.discriminatedUnion('type', [
  purchaseInvoiceUpdateSchema,
  subscriptionInvoiceUpdateSchema,
])

const hiddenColumns = {
  stripePaymentIntentId: true,
  stripeTaxCalculationId: true,
  stripeTaxTransactionId: true,
} as const

const createOnlyColumns = {
  CustomerProfileId: true,
  OrganizationId: true,
  PurchaseId: true,
} as const

const readOnlyColumns = {
  OrganizationId: true,
  livemode: true,
  applicationFee: true,
  taxRatePercentage: true,
  taxAmount: true,
} as const

const nonClientEditableColumns = {
  ...hiddenColumns,
  ...createOnlyColumns,
  ...readOnlyColumns,
} as const

export const purchaseInvoiceClientSelectSchema =
  purchaseInvoiceSelectSchema.omit(hiddenColumns)
export const subscriptionInvoiceClientSelectSchema =
  subscriptionInvoiceSelectSchema.omit(hiddenColumns)
export const invoicesClientSelectSchema = z.discriminatedUnion(
  'type',
  [
    purchaseInvoiceClientSelectSchema,
    subscriptionInvoiceClientSelectSchema,
  ]
)

export const purchaseInvoiceClientInsertSchema =
  purchaseInvoiceInsertSchema.omit(createOnlyColumns)
export const subscriptionInvoiceClientInsertSchema =
  subscriptionInvoiceInsertSchema.omit(createOnlyColumns)
export const invoicesClientInsertSchema = z.discriminatedUnion(
  'type',
  [
    purchaseInvoiceClientInsertSchema,
    subscriptionInvoiceClientInsertSchema,
  ]
)

export const purchaseInvoiceClientUpdateSchema =
  purchaseInvoiceUpdateSchema.omit(nonClientEditableColumns)
export const subscriptionInvoiceClientUpdateSchema =
  subscriptionInvoiceUpdateSchema.omit(nonClientEditableColumns)
export const invoicesClientUpdateSchema = z.discriminatedUnion(
  'type',
  [
    purchaseInvoiceClientUpdateSchema,
    subscriptionInvoiceClientUpdateSchema,
  ]
)

export const invoicesPaginatedSelectSchema =
  createPaginatedSelectSchema(invoicesClientSelectSchema)

export const invoicesPaginatedListSchema =
  createPaginatedListQuerySchema<
    z.infer<typeof invoicesClientSelectSchema>
  >(invoicesClientSelectSchema)

export namespace Invoice {
  export type Insert = z.infer<typeof invoicesInsertSchema>
  export type Update = z.infer<typeof invoicesUpdateSchema>
  export type Record = z.infer<typeof invoicesSelectSchema>
  export type ClientInsert = z.infer<
    typeof invoicesClientInsertSchema
  >
  export type ClientUpdate = z.infer<
    typeof invoicesClientUpdateSchema
  >
  export type ClientRecord = z.infer<
    typeof invoicesClientSelectSchema
  >
  export type PaginatedList = z.infer<
    typeof invoicesPaginatedListSchema
  >
}
