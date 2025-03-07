'use client'
import {
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
  AddressElement,
  LinkAuthenticationElementProps,
} from '@stripe/react-stripe-js'
import { useState } from 'react'
import core, { cn } from '@/utils/core'
import Button from '@/components/ion/Button'
import { trpc } from '@/app/_trpc/client'
import { Skeleton } from '@/components/ion/Skeleton'
import { useRouter } from 'next/navigation'
import { PaymentMethodType, PriceType } from '@/types'
import { LoaderCircle } from 'lucide-react'
import { stripeCurrencyAmountToHumanReadableCurrencyAmount } from '@/utils/stripe'
import TotalBillingDetails from './ion/TotalBillingDetails'
import PoweredByFlowgladText from './ion/PoweredByFlowgladText'
import DiscountCodeInput from './DiscountCodeInput'
import { useCheckoutPageContext } from '@/contexts/checkoutPageContext'
import { calculateTotalDueAmount } from '@/utils/bookkeeping/fees'

export const PaymentLoadingForm = ({
  disableAnimation,
}: {
  disableAnimation?: boolean
}) => {
  return (
    <>
      <div className="flex flex-col gap-4">
        <Skeleton
          className="h-10 w-full"
          disableAnimation={disableAnimation}
        />
        <Skeleton
          className="h-10 w-full"
          disableAnimation={disableAnimation}
        />
        <div className="flex gap-4">
          <Skeleton
            className="h-10 w-1/2"
            disableAnimation={disableAnimation}
          />
          <Skeleton
            className="h-10 w-1/2"
            disableAnimation={disableAnimation}
          />
        </div>
        <Skeleton
          className="h-10 w-full"
          disableAnimation={disableAnimation}
        />
        <div className="flex gap-4">
          <Skeleton
            className="h-10 w-1/2"
            disableAnimation={disableAnimation}
          />
          <Skeleton
            className="h-10 w-1/2"
            disableAnimation={disableAnimation}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 py-3">
        <Skeleton
          className="h-10 w-full"
          disableAnimation={disableAnimation}
        />
        <Skeleton
          className="h-10 w-full"
          disableAnimation={disableAnimation}
        />
        <Skeleton
          className="h-10 w-full"
          disableAnimation={disableAnimation}
        />
      </div>
      <div className="flex flex-col gap-4 py-3">
        <Skeleton
          className="h-10 w-full"
          disableAnimation={disableAnimation}
        />
        <Skeleton
          className="h-10 w-full"
          disableAnimation={disableAnimation}
        />
        <Skeleton
          className="h-10 w-full"
          disableAnimation={disableAnimation}
        />
      </div>
    </>
  )
}

