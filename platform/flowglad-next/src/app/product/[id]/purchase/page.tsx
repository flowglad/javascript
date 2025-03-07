import CheckoutPage from '@/components/CheckoutPage'
import { adminTransaction } from '@/db/databaseMethods'
import { selectCustomerProfileById } from '@/db/tableMethods/customerProfileMethods'
import { selectDiscountById } from '@/db/tableMethods/discountMethods'
import { selectLatestFeeCalculation } from '@/db/tableMethods/feeCalculationMethods'
import { selectOrganizationById } from '@/db/tableMethods/organizationMethods'
import {
  BillingInfoCore,
  billingInfoSchema,
} from '@/db/tableMethods/purchaseMethods'
import { selectDefaultVariantAndProductByProductId } from '@/db/tableMethods/variantMethods'
import core from '@/utils/core'
import {
  createPurchaseSession,
  findPurchaseSession,
} from '@/utils/purchaseSessionState'
import { getPaymentIntent, getSetupIntent } from '@/utils/stripe'

interface PurchasePageProps {
  params: {
    id: string
  }
}

const PurchasePage = async ({ params }: PurchasePageProps) => {
  const {
    product,
    variant,
    organization,
    purchaseSession,
    discount,
    feeCalculation,
    maybeCustomerProfile,
  } = await adminTransaction(async ({ transaction }) => {
    const { product, variant } =
      await selectDefaultVariantAndProductByProductId(
        params.id,
        transaction
      )
    if (!product.active) {
      // TODO: ERROR PAGE UI
      return {
        product,
      }
    }
    const organization = await selectOrganizationById(
      product.OrganizationId,
      transaction
    )

    /**
     * Attempt to get the saved purchase session (from cookies).
     * If not found, or the variant id does not match, create a new purchase session
     * and save it to cookies.
     */
    let purchaseSession = await findPurchaseSession(
      {
        productId: product.id,
      },
      transaction
    )
    if (
      core.isNil(purchaseSession) ||
      purchaseSession.VariantId !== variant.id
    ) {
      purchaseSession = await createPurchaseSession(
        { variant, OrganizationId: organization.id },
        transaction
      )
    }
    const discount = purchaseSession.DiscountId
      ? await selectDiscountById(
          purchaseSession.DiscountId,
          transaction
        )
      : null
    const feeCalculation = await selectLatestFeeCalculation(
      {
        PurchaseSessionId: purchaseSession.id,
      },
      transaction
    )
    const maybeCustomerProfile = purchaseSession.CustomerProfileId
      ? await selectCustomerProfileById(
          purchaseSession.CustomerProfileId,
          transaction
        )
      : null
    return {
      product,
      variant,
      organization,
      purchaseSession,
      discount,
      feeCalculation: feeCalculation ?? null,
      maybeCustomerProfile,
    }
  })

  if (!product.active) {
    // TODO: ERROR PAGE UI
    return <div>Product is not active</div>
  }

  if (!purchaseSession) {
    return <div>Purchase session not found</div>
  }

  let clientSecret: string | null = null
  if (purchaseSession.stripePaymentIntentId) {
    const paymentIntent = await getPaymentIntent(
      purchaseSession.stripePaymentIntentId
    )
    clientSecret = paymentIntent.client_secret
  } else if (purchaseSession.stripeSetupIntentId) {
    const setupIntent = await getSetupIntent(
      purchaseSession.stripeSetupIntentId
    )
    clientSecret = setupIntent.client_secret
  }

  const billingInfo = billingInfoSchema.parse({
    purchaseSession,
    product,
    variant,
    sellerOrganization: organization,
    priceType: variant?.priceType as BillingInfoCore['priceType'],
    redirectUrl: core.safeUrl(
      `/purchase/post-payment`,
      core.envVariable('NEXT_PUBLIC_APP_URL')
    ),
    clientSecret,
    billingAddress: purchaseSession.billingAddress,
    readonlyCustomerEmail: maybeCustomerProfile?.email,
    discount,
    feeCalculation,
  })

  return <CheckoutPage billingInfo={billingInfo} />
}

export default PurchasePage
