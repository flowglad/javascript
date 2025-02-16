'use server'
import { FlowgladServer, routeToHandlerMap } from '@flowglad/server'
import { FlowgladActionKey, HTTPMethod } from '@flowglad/shared'
import { NextRequest, NextResponse } from 'next/server'

export const createNextRouteHandler =
  (flowgladServer: FlowgladServer) =>
  async (
    req: NextRequest,
    { params }: { params: { path: string[] } }
  ): Promise<NextResponse> => {
    const joinedPath = params.path.join('/') as FlowgladActionKey
    console.log('-------joinedPath', joinedPath)
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
    let data
    if (req.method === 'GET') {
      data = Object.fromEntries(req.nextUrl.searchParams)
    } else {
      data = await req.json()
    }
    const result = await handler(
      {
        method: req.method as HTTPMethod,
        data,
      },
      flowgladServer
    )
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
