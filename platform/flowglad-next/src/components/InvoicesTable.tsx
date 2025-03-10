import Table from '@/components/ion/Table'
import TableTitle from '@/components/ion/TableTitle'
import Button from '@/components/ion/Button'
import { Ellipsis, Plus } from 'lucide-react'
import { Invoice } from '@/db/schema/invoices'
import { Customer } from '@/db/schema/customers'
import { CustomerProfile } from '@/db/schema/customerProfiles'
import { Purchase } from '@/db/schema/purchases'
import { useMemo, useState } from 'react'
import Badge, { BadgeProps } from './ion/Badge'
import { ColumnDef } from '@tanstack/react-table'
import core from '@/utils/core'
import { sentenceCase } from 'change-case'
import SortableColumnHeaderCell from '@/components/ion/SortableColumnHeaderCell'
import CreateInvoiceModal from './forms/CreateInvoiceModal'
import {
  InvoiceLineItem,
  InvoiceWithLineItems,
} from '@/db/schema/invoiceLineItems'

const InvoiceStatusBadge = ({
  invoice,
}: {
  invoice: Invoice.ClientRecord
}) => {
  let color: BadgeProps['color']
  switch (invoice.status) {
    case 'draft':
      color = 'grey'
      break
    case 'paid':
      color = 'green'
      break
    case 'void':
      color = 'red'
      break
    case 'uncollectible':
      color = 'red'
      break
    case 'partially_refunded':
      color = 'yellow'
      break
    case 'refunded':
      color = 'yellow'
      break
  }
  return (
    <Badge variant="soft" color={color} size="sm">
      {sentenceCase(invoice.status)}
    </Badge>
  )
}

const InvoicesTable = ({
  invoicesAndLineItems,
  customer,
}: {
  invoicesAndLineItems: InvoiceWithLineItems[]
  customer: {
    customer: Customer.ClientRecord
    customerProfile: CustomerProfile.ClientRecord
  }
  purchases: Purchase.ClientRecord[]
}) => {
  const [createInvoiceModalOpen, setCreateInvoiceModalOpen] =
    useState(false)

  const columns_1 = useMemo(
    () =>
      [
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Amount"
              column={column}
            />
          ),
          accessorKey: 'amount',
          cell: ({ row: { original: cellData } }) => (
            <>
              <span className="font-bold text-sm">$0.00</span>
            </>
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Status"
              column={column}
            />
          ),
          accessorKey: 'status',
          cell: ({ row: { original: cellData } }) => (
            <InvoiceStatusBadge invoice={cellData} />
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Invoice Number"
              column={column}
            />
          ),
          accessorKey: 'invoiceNumber',
          cell: ({ row: { original: cellData } }) => (
            <>{cellData.invoiceNumber}</>
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell title="Due" column={column} />
          ),
          accessorKey: 'due',
          cell: ({ row: { original: cellData } }) => (
            <>
              {cellData.dueDate
                ? core.formatDate(cellData.dueDate)
                : '-'}
            </>
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
            <>{core.formatDate(cellData.createdAt)}</>
          ),
        },
        {
          id: '_',
          cell: ({ row: { original: cellData } }) => (
            <Button
              iconLeading={<Ellipsis size={16} />}
              variant="ghost"
              color="neutral"
              size="sm"
              onClick={() => {}}
            />
          ),
        },
      ] as ColumnDef<InvoiceWithLineItems>[],
    []
  )

  return (
    <div className="w-full flex flex-col gap-5">
      <TableTitle
        title="Invoices"
        buttonLabel="Create Invoice"
        buttonIcon={<Plus size={16} />}
        buttonOnClick={() => setCreateInvoiceModalOpen(true)}
      />
      <div className="w-full flex flex-col gap-5 pb-20">
        <Table
          columns={columns_1}
          data={invoicesAndLineItems}
          className="w-full rounded-radius"
          bordered
        />
      </div>
      <CreateInvoiceModal
        isOpen={createInvoiceModalOpen}
        setIsOpen={setCreateInvoiceModalOpen}
        customerProfile={customer.customerProfile}
      />
    </div>
  )
}

export default InvoicesTable
