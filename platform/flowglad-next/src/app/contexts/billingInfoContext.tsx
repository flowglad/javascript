'use client'
import { Organization } from '@/db/schema/organizations'
import { Product } from '@/db/schema/products'
import { createContext, useContext } from 'react'
import { Nullish, PriceType } from '@/types'
import {
  BillingInfoCore,
  billingInfoSchema,
} from '@/db/tableMethods/purchaseMethods'
import { CustomerBillingAddress } from '@/db/schema/customers'

export type BillingInfoContextValues = {
  taxAmount?: Nullish<number>
  sellerOrganization?: Pick<Organization.Record, 'logoURL' | 'name'>
  product?: Product.ClientRecord
  priceType: PriceType
  billingAddress?: Nullish<CustomerBillingAddress>
} & BillingInfoCore

const BillingInfoContext = createContext<
  Partial<BillingInfoContextValues>
>({
  priceType: PriceType.SinglePayment,
  billingAddress: null,
})

export const useSafeBillingInfoContext = () => {
  const billingInfo = useContext(BillingInfoContext)
  return billingInfoSchema.parse(billingInfo)
}

const BillingInfoProvider = ({
  children,
  values,
}: {
  children: React.ReactNode
  values: BillingInfoContextValues
}) => {
  return (
    <BillingInfoContext.Provider value={values}>
      {children}
    </BillingInfoContext.Provider>
  )
}

export default BillingInfoProvider
