import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  ORMMethodCreatorConfig,
} from '@/db/tableUtils'
import {
  paymentMethods,
  paymentMethodsInsertSchema,
  paymentMethodsSelectSchema,
  paymentMethodsUpdateSchema,
} from '@/db/schema/paymentMethods'

const config: ORMMethodCreatorConfig<
  typeof paymentMethods,
  typeof paymentMethodsSelectSchema,
  typeof paymentMethodsInsertSchema,
  typeof paymentMethodsUpdateSchema
> = {
  selectSchema: paymentMethodsSelectSchema,
  insertSchema: paymentMethodsInsertSchema,
  updateSchema: paymentMethodsUpdateSchema,
}

export const selectPaymentMethodById = createSelectById(
  paymentMethods,
  config
)

export const insertPaymentMethod = createInsertFunction(
  paymentMethods,
  config
)

export const updatePaymentMethod = createUpdateFunction(
  paymentMethods,
  config
)

export const selectPaymentMethods = createSelectFunction(
  paymentMethods,
  config
)
