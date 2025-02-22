import { routeToHandlerMap } from './subrouteHandlers'
import { FlowgladServer } from './flowgladServer'
import { FlowgladActionKey, HTTPMethod } from '@flowglad/shared'

export interface RequestHandlerInput {
  path: string[]
  method: HTTPMethod
  query?: Record<string, string>
  body?: unknown
}

export interface RequestHandlerOutput {
  status: number
  data?: unknown
  error?: unknown
}

export interface RequestHandlerOptions {
  flowgladServer: FlowgladServer
  onError?: (error: unknown) => void
  beforeRequest?: () => Promise<void>
  afterRequest?: () => Promise<void>
}

export class RequestHandlerError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message)
    this.name = 'RequestHandlerError'
  }
}

export const createRequestHandler = (
  options: RequestHandlerOptions
) => {
  const { flowgladServer, onError, beforeRequest, afterRequest } =
    options

  return async (
    input: RequestHandlerInput
  ): Promise<RequestHandlerOutput> => {
    try {
      if (beforeRequest) {
        await beforeRequest()
      }

      const joinedPath = input.path.join('/') as FlowgladActionKey

      if (!Object.values(FlowgladActionKey).includes(joinedPath)) {
        throw new RequestHandlerError(
          `"${joinedPath}" is not a valid Flowglad API path`,
          404
        )
      }

      const handler = routeToHandlerMap[joinedPath]
      if (!handler) {
        throw new RequestHandlerError(
          `"${joinedPath}" is not a valid Flowglad API path`,
          404
        )
      }

      const data = input.method === 'GET' ? input.query : input.body

      const result = await handler(
        {
          method: input.method,
          data,
        },
        flowgladServer
      )

      if (afterRequest) {
        await afterRequest()
      }

      return {
        status: result.status,
        data: result.data,
        error: result.error,
      }
    } catch (error) {
      if (onError) {
        onError(error)
      }

      if (error instanceof RequestHandlerError) {
        return {
          status: error.status,
          error: { message: error.message },
        }
      }

      return {
        status: 500,
        error: { message: 'Internal server error' },
      }
    }
  }
}
