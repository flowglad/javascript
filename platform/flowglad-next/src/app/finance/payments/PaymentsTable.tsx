'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DisplayColumnDef } from '@tanstack/react-table'
import Table from '@/app/components/ion/Table'
import SortableColumnHeaderCell from '@/app/components/ion/SortableColumnHeaderCell'
import { Payment } from '@/db/schema/payments'
import TableRowPopoverMenu from '@/app/components/TableRowPopoverMenu'
import { PopoverMenuItem } from '@/app/components/PopoverMenu'
import Link from 'next/link'
import { CurrencyCode, PaymentStatus } from '@/types'
import { stripeCurrencyAmountToHumanReadableCurrencyAmount } from '@/utils/stripe'
import Badge, { BadgeColor } from '@/app/components/ion/Badge'
import { sentenceCase } from 'change-case'
import RefundPaymentModal from './RefundPaymentModal'
import { Check, Hourglass, X, RotateCcw } from 'lucide-react'
import { formatDate } from '@/utils/core'

const MoreMenuCell = ({
  payment,
  customerProfile,
}: Payment.TableRowData) => {
  const [isRefundOpen, setIsRefundOpen] = useState(false)
  const items: PopoverMenuItem[] = [
    {
      label: 'Refund Payment',
      handler: () => setIsRefundOpen(true),
      disabled: payment.status !== PaymentStatus.Succeeded,
    },
  ]
  return (
    <>
      <RefundPaymentModal
        isOpen={isRefundOpen}
        setIsOpen={setIsRefundOpen}
        payment={payment}
      />
      <TableRowPopoverMenu items={items} />
    </>
  )
}

const PaymentStatusBadge = ({
  status,
}: {
  status: PaymentStatus
}) => {
  let color: BadgeColor = 'grey'
  let icon: React.ReactNode = null
  if (status === PaymentStatus.Succeeded) {
    color = 'green'
    icon = <Check className="w-4 h-4" />
  } else if (status === PaymentStatus.Processing) {
    color = 'yellow'
    icon = <Hourglass className="w-4 h-4" />
  } else if (status === PaymentStatus.Canceled) {
    color = 'red'
    icon = <X className="w-4 h-4" />
  } else if (status === PaymentStatus.Refunded) {
    color = 'grey'
    icon = <RotateCcw className="w-4 h-4" />
  }
  return (
    <Badge variant="soft" color={color} iconLeading={icon}>
      {sentenceCase(status)}
    </Badge>
  )
}
const PaymentsTable = ({
  data,
}: {
  data: Payment.TableRowData[]
}) => {
  const router = useRouter()

  const columns = useMemo(
    () =>
      [
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Amount"
              column={column}
            />
          ),
          accessorKey: 'payment.amount',
          cell: ({ row: { original: cellData } }) => (
            <span className="text-sm">
              {stripeCurrencyAmountToHumanReadableCurrencyAmount(
                cellData.payment.currency,
                cellData.payment.amount
              )}
            </span>
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Status"
              column={column}
            />
          ),
          accessorKey: 'payment.status',
          cell: ({ row: { original: cellData } }) => (
            <PaymentStatusBadge status={cellData.payment.status} />
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Customer"
              column={column}
            />
          ),
          accessorKey: 'customerProfile.name',
          cell: ({ row: { original: cellData } }) => (
            <Link
              href={`/customers/profiles/${cellData.customerProfile.id}`}
              className="text-sm"
            >
              {cellData.customerProfile.name}
            </Link>
          ),
        },
        {
          id: 'refundedAmount',
          header: ({ column }) => (
            <SortableColumnHeaderCell title="Date" column={column} />
          ),
          accessorKey: 'payment.refundedDate',
          cell: ({ row: { original: cellData } }) => (
            <span className="text-sm">
              {formatDate(cellData.payment.chargeDate, true)}
            </span>
          ),
        },
        {
          id: '_',
          cell: ({ row: { original: cellData } }) => (
            <MoreMenuCell
              payment={cellData.payment}
              customerProfile={cellData.customerProfile}
            />
          ),
        },
      ] as DisplayColumnDef<Payment.TableRowData>[],
    []
  )

  return (
    <Table
      columns={columns}
      data={data}
      className="bg-nav"
      bordered
      // onClickRow={(row) =>
      //   router.push(`/finance/payments/${row.payment.id}`)
      // }
    />
  )
}

export default PaymentsTable
