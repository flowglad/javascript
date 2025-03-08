import { InvoiceTemplateProps } from '@/pdf-generation/invoices'
import { CustomerFacingInvoicePage } from './CustomerFacingInvoicePage'
import core from '@/utils/core'
import {
  humanReadableCurrencyAmountToStripeCurrencyAmount,
  stripeCurrencyAmountToHumanReadableCurrencyAmount,
} from '@/utils/stripe'
import Button from '@/components/ion/Button'

const CustomerInvoiceView = (props: InvoiceTemplateProps) => {
  const { invoice, invoiceLineItems } = props
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary-container p-4">
      <div className="bg-internal rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-primary text-2xl font-bold mb-2">
            Invoice paid
          </h1>
          <p className="text-4xl font-bold">
            {stripeCurrencyAmountToHumanReadableCurrencyAmount(
              invoice.currency,
              invoiceLineItems.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
              )
            )}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between">
            <span className="text-subtle">Invoice number</span>
            <span className="font-medium">
              #{invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-subtle">Payment date</span>
            <span className="font-medium">
              {core.formatDate(invoice.createdAt)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {invoice.pdfURL && (
            <Button
              onClick={() => {
                window.open(invoice.pdfURL!, '_blank')
              }}
            >
              Download invoice
            </Button>
          )}

          {invoice.receiptPdfURL && (
            <Button
              onClick={() => {
                window.open(invoice.receiptPdfURL!, '_blank')
              }}
            >
              Download receipt
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

const CustomerInvoiceViewPage = CustomerFacingInvoicePage(
  CustomerInvoiceView
)

export default CustomerInvoiceViewPage
