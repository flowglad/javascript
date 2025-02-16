import { FlowgladActionKey } from '@flowglad/shared'
import z from 'zod'
import { FlowgladActionValidatorMap } from '../../shared/dist/types/actions'

export interface CoreCustomerProfileUser {
  externalId: string
  name: string
  email: string
}

export type GetRequestingCustomerProfile =
  () => Promise<CoreCustomerProfileUser>

export interface FlowgladServerSessionParamsCore {
  getRequestingCustomerProfile?: GetRequestingCustomerProfile
  authorizeRead?: (
    requestedCustomerProfileId: string
  ) => Promise<boolean>
}

export interface SupabaseFlowgladServerSessionParams
  extends FlowgladServerSessionParamsCore {
  supabaseAuth: {
    client: () => {
      auth: {
        getUser: () => Promise<
          | {
              data: {
                user: {
                  id: string
                  email?: string
                  phone?: string
                  user_metadata: {
                    [key: string]: any
                  }
                }
              }
            }
          | {
              data: {
                user: null
              }
              error: any
            }
        >
      }
    }
  }
}

export interface NextjsAuthFlowgladServerSessionParams {
  nextAuth: {
    getServerSession: () => Promise<{
      user: {
        name?: string | null
        email?: string | null
        image?: string | null
      }
    } | null>

    extractUserIdFromSession?: (
      sessionFromGetServerSession: any
    ) => string
  }
}

export interface FooFlowgladServerSessionParams {
  getRequestingCustomerProfile: GetRequestingCustomerProfile
  authorizeRead?: (
    requestedCustomerProfileId: string
  ) => Promise<boolean>
}

export type FlowgladServerSessionParams =
  | SupabaseFlowgladServerSessionParams
  | NextjsAuthFlowgladServerSessionParams
  | FooFlowgladServerSessionParams
