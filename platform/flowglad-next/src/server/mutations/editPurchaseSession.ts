import { publicProcedure } from '@/server/trpc'
import { adminTransaction } from '@/db/databaseMethods'
import { editPurchaseSessionInputSchema } from '@/db/schema/purchaseSessions'
import { editPurchaseSession as editPurchaseSessionFn } from '@/utils/bookkeeping/purchaseSessions'

export const editPurchaseSession = publicProcedure
  .input(editPurchaseSessionInputSchema)
  .mutation(async ({ input }) => {
    return adminTransaction(async ({ transaction }) => {
      return editPurchaseSessionFn(input, transaction)
    })
  })
