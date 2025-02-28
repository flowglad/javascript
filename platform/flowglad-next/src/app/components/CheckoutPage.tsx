'use client'
import { BillingInfoCore } from '@/db/tableMethods/purchaseMethods'
import CheckoutForm from '@/app/components/CheckoutForm'
import BillingInfo from '@/app/components/ion/BillingInfo'
import CheckoutPageProvider from '@/app/contexts/checkoutPageContext'
import { trpc } from '@/app/_trpc/client'
import { useEffect, useRef } from 'react'
import core, { cn } from '@/utils/core'

const CheckoutPage = ({
  billingInfo,
}: {
  billingInfo: BillingInfoCore
}) => {
  const purchaseSessionId = billingInfo.purchaseSession.id
  const setPurchaseSessionCookie =
    trpc.purchases.createSession.useMutation()
  const productId = billingInfo.product.id
  const componentIsMounted = useRef(true)

  useEffect(() => {
    // Cleanup function sets mounted flag
    return () => {
      componentIsMounted.current = false
    }
  }, [])
  const mountedRef = useRef(false)
  const purchaseId = billingInfo.purchase?.id
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    setPurchaseSessionCookie.mutateAsync({
      purchaseId,
      productId,
      id: purchaseSessionId,
    })
  })

  /** Background split overlay for left side of checkout page */
  const leftBackgroundOverlay = core.cn(
    'absolute top-0 left-0 bottom-0 right-[50%]',
    'bg-background-input -z-10 hidden lg:block'
  )

  /** Background split overlay for right side of checkout page */
  const rightBackgroundOverlay = core.cn(
    'absolute top-0 left-[50%] bottom-0 right-0',
    '-z-10 hidden lg:block'
  )

  /** Container for entire checkout page content */
  const checkoutContainer = core.cn(
    'bg-transparent',
    'flex flex-col lg:flex-row',
    'gap-8 lg:gap-0 h-full m-auto lg:m-0',
    'z-10 overflow-y-scroll lg:justify-center'
  )
  const checkoutContainerInnerDimensionsClass =
    'w-full flex flex-1 pt-16 lg:bg-transparent lg:h-full'

  /** Container for checkout form section on right side */
  const checkoutFormContainer = core.cn(
    'bg-internal',
    'lg:w-[444px]',
    checkoutContainerInnerDimensionsClass,
    'lg:pl-8'
  )
  return (
    <CheckoutPageProvider values={billingInfo}>
      <div className={leftBackgroundOverlay} />
      <div className={rightBackgroundOverlay} />
      <div className={checkoutContainer}>
        <div
          className={cn(
            checkoutFormContainer,
            'lg:justify-end lg:pl-0 lg:pr-8 lg:pt-18'
          )}
        >
          <BillingInfo />
        </div>
        <div className={checkoutFormContainer}>
          <CheckoutForm />
        </div>
      </div>
    </CheckoutPageProvider>
  )
}

export default CheckoutPage
