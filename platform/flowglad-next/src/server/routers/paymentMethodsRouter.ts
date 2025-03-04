import { protectedProcedure, router } from '@/server/trpc'
import { authenticatedTransaction } from '@/db/databaseMethods'
import {
  selectPaymentMethodById,
  selectPaymentMethodsPaginated,
} from '@/db/tableMethods/paymentMethodMethods'
import { idInputSchema } from '@/db/tableUtils'
import { generateOpenApiMetas } from '@/utils/openapi'
import {
  paymentMethodsPaginatedListSchema,
  paymentMethodsPaginatedSelectSchema,
  paymentMethodClientSelectSchema,
} from '@/db/schema/paymentMethods'

const { openApiMetas, routeConfigs } = generateOpenApiMetas({
  resource: 'PaymentMethod',
  tags: ['PaymentMethods'],
})

export const paymentMethodsRouteConfigs = routeConfigs

const listPaymentMethodsProcedure = protectedProcedure
  .meta(openApiMetas.LIST)
  .input(paymentMethodsPaginatedSelectSchema)
  .output(paymentMethodsPaginatedListSchema)
  .query(async ({ ctx, input }) => {
    return authenticatedTransaction(async ({ transaction }) => {
      return selectPaymentMethodsPaginated(input, transaction)
    })
  })

const getPaymentMethodProcedure = protectedProcedure
  .meta(openApiMetas.GET)
  .input(idInputSchema)
  .output(paymentMethodClientSelectSchema)
  .query(async ({ ctx, input }) => {
    return authenticatedTransaction(async ({ transaction }) => {
      return selectPaymentMethodById(input.id, transaction)
    })
  })

export const paymentMethodsRouter = router({
  list: listPaymentMethodsProcedure,
  get: getPaymentMethodProcedure,
})
