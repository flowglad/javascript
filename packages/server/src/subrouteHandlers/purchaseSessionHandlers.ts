import { FlowgladActionKey, HTTPMethod } from '@flowglad/shared'
import { SubRouteHandler, SubRouteHandlerResultData } from './types'
import { FlowgladServer } from '../flowgladServer'
import { parseErrorStringToErrorObject } from '../serverUtils'

const createPurchaseSession: SubRouteHandler<
  FlowgladActionKey.CreatePurchaseSession
> = async (params, flowgladServer: FlowgladServer) => {
  let error:
    | { code: string; json: Record<string, unknown> }
    | undefined
  let status: number
  let data: SubRouteHandlerResultData<FlowgladActionKey.CreatePurchaseSession> =
    {}
  if (params.method !== HTTPMethod.POST) {
    error = {
      code: 'Method not allowed',
      json: {},
    }
    status = 405
    return {
      data,
      status,
      error,
    }
  }
  try {
    const purchaseSession =
      await flowgladServer.createPurchaseSession(params.data)
    data = purchaseSession
    status = 200
  } catch (e) {
    if (e instanceof Error) {
      error = parseErrorStringToErrorObject(e.message)
    } else {
      error = {
        code: 'Unknown error',
        json: {},
      }
    }
    status = 500
  }
  return {
    data,
    status,
    error,
  }
}

export { createPurchaseSession }
