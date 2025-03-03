import { Product } from '@/db/schema/products'

export const dummyProduct: Product.Record = {
  id: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Test Product',
  description: 'Test Product Description',
  imageURL: null,
  stripeProductId: null,
  OrganizationId: '1',
  displayFeatures: null,
  active: true,
  livemode: false,
}
