import { Product } from '@/db/schema/products'
import { ProductType } from '@/types'

export const dummyProduct: Product.Record = {
  id: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Test Product',
  description: 'Test Product Description',
  type: ProductType.Service,
  imageURL: null,
  stripeProductId: null,
  OrganizationId: '1',
  active: true,
  livemode: false,
}
