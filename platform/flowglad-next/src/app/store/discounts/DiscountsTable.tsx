'use client'
import { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import Table from '@/app/components/ion/Table'
import SortableColumnHeaderCell from '@/app/components/ion/SortableColumnHeaderCell'
import { Discount } from '@/db/schema/discounts'
import core from '@/utils/core'
import {
  CurrencyCode,
  DiscountAmountType,
  DiscountDuration,
} from '@/types'
import TableRowPopoverMenu from '@/app/components/TableRowPopoverMenu'
import { PopoverMenuItem } from '@/app/components/PopoverMenu'
import EditDiscountModal from '@/app/components/forms/EditDiscountModal'
import DeleteDiscountModal from '@/app/components/forms/DeleteDiscountModal'
import StatusBadge from '@/app/components/StatusBadge'
import { RotateCw, Infinity } from 'lucide-react'
import { sentenceCase } from 'change-case'
import { stripeCurrencyAmountToHumanReadableCurrencyAmount } from '@/utils/stripe'

const MoreMenuCell = ({
  discount,
}: {
  discount: Discount.ClientRecord
}) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const items: PopoverMenuItem[] = [
    {
      label: 'Edit Discount',
      handler: () => setIsEditOpen(true),
    },
    {
      label: 'Delete Discount',
      handler: () => setIsDeleteOpen(true),
    },
  ]
  return (
    <>
      <EditDiscountModal
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
        discount={discount}
      />
      <DeleteDiscountModal
        id={discount.id}
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
      />
      <TableRowPopoverMenu items={items} />
    </>
  )
}

const DiscountTableDurationCell = ({
  duration,
}: {
  duration: Discount.ClientRecord
}) => {
  let durationText = ''
  let icon = null
  if (duration.duration === DiscountDuration.NumberOfPayments) {
    durationText = `${duration.numberOfPayments} Payments`
    icon = <RotateCw size={16} />
  } else if (duration.duration === DiscountDuration.Forever) {
    durationText = 'Forever'
    icon = <Infinity size={16} />
  } else {
    durationText = sentenceCase(duration.duration)
  }
  return (
    <div className="flex flex-row items-center gap-2">
      {icon}
      <span className="text-sm">{durationText}</span>
    </div>
  )
}

const DiscountTableAmountCell = ({
  amount,
}: {
  amount: Discount.ClientRecord
}) => {
  let amountText = ''
  if (amount.amountType === DiscountAmountType.Fixed) {
    amountText = stripeCurrencyAmountToHumanReadableCurrencyAmount(
      CurrencyCode.USD,
      amount.amount
    )
  } else if (amount.amountType === DiscountAmountType.Percent) {
    amountText = `${amount.amount}%`
  }
  return <span className="text-sm">{amountText}</span>
}

const DiscountsTable = ({
  discounts,
}: {
  discounts: Discount.Record[]
}) => {
  const columns = useMemo(
    () =>
      [
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell title="Name" column={column} />
          ),
          accessorKey: 'name',
          cell: ({ row: { original: cellData } }) => (
            <span className="text-sm">{cellData.name}</span>
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell title="Code" column={column} />
          ),
          accessorKey: 'code',
          cell: ({ row: { original: cellData } }) => (
            <span className="text-sm">{cellData.code}</span>
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Amount"
              column={column}
            />
          ),
          accessorKey: 'amount',
          cell: ({ row: { original: cellData } }) => (
            <DiscountTableAmountCell amount={cellData} />
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Duration"
              column={column}
            />
          ),
          accessorKey: 'duration',
          cell: ({ row: { original: cellData } }) => (
            <DiscountTableDurationCell duration={cellData} />
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Status"
              column={column}
            />
          ),
          accessorKey: 'active',
          cell: ({ row: { original: cellData } }) => (
            <StatusBadge active={cellData.active} />
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Created"
              column={column}
            />
          ),
          accessorKey: 'createdAt',
          cell: ({ row: { original: cellData } }) => (
            <>{core.formatDate(cellData.createdAt!)}</>
          ),
        },
        {
          id: '_',
          cell: ({ row: { original: cellData } }) => (
            <div
              className="justify-end flex"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreMenuCell discount={cellData} />
            </div>
          ),
        },
      ] as ColumnDef<Discount.Record>[],
    []
  )

  return (
    <Table
      columns={columns}
      data={discounts}
      className="bg-nav"
      bordered
    />
  )
}

export default DiscountsTable
