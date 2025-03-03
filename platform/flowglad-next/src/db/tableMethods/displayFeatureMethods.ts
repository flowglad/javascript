import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  createUpsertFunction,
  ORMMethodCreatorConfig,
} from '@/db/tableUtils'
import {
  displayFeatures,
  displayFeaturesInsertSchema,
  displayFeaturesSelectSchema,
  displayFeaturesUpdateSchema,
} from '@/db/schema/displayFeatures'

const config: ORMMethodCreatorConfig<
  typeof displayFeatures,
  typeof displayFeaturesSelectSchema,
  typeof displayFeaturesInsertSchema,
  typeof displayFeaturesUpdateSchema
> = {
  selectSchema: displayFeaturesSelectSchema,
  insertSchema: displayFeaturesInsertSchema,
  updateSchema: displayFeaturesUpdateSchema,
}

export const selectDisplayFeatureById = createSelectById(
  displayFeatures,
  config
)

export const insertDisplayFeature = createInsertFunction(
  displayFeatures,
  config
)

export const updateDisplayFeature = createUpdateFunction(
  displayFeatures,
  config
)

export const selectDisplayFeatures = createSelectFunction(
  displayFeatures,
  config
)

export const upsertProductFeatureByKeyAndOrganizationId =
  createUpsertFunction(
    displayFeatures,
    [displayFeatures.key, displayFeatures.OrganizationId],
    config
  )
