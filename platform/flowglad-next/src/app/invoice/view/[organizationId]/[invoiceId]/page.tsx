import { InvoiceTemplateProps } from '@/pdf-generation/invoices'
import { CustomerFacingInvoicePage } from './CustomerFacingInvoicePage'
import core from '@/utils/core'
import {
  humanReadableCurrencyAmountToStripeCurrencyAmount,
  stripeCurrencyAmountToHumanReadableCurrencyAmount,
} from '@/utils/stripe'
import Button from '@/components/ion/Button'
import { CheckoutFlowType, InvoiceStatus, PriceType } from '@/types'
import { CustomerInvoiceButtonBanner } from './CustomerInvoiceButtonBanner'
import { BillingInfoCore } from '@/db/tableMethods/purchaseMethods'
import { stubbedPurchaseSession } from '@/stubs/checkoutContextStubs'

const CustomerInvoicePaidView = (props: InvoiceTemplateProps) => {
  const { invoice, invoiceLineItems } = props
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary-container p-4">
      <div className="bg-internal rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-primary text-2xl font-bold mb-2">
            Invoice Paid
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

const CustomerInvoiceOpenView = (props: InvoiceTemplateProps) => {
  const { invoice, invoiceLineItems, customerProfile, organization } =
    props
  // TODO: unstub
  const billingInfo: BillingInfoCore = {
    customerProfile,
    sellerOrganization: organization,
    flowType: CheckoutFlowType.Invoice,
    invoice,
    invoiceLineItems,
    feeCalculation: null,
    clientSecret: '',
    redirectUrl: '',
    purchaseSession: stubbedPurchaseSession,
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary-container p-4">
      <div className="bg-internal rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="mb-8">
          <p className="text-4xl font-bold mb-1">
            {stripeCurrencyAmountToHumanReadableCurrencyAmount(
              invoice.currency,
              invoiceLineItems.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
              )
            )}
          </p>
          <p className="text-subtle">
            Due{' '}
            {core.formatDate(invoice.dueDate || invoice.createdAt)}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex flex-col">
            <span className="text-subtle text-sm">To</span>
            <span className="font-medium">
              {customerProfile.name}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-subtle text-sm">From</span>
            <span className="font-medium">{organization.name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-subtle text-sm">Invoice</span>
            <span className="font-medium">
              #{invoice.invoiceNumber}
            </span>
          </div>
        </div>

        <CustomerInvoiceButtonBanner
          invoice={invoice}
          billingInfo={billingInfo}
        />
      </div>
    </div>
  )
}

const CustomerInvoiceView = (props: InvoiceTemplateProps) => {
  const { invoice, invoiceLineItems } = props
  if (invoice.status === InvoiceStatus.Paid) {
    return (
      <CustomerInvoicePaidView
        invoice={invoice}
        invoiceLineItems={invoiceLineItems}
        customerProfile={props.customerProfile}
        organization={props.organization}
      />
    )
  }

  return (
    <CustomerInvoiceOpenView
      invoice={invoice}
      invoiceLineItems={invoiceLineItems}
      customerProfile={props.customerProfile}
      organization={props.organization}
    />
  )
}
const CustomerInvoiceViewPage = CustomerFacingInvoicePage(
  CustomerInvoiceView
)

export default CustomerInvoiceViewPage
