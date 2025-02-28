import { protectedProcedure } from '@/server/trpc'
import { authenticatedTransaction } from '@/db/databaseMethods'
import {
  Variant,
  variantSelectClauseSchema,
} from '@/db/schema/variants'
import { selectVariants } from '@/db/tableMethods/variantMethods'

export const getVariants = protectedProcedure
  .input(variantSelectClauseSchema)
  .query(async ({ input }) => {
    const variants: Variant.ClientRecord[] =
      await authenticatedTransaction(async ({ transaction }) => {
        return selectVariants(input, transaction)
      })
    return {
      variants,
    }
  })
