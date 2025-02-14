'use server'
import { NextRequest, NextResponse } from 'next/server'
import {
  findOrCreateCustomerProfile,
  getCustomerProfileBilling,
} from './customerProfileSubrouteHandler'
import { FlowgladServer } from './flowgladServer'
import { FlowgladActionKey } from '../../shared/types'

console.log('createNex--tRouteHandler------')
const routeToHandlerMap: Record<
  FlowgladActionKey,
  (
    req: NextRequest,
    flowgladServer: FlowgladServer
  ) => Promise<NextResponse>
> = {
  [FlowgladActionKey.GetCustomerProfileBilling]:
    getCustomerProfileBilling,
  [FlowgladActionKey.FindOrCreateCustomerProfile]:
    findOrCreateCustomerProfile,
  [FlowgladActionKey.CreatePurchaseSession]:
    findOrCreateCustomerProfile,
}

export const createNextRouteHandler =
  (flowgladServer: FlowgladServer) =>
  async (
    req: NextRequest,
    { params }: { params: { path: string[] } }
  ) => {
    const joinedPath = params.path.join('/') as FlowgladActionKey

    if (!Object.values(FlowgladActionKey).includes(joinedPath)) {
      return NextResponse.json(
        {
          message: `"${joinedPath}" is not a valid Flowglad API path`,
        },
        { status: 404 }
      )
    }

    const handler = routeToHandlerMap[joinedPath]
    if (!handler) {
      return NextResponse.json(
        {
          message: `"${joinedPath}" is not a valid Flowglad API path`,
        },
        { status: 404 }
      )
    }

    return handler(req, flowgladServer)
  }
