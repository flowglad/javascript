import { BillingRun } from '@/db/schema/billingRuns'
import { executeBillingRun } from '@/subscriptions/billingRunHelpers'
import { logger, task } from '@trigger.dev/sdk/v3'

export const attemptBillingRunTask = task({
  id: 'attempt-billing-run',
  run: async (
    payload: {
      billingRun: BillingRun.Record
    },
    { ctx }
  ) => {
    logger.log('Attempting billing run', { payload, ctx })
    await executeBillingRun(payload.billingRun.id)
    return {
      message: 'Billing run executed',
    }
  },
})
