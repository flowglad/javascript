import { InvoiceTemplate } from '@/pdf-generation/invoices/invoices'
import { CustomerFacingInvoicePage } from '../CustomerFacingInvoicePage'

const InvoicePdfPreviewPage =
  CustomerFacingInvoicePage(InvoiceTemplate)

export default InvoicePdfPreviewPage
