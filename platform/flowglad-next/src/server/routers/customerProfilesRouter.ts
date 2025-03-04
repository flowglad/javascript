import { router } from '../trpc'
import { protectedProcedure } from '@/server/trpc'
import {
  adminTransaction,
  authenticatedTransaction,
} from '@/db/databaseMethods'
import { z } from 'zod'
import {
  selectCustomerProfiles,
  selectCustomerProfilesPaginated,
  updateCustomerProfile,
} from '@/db/tableMethods/customerProfileMethods'
import {
  customerProfileClientSelectSchema,
  editCustomerProfileOutputSchema,
  editCustomerProfileInputSchema,
  customerProfilesPaginatedSelectSchema,
  customerProfilesPaginatedListSchema,
} from '@/db/schema/customerProfiles'
import { TRPCError } from '@trpc/server'
import * as R from 'ramda'
import { createOrUpdateCustomerProfile as createCustomerProfileBookkeeping } from '@/utils/bookkeeping'
import { revalidatePath } from 'next/cache'
import {
  selectCustomers,
  upsertCustomerByEmail,
} from '@/db/tableMethods/customerMethods'
import { createCustomerProfileInputSchema } from '@/db/tableMethods/purchaseMethods'
import { createCustomerProfileOutputSchema } from '@/db/schema/purchases'
import {
  createGetOpenApiMeta,
  generateOpenApiMetas,
  trpcToRest,
  RouteConfig,
} from '@/utils/openapi'
import { externalIdInputSchema } from '@/db/tableUtils'
import { selectCatalog } from '@/utils/catalog'
import { variantsClientSelectSchema } from '@/db/schema/variants'
import { productsClientSelectSchema } from '@/db/schema/products'
import { richSubscriptionClientSelectSchema } from '@/subscriptions/schemas'
import { selectRichSubscriptions } from '@/db/tableMethods/subscriptionItemMethods'

const { openApiMetas } = generateOpenApiMetas({
  resource: 'Customer Profile',
  tags: ['Customer Profiles', 'Customer', 'Customer Profile'],
  idParamOverride: 'externalId',
})

export const customerProfilesRouteConfigs: Record<
  string,
  RouteConfig
> = {
  ...trpcToRest('customerProfiles.create', {
    routeParams: ['externalId'],
  }),
  ...trpcToRest('customerProfiles.edit', {
    routeParams: ['externalId'],
  }),
  ...trpcToRest('customerProfiles.get', {
    routeParams: ['externalId'],
  }),
  'GET /customer-profiles/:externalId/billing': {
    procedure: 'customerProfiles.getBilling',
    pattern: new RegExp(`^customer-profiles\/([^\\/]+)\/billing$`),
    mapParams: (matches) => ({
      externalId: matches[0],
    }),
  },
  ...trpcToRest('customerProfiles.list', {
    routeParams: [],
  }),
}

const createCustomerProfileProcedure = protectedProcedure
  .meta(openApiMetas.POST)
  .input(createCustomerProfileInputSchema)
  .output(createCustomerProfileOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const OrganizationId = ctx.OrganizationId
    if (!OrganizationId) {
      throw new Error('OrganizationId is required')
    }
    /**
     * We can't allow an insert on to customers without
     * allowing full table read, it seems.
     * So we insert a customer record and then do the rest of the
     * stuff atomically. Not ideal, but it works.
     */
    const customerRecord = await adminTransaction(
      async ({ transaction }) => {
        const upsertResult = await upsertCustomerByEmail(
          {
            email: input.customerProfile.email,
            name: input.customerProfile.name ?? '',
            billingAddress: null,
            livemode: ctx.livemode,
          },
          transaction
        )
        if (upsertResult.length > 0) {
          return upsertResult[0]
        }
        const customerResult = await selectCustomers(
          {
            email: input.customerProfile.email,
          },
          transaction
        )
        return customerResult[0]
      }
    )
    return authenticatedTransaction(
      async ({ transaction, userId, livemode }) => {
        const { customerProfile } = input
        /**
         * We have to parse the customer record here because of the billingAddress json
         */
        const createdCustomer =
          await createCustomerProfileBookkeeping(
            {
              customer: customerRecord,
              customerProfile: {
                ...customerProfile,
                OrganizationId,
                CustomerId: customerRecord.id,
                livemode: ctx.livemode,
              },
            },
            { transaction, userId, livemode }
          )

        if (ctx.path) {
          await revalidatePath(ctx.path)
        }

        return {
          data: {
            customerProfile: createdCustomer.customerProfile,
          },
        }
      },
      {
        apiKey: R.propOr(undefined, 'apiKey', ctx),
      }
    )
  })

