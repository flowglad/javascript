import {
  selectPurchaseById,
  selectPurchases,
} from '@/db/tableMethods/purchaseMethods'
import { notFound } from 'next/navigation'
import { adminTransaction } from '@/db/databaseMethods'
import InnerPaymentConfirmedPage from './InnerPaymentConfirmedPage'

interface PageProps {
  params: {
    id: string
  }
}

const PaymentConfirmedPage = async ({ params }: PageProps) => {
  const purchase = await adminTransaction(async ({ transaction }) => {
    return selectPurchaseById(params.id, transaction)
  })

  if (!purchase) {
    notFound()
  }

  return <InnerPaymentConfirmedPage />
}

export default PaymentConfirmedPage