const AuthenticationElement = ({
  readonlyCustomerEmail,
  onChange,
  onReady,
  className,
}: {
  readonlyCustomerEmail: string | undefined | null
  onChange: LinkAuthenticationElementProps['onChange']
  className: string
  onReady: LinkAuthenticationElementProps['onReady']
}) => {
  const preventInteraction = readonlyCustomerEmail
    ? (
        e:
          | React.MouseEvent<HTMLDivElement>
          | React.KeyboardEvent<HTMLDivElement>
      ) => {
        e.preventDefault()
        e.stopPropagation()
      }
    : undefined

  return (
    <div
      className="relative"
      onMouseDown={preventInteraction}
      onKeyDown={preventInteraction}
    >
      {readonlyCustomerEmail && (
        <div
          className="absolute inset-0 z-10 bg-transparent"
          aria-hidden="true"
        />
      )}
      <LinkAuthenticationElement
        options={
          readonlyCustomerEmail
            ? {
                defaultValues: { email: readonlyCustomerEmail },
              }
            : {}
        }
        onChange={onChange}
        onReady={onReady}
        className={cn(
          className,
          readonlyCustomerEmail && 'opacity-50'
        )}
      />
    </div>
  )
}
const PaymentForm = () => {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const {
    redirectUrl,
    purchaseSession,
    product,
    variant,
    priceType,
    subscriptionDetails,
    customerProfile,
    editPurchaseSession,
    checkoutBlocked,
    feeCalculation,
    readonlyCustomerEmail,
  } = useCheckoutPageContext()
  const [emailEmbedReady, setEmailEmbedReady] = useState(true)
  const [paymentEmbedReady, setPaymentEmbedReady] = useState(false)
  const [addressEmbedReady, setAddressEmbedReady] = useState(true)
  const [paymentInfoComplete, setPaymentInfoComplete] =
    useState(false)
  const [emailComplete, setEmailComplete] = useState(
    Boolean(readonlyCustomerEmail)
  )
  const embedsReady =
    emailEmbedReady && paymentEmbedReady && addressEmbedReady
  const [errorMessage, setErrorMessage] = useState<
    string | undefined
  >(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const confirmPurchaseSession =
    trpc.purchases.confirmSession.useMutation()
  let buttonLabel = 'Pay'
  const totalDueAmount: number | null = feeCalculation
    ? calculateTotalDueAmount(feeCalculation)
    : null
  if (checkoutBlocked) {
    buttonLabel = 'Processing'
  } else if (subscriptionDetails?.trialPeriodDays) {
    buttonLabel = `Start ${subscriptionDetails.trialPeriodDays} day trial`
  } else if (feeCalculation && !core.isNil(totalDueAmount)) {
    if (priceType === PriceType.SinglePayment) {
      buttonLabel = `Pay ${stripeCurrencyAmountToHumanReadableCurrencyAmount(
        variant.currency,
        totalDueAmount
      )}`
    } else if (priceType === PriceType.Subscription) {
      buttonLabel = `Start ${stripeCurrencyAmountToHumanReadableCurrencyAmount(
        variant.currency,
        totalDueAmount
      )} Subscription`
    }
  }

  return (
    <form
      className="w-[380px] relative"
      onSubmit={async (event) => {
        // We don't want to let default form submission happen here,
        // which would refresh the page.
        event.preventDefault()

        if (!stripe || !elements) {
          // Stripe.js hasn't yet loaded.
          // Make sure to disable form submission until Stripe.js has loaded.
          return
        }

        setIsSubmitting(true)

        await confirmPurchaseSession.mutateAsync({
          id: purchaseSession.id,
        })
        /**
         * If the total due amount is 0, and the price type is a single payment,
         * we cannot attempt to confirm a $0 payment. So we can redirect to the purchase page.
         */
        if (
          totalDueAmount === 0 &&
          priceType === PriceType.SinglePayment
        ) {
          window.location.href = `${redirectUrl}?purchase_session=${purchaseSession.id}`
          return
        }

        // Trigger form validation and wallet collection
        const { error: submitError } = await elements.submit()
        if (submitError) {
          setErrorMessage(submitError.message)
          return
        }

        const confirmationFunction =
          priceType === PriceType.SinglePayment
            ? stripe.confirmPayment
            : stripe.confirmSetup
        const hasEmail = customerProfile?.email
        // Create the ConfirmationToken using the details collected by the Payment Element
        // and additional shipping information
        const { error: confirmationError } =
          await confirmationFunction({
            elements,
            confirmParams: {
              return_url: redirectUrl,
              /**
               * If we have a customer profile (which only happens when there's an open purchase),
               * we want to use the customer profile email.
               * Otherwise, we want to use the email collected from the email element.
               */
              payment_method_data: {
                billing_details: {
                  email: hasEmail ? customerProfile.email : undefined,
                },
              },
            },
          })

        if (confirmationError) {
          // This point will only be reached if there is an immediate error when
          // confirming the payment. Show error to your customer (for example, payment
          // details incomplete)
          setErrorMessage(confirmationError.message)
        } else {
          // Your customer will be redirected to your `return_url`. For some payment
          // methods like iDEAL, your customer will be redirected to an intermediate
          // site first to authorize the payment, then redirected to the `return_url`.
        }
        setIsSubmitting(false)
      }}
    >
      {
        <div
          className={core.cn(
            'absolute inset-0 z-10 transition-opacity duration-300',
            embedsReady
              ? 'opacity-0 pointer-events-none'
              : 'opacity-100'
          )}
        >
          <PaymentLoadingForm />
        </div>
      }
      <div
        className={core.cn(
          'transition-opacity duration-300',
          !embedsReady && 'opacity-0'
        )}
      >
        <AuthenticationElement
          readonlyCustomerEmail={readonlyCustomerEmail}
          onChange={async (event) => {
            if (readonlyCustomerEmail) {
              return
            }
            if (event.complete) {
              await editPurchaseSession({
                purchaseSession: {
                  id: purchaseSession.id,
                  customerEmail: event.value.email,
                },
              })
              setEmailComplete(true)
              router.refresh()
            }
          }}
          onReady={() => {
            setEmailEmbedReady(true)
          }}
          className={core.cn('pb-3', !embedsReady && 'opacity-0')}
        />
        <PaymentElement
          onReady={() => {
            // setTimeout(() => {
            setPaymentEmbedReady(true)
            // }, 300)
          }}
          options={{
            fields: {
              billingDetails: {
                email: readonlyCustomerEmail ? 'never' : undefined,
                address: 'never',
              },
            },
          }}
          onChange={(e) => {
            setPaymentInfoComplete(e.complete)

            if (e.complete) {
              editPurchaseSession({
                purchaseSession: {
                  id: purchaseSession.id,
                  paymentMethodType: e.value
                    .type as PaymentMethodType,
                },
              })
            }
          }}
          className={!embedsReady ? 'opacity-0' : ''}
        />
        <AddressElement
          options={{
            mode: 'billing',
            defaultValues:
              purchaseSession.billingAddress ?? undefined,
          }}
          onReady={() => {
            // setTimeout(() => {
            setAddressEmbedReady(true)
            // }, 300)
          }}
          onChange={async (event) => {
            if (event.complete) {
              await editPurchaseSession({
                purchaseSession: {
                  id: purchaseSession.id,
                  billingAddress: event.value,
                },
              })
            }
          }}
          className={!embedsReady ? 'py-3 opacity-0' : 'py-3'}
        />
      </div>
      {embedsReady && (
        <>
          <DiscountCodeInput />
          <TotalBillingDetails data-testid="total-billing-details" />
          <div className="py-8">
            <Button
              className="justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 w-full h-[45px]"
              disabled={
                !paymentInfoComplete ||
                !emailComplete ||
                isSubmitting ||
                checkoutBlocked
              }
              iconLeading={
                isSubmitting ? (
                  <LoaderCircle
                    className="animate-spin-slow"
                    size={16}
                  />
                ) : undefined
              }
            >
              {buttonLabel}
            </Button>
            {!product.livemode && (
              <div className="p-2 bg-orange-600 justify-center items-center text-center w-full flex mt-4 rounded-md">
                <div className="text-white text-sm">
                  <p>This is a test mode checkout.</p>
                  <p>No payments will be processed.</p>
                </div>
              </div>
            )}
            <PoweredByFlowgladText />
          </div>
        </>
      )}
      {/* {errorMessage && <ErrorLabel message={errorMessage} />} */}
    </form>
  )
}

export default PaymentForm
