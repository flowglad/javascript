import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  ORMMethodCreatorConfig,
} from '@/db/tableUtils'
import {
  ApiKey,
  apiKeys,
  apiKeysInsertSchema,
  apiKeysSelectSchema,
  apiKeysUpdateSchema,
} from '@/db/schema/apiKeys'
import { encrypt } from '@/utils/encryption'
import { DbTransaction } from '@/types'
import { UserRecord, users } from '@/db/schema/users'
import { memberships } from '../schema/memberships'
import { eq } from 'drizzle-orm'

const config: ORMMethodCreatorConfig<
  typeof apiKeys,
  typeof apiKeysSelectSchema,
  typeof apiKeysInsertSchema,
  typeof apiKeysUpdateSchema
> = {
  selectSchema: apiKeysSelectSchema,
  insertSchema: apiKeysInsertSchema,
  updateSchema: apiKeysUpdateSchema,
}

export const selectApiKeyById = createSelectById(apiKeys, config)

export const insertApiKey = createInsertFunction(apiKeys, config)

export const updateApiKey = createUpdateFunction(apiKeys, config)

export const selectApiKeys = createSelectFunction(apiKeys, config)
