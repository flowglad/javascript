import { headers } from 'next/headers'
import PostPaymentSideBar from '@/app/components/ion/PostPaymentSidebar'
import { adminTransaction } from '@/db/databaseMethods'
import { selectPurchaseCheckoutParametersById } from '@/db/tableMethods/purchaseMethods'

const PurchaseAccessLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: { purchaseId: string }
}) => {
  const { organization } = await adminTransaction(
    async ({ transaction }) => {
      const { organization } =
        await selectPurchaseCheckoutParametersById(
          params.purchaseId,
          transaction
        )
      return { organization }
    }
  )

  return (
    <div className="bg-internal h-full w-full flex justify-between items-center">
      <PostPaymentSideBar organization={organization} />
      {children}
    </div>
  )
}

export default PurchaseAccessLayout
