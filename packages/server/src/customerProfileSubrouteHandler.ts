import { NextRequest, NextResponse } from 'next/server'
import { flowgladNode } from './core'
import { FlowgladServer } from './flowgladServer'

export const getCustomerProfileBilling = async (
  req: NextRequest,
  flowgladServer: FlowgladServer
) => {
  if (req.method !== 'GET') {
    return NextResponse.json(
      { message: 'Method not allowed' },
      { status: 405 }
    )
  }
  const requestingCustomerProfileId =
    await flowgladServer.getRequestingCustomerProfileId()
  const customerProfileBilling =
    await flowgladNode().customerProfiles.billing.retrieve(
      requestingCustomerProfileId
    )
  return NextResponse.json(customerProfileBilling)
}

export const findOrCreateCustomerProfile = async (
  req: NextRequest,
  flowgladServer: FlowgladServer
) => {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { message: 'Method not allowed' },
      { status: 405 }
    )
  }
  const user = await flowgladServer.getSession()
  if (!user) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }
  let customerProfile
  const requestingCustomerProfileId =
    await flowgladServer.getRequestingCustomerProfileId()
  try {
    customerProfile = await flowgladNode().customerProfiles.retrieve(
      requestingCustomerProfileId
    )
  } catch (error) {
    if ((error as any).error.code === 'NOT_FOUND') {
      customerProfile = await flowgladNode().customerProfiles.create({
        customerProfile: {
          email: user.email,
          name: user.name,
          externalId: requestingCustomerProfileId,
        },
      })
    }
  }
  return NextResponse.json(customerProfile)
}
