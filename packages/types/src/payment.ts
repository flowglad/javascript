import { type Flowglad } from '@flowglad/node'

export type Payment = Flowglad.Payments.PaymentRetrieveResponse

export type PaymentStatus =
  Flowglad.Payments.PaymentRetrieveResponse['status']

export type PaymentMethodType =
  Flowglad.Payments.PaymentRetrieveResponse['paymentMethod']
