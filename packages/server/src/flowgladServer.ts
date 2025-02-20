import { CreatePurchaseSessionParams } from '@flowglad/shared'
import { flowgladNode } from './core'
import {
  CoreCustomerProfileUser,
  FlowgladServerSessionParams,
  NextjsAuthFlowgladServerSessionParams,
  SupabaseFlowgladServerSessionParams,
} from './types'

import { Flowglad as FlowgladNode } from '@flowglad/node'

const getSessionFromNextAuth = async (
  params: NextjsAuthFlowgladServerSessionParams
) => {
  let coreCustomerProfileUser: CoreCustomerProfileUser | null = null
  const session = await params.nextAuth.auth()
  if (session?.user) {
    if (params.nextAuth.customerProfileFromAuth) {
      coreCustomerProfileUser =
        await params.nextAuth.customerProfileFromAuth(session)
    } else {
      if (!session.user.email) {
        throw new Error(
          'FlowgladError: NextAuth session has no email. Please provide an extractUserIdFromSession function to extract the userId from the session, or include email on your sessions.'
        )
      }
      coreCustomerProfileUser = {
        externalId: session.user.email,
        name: session.user.name || '',
        email: session.user.email || '',
      }
    }
  }
  return coreCustomerProfileUser
}

const getSessionFromNextAuth4 = async (
  params: NextjsAuthFlowgladServerSessionParams
) => {
  const session = await params.nextAuth.auth()
  return session
}

const sessionFromSupabaseAuth = async (
  params: SupabaseFlowgladServerSessionParams
) => {
  let coreCustomerProfileUser: CoreCustomerProfileUser | null = null
  const {
    data: { user },
  } = await params.supabaseAuth.client().auth.getUser()
  if (user) {
    coreCustomerProfileUser = {
      externalId: user.id,
      name: user.user_metadata.name || '',
      email: user.email || '',
    }
  }
  return coreCustomerProfileUser
}

const getSessionFromParams = async (
  params: FlowgladServerSessionParams
) => {
  let coreCustomerProfileUser: CoreCustomerProfileUser | null = null
  if ('nextAuth' in params) {
    coreCustomerProfileUser = await getSessionFromNextAuth(params)
  }

  if ('supabaseAuth' in params) {
    coreCustomerProfileUser = await sessionFromSupabaseAuth(params)
  }
  return coreCustomerProfileUser
}

export class FlowgladServer {
  private createHandlerParams: FlowgladServerSessionParams

  constructor(createHandlerParams: FlowgladServerSessionParams) {
    this.createHandlerParams = createHandlerParams
  }

  public getRequestingCustomerProfileId =
    async (): Promise<string> => {
      const session = await getSessionFromParams(
        this.createHandlerParams
      )
      if (!session) {
        throw new Error('User not authenticated')
      }
      return session.externalId
    }

  public getSession =
    async (): Promise<CoreCustomerProfileUser | null> => {
      return await getSessionFromParams(this.createHandlerParams)
    }

  public getBilling =
    async (): Promise<FlowgladNode.CustomerProfiles.CustomerProfileBillingResponse> => {
      const session = await getSessionFromParams(
        this.createHandlerParams
      )
      if (!session) {
        throw new Error('User not authenticated')
      }
      return flowgladNode().customerProfiles.billing(
        session.externalId
      )
    }

  public createPurchaseSession = async (
    params: CreatePurchaseSessionParams
  ): Promise<FlowgladNode.PurchaseSessions.PurchaseSessionCreateResponse> => {
    const session = await getSessionFromParams(
      this.createHandlerParams
    )
    if (!session) {
      throw new Error('User not authenticated')
    }
    return flowgladNode().purchaseSessions.create({
      customerProfileExternalId: session.externalId,
      VariantId: params.VariantId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
    })
  }
}