export const editCustomerProfile = protectedProcedure
  .meta(openApiMetas.PUT)
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

export const getCustomerProfile = protectedProcedure
  .meta(openApiMetas.GET)
  .input(
    z.object({
      externalId: z
        .string()
        .describe(
          'The ID of the customer, as defined in your application'
        ),
    })
  )
  .output(
    z.object({ customerProfile: customerProfileClientSelectSchema })
  )
  .query(async ({ input, ctx }) => {
    const OrganizationId = ctx.OrganizationId
    if (!OrganizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'OrganizationId is required',
      })
    }

    const customerProfiles = await authenticatedTransaction(
      async ({ transaction }) => {
        return selectCustomerProfiles(
          { ...input, OrganizationId },
          transaction
        )
      },
      {
        apiKey: ctx.apiKey,
      }
    )

    if (!customerProfiles.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Customer profile with externalId ${input.externalId} not found`,
      })
    }

    return { customerProfile: customerProfiles[0] }
  })

export const getCustomerBilling = protectedProcedure
  .meta(
    createGetOpenApiMeta({
      resource: 'customer-profiles',
      routeSuffix: 'billing',
      summary: 'Get Billing Details',
      tags: ['Customer Profiles', 'Customer', 'Customer Profile'],
      idParamOverride: 'externalId',
    })
  )
  .input(externalIdInputSchema)
  .output(
    z.object({
      customerProfile: customerProfileClientSelectSchema,
      subscriptions: richSubscriptionClientSelectSchema.array(),
      catalog: z.object({
        products: z
          .object({
            product: productsClientSelectSchema,
            variants: variantsClientSelectSchema.array(),
          })
          .array(),
      }),
    })
  )
  .query(async ({ input, ctx }) => {
    const OrganizationId = ctx.OrganizationId
    if (!OrganizationId) {
      throw new Error('OrganizationId is required')
    }
    const { customerProfile, catalog } =
      await authenticatedTransaction(
        async ({ transaction }) => {
          const customerProfiles = await selectCustomerProfiles(
            { ...input, OrganizationId },
            transaction
          )
          const subscriptions = await selectRichSubscriptions(
            { CustomerProfileId: customerProfiles[0].id },
            transaction
          )
          const catalog = await selectCatalog(
            { OrganizationId },
            transaction
          )
          return {
            customerProfile: {
              ...customerProfiles[0],
              subscriptions,
            },
            catalog,
          }
        },
        {
          apiKey: ctx.apiKey,
        }
      )
    return {
      customerProfile,
      subscriptions: customerProfile.subscriptions,
      catalog: {
        products: catalog,
      },
    }
  })

const listCustomerProfilesProcedure = protectedProcedure
  .meta(openApiMetas.LIST)
  .input(customerProfilesPaginatedSelectSchema)
  .output(customerProfilesPaginatedListSchema)
  .query(async ({ input, ctx }) => {
    return authenticatedTransaction(async ({ transaction }) => {
      return selectCustomerProfilesPaginated(input, transaction)
    })
  })

export const customerProfilesRouter = router({
  create: createCustomerProfileProcedure,
  edit: editCustomerProfile,
  getBilling: getCustomerBilling,
  get: getCustomerProfile,
  list: listCustomerProfilesProcedure,
})
