import * as R from 'ramda'
import { publicProcedure } from '@/server/trpc'
import { adminTransaction } from '@/db/databaseMethods'
import { attemptDiscountCodeInputSchema } from '@/db/schema/discounts'
import { selectDiscounts } from '@/db/tableMethods/discountMethods'
import { selectProducts } from '@/db/tableMethods/productMethods'
import { selectPurchaseById } from '@/db/tableMethods/purchaseMethods'
import { findPurchaseSession } from '@/utils/purchaseSessionState'
import { editPurchaseSession } from '@/utils/bookkeeping/purchaseSessions'

export const attemptDiscountCode = publicProcedure
  .input(attemptDiscountCodeInputSchema)
  .mutation(async ({ input }) => {
    const isValid = await adminTransaction(
      async ({ transaction }) => {
        // Find active discounts with matching code
        const matchingDiscounts = await selectDiscounts(
          {
            code: input.code,
          },
          transaction
        )

        if (matchingDiscounts.length === 0) {
          return false
        }

        const discount = matchingDiscounts[0]

        if (!discount.active) {
          return false
        }

        // Check if product or purchase exists and get its OrganizationId
        let OrganizationId: string | null = null

        if ('productId' in input) {
          const products = await selectProducts(
            {
              id: input.productId,
            },
            transaction
          )
          OrganizationId = products[0]?.OrganizationId
        } else {
          const purchase = await selectPurchaseById(
            input.purchaseId,
            transaction
          )
          OrganizationId = purchase?.OrganizationId
        }

        if (!OrganizationId) {
          return false
        }

        const purchaseSession = await findPurchaseSession(
          input,
          transaction
        )

        if (!purchaseSession) {
          return false
        }

        await editPurchaseSession(
          {
            purchaseSession: {
              ...purchaseSession,
              DiscountId: matchingDiscounts[0].id,
            },
            purchaseId: R.propOr(null, 'purchaseId', input),
          },
          transaction
        )
        // Verify organization matches
        return matchingDiscounts[0].OrganizationId === OrganizationId
      }
    )

    return { isValid }
  })
