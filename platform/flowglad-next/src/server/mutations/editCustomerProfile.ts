import { protectedProcedure } from '@/server/trpc'
import { authenticatedTransaction } from '@/db/databaseMethods'
import {
  editCustomerProfileInputSchema,
  editCustomerProfileOutputSchema,
} from '@/db/schema/customerProfiles'
import { updateCustomerProfile } from '@/db/tableMethods/customerProfileMethods'

export const editCustomerProfile = protectedProcedure
  .input(editCustomerProfileInputSchema)
  .output(editCustomerProfileOutputSchema)
  .mutation(async ({ input }) => {
    return authenticatedTransaction(async ({ transaction }) => {
      const { customerProfile } = input

      const updatedCustomerProfile = await updateCustomerProfile(
        customerProfile,
        transaction
      )
      return {
        customerProfile: updatedCustomerProfile,
      }
    })
  })
