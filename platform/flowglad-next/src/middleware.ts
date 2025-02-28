import { NextResponse } from 'next/server'
import {
  clerkMiddleware,
  createRouteMatcher,
} from '@clerk/nextjs/server'
import { updateSupabaseSession } from './db/supabase'
import core from './utils/core'

const publicRoutes = [
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/ping',
  '/api/webhook-(.*)',
  '/api/testimonial-sets/(.*)',
  '/product/(.*)/purchase',
  '/purchase/pay/(.*)',
  '/purchase/post-payment',
  '/purchase/verify/(.*)',
  '/purchase/access/(.*)',
  '/product/(.*)/post-purchase/(.*)',
  '/api/trpc/public.(.*)',
  '/purchase-session/(.*)',
  /**
   * Purchase session procedures need to be public,
   * otherwise anon users will hit 307 redirects.
   */
  '/api/trpc/purchases.(.*)Session',
  '/api/trpc/purchases.requestAccess',
  '/api/trpc/discounts.attempt',
  '/api/trpc/discounts.clear',
  '/apple-touch-icon(.*).png',
  '/api/v1/(.*)',
  '/api/openapi',
]

if (core.IS_DEV) {
  publicRoutes.push('/demo-route')
  publicRoutes.push('/oauth/callback/(.*)')
}

const isPublicRoute = createRouteMatcher(publicRoutes)

export default clerkMiddleware(async (auth, req) => {
  // Handle CORS for staging
  if (
    req.method === 'OPTIONS' &&
    process.env.VERCEL_GIT_COMMIT_REF === 'staging'
  ) {
    return NextResponse.json(
      { message: 'OK' },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        },
      }
    )
  }

  const { userId } = auth()
  await updateSupabaseSession(req, auth().getToken)
  const isProtectedRoute = !isPublicRoute(req)

  if (isProtectedRoute && !userId) {
    /**
     * TODO: figure out how to redirect to community signup page,
     * or whatever page they were trying to access
     */
    return NextResponse.redirect(new URL('/sign-in', req.url))
  } else if (isProtectedRoute) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
