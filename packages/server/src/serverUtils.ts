import {
  CoreCustomerProfileUser,
  FlowgladServerSessionParams,
  NextjsAuthFlowgladServerSessionParams,
  SupabaseFlowgladServerSessionParams,
} from './types'

export const getSessionFromNextAuth = async (
  params: NextjsAuthFlowgladServerSessionParams
) => {
  let coreCustomerProfileUser: CoreCustomerProfileUser | null = null
  const session = await params.nextAuth.auth()
  if (session?.user) {
    if (params.nextAuth.customerProfileFromAuth) {
      coreCustomerProfileUser =
        await params.nextAuth.customerProfileFromAuth(session)
    } else if (!session.user.email) {
      throw new Error(
        'FlowgladError: NextAuth session has no email. Please provide an extractUserIdFromSession function to extract the userId from the session, or include email on your sessions.'
      )
    } else {
      coreCustomerProfileUser = {
        externalId: session.user.email,
        name: session.user.name || '',
        email: session.user.email || '',
      }
    }
  }
  return coreCustomerProfileUser
}

export const sessionFromSupabaseAuth = async (
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

export const parseErrorStringToErrorObject = (
  errorString: string
) => {
  let [errorCode, ...errorJsonParts] = errorString.split(' ')
  if (isNaN(Number(errorCode))) {
    errorCode = 'Unknown'
  }
  let errorJson: Record<string, unknown> = {}
  try {
    errorJson = JSON.parse(errorJsonParts.join(' '))
  } catch (e) {
    errorJson = {
      message: errorString,
    }
  }
  return {
    code: errorCode,
    json: errorJson,
  }
}
