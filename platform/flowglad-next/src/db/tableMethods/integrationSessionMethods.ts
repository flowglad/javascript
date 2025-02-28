import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  createDeleteFunction,
  ORMMethodCreatorConfig,
} from '@/db/tableUtils'
import {
  integrationSessions,
  integrationSessionsInsertSchema,
  integrationSessionsSelectSchema,
  integrationSessionsUpdateSchema,
} from '@/db/schema/integrationSessions'

const config: ORMMethodCreatorConfig<
  typeof integrationSessions,
  typeof integrationSessionsSelectSchema,
  typeof integrationSessionsInsertSchema,
  typeof integrationSessionsUpdateSchema
> = {
  selectSchema: integrationSessionsSelectSchema,
  insertSchema: integrationSessionsInsertSchema,
  updateSchema: integrationSessionsUpdateSchema,
}

export const selectIntegrationSessionById = createSelectById(
  integrationSessions,
  config
)

export const insertIntegrationSession = createInsertFunction(
  integrationSessions,
  config
)

export const updateIntegrationSession = createUpdateFunction(
  integrationSessions,
  config
)

export const selectIntegrationSessions = createSelectFunction(
  integrationSessions,
  config
)

export const deleteIntegrationSession = createDeleteFunction(
  integrationSessions
)
