import { logger, task, idempotencyKeys } from '@trigger.dev/sdk/v3'
import { attemptBillingRunTask } from './attempt-billing-run'
import { adminTransaction } from '@/db/databaseMethods'
import { selectBillingRunsDueForExecution } from '@/db/tableMethods/billingRunMethods'

export const attemptBillingRunsTask = task({
  id: 'attempt-billing-runs',
  run: async (payload: { timestamp: Date }, { ctx }) => {
    const {
      livemodeBillingRunsToAttempt,
      testmodeBillingRunsToAttempt,
    } = await adminTransaction(async ({ transaction }) => {
      const livemodeBillingRunsToAttempt =
        await selectBillingRunsDueForExecution(
          { livemode: true },
          transaction
        )
      const testmodeBillingRunsToAttempt =
        await selectBillingRunsDueForExecution(
          { livemode: false },
          transaction
        )
      return {
        livemodeBillingRunsToAttempt,
        testmodeBillingRunsToAttempt,
      }
    })

    /**
     * Ensure that billing runs are not attempted again if the cron job is retried
     */
    await attemptBillingRunTask.batchTrigger(
      livemodeBillingRunsToAttempt.map((billingRun) => ({
        payload: {
          billingRun,
          livemode: true,
        },
        idempotencyKey: idempotencyKeys.create(
          `attempt-livemode-billing-run:${billingRun.id}`
        ),
      }))
    )

    await attemptBillingRunTask.batchTrigger(
      testmodeBillingRunsToAttempt.map((billingRun) => ({
        payload: {
          billingRun,
          livemode: false,
        },
        idempotencyKey: idempotencyKeys.create(
          `attempt-testmode-billing-run:${billingRun.id}`
        ),
      }))
    )
    return {
      message: 'Hello, world!',
    }
  },
})
