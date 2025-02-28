import { z } from 'zod'
import { publicProcedure } from '@/server/trpc'
import { cookies } from 'next/headers'

export const pong = publicProcedure
  .input(z.object({ foo: z.string() }))
  .mutation(async ({ input, ctx }) => {
    cookies().set('foo', 'bar')
    return {
      data: { bar: 'baz' },
    }
  })
