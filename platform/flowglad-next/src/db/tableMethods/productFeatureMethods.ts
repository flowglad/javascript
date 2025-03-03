import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  createUpsertFunction,
  ORMMethodCreatorConfig,
} from '@/db/tableUtils'
import {
  productFeatures,
  productFeaturesInsertSchema,
  productFeaturesSelectSchema,
  productFeaturesUpdateSchema,
} from '@/db/schema/productFeatures'

const config: ORMMethodCreatorConfig<
  typeof productFeatures,
  typeof productFeaturesSelectSchema,
  typeof productFeaturesInsertSchema,
  typeof productFeaturesUpdateSchema
> = {
  selectSchema: productFeaturesSelectSchema,
  insertSchema: productFeaturesInsertSchema,
  updateSchema: productFeaturesUpdateSchema,
}

export const selectProductFeatureById = createSelectById(
  productFeatures,
  config
)

export const insertProductFeature = createInsertFunction(
  productFeatures,
  config
)

export const updateProductFeature = createUpdateFunction(
  productFeatures,
  config
)

export const selectProductFeatures = createSelectFunction(
  productFeatures,
  config
)

export const upsertProductFeatureByKeyAndOrganizationId =
  createUpsertFunction(
    productFeatures,
    [productFeatures.key, productFeatures.OrganizationId],
    config
  )
