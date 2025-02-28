import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  ORMMethodCreatorConfig,
} from '@/db/tableUtils'
import {
  integrations,
  integrationsInsertSchema,
  integrationsSelectSchema,
  integrationsUpdateSchema,
} from '@/db/schema/integrations'

const config: ORMMethodCreatorConfig<
  typeof integrations,
  typeof integrationsSelectSchema,
  typeof integrationsInsertSchema,
  typeof integrationsUpdateSchema
> = {
  selectSchema: integrationsSelectSchema,
  insertSchema: integrationsInsertSchema,
  updateSchema: integrationsUpdateSchema,
}

export const selectIntegrationById = createSelectById(
  integrations,
  config
)

export const insertIntegration = createInsertFunction(
  integrations,
  config
)

export const updateIntegration = createUpdateFunction(
  integrations,
  config
)

export const selectIntegrations = createSelectFunction(
  integrations,
  config
)
