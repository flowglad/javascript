import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  ORMMethodCreatorConfig,
  createBulkInsertFunction,
  SelectConditions,
  whereClauseFromObject,
} from '@/db/tableUtils'
import {
  billingPeriodItems,
  billingPeriodItemsInsertSchema,
  billingPeriodItemsSelectSchema,
  billingPeriodItemsUpdateSchema,
} from '@/db/schema/billingPeriodItems'
import { and, eq, gte, lte } from 'drizzle-orm'
import { DbTransaction } from '@/db/types'
import {
  organizations,
  organizationsSelectSchema,
} from '../schema/organizations'
import {
  billingPeriods,
  billingPeriodsSelectSchema,
} from '../schema/billingPeriods'
import {
  subscriptions,
  subscriptionsSelectSchema,
} from '../schema/subscriptions'
import {
  customerProfiles,
  customerProfilesSelectSchema,
} from '../schema/customerProfiles'

const config: ORMMethodCreatorConfig<
  typeof billingPeriodItems,
  typeof billingPeriodItemsSelectSchema,
  typeof billingPeriodItemsInsertSchema,
  typeof billingPeriodItemsUpdateSchema
> = {
  selectSchema: billingPeriodItemsSelectSchema,
  insertSchema: billingPeriodItemsInsertSchema,
  updateSchema: billingPeriodItemsUpdateSchema,
}

export const selectBillingPeriodItemById = createSelectById(
  billingPeriodItems,
  config
)

export const insertBillingPeriodItem = createInsertFunction(
  billingPeriodItems,
  config
)

export const updateBillingPeriodItem = createUpdateFunction(
  billingPeriodItems,
  config
)

export const selectBillingPeriodItems = createSelectFunction(
  billingPeriodItems,
  config
)

export const bulkInsertBillingPeriodItems = createBulkInsertFunction(
  billingPeriodItems,
  config
)

export const selectBillingPeriodItemsBillingPeriodSubscriptionAndOrganizationByBillingPeriodId =
  async (billingPeriodId: string, transaction: DbTransaction) => {
    const result = await transaction
      .select({
        billingPeriod: billingPeriods,
        subscription: subscriptions,
        organization: organizations,
        billingPeriodItem: billingPeriodItems,
        customerProfile: customerProfiles,
      })
      .from(billingPeriodItems)
      .innerJoin(
        billingPeriods,
        eq(billingPeriodItems.BillingPeriodId, billingPeriods.id)
      )
      .innerJoin(
        subscriptions,
        eq(billingPeriods.SubscriptionId, subscriptions.id)
      )
      .innerJoin(
        organizations,
        eq(subscriptions.OrganizationId, organizations.id)
      )
      .innerJoin(
        customerProfiles,
        eq(subscriptions.CustomerProfileId, customerProfiles.id)
      )
      .where(eq(billingPeriodItems.BillingPeriodId, billingPeriodId))

    const {
      organization,
      subscription,
      billingPeriod,
      customerProfile,
    } = result[0]
    return {
      organization: organizationsSelectSchema.parse(organization),
      subscription: subscriptionsSelectSchema.parse(subscription),
      billingPeriod: billingPeriodsSelectSchema.parse(billingPeriod),
      billingPeriodItems: result.map((item) =>
        billingPeriodItemsSelectSchema.parse(item.billingPeriodItem)
      ),
      customerProfile:
        customerProfilesSelectSchema.parse(customerProfile),
    }
  }

export const selectBillingPeriodAndItemsForDate = async (
  whereConditions: SelectConditions<typeof billingPeriods>,
  date: Date,
  transaction: DbTransaction
) => {
  const result = await transaction
    .select({
      billingPeriod: billingPeriods,
      billingPeriodItems: billingPeriodItems,
    })
    .from(billingPeriods)
    .innerJoin(
      billingPeriodItems,
      eq(billingPeriods.id, billingPeriodItems.BillingPeriodId)
    )
    .where(
      and(
        lte(billingPeriods.startDate, date),
        gte(billingPeriods.endDate, date),
        whereClauseFromObject(billingPeriods, whereConditions)
      )
    )
    .limit(1)

  if (!result[0]) return null

  return {
    billingPeriod: billingPeriodsSelectSchema.parse(
      result[0].billingPeriod
    ),
    billingPeriodItems: result.map((item) =>
      billingPeriodItemsSelectSchema.parse(item.billingPeriodItems)
    ),
  }
}
