import { z } from 'zod'
import { publicProcedure } from '@/server/trpc'
import { sendFormSubmissionToDiscord } from '@/utils/discord'

const servicePurchaseIntakeFormSchema = z.object({
  dashboardTypes: z.string(),
  dashboardDesignAssets: z.string(),
  industry: z.string(),
})

export const createFormSubmission = publicProcedure
  .input(servicePurchaseIntakeFormSchema)
  .mutation(async ({ input }) => {
    await sendFormSubmissionToDiscord(input)

    return {
      success: true,
    }
  })
