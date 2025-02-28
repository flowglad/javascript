import { protectedProcedure } from '@/server/trpc'
import { authenticatedTransaction } from '@/db/databaseMethods'
import { editVariantSchema } from '@/db/schema/variants'
import { editVariantTransaction } from '@/utils/catalog'

export const editVariant = protectedProcedure
  .input(editVariantSchema)
  .mutation(async ({ input }) => {
    return authenticatedTransaction(
      async ({ transaction, userId }) => {
        const { variant } = input

        const updatedVariant = await editVariantTransaction(
          { variant },
          transaction
        )
        return updatedVariant
      }
    )
  })
