import { protectedProcedure, router } from '@/server/trpc'
import { refundPayment } from '@/server/mutations/refundPayment'
import {
  paymentsClientSelectSchema,
  paymentsPaginatedListSchema,
  paymentsPaginatedSelectSchema,
} from '@/db/schema/payments'
import { authenticatedTransaction } from '@/db/databaseMethods'
import {
  selectPaymentById,
  selectPaymentsPaginated,
} from '@/db/tableMethods/paymentMethods'
import { idInputSchema } from '@/db/tableUtils'
import { trpcToRest } from '@/utils/openapi'
import { generateOpenApiMetas } from '@/utils/openapi'

const { openApiMetas } = generateOpenApiMetas({
  resource: 'Payment',
  tags: ['Payments'],
})

export const paymentsRouteConfigs = {
  ...trpcToRest('payments.list'),
  ...trpcToRest('payments.get'),
}

const listPaymentsProcedure = protectedProcedure
  .meta(openApiMetas.LIST)
  .input(paymentsPaginatedSelectSchema)
  .output(paymentsPaginatedListSchema)
  .query(async ({ ctx, input }) => {
    return authenticatedTransaction(async ({ transaction }) => {
      return selectPaymentsPaginated(input, transaction)
    })
  })

const getPaymentProcedure = protectedProcedure
  .meta(openApiMetas.GET)
  .input(idInputSchema)
  .output(paymentsClientSelectSchema)
  .query(async ({ ctx, input }) => {
    return authenticatedTransaction(async ({ transaction }) => {
      return selectPaymentById(input.id, transaction)
    })
  })

export const paymentsRouter = router({
  refund: refundPayment,
  list: listPaymentsProcedure,
  get: getPaymentProcedure,
})
