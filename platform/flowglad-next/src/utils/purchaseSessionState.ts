import { Variant } from '@/db/schema/variants'
import { cookies } from 'next/headers'
import {
  selectPurchaseSessions,
  insertPurchaseSession,
  updatePurchaseSession,
} from '@/db/tableMethods/purchaseSessionMethods'
import {
  createPaymentIntentForPurchaseSession,
  createSetupIntentForPurchaseSession,
} from '@/utils/stripe'
import {
  DbTransaction,
  PriceType,
  PurchaseSessionStatus,
} from '@/types'
import { PurchaseSession } from '@/db/schema/purchaseSessions'
import { selectProductById } from '@/db/tableMethods/productMethods'
import { selectOrganizationById } from '@/db/tableMethods/organizationMethods'
import { Purchase } from '@/db/schema/purchases'

import { z } from 'zod'
import { idInputSchema } from '@/db/tableUtils'

const productPurchaseSessionCookieNameParamsSchema = z.object({
  productId: z.string(),
})

const purchasePurchaseSessionCookieNameParamsSchema = z.object({
  purchaseId: z.string(),
})

/**
 * SUBTLE CODE ALERT:
 * The order of z.union matters here!
 *
 * We want to prioritize the purchase id over the variant id,
 * so that we can delete the purchase session cookie when the purchase is confirmed.
 * z.union is like "or" in natural language:
 * If you pass it an object with both a purchaseId and a variantId,
 * it will choose the purchaseId and OMIT the variantId.
 *
 * We actually want this because open purchases are more strict versions than variants
 *
 */
export const purchaseSessionCookieNameParamsSchema = z.union([
  purchasePurchaseSessionCookieNameParamsSchema,
  productPurchaseSessionCookieNameParamsSchema,
])

export const setPurchaseSessionCookieParamsSchema = idInputSchema.and(
  purchaseSessionCookieNameParamsSchema
)

export type ProductPurchaseSessionCookieNameParams = z.infer<
  typeof productPurchaseSessionCookieNameParamsSchema
>

export type PurchasePurchaseSessionCookieNameParams = z.infer<
  typeof purchasePurchaseSessionCookieNameParamsSchema
>

export type PurchaseSessionCookieNameParams = z.infer<
  typeof purchaseSessionCookieNameParamsSchema
>

const purchaseSessionName = (
  params: PurchaseSessionCookieNameParams
) =>
  `purchase-session-id-${
    'purchaseId' in params ? params.purchaseId : params.productId
  }`

/**
 * We must support multiple purchase session cookies on the client,
 * one for each variant. Otherwise, the client will not be able to
 * tell which purchase session corresponds to which variant.
 *
 * Purchase sessions are used to manage the state
 * between the checkout and the purchase confirmation pages.
 */
export const getPurchaseSessionCookie = (
  params: PurchaseSessionCookieNameParams
) => {
  return cookies().get(purchaseSessionName(params))?.value
}

export const findPurchaseSession = async (
  params: PurchaseSessionCookieNameParams,
  transaction: DbTransaction
): Promise<PurchaseSession.Record | null> => {
  const purchaseSessionId = getPurchaseSessionCookie(params)

  if (!purchaseSessionId) {
    return null
  }

  const sessions = await selectPurchaseSessions(
    { id: purchaseSessionId },
    transaction
  )

  if (sessions[0].expires && sessions[0].expires < new Date()) {
    return null
  }

  return sessions[0]
}

export const createPurchaseSession = async (
  {
    variant,
    purchase,
    OrganizationId,
  }: {
    variant: Variant.Record
    purchase?: Purchase.Record
    OrganizationId: string
  },
  transaction: DbTransaction
) => {
  const purchaseSession = await insertPurchaseSession(
    {
      VariantId: variant.id,
      status: PurchaseSessionStatus.Open,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      OrganizationId,
      PurchaseId: purchase?.id,
      livemode: variant.livemode,
    },
    transaction
  )
  const organization = await selectOrganizationById(
    OrganizationId,
    transaction
  )
  const product = await selectProductById(
    variant.ProductId,
    transaction
  )

  let stripeSetupIntentId: string | null = null
  let stripePaymentIntentId: string | null = null
  /**
   * Only attempt to create intents if:
   * - It's not livemode
   * - It's livemode AND payouts are enabled
   */
  if (!purchaseSession.livemode || organization.payoutsEnabled) {
    if (variant.priceType === PriceType.Subscription) {
      const setupIntent = await createSetupIntentForPurchaseSession({
        variant,
        product,
        organization,
        purchaseSession,
        purchase,
      })
      stripeSetupIntentId = setupIntent.id
    } else {
      const paymentIntent =
        await createPaymentIntentForPurchaseSession({
          variant,
          product,
          purchase,
          purchaseSession,
          organization,
        })
      stripePaymentIntentId = paymentIntent.id
    }
  }
  const updatedPurchaseSession = await updatePurchaseSession(
    {
      id: purchaseSession.id,
      stripePaymentIntentId,
      stripeSetupIntentId,
    },
    transaction
  )

  return updatedPurchaseSession
}

type SetPurchaseSessionCookieParams = {
  id: string
} & PurchaseSessionCookieNameParams

export const setPurchaseSessionCookie = async (
  params: SetPurchaseSessionCookieParams
) => {
  const { id } = params
  return (await cookies()).set(purchaseSessionName(params), id, {
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

/**
 * Attempt to delete the purchase session cookie for each of the given params.
 * This strategy ensures we delete variant id
 * @param params
 */
export const deletePurchaseSessionCookie = async (
  params: PurchaseSessionCookieNameParams
) => {
  const cookieStore = await cookies()
  if ('productId' in params) {
    await cookieStore.delete(
      purchaseSessionName({
        productId: params.productId,
      })
    )
  }
  if ('purchaseId' in params) {
    await cookieStore.delete(
      purchaseSessionName({
        purchaseId: params.purchaseId,
      })
    )
  }
}
