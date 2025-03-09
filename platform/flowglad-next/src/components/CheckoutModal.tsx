'use client'
import { BillingInfoCore } from '@/db/tableMethods/purchaseMethods'
import CheckoutForm from '@/components/CheckoutForm'
import BillingInfo from '@/components/ion/BillingInfo'
import CheckoutPageProvider from '@/contexts/checkoutPageContext'
import Modal from '@/components/ion/Modal'
import { trpc } from '@/app/_trpc/client'
import { useEffect, useRef } from 'react'
import { cn } from '@/utils/core'
import { CheckoutFlowType, PurchaseSessionType } from '@/types'
import { useSetPurchaseSessionCookieEffect } from '@/app/hooks/useSetPurchaseSessionCookieEffect'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  billingInfo: BillingInfoCore
}

const CheckoutModal = ({
  isOpen,
  onClose,
  billingInfo,
}: CheckoutModalProps) => {
  if (billingInfo.flowType === CheckoutFlowType.Invoice) {
    throw Error(
      'Invoice checkout flow cannot be rendered as a Checkout Modal'
    )
  }

  useSetPurchaseSessionCookieEffect(billingInfo)

  const checkoutContainer = cn(
    'flex flex-col lg:flex-row',
    'gap-8 lg:gap-0',
    'w-full'
  )

  const checkoutFormContainer = cn(
    'bg-internal',
    'lg:w-[444px]',
    'w-full flex flex-1'
  )

  return (
    <Modal open={isOpen} onOpenChange={onClose} extraWide>
      <CheckoutPageProvider values={billingInfo}>
        <div className={checkoutContainer}>
          <div className={checkoutFormContainer}>
            <BillingInfo />
          </div>
          <div className={checkoutFormContainer}>
            <CheckoutForm />
          </div>
        </div>
      </CheckoutPageProvider>
    </Modal>
  )
}

export default CheckoutModal
