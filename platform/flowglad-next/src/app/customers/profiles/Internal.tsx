// Generated with Ion on 9/20/2024, 10:31:46 PM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=372:12322
'use client'
import { Plus } from 'lucide-react'

import { type ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import Table from '@/components/ion/Table'
import { PageHeader } from '@/components/ion/PageHeader'
import {
  CustomerProfile,
  CustomerTableRowData,
  InferredCustomerProfileStatus,
} from '@/db/schema/customerProfiles'
import { Customer } from '@/db/schema/customers'
import TableRowPopoverMenu from '@/components/TableRowPopoverMenu'
import core from '@/utils/core'
import { useRouter } from 'next/navigation'
import Button from '@/components/ion/Button'
import CreateCustomerFormModal from '@/components/forms/CreateCustomerFormModal'
import { Variant } from '@/db/schema/variants'
import { Product } from '@/db/schema/products'
import {
  PopoverMenuItem,
  PopoverMenuItemState,
} from '@/components/PopoverMenu'
import ArchiveCustomerModal from '@/components/forms/ArchiveCustomerModal'
import Badge, { BadgeProps } from '@/components/ion/Badge'
import { CurrencyCode } from '@/types'
import EditCustomerModal from '@/components/forms/EditCustomerModal'
import { stripeCurrencyAmountToHumanReadableCurrencyAmount } from '@/utils/stripe'
import SortableColumnHeaderCell from '@/components/ion/SortableColumnHeaderCell'

type CustomerTableRow = {
  name: string
  email: string
  totalSpend: number
  payments: number
  status: InferredCustomerProfileStatus
  customerProfile: CustomerProfile.ClientRecord
  customer: Customer.ClientRecord
}

const MoreMenuCell = ({
  customerProfile,
  customer,
  variants,
}: {
  customerProfile: CustomerProfile.ClientRecord
  customer: Customer.ClientRecord
  variants: {
    variant: Variant.Record
    product: Product.ClientRecord
  }[]
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  // const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false)
  const [isArchiveCustomerOpen, setIsArchiveCustomerOpen] =
    useState(false)
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] =
    useState(false)
  const basePopoverMenuItems: PopoverMenuItem[] = [
    // {
    //   label: 'New Purchase',
    //   handler: () => setIsNewPurchaseOpen(true),
    // },
    {
      label: 'Edit Customer',
      handler: () => setIsEditOpen(true),
    },
    {
      label: 'Archive Customer',
      state: PopoverMenuItemState.Danger,
      handler: () => setIsArchiveCustomerOpen(true),
    },
  ]
  const maybeNewInvoiceItem: PopoverMenuItem[] = [
    {
      label: 'New Invoice',
      handler: () => setIsCreateInvoiceOpen(true),
    },
  ]
  return (
    <>
      <EditCustomerModal
        customerProfile={customerProfile}
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
      />
      <ArchiveCustomerModal
        isOpen={isArchiveCustomerOpen}
        setIsOpen={setIsArchiveCustomerOpen}
        CustomerProfileId={customerProfile.id}
        customerArchived={customerProfile.archived ?? false}
      />
      <TableRowPopoverMenu
        items={[...maybeNewInvoiceItem, ...basePopoverMenuItems]}
      />
    </>
  )
}

const CustomerStatusBadge = ({
  status,
}: {
  status: InferredCustomerProfileStatus
}) => {
  let color: BadgeProps['color'] = 'green'
  let label = 'Active'
  if (status === InferredCustomerProfileStatus.Archived) {
    color = 'grey'
    label = 'Archived'
  } else if (status === InferredCustomerProfileStatus.Pending) {
    color = 'yellow'
    label = 'Pending'
  }
  return <Badge color={color}>{label}</Badge>
}

const CustomersTable = ({
  customers,
  focusedTab,
  variants,
}: {
  customers: CustomerTableRowData[]
  focusedTab: string
  variants: {
    variant: Variant.Record
    product: Product.ClientRecord
  }[]
}) => {
  const router = useRouter()
  const customerData: CustomerTableRow[] = customers
    .map((item) => ({
      name: item.customer.name,
      email: item.customer.email,
      totalSpend: item.totalSpend ?? 0,
      payments: item.payments ?? 0,
      customerProfile: item.customerProfile,
      customer: {
        ...item.customer,
        billingAddress: item.customerProfile.billingAddress,
      },
      status: item.status,
    }))
    .filter((customerItem) => {
      if (focusedTab === 'archived') {
        return customerItem.customerProfile.archived
      }
      return true
    })

  const columns: ColumnDef<CustomerTableRow>[] = useMemo(
    () =>
      [
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell title="Name" column={column} />
          ),
          accessorKey: 'name',
          cell: ({ row: { original: cellData } }) => (
            <>{cellData.name}</>
          ),
        },
        // {
        //   header: ({ column }) => (
        //     <SortableColumnHeaderCell
        //       title="Status"
        //       column={column}
        //     />
        //   ),
        //   accessorKey: 'status',
        //   cell: ({ row: { original: cellData } }) => (
        //     <CustomerStatusBadge status={cellData.status} />
        //   ),
        // },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell title="Email" column={column} />
          ),
          accessorKey: 'email',
          cell: ({ row: { original: cellData } }) => (
            <>{cellData.email}</>
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Total Spend"
              column={column}
            />
          ),
          accessorKey: 'totalSpend',
          cell: ({ row: { original: cellData } }) =>
            stripeCurrencyAmountToHumanReadableCurrencyAmount(
              CurrencyCode.USD,
              cellData.totalSpend
            ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Payments"
              column={column}
            />
          ),
          accessorKey: 'payments',
          cell: ({ row: { original: cellData } }) => (
            <>{cellData.payments}</>
          ),
        },
        {
          header: ({ column }) => (
            <SortableColumnHeaderCell
              title="Created At"
              column={column}
            />
          ),
          accessorKey: 'customerProfile.createdAt',
          cell: ({ row: { original: cellData } }) => (
            <>
              {core.formatDate(cellData.customerProfile.createdAt!)}
            </>
          ),
        },
        {
          id: '_',
          cell: ({ row: { original: cellData } }) => (
            <div
              className="w-fit"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreMenuCell
                customer={cellData.customer}
                customerProfile={cellData.customerProfile}
                variants={variants}
              />
            </div>
          ),
        },
      ] as ColumnDef<CustomerTableRow>[],
    []
  )

  return (
    <div className="flex-1 h-full w-full flex flex-col gap-6 rounded-radius-sm">
      <div className="w-full flex flex-col gap-5 rounded-radius-sm">
        <Table
          columns={columns}
          data={customerData}
          onClickRow={(row) => {
            router.push(
              `/customers/profiles/${row.customerProfile.id}`
            )
          }}
          bordered
        />
      </div>
    </div>
  )
}

