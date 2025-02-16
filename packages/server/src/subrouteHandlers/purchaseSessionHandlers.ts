import { FlowgladActionKey, HTTPMethod } from '@flowglad/shared'
import { SubRouteHandler } from './types'
import { FlowgladServer } from '../flowgladServer'

const createPurchaseSession: SubRouteHandler<
  FlowgladActionKey.CreatePurchaseSession
> = async (params, flowgladServer: FlowgladServer) => {
  if (params.method !== HTTPMethod.POST) {
    return {
      data: {},
      status: 405,
      error: 'Method not allowed',
    }
  }
  const purchaseSession = await flowgladServer.createPurchaseSession(
    params.data
  )
  return {
    data: purchaseSession,
    status: 200,
  }
}

export { createPurchaseSession }
