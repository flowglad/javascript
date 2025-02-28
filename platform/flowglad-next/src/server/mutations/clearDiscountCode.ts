import { publicProcedure } from '@/server/trpc'
import { findPurchaseSession } from '@/utils/purchaseSessionState'
import { editPurchaseSession } from '@/utils/bookkeeping/purchaseSessions'
import { adminTransaction } from '@/db/databaseMethods'
import { productIdOrPurchaseIdSchema } from '@/db/schema/discounts'

export const clearDiscountCode = publicProcedure
  .input(productIdOrPurchaseIdSchema)
  .mutation(async ({ input }) => {
    return adminTransaction(async ({ transaction }) => {
      const purchaseSession = await findPurchaseSession(
        input,
        transaction
      )
      if (!purchaseSession) {
        return false
      }
      const maybePurchaseId = (input as { purchaseId: string })
        .purchaseId
      return editPurchaseSession(
        {
          purchaseSession: {
            ...purchaseSession,
            DiscountId: null,
          },
          purchaseId: maybePurchaseId,
        },
        transaction
      )
    })
  })
