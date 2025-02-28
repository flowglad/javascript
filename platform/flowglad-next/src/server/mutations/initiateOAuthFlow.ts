import { publicProcedure } from '@/server/trpc'
import { authenticatedTransaction } from '@/db/databaseMethods'
import { initiateOAuthFlowForIntegration } from '@/integrations/oauth'
import { selectIntegrationById } from '@/db/tableMethods/integrationMethods'
import { idInputSchema } from '@/db/tableUtils'

export const initiateOAuthFlow = publicProcedure
  .input(idInputSchema)
  .mutation(async ({ input, ctx }) => {
    const { id } = input
    const redirectUrl = await authenticatedTransaction(
      async ({ transaction }) => {
        const integration = await selectIntegrationById(
          id,
          transaction
        )
        return initiateOAuthFlowForIntegration(
          integration,
          transaction
        )
      }
    )
    return {
      data: {
        redirectUrl,
      },
    }
  })
