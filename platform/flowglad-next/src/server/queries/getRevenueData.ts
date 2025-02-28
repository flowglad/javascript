import { protectedProcedure } from '../trpc'
import { getRevenueDataInputSchema } from '@/db/schema/payments'
import { authenticatedTransaction } from '@/db/databaseMethods'
import { selectRevenueDataForOrganization } from '@/db/tableMethods/paymentMethods'

export const getRevenueData = protectedProcedure
  .input(getRevenueDataInputSchema)
  .query(async ({ input }) => {
    return authenticatedTransaction(async ({ transaction }) => {
      return selectRevenueDataForOrganization(input, transaction)
    })
  })
