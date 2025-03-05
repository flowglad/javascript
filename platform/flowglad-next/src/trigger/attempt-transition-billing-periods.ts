import { logger, task } from '@trigger.dev/sdk/v3'
import { selectBillingPeriodsDueForTransition } from '@/db/tableMethods/billingPeriodMethods'
import { adminTransaction } from '@/db/databaseMethods'
import { attemptBillingPeriodTransitionTask } from './attempt-billing-period-transition'

export const attemptTransitionBillingPeriodsTask = task({
  id: 'attempt-transition-billing-periods',
  run: async (
    payload: {
      idempotencyKey: string
      lastTimestamp: Date
      currentTimestamp: Date
    },
    { ctx }
  ) => {
    logger.log('Attempting to transition billing periods', {
      idempotencyKey: payload.idempotencyKey,
      ctx,
    })

    const billingPeriodsToTransition = await adminTransaction(
      ({ transaction }) =>
        selectBillingPeriodsDueForTransition(
          {
            rangeStart: payload.lastTimestamp,
            rangeEnd: payload.currentTimestamp,
          },
          transaction
        )
    )

    if (billingPeriodsToTransition.length > 0) {
      await attemptBillingPeriodTransitionTask.batchTrigger(
        billingPeriodsToTransition.map((billingPeriod) => ({
          payload: { billingPeriod },
        }))
      )
    }

    return {
      message: 'Billing periods transitioned',
    }
  },
})
