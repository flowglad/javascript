export interface CoreCustomerProfileUser {
  externalId: string
  name: string
  email: string
}

export type GetRequestingCustomerProfile =
  () => Promise<CoreCustomerProfileUser>

export interface FlowgladServerSessionParamsCore {
  getRequestingCustomerProfile?: GetRequestingCustomerProfile
  baseURL?: string
  apiKey?: string
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

interface NextAuthSession {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export interface NextjsAuthFlowgladServerSessionParams
  extends FlowgladServerSessionParamsCore {
  nextAuth: {
    auth: () => Promise<NextAuthSession | null>
    customerProfileFromAuth?: (
      session: NextAuthSession
    ) => Promise<CoreCustomerProfileUser | null>
  }
}

interface BetterAuthSession {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export interface BetterAuthFlowgladServerSessionParams
  extends FlowgladServerSessionParamsCore {
  betterAuth: {
    /**
     * the getSession function from the BetterAuth client.
     */
    getSession: () => Promise<BetterAuthSession | null>
    /**
     * Extracts the customer profile parameters from the session object.
     */
    customerProfileFromSession?: (
      session: BetterAuthSession
    ) => Promise<CoreCustomerProfileUser | null>
  }
}

export interface BaseFlowgladServerSessionParams
  extends FlowgladServerSessionParamsCore {
  getRequestingCustomerProfile: GetRequestingCustomerProfile
}

interface ClerkEmailAddress {
  emailAddress: string
}

interface ClerkUser {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  emailAddresses: ClerkEmailAddress[]
}

export interface ClerkFlowgladServerSessionParams
  extends FlowgladServerSessionParamsCore {
  clerk: {
    currentUser: () => Promise<ClerkUser | null>
    customerProfileFromCurrentUser?: (
      currentUser: ClerkUser
    ) => Promise<CoreCustomerProfileUser | null>
  }
}

export type FlowgladServerSessionParams =
  | SupabaseFlowgladServerSessionParams
  | NextjsAuthFlowgladServerSessionParams
  | ClerkFlowgladServerSessionParams
  | BetterAuthFlowgladServerSessionParams
  | BaseFlowgladServerSessionParams
