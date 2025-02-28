import {
  organizations,
  organizationsInsertSchema,
  organizationsSelectSchema,
  organizationsUpdateSchema,
} from '@/db/schema/organizations'
import {
  createUpsertFunction,
  createSelectById,
  createSelectFunction,
  ORMMethodCreatorConfig,
  createInsertFunction,
  createUpdateFunction,
} from '@/db/tableUtils'

const config: ORMMethodCreatorConfig<
  typeof organizations,
  typeof organizationsSelectSchema,
  typeof organizationsInsertSchema,
  typeof organizationsUpdateSchema
> = {
  selectSchema: organizationsSelectSchema,
  insertSchema: organizationsInsertSchema,
  updateSchema: organizationsUpdateSchema,
}

export const selectOrganizationById = createSelectById(
  organizations,
  config
)

export const upsertOrganizationByName = createUpsertFunction(
  organizations,
  organizations.name,
  config
)

export const upsertOrganizationByStripeAccountId =
  createUpsertFunction(
    organizations,
    organizations.stripeAccountId,
    config
  )

export const selectOrganizations = createSelectFunction(
  organizations,
  config
)

export const insertOrganization = createInsertFunction(
  organizations,
  config
)

export const updateOrganization = createUpdateFunction(
  organizations,
  config
)
