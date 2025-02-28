import { protectedProcedure } from '@/server/trpc'
import { authenticatedTransaction } from '@/db/databaseMethods'
import { editOrganizationSchema } from '@/db/schema/organizations'
import { updateOrganization } from '@/db/tableMethods/organizationMethods'

export const editOrganization = protectedProcedure
  .input(editOrganizationSchema)
  .mutation(async ({ input }) => {
    return authenticatedTransaction(
      async ({ transaction, userId }) => {
        const { organization } = input
        await updateOrganization(organization, transaction)
        return {
          data: organization,
        }
      }
    )
  })
