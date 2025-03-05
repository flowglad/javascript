import { type Flowglad } from '@flowglad/node'

export type Catalog =
  Flowglad.CustomerProfileRetrieveBillingResponse['catalog']

export type Product =
  Flowglad.CustomerProfileRetrieveBillingResponse.Catalog.Product.Product

export type SinglePaymentVariant =
  Flowglad.CustomerProfileRetrieveBillingResponse.Catalog.Product.SinglePaymentVariant

export type SubscriptionVariant =
  Flowglad.CustomerProfileRetrieveBillingResponse.Catalog.Product.SubscriptionVariant

export type Variant = SinglePaymentVariant | SubscriptionVariant
