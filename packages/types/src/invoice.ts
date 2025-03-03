import { type Flowglad } from '@flowglad/node'

export type Invoice = Flowglad.Invoice.InvoiceRetrieveResponse
export type InvoiceLineItem = Flowglad.InvoiceLineItemRetrieveResponse
export type InvoiceStatus =
  Flowglad.Invoice.InvoiceRetrieveResponse['status']

export interface InvoiceDisplayProps {
  showTaxDetails?: boolean
  condensed?: boolean
}

export interface InvoiceActionOptions {
  allowDownload?: boolean
  allowPayment?: boolean
}
