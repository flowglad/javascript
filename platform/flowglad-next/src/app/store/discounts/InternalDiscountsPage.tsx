'use client'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/ion/Button'
import { PageHeader } from '@/components/ion/PageHeader'
import CreateDiscountModal from '@/components/forms/CreateDiscountModal'
import DiscountsTable from './DiscountsTable'
import { Discount } from '@/db/schema/discounts'

export enum FocusedTab {
  All = 'all',
  Active = 'active',
  Inactive = 'inactive',
}

type Props = {
  discounts: Discount.ClientRecord[]
}

function InternalDiscountsPage({ discounts }: Props) {
  const [isCreateDiscountOpen, setIsCreateDiscountOpen] =
    useState(false)

  const activeDiscounts = discounts.filter(
    (discount) => discount.active
  )
  const inactiveDiscounts = discounts.filter(
    (discount) => !discount.active
  )
  const activeDiscountsCount = activeDiscounts.length
  const inactiveDiscountsCount = inactiveDiscounts.length
  return (
    <div className="h-full flex justify-between items-center gap-2.5">
      <div className="bg-background flex-1 h-full w-full flex gap-6 p-6">
        <div className="flex-1 h-full w-full flex flex-col">
          <PageHeader
            title="Discounts"
            tabs={[
              {
                label: 'All',
                subPath: 'all',
                Component: () => (
                  <DiscountsTable discounts={discounts} />
                ),
              },
              {
                label: `${activeDiscountsCount} Active`,
                subPath: 'active',
                Component: () => (
                  <DiscountsTable discounts={activeDiscounts} />
                ),
              },
              {
                label: `${inactiveDiscountsCount} Inactive`,
                subPath: 'inactive',
                Component: () => (
                  <DiscountsTable discounts={inactiveDiscounts} />
                ),
              },
            ]}
            primaryButton={
              <Button
                iconLeading={<Plus size={16} />}
                onClick={() => setIsCreateDiscountOpen(true)}
              >
                Create Discount
              </Button>
            }
          />
          <CreateDiscountModal
            isOpen={isCreateDiscountOpen}
            setIsOpen={setIsCreateDiscountOpen}
          />
        </div>
      </div>
    </div>
  )
}

export default InternalDiscountsPage