function Internal({
  params,
  customers,
  variants,
}: {
  params: { focusedTab: string }
  customers: CustomerTableRowData[]
  variants: {
    variant: Variant.Record
    product: Product.ClientRecord
  }[]
}) {
  const [focusedTab, setFocusedTab] = useState(
    params.focusedTab ?? 'all'
  )
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] =
    useState(false)

  const tabs = [
    {
      label: 'All',
      subPath: 'all',
      active: focusedTab === 'all',
      Component: () => (
        <CustomersTable
          customers={customers}
          focusedTab={focusedTab}
          variants={variants}
        />
      ),
    },
    {
      label: 'Top Spending',
      subPath: 'top-spending',
      active: focusedTab === 'top-spending',
      Component: () => (
        <CustomersTable
          customers={customers}
          focusedTab={focusedTab}
          variants={variants}
        />
      ),
    },
    {
      label: 'Newest',
      subPath: 'newest',
      active: focusedTab === 'newest',
      Component: () => (
        <CustomersTable
          customers={customers}
          focusedTab={focusedTab}
          variants={variants}
        />
      ),
    },
    {
      label: 'Archived',
      subPath: 'archived',
      active: focusedTab === 'archived',
      Component: () => (
        <CustomersTable
          customers={customers}
          focusedTab={focusedTab}
          variants={variants}
        />
      ),
    },
  ]
  return (
    <>
      <div className="h-full flex justify-between items-center gap-2.5">
        <div className="bg-background flex-1 h-full w-full flex gap-6 p-6">
          <div className="flex-1 h-full w-full flex flex-col">
            <PageHeader
              title="Customers"
              tabs={tabs}
              onTabChange={setFocusedTab}
              primaryButton={
                <Button
                  iconLeading={<Plus size={16} />}
                  onClick={() => setIsCreateCustomerOpen(true)}
                >
                  Create Customer
                </Button>
              }
            />
          </div>
        </div>
      </div>
      <CreateCustomerFormModal
        isOpen={isCreateCustomerOpen}
        setIsOpen={setIsCreateCustomerOpen}
      />
    </>
  )
}

export default Internal
