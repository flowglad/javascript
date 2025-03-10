import * as trpcNext from '@trpc/server/adapters/next'
import { getAuth } from '@clerk/nextjs/server'
import { ApiEnvironment } from '@/types'
import { adminTransaction } from '@/db/databaseMethods'
import { selectFocusedMembershipAndOrganization } from '@/db/tableMethods/membershipMethods'

export const createContext = async (
  opts: trpcNext.CreateNextContextOptions
) => {
  const auth = getAuth(opts.req)
  let environment: ApiEnvironment = 'live'
  let OrganizationId: string | undefined
  if (auth.userId) {
    const maybeMembership = await adminTransaction(
      async ({ transaction }) => {
        return selectFocusedMembershipAndOrganization(
          auth.userId,
          transaction
        )
      }
    )
    if (maybeMembership) {
      const { membership, organization } = maybeMembership
      environment = membership.livemode ? 'live' : 'test'
      OrganizationId = organization.id
    }
  }
  return {
    auth,
    path: opts.req.url,
    environment,
    livemode: environment === 'live',
    OrganizationId,
  }
}

export const createApiContext = ({
  OrganizationId,
  environment,
}: {
  OrganizationId: string
  environment: ApiEnvironment
}) => {
  return async (opts: trpcNext.CreateNextContextOptions) => {
    /**
     * Get the api key from the request headers
     */
    // @ts-expect-error - headers get
    const apiKey = opts.req.headers
      // @ts-expect-error - headers get
      .get('Authorization')
      ?.replace(/^Bearer\s/, '')
    return {
      apiKey,
      isApi: true,
      path: opts.req.url,
      OrganizationId,
      environment,
      livemode: environment === 'live',
    }
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>

export type TRPCApiContext = Awaited<
  ReturnType<ReturnType<typeof createApiContext>>
>
