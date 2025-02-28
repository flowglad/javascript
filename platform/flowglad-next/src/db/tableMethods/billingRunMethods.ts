import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  ORMMethodCreatorConfig,
} from '@/db/tableUtils'
import {
  billingRuns,
  billingRunsInsertSchema,
  billingRunsSelectSchema,
  billingRunsUpdateSchema,
} from '@/db/schema/billingRuns'
import { BillingRunStatus, DbTransaction } from '@/types'
import { eq, and, lt } from 'drizzle-orm'

const config: ORMMethodCreatorConfig<
  typeof billingRuns,
  typeof billingRunsSelectSchema,
  typeof billingRunsInsertSchema,
  typeof billingRunsUpdateSchema
> = {
  selectSchema: billingRunsSelectSchema,
  insertSchema: billingRunsInsertSchema,
  updateSchema: billingRunsUpdateSchema,
}

export const selectBillingRunById = createSelectById(
  billingRuns,
  config
)

export const insertBillingRun = createInsertFunction(
  billingRuns,
  config
)

export const updateBillingRun = createUpdateFunction(
  billingRuns,
  config
)

export const selectBillingRuns = createSelectFunction(
  billingRuns,
  config
)

export const selectBillingRunsDueForExecution = async (
  { livemode }: { livemode: boolean },
  transaction: DbTransaction
) => {
  const now = new Date()
  const result = await transaction
    .select()
    .from(billingRuns)
    .where(
      and(
        eq(billingRuns.status, BillingRunStatus.Scheduled),
        lt(billingRuns.scheduledFor, now),
        eq(billingRuns.livemode, livemode)
      )
    )
  return result.map((billingRun) =>
    billingRunsSelectSchema.parse(billingRun)
  )
}
