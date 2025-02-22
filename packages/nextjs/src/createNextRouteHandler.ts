'use server'
import {
  FlowgladServer,
  createRequestHandler,
  RequestHandlerOptions,
} from '@flowglad/server'
import { HTTPMethod } from '@flowglad/shared'
import { NextRequest, NextResponse } from 'next/server'

export const createNextRouteHandler = (
  flowgladServer: FlowgladServer,
  options: Omit<RequestHandlerOptions, 'flowgladServer'> = {}
) => {
  const handler = createRequestHandler({ flowgladServer, ...options })

  return async (
    req: NextRequest,
    { params }: { params: { path: string[] } }
  ): Promise<NextResponse> => {
    const result = await handler({
      path: params.path,
      method: req.method as HTTPMethod,
      query:
        req.method === 'GET'
          ? Object.fromEntries(req.nextUrl.searchParams)
          : undefined,
      body: req.method !== 'GET' ? await req.json() : undefined,
    })

    return NextResponse.json(
      {
        error: result.error,
        data: result.data,
      },
      {
        status: result.status,
      }
    )
  }
}
