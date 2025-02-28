import { protectedProcedure } from '@/server/trpc'
import { z } from 'zod'

export const ping = protectedProcedure
  // .input(z.object({ ProductId: z.string() }))
  .query(({ input, ctx }) => {
    return {
      message: 'pong',
      // ProductId: input.ProductId,
      environment: ctx.environment,
      userId: ctx.auth.userId,
      OrganizationId: ctx.OrganizationId,
    }
  })
