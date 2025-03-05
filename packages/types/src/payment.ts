import { type Flowglad } from '@flowglad/node'

export type Payment =
  Flowglad.Payments.PaymentRetrieveResponse.Payment

export type PaymentStatus = Payment['status']

export type PaymentMethodType = Payment['paymentMethod']
