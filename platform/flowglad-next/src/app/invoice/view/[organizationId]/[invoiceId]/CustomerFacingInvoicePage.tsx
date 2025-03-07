import { adminTransaction } from '@/db/databaseMethods'
import { selectCustomerProfileById } from '@/db/tableMethods/customerProfileMethods'
import { selectInvoiceLineItemsAndInvoicesByInvoiceWhere } from '@/db/tableMethods/invoiceLineItemMethods'
import { selectOrganizationById } from '@/db/tableMethods/organizationMethods'
import core from '@/utils/core'
import { notFound } from 'next/navigation'
import { InvoiceTemplateProps } from '@/pdf-generation/invoices/invoices'

export const CustomerFacingInvoicePage = (
  InnerComponent: React.FC<InvoiceTemplateProps>
) => {
  const InvoicePage = async ({
    params,
  }: {
    params: { invoiceId: string; organizationId: string }
  }) => {
    const { invoiceId, organizationId } = await params
    const result = await adminTransaction(async ({ transaction }) => {
      const invoicesWithLineItems =
        await selectInvoiceLineItemsAndInvoicesByInvoiceWhere(
          { id: invoiceId },
          transaction
        )

      if (invoicesWithLineItems.length === 0) {
        return null
      }
      const customerProfile = await selectCustomerProfileById(
        invoicesWithLineItems[0].CustomerProfileId,
        transaction
      )
      const organization = await selectOrganizationById(
        invoicesWithLineItems[0].OrganizationId,
        transaction
      )
      return {
        invoice: invoicesWithLineItems[0],
        invoiceLineItems: invoicesWithLineItems[0].invoiceLineItems,
        customerProfile: customerProfile,
        organization: organization,
      }
    })

    if (!result) {
      notFound()
    }
    const {
      invoice,
      invoiceLineItems,
      customerProfile,
      organization,
    } = result
    if (result.invoice.OrganizationId !== organizationId) {
      return notFound()
    }
    return (
      <InnerComponent
        invoice={invoice}
        invoiceLineItems={invoiceLineItems}
        customerProfile={customerProfile}
        organization={organization}
      />
    )
  }
  InvoicePage.displayName = InnerComponent.displayName
  return InvoicePage
}
