'use client'

import { PageHeader } from '@/app/components/ion/PageHeader'
import PaymentsTable from './PaymentsTable'
import { Payment } from '@/db/schema/payments'
import { PaymentStatus } from '@/types'

interface InternalPaymentsPageProps {
  payments: Payment.TableRowData[]
}

export default function InternalPaymentsPage({
  payments,
}: InternalPaymentsPageProps) {
  return (
    <div className="h-full flex justify-between items-center gap-2.5">
      <div className="bg-background flex-1 h-full w-full flex gap-6 p-6 pb-10">
        <div className="flex-1 h-full w-full flex flex-col">
          <PageHeader
            title="Payments"
            tabs={[
              {
                label: 'All',
                subPath: 'all',
                Component: () => <PaymentsTable data={payments} />,
              },
              {
                label: 'Refunded',
                subPath: 'refunded',
                Component: () => (
                  <PaymentsTable
                    data={payments.filter(
                      (data) =>
                        data.payment.status === PaymentStatus.Refunded
                    )}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
