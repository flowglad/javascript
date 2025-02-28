import { z } from 'zod'
import {
  SupabaseInsertPayload,
  SupabasePayloadType,
  SupabaseUpdatePayload,
} from '@/types'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import core from '@/utils/core'

export async function updateSupabaseSession(
  request: NextRequest,
  getToken: ReturnType<typeof auth>['getToken']
) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        async setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          const clerkToken = await getToken({
            template: 'supabase',
          })
          // Insert the Clerk Supabase token into the headers
          supabaseResponse.headers.set(
            'Authorization',
            `Bearer ${clerkToken}`
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

export function createClerkSupabaseClient() {
  const { getToken } = auth()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      auth: {
        persistSession: typeof window !== 'undefined',
      },
      global: {
        // Get the Supabase token with a custom fetch method
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken({
            template: 'supabase',
          })

          // Insert the Clerk Supabase token into the headers
          const headers = new Headers(options?.headers)
          headers.set('Authorization', `Bearer ${clerkToken}`)

          // Now call the default fetch
          return fetch(url, {
            ...options,
            headers,
          })
        },
      },
    }
  )
}

export const supabasePayloadBaseSchema = z.object({
  table: z.string(),
  schema: z.string(),
  type: core.createSafeZodEnum(SupabasePayloadType),
  record: z.object({}),
})

export const supabaseInsertPayloadSchema = <T extends z.ZodTypeAny>(
  recordSchema: T
) =>
  supabasePayloadBaseSchema.extend({
    type: z.literal('INSERT'),
    record: recordSchema,
  }) as z.ZodType<SupabaseInsertPayload<z.infer<T>>>

export const supabaseUpdatePayloadSchema = <T extends z.ZodTypeAny>(
  recordSchema: T
) =>
  supabasePayloadBaseSchema.extend({
    type: z.literal('UPDATE'),
    record: recordSchema,
    old_record: recordSchema,
  }) as z.ZodType<SupabaseUpdatePayload<z.infer<T>>>
