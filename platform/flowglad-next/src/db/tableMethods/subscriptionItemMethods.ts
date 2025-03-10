import {
  createSelectById,
  createInsertFunction,
  createUpdateFunction,
  createSelectFunction,
  ORMMethodCreatorConfig,
  createBulkInsertFunction,
  createBulkUpsertFunction,
  SelectConditions,
  whereClauseFromObject,
} from '@/db/tableUtils'
import {
  SubscriptionItem,
  subscriptionItems,
  subscriptionItemsInsertSchema,
  subscriptionItemsSelectSchema,
  subscriptionItemsUpdateSchema,
} from '@/db/schema/subscriptionItems'
import { DbTransaction } from '@/db/types'
import {
  Subscription,
  subscriptions,
  subscriptionsSelectSchema,
} from '../schema/subscriptions'
import { eq } from 'drizzle-orm'
import {
  RichSubscription,
  richSubscriptionClientSelectSchema,
  RichSubscriptionItem,
} from '@/subscriptions/schemas'
import { variantsClientSelectSchema } from '../schema/variants'
import { variants } from '../schema/variants'

const config: ORMMethodCreatorConfig<
  typeof subscriptionItems,
  typeof subscriptionItemsSelectSchema,
  typeof subscriptionItemsInsertSchema,
  typeof subscriptionItemsUpdateSchema
> = {
  selectSchema: subscriptionItemsSelectSchema,
  insertSchema: subscriptionItemsInsertSchema,
  updateSchema: subscriptionItemsUpdateSchema,
}

export const selectSubscriptionItemById = createSelectById(
  subscriptionItems,
  config
)

export const insertSubscriptionItem = createInsertFunction(
  subscriptionItems,
  config
)

export const updateSubscriptionItem = createUpdateFunction(
  subscriptionItems,
  config
)

export const selectSubscriptionItems = createSelectFunction(
  subscriptionItems,
  config
)

export const bulkInsertSubscriptionItems = createBulkInsertFunction(
  subscriptionItems,
  config
)

const bulkUpsertSubscriptionItems = createBulkUpsertFunction(
  subscriptionItems,
  config
)
export const selectSubscriptionItemsAndSubscriptionBySubscriptionId =
  async (subscriptionId: string, transaction: DbTransaction) => {
    const result = await transaction
      .select({
        subscriptionItems: subscriptionItems,
        subscription: subscriptions,
      })
      .from(subscriptionItems)
      .innerJoin(
        subscriptions,
        eq(subscriptionItems.SubscriptionId, subscriptions.id)
      )
      .where(eq(subscriptionItems.SubscriptionId, subscriptionId))
      .execute()

    if (!result.length) {
      return null
    }

    const subscription = subscriptionsSelectSchema.parse(
      result[0].subscription
    )

    const subscriptionItemsResults = result.map((row) =>
      subscriptionItemsSelectSchema.parse(row.subscriptionItems)
    )

    return {
      subscription,
      subscriptionItems: subscriptionItemsResults,
    }
  }

export const bulkCreateOrUpdateSubscriptionItems = async (
  subscriptionItemUpdates: (
    | SubscriptionItem.Record
    | SubscriptionItem.Insert
  )[],
  transaction: DbTransaction
) => {
  return bulkUpsertSubscriptionItems(
    subscriptionItemUpdates,
    [subscriptionItems.id],
    transaction
  )
}

export const deleteSubscriptionItem = async (
  subscriptionItemId: string,
  transaction: DbTransaction
) => {
  await transaction
    .delete(subscriptionItems)
    .where(eq(subscriptionItems.id, subscriptionItemId))
}

export const selectRichSubscriptions = async (
  whereConditions: SelectConditions<typeof subscriptions>,
  transaction: DbTransaction
): Promise<RichSubscription[]> => {
  const result = await transaction
    .select({
      subscriptionItems: subscriptionItems,
      subscription: subscriptions,
      variant: variants,
    })
    .from(subscriptionItems)
    .innerJoin(
      subscriptions,
      eq(subscriptionItems.SubscriptionId, subscriptions.id)
    )
    .innerJoin(variants, eq(subscriptionItems.VariantId, variants.id))
    .where(whereClauseFromObject(subscriptions, whereConditions))

  const subscriptionItemsResults = result.map((row) => ({
    ...subscriptionItemsSelectSchema.parse(row.subscriptionItems),
    variant: variantsClientSelectSchema.parse(row.variant),
  }))

  const subscriptionItemsBySubscriptionId = result.reduce(
    (acc, row) => {
      const subscriptionId = row.subscription.id
      if (!acc.has(subscriptionId)) {
        acc.set(subscriptionId, {
          ...subscriptionsSelectSchema.parse(row.subscription),
          subscriptionItems: [],
        })
      }
      acc.get(subscriptionId)?.subscriptionItems.push({
        ...subscriptionItemsSelectSchema.parse(row.subscriptionItems),
        variant: variantsClientSelectSchema.parse(row.variant),
      })
      return acc
    },
    new Map()
  )
  /**
   * Typecheck before parsing so we can catch type errors before runtime ones
   */
  const richSubscriptions: RichSubscription[] = Array.from(
    subscriptionItemsBySubscriptionId.values()
  )

  return richSubscriptions.map((item) =>
    richSubscriptionClientSelectSchema.parse(item)
  )
}
