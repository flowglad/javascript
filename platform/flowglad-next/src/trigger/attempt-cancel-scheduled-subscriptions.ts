import { task, idempotencyKeys } from '@trigger.dev/sdk/v3'
import { adminTransaction } from '@/db/databaseMethods'
import { selectSubscriptionsToBeCancelled } from '@/db/tableMethods/subscriptionMethods'
import { attemptSubscriptionCancellationTask } from './attempt-subscription-cancellation'

export const attemptCancelScheduledSubscriptionsTask = task({
  id: 'attempt-cancel-scheduled-subscriptions',
  run: async (
    payload: {
      startDateISO: string
      endDateISO: string
    },
    { ctx }
  ) => {
    const {
      testmodeSubscriptionsToCancel,
      livemodeSubscriptionsToCancel,
    } = await adminTransaction(async ({ transaction }) => {
      return {
        testmodeSubscriptionsToCancel:
          await selectSubscriptionsToBeCancelled(
            {
              rangeStart: new Date(payload.startDateISO),
              rangeEnd: new Date(payload.endDateISO),
              livemode: false,
            },
            transaction
          ),
        livemodeSubscriptionsToCancel:
          await selectSubscriptionsToBeCancelled(
            {
              rangeStart: new Date(payload.startDateISO),
              rangeEnd: new Date(payload.endDateISO),
              livemode: true,
            },
            transaction
          ),
      }
    })
    if (testmodeSubscriptionsToCancel.length > 0) {
      const testmodeSubscriptionCancellationIdempotencyKey =
        await idempotencyKeys.create(
          'attempt-testmode-subscription-cancellation'
        )
      await attemptSubscriptionCancellationTask.batchTrigger(
        testmodeSubscriptionsToCancel.map((subscription) => ({
          payload: {
            subscription,
          },
        })),
        {
          idempotencyKey:
            testmodeSubscriptionCancellationIdempotencyKey,
        }
      )
    }
    if (livemodeSubscriptionsToCancel.length > 0) {
      const livemodeSubscriptionCancellationIdempotencyKey =
        await idempotencyKeys.create(
          'attempt-livemode-subscription-cancellation'
        )
      await attemptSubscriptionCancellationTask.batchTrigger(
        livemodeSubscriptionsToCancel.map((subscription) => ({
          payload: {
            subscription,
          },
        })),
        {
          idempotencyKey:
            livemodeSubscriptionCancellationIdempotencyKey,
        }
      )
    }

    return {
      message: 'Attempted to cancel scheduled subscriptions',
    }
  },
})
