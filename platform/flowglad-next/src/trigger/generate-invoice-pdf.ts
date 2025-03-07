import fs from 'fs/promises'
import path from 'path'
import cloudflareMethods from '@/utils/cloudflare'
import core from '@/utils/core'
import { logger, task } from '@trigger.dev/sdk/v3'
import { initBrowser } from '@/utils/browser'
import { Invoice } from '@/db/schema/invoices'
import { generatePdf } from '@/pdf-generation/generatePDF'

export const generatePdfTask = task({
  id: 'generate-invoice-pdf',
  run: async ({ invoice }: { invoice: Invoice.Record }, { ctx }) => {
    logger.info('Starting PDF generation task')
    const urlBase = core.IS_DEV
      ? 'https://staging.flowglad.com'
      : core.envVariable('NEXT_PUBLIC_APP_URL')
    const invoiceUrl = core.safeUrl(
      `/invoice/view/${invoice.OrganizationId}/${invoice.id}/pdf-preview`,
      urlBase
    )
    const key = `invoices/${invoice.OrganizationId}/${invoice.id}/${core.nanoid()}.pdf`
    await generatePdf({ url: invoiceUrl, bucketKey: key })
    return {
      message: `PDF generated successfully: ${invoice.id}`,
      url: core.safeUrl(key, cloudflareMethods.BUCKET_PUBLIC_URL),
    }
  },
})
