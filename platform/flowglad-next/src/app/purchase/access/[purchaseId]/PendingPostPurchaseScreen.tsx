'use client'
import PaymentStatusProcessing from '@/components/PaymentStatusProcessing'

const PendingPostPurchaseScreen = ({
  purchaseId,
}: {
  purchaseId: string
}) => {
  return <PaymentStatusProcessing />
}

export default PendingPostPurchaseScreen
