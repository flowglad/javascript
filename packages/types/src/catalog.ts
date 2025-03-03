import { type Flowglad } from '@flowglad/node'

export type Catalog =
  Flowglad.CustomerProfileRetrieveBillingResponse['catalog']

export type Product =
  Flowglad.CustomerProfileRetrieveBillingResponse.Catalog.Product

export type Variant =
  | Flowglad.CustomerProfileRetrieveBillingResponse.Catalog.Product.SinglePaymentVariant
  | Flowglad.CustomerProfileRetrieveBillingResponse.Catalog.Product.SubscriptionVariant
