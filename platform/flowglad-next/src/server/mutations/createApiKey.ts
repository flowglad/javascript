import { protectedProcedure } from '@/server/trpc'
import { authenticatedTransaction } from '@/db/databaseMethods'
import { createApiKeyInputSchema } from '@/db/schema/apiKeys'
import { createApiKeyTransaction } from '@/utils/apiKeyHelpers'

export const createApiKey = protectedProcedure
  .input(createApiKeyInputSchema)
  .mutation(async ({ input }) => {
    const result = await authenticatedTransaction(
      async ({ transaction, userId, livemode }) => {
        return createApiKeyTransaction(input, {
          transaction,
          userId,
          livemode,
        })
      }
    )

    return {
      apiKey: result.apiKey,
      shownOnlyOnceKey: result.shownOnlyOnceKey,
    }
  })
