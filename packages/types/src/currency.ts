import { type Flowglad } from '@flowglad/node'

export type Currency =
  Flowglad.CustomerProfileRetrieveBillingResponse.Catalog.Product.SinglePaymentVariant['currency']
