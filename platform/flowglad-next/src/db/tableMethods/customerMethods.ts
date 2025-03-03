import {
  customers,
  customersInsertSchema,
  customersSelectSchema,
  customersUpdateSchema,
} from '@/db/schema/customers'
import {
  createUpsertFunction,
  createSelectById,
  createSelectFunction,
  createInsertFunction,
  ORMMethodCreatorConfig,
  createBulkInsertOrDoNothingFunction,
  createUpdateFunction,
} from '@/db/tableUtils'
import { DbTransaction } from '@/db/types'
import { z } from 'zod'

const config: ORMMethodCreatorConfig<
  typeof customers,
  typeof customersSelectSchema,
  typeof customersInsertSchema,
  typeof customersUpdateSchema
> = {
  selectSchema: customersSelectSchema,
  insertSchema: customersInsertSchema,
  updateSchema: customersUpdateSchema,
}

export const selectCustomerById = createSelectById(customers, config)

export const selectCustomers = createSelectFunction(customers, config)

export const insertCustomer = createInsertFunction(customers, config)

export const updateCustomer = createUpdateFunction(customers, config)

const bulkIdempotentInsertCustomers =
  createBulkInsertOrDoNothingFunction(customers, config)

export const bulkIdempotentInsertCustomersByEmail = (
  data: z.infer<typeof customersInsertSchema>[],
  transaction: DbTransaction
) =>
  bulkIdempotentInsertCustomers(
    data,
    [customers.email, customers.livemode],
    transaction
  )

export const upsertCustomerByEmail = createUpsertFunction(
  customers,
  [customers.email, customers.livemode],
  config
) as (
  data: z.infer<typeof customersInsertSchema>,
  transaction: DbTransaction
) => Promise<z.infer<typeof customersSelectSchema>[]>
