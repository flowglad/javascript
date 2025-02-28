'use client'
import PaymentStatusProcessing from '@/app/components/PaymentStatusProcessing'

const PendingPostPurchaseScreen = ({
  purchaseId,
}: {
  purchaseId: string
}) => {
  return <PaymentStatusProcessing />
}

export default PendingPostPurchaseScreen
