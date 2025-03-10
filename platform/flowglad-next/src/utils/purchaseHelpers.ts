import Papa from 'papaparse'
import {
  Purchase,
  purchasesInsertSchema,
} from '@/db/schema/purchases'
import { Variant } from '@/db/schema/variants'
import { PriceType, PurchaseStatus } from '@/types'
import {
  BulkImportCustomerProfilesInput,
  CustomerProfile,
} from '@/db/schema/customerProfiles'
import {
  Customer,
  customersInsertSchema,
} from '@/db/schema/customers'
import core from './core'

export const projectVariantFieldsOntoPurchaseFields = (
  variant: Variant.Record
): Pick<
  Purchase.Insert,
  | 'intervalUnit'
  | 'intervalCount'
  | 'pricePerBillingCycle'
  | 'trialPeriodDays'
  | 'firstInvoiceValue'
  | 'totalPurchaseValue'
  | 'priceType'
> | null => {
  let enhancements: Pick<
    Purchase.Insert,
    | 'intervalUnit'
    | 'intervalCount'
    | 'pricePerBillingCycle'
    | 'trialPeriodDays'
    | 'firstInvoiceValue'
    | 'totalPurchaseValue'
    | 'priceType'
  > | null = null
  const nulledSubsriptionFields: Pick<
    Purchase.Insert,
    | 'intervalUnit'
    | 'intervalCount'
    | 'pricePerBillingCycle'
    | 'trialPeriodDays'
  > = {
    intervalUnit: null,
    intervalCount: null,
    pricePerBillingCycle: null,
    trialPeriodDays: null,
  }
  if (variant?.priceType == PriceType.Subscription) {
    enhancements = {
      intervalUnit: variant.intervalUnit,
      intervalCount: variant.intervalCount,
      pricePerBillingCycle: variant.unitPrice,
      trialPeriodDays: variant.trialPeriodDays ?? 0,
      firstInvoiceValue: variant.trialPeriodDays
        ? 0
        : variant.unitPrice,
      totalPurchaseValue: null,
      priceType: PriceType.Subscription,
    } as const
  } else if (variant?.priceType == PriceType.SinglePayment) {
    enhancements = {
      firstInvoiceValue: variant.unitPrice,
      totalPurchaseValue: variant.unitPrice,
      ...nulledSubsriptionFields,
      priceType: PriceType.SinglePayment,
    } as const
  }

  return enhancements
}

export const createManualPurchaseInsert = ({
  customerProfile,
  variant,
  OrganizationId,
}: {
  customerProfile: CustomerProfile.Record
  variant: Variant.Record
  OrganizationId: string
}) => {
  const enhancements = projectVariantFieldsOntoPurchaseFields(variant)
  const purchaseInsert = purchasesInsertSchema.parse({
    CustomerProfileId: customerProfile.id,
    VariantId: variant.id,
    OrganizationId,
    status: PurchaseStatus.Paid,
    name: `${variant.name} - ${customerProfile.name}`,
    priceType: variant.priceType,
    quantity: 1,
    firstInvoiceValue: 0,
    totalPurchaseValue: 0,
    ...enhancements,
  })
  return purchaseInsert
}

interface CustomerCSVRow {
  name?: string
  email: string
  fullName?: string
  firstName?: string
  lastName?: string
  full_name?: string
  first_name?: string
  last_name?: string
}

export const customerAndCustomerProfileInsertsFromCSV = async (
  csvContent: string,
  OrganizationId: string,
  livemode: boolean
) => {
  // Parse CSV to JSON
  const results = await new Promise<CustomerCSVRow[]>((resolve) => {
    Papa.parse(csvContent, {
      header: true, // Treats first row as headers
      dynamicTyping: true, // Automatically converts numbers
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<CustomerCSVRow>) => {
        resolve(results.data as CustomerCSVRow[])
      },
    })
  })

  const customerInserts: Customer.Insert[] = results.map(
    (customer) => {
      let name = customer.name
      if (!name && customer.fullName) {
        name = customer.fullName
      }
      if (!name && customer.firstName && customer.lastName) {
        name = `${customer.firstName} ${customer.lastName}`
      }
      if (!name && customer.full_name) {
        name = customer.full_name
      }
      if (!name && customer.first_name && customer.last_name) {
        name = `${customer.first_name} ${customer.last_name}`
      }
      if (!name) {
        name = ''
      }
      return customersInsertSchema.parse({
        email: customer.email,
        name,
      })
    }
  )

  const customerProfileInserts: Omit<
    CustomerProfile.Insert,
    'CustomerId'
  >[] = results.map((customer) => {
    return {
      email: customer.email,
      name: customer.name,
      OrganizationId,
      externalId: core.nanoid(),
      livemode,
    }
  })

  return { customerInserts, customerProfileInserts }
}

export const customerAndCustomerProfileInsertsFromBulkImport = async (
  input: BulkImportCustomerProfilesInput,
  OrganizationId: string,
  livemode: boolean
) => {
  let customerUpserts: Customer.Insert[] = []
  let incompleteCustomerProfileUpserts: Omit<
    CustomerProfile.Insert,
    'CustomerId'
  >[] = []
  if (input.format === 'csv') {
    const csvContent = input.csvContent
    const result = await customerAndCustomerProfileInsertsFromCSV(
      csvContent,
      OrganizationId,
      livemode
    )
    customerUpserts = result.customerInserts
    incompleteCustomerProfileUpserts = result.customerProfileInserts
  }

  if (input.format === 'object') {
    customerUpserts = input.data.map((row) => {
      const customerUpsert = customersInsertSchema.safeParse({
        email: row.email,
        name: row.name,
      })
      if (!customerUpsert.success) {
        console.error(
          'Invalid customer data:',
          customerUpsert.error,
          'For row:',
          row
        )
        throw new Error('Invalid customer data')
      }
      return customerUpsert.data
    })
  }

  return { customerUpserts, incompleteCustomerProfileUpserts }
}
