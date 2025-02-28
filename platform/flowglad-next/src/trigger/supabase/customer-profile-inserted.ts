import { logger, task } from '@trigger.dev/sdk/v3'
import { SupabaseInsertPayload } from '@/types'
import { supabaseInsertPayloadSchema } from '@/db/supabase'
import {
  CustomerProfile,
  customerProfilesSelectSchema,
} from '@/db/schema/customerProfiles'

const customerProfileInsertPayloadSchema =
  supabaseInsertPayloadSchema(customerProfilesSelectSchema)

export const customerProfileCreatedTask = task({
  id: 'customer-profile-inserted',
  run: async (
    payload: SupabaseInsertPayload<CustomerProfile.Record>,
    { ctx }
  ) => {
    const parsedPayload =
      customerProfileInsertPayloadSchema.safeParse(payload)
    if (!parsedPayload.success) {
      logger.error(parsedPayload.error.message)
      parsedPayload.error.issues.forEach((issue) => {
        logger.error(`${issue.path.join('.')}: ${issue.message}`)
      })
      throw new Error('Invalid payload')
    }

    const { record } = parsedPayload.data
    return {
      message: 'OK',
    }
  },
})
