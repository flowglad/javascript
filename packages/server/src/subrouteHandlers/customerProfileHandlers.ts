import { FlowgladServer } from '../flowgladServer'
import { FlowgladActionKey, HTTPMethod } from '@flowglad/shared'
import type { SubRouteHandler } from './types'

export const getCustomerProfileBilling: SubRouteHandler<
  FlowgladActionKey.GetCustomerProfileBilling
> = async (params, flowgladServer: FlowgladServer) => {
  if (params.method !== HTTPMethod.GET) {
    return {
      data: {},
      status: 405,
      error: 'Method not allowed',
    }
  }
  const customerProfileBilling = await flowgladServer.getBilling()
  return {
    data: customerProfileBilling,
    status: 200,
  }
}

export const findOrCreateCustomerProfile: SubRouteHandler<
  FlowgladActionKey.FindOrCreateCustomerProfile
> = async (params, flowgladServer: FlowgladServer) => {
  if (params.method !== HTTPMethod.POST) {
    return {
      data: {},
      status: 405,
      error: 'Method not allowed',
    }
  }
  const user = await flowgladServer.getSession()
  if (!user) {
    return {
      data: {},
      status: 401,
      error: 'Unauthorized',
    }
  }
  let customerProfile
  const requestingCustomerProfileId =
    await flowgladServer.getRequestingCustomerProfileId()
  try {
    customerProfile = await flowgladServer.getCustomerProfile()
  } catch (error) {
    if ((error as any).error.code === 'NOT_FOUND') {
      customerProfile = await flowgladServer.createCustomerProfile({
        customerProfile: {
          email: user.email,
          name: user.name,
          externalId: requestingCustomerProfileId,
        },
      })
    }
  }
  if (!customerProfile) {
    return {
      data: {},
      status: 404,
      error: 'Customer profile not found',
    }
  }
  return {
    data: customerProfile,
    status: 200,
  }
}
