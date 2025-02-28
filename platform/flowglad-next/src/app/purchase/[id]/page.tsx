import { notFound } from 'next/navigation'
import { authenticatedTransaction } from '@/db/databaseMethods'
import { selectPurchaseById } from '@/db/tableMethods/purchaseMethods'
import { selectInvoices } from '@/db/tableMethods/invoiceMethods'
import { selectCustomerProfileAndCustomerTableRows } from '@/db/tableMethods/customerProfileMethods'

const PurchasePage = async ({
  params,
}: {
  params: { id: string }
}) => {
  const purchaseId = params.id

  if (!purchaseId) {
    notFound()
  }

  const data = await authenticatedTransaction(
    async ({ transaction }) => {
      const purchase = await selectPurchaseById(
        purchaseId,
        transaction
      )

      if (!purchase) {
        return null
      }

      const invoices = await selectInvoices(
        { PurchaseId: purchaseId },
        transaction
      )
      const [{ customerProfile, customer }] =
        await selectCustomerProfileAndCustomerTableRows(
          { id: purchase.CustomerProfileId },
          transaction
        )
      return { purchase, invoices, customerProfile, customer }
    }
  )

  if (!data) {
    notFound()
  }

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export default PurchasePage
