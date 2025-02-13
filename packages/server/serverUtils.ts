import {
  CoreCustomerProfileUser,
  FlowgladServerSessionParams,
  NextjsAuthFlowgladServerSessionParams,
  SupabaseFlowgladServerSessionParams,
} from '../next/types'

const getSessionFromNextAuth = async (
  params: NextjsAuthFlowgladServerSessionParams
) => {
  let coreCustomerProfileUser: CoreCustomerProfileUser | null = null
  const session = await params.nextAuth.getServerSession()
  if (session?.user) {
    if (params.nextAuth.extractUserIdFromSession) {
      const userId = params.nextAuth.extractUserIdFromSession(session)
      coreCustomerProfileUser = {
        externalId: userId,
        name: session.user.name || '',
        email: session.user.email || '',
      }
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

export const getSessionFromParams = async (
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
