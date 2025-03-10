import cloudflareMethods from '@/utils/cloudflare'
import core from '@/utils/core'
import { logger, task } from '@trigger.dev/sdk/v3'
import { Invoice } from '@/db/schema/invoices'
import { generatePdf } from '@/pdf-generation/generatePDF'
import { adminTransaction } from '@/db/databaseMethods'
import {
  selectInvoiceById,
  updateInvoice,
} from '@/db/tableMethods/invoiceMethods'

export const generateInvoicePdfTask = task({
  id: 'generate-invoice-pdf',
  run: async ({ invoiceId }: { invoiceId: string }, { ctx }) => {
    const invoice = await adminTransaction(
      async ({ transaction }) => {
        return await selectInvoiceById(invoiceId, transaction)
      }
    )
    /**
     * In dev mode, trigger will not load localhost:3000 correctly,
     * probably because it's running inside of a container.
     * So we use staging.flowglad.com as the base URL
     */
    const urlBase = core.IS_DEV
      ? 'https://staging.flowglad.com'
      : core.envVariable('NEXT_PUBLIC_APP_URL')

    const invoiceUrl = core.safeUrl(
      `/invoice/view/${invoice.OrganizationId}/${invoice.id}/pdf-preview`,
      urlBase
    )
    const key = `invoices/${invoice.OrganizationId}/${invoice.id}/${core.nanoid()}.pdf`
    await generatePdf({ url: invoiceUrl, bucketKey: key })
    const invoicePdfUrl = core.safeUrl(
      key,
      cloudflareMethods.BUCKET_PUBLIC_URL
    )
    const oldInvoicePdfUrl = await adminTransaction(
      async ({ transaction }) => {
        const latestInvoice = await selectInvoiceById(
          invoice.id,
          transaction
        )
        const oldInvoicePdfUrl = latestInvoice.pdfURL
        await updateInvoice(
          {
            ...latestInvoice,
            pdfURL: invoicePdfUrl,
          },
          transaction
        )
        return oldInvoicePdfUrl
      }
    )
    /**
     * Delete the old invoice PDF from Cloudflare if it exists
     */
    if (oldInvoicePdfUrl) {
      try {
        await cloudflareMethods.deleteObject(
          cloudflareMethods.keyFromCDNUrl(oldInvoicePdfUrl)
        )
      } catch (error) {
        logger.info(
          `Error deleting old invoice PDF: ${oldInvoicePdfUrl}`,
          { error }
        )
      }
    }
    return {
      message: `PDF generated successfully: ${invoice.id}`,
      url: invoicePdfUrl,
    }
  },
})
