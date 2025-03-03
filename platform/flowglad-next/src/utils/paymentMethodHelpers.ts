import { PaymentMethodType } from '@/types'
import { PaymentMethod } from '@/db/schema/paymentMethods'
import { DbTransaction } from '@/db/types'
import { getStripePaymentMethod } from '@/utils/stripe'
import {
  insertPaymentMethod,
  selectPaymentMethods,
} from '@/db/tableMethods/paymentMethodMethods'

export const paymentMethodForStripePaymentMethodId = async (
  {
    stripePaymentMethodId,
    livemode,
    CustomerProfileId,
  }: {
    stripePaymentMethodId: string
    livemode: boolean
    CustomerProfileId: string
  },
  transaction: DbTransaction
): Promise<PaymentMethod.Record> => {
  const stripePaymentMethod = await getStripePaymentMethod(
    stripePaymentMethodId,
    livemode
  )
  let paymentMethod: PaymentMethod.Record | null = null
  const [existingPaymentMethod] = await selectPaymentMethods(
    {
      stripePaymentMethodId,
    },
    transaction
  )
  if (existingPaymentMethod) {
    paymentMethod = existingPaymentMethod
  } else {
    const paymentMethodInsert: PaymentMethod.Insert = {
      type: PaymentMethodType.Card,
      livemode,
      CustomerProfileId,
      billingDetails: {
        name: stripePaymentMethod.billing_details?.name,
        email: stripePaymentMethod.billing_details?.email,
        address: {
          name: stripePaymentMethod.billing_details?.name ?? '',
          address: stripePaymentMethod.billing_details?.address,
        },
      },
      stripePaymentMethodId,
      /**
       * Stripe payment method objects are not serializable, so we need to
       * stringify and parse them to get a JSON object.
       */
      paymentMethodData: JSON.parse(
        JSON.stringify(stripePaymentMethod.card ?? {})
      ),
      metadata: {},
    }

    paymentMethod = await insertPaymentMethod(
      paymentMethodInsert,
      transaction
    )
  }
  return paymentMethod
}
