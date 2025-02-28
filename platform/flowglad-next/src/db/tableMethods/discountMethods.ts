import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  ORMMethodCreatorConfig,
  createDeleteFunction,
  createPaginatedSelectFunction,
} from '@/db/tableUtils'
import {
  discounts,
  discountsInsertSchema,
  discountsSelectSchema,
  discountsUpdateSchema,
} from '@/db/schema/discounts'

const config: ORMMethodCreatorConfig<
  typeof discounts,
  typeof discountsSelectSchema,
  typeof discountsInsertSchema,
  typeof discountsUpdateSchema
> = {
  selectSchema: discountsSelectSchema,
  insertSchema: discountsInsertSchema,
  updateSchema: discountsUpdateSchema,
}

export const selectDiscountById = createSelectById(discounts, config)
export const insertDiscount = createInsertFunction(discounts, config)
export const updateDiscount = createUpdateFunction(discounts, config)
export const selectDiscounts = createSelectFunction(discounts, config)
export const deleteDiscount = createDeleteFunction(discounts)

export const selectDiscountsPaginated = createPaginatedSelectFunction(
  discounts,
  config
)
