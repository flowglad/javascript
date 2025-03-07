import cloudflareMethods from '@/utils/cloudflare'
import core from '@/utils/core'
import { task } from '@trigger.dev/sdk/v3'
import { Invoice } from '@/db/schema/invoices'
import { generatePdf } from '@/pdf-generation/generatePDF'
import { adminTransaction } from '@/db/databaseMethods'
import { updateInvoice } from '@/db/tableMethods/invoiceMethods'

export const generatePdfTask = task({
  id: 'generate-invoice-pdf',
  run: async ({ invoice }: { invoice: Invoice.Record }, { ctx }) => {
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
    await adminTransaction(async ({ transaction }) => {
      return updateInvoice(
        {
          id: invoice.id,
          pdfURL: invoicePdfUrl,
        } as Invoice.Update,
        transaction
      )
    })
    return {
      message: `PDF generated successfully: ${invoice.id}`,
      url: invoicePdfUrl,
    }
  },
})
