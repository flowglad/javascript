import { selectFocusedMembershipAndOrganization } from '@/db/tableMethods/membershipMethods'
import {
  AuthenticatedTransactionParams,
  FlowgladApiKeyType,
} from '@/types'
import { createApiKey as createApiKeyUnkey } from '@/utils/unkey'
import { insertApiKey } from '@/db/tableMethods/apiKeyMethods'
import { CreateApiKeyInput } from '@/db/schema/apiKeys'

export const createApiKeyTransaction = async (
  input: CreateApiKeyInput,
  { transaction, userId, livemode }: AuthenticatedTransactionParams
) => {
  // Get the focused membership and organization
  const focusedMembership =
    await selectFocusedMembershipAndOrganization(userId, transaction)
  if (!focusedMembership) {
    throw new Error('No focused membership found')
  }
  /**
   * Disable the creation of API keys in livemode if the organization does not have payouts enabled
   */
  if (
    !focusedMembership.organization.payoutsEnabled &&
    livemode &&
    input.apiKey.type === FlowgladApiKeyType.Secret
  ) {
    throw new Error(
      `createApiKey: Cannot create livemode secret key.` +
        `Organization ${focusedMembership.organization.name} does not have payouts enabled`
    )
  }
  // Create the API key
  const { apiKeyInsert, shownOnlyOnceKey } = await createApiKeyUnkey({
    name: input.apiKey.name,
    apiEnvironment: livemode ? 'live' : 'test',
    organization: focusedMembership.organization,
    userId,
    type: input.apiKey.type,
  })

  // Insert the API key into the database
  const apiKey = await insertApiKey(apiKeyInsert, transaction)

  return {
    apiKey,
    shownOnlyOnceKey,
  }
}
