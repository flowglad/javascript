'use client'
import { PageHeader } from '@/app/components/ion/PageHeader'
import PurchasesTable from './PurchasesTable'
import { Purchase } from '@/db/schema/purchases'

const InnerPurchasesPage = ({
  purchases,
}: {
  purchases: Purchase.PurchaseTableRowData[]
}) => {
  return (
    <div className="h-full flex justify-between items-center gap-2.5">
      <div className="bg-internal flex-1 h-full w-full flex flex-col p-6">
        <PageHeader
          title="Purchases"
          tabs={[
            {
              label: 'All',
              subPath: '',
              Component: () => <PurchasesTable data={purchases} />,
            },
          ]}
          hideTabs
        />
      </div>
    </div>
  )
}

export default InnerPurchasesPage
