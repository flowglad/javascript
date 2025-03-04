import { type Flowglad } from '@flowglad/node'

export type Payment = Flowglad.Payments.PaymentRetrieveResponse

export type PaymentStatus =
  Flowglad.Payments.PaymentRetrieveResponse['payment']['status']

export type PaymentMethodType =
  Flowglad.Payments.PaymentRetrieveResponse['payment']['paymentMethod']
