import { protectedProcedure } from '@/server/trpc'
import { authenticatedTransaction } from '@/db/databaseMethods'
import { selectFocusedMembershipAndOrganization } from '@/db/tableMethods/membershipMethods'

export const getFocusedMembership = protectedProcedure.query(
  async () => {
    const focusedMembership = await authenticatedTransaction(
      async ({ transaction, userId }) => {
        return selectFocusedMembershipAndOrganization(
          userId,
          transaction
        )
      }
    )
    return focusedMembership
  }
)
