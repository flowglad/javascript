'use client'
import { useState } from 'react'
import Button from '@/components/ion/Button'
import { Invoice } from '@/db/schema/invoices'
import CheckoutModal from '@/components/CheckoutModal'
import { BillingInfoCore } from '@/db/tableMethods/purchaseMethods'

export const CustomerInvoiceButtonBanner = ({
  invoice,
  billingInfo,
}: {
  invoice: Invoice.Record
  billingInfo: BillingInfoCore
}) => {
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] =
    useState(false)
  return (
    <>
      <div className="space-y-4 w-full">
        <Button
          onClick={() => {
            setIsCheckoutModalOpen(true)
          }}
          className="w-full"
        >
          Pay Now
        </Button>
        {invoice.receiptPdfURL && (
          <Button
            onClick={() => {
              window.open(invoice.receiptPdfURL!, '_blank')
            }}
          >
            Pay via Manual Bank Transfer
          </Button>
        )}
      </div>
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        billingInfo={billingInfo}
      />
    </>
  )
}
