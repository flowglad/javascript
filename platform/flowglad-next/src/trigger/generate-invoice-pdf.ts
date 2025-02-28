import cloudflareMethods from '@/utils/cloudflare'
import core from '@/utils/core'
import { logger, task } from '@trigger.dev/sdk/v3'
import { initBrowser } from '@/utils/browser'

export const generatePdfTask = task({
  id: 'generate-invoice-pdf',
  run: async (
    { invoiceNumber }: { invoiceNumber: string },
    { ctx }
  ) => {
    logger.info('Starting PDF generation task')
    const browser = await initBrowser()
    logger.info('Browser initialized')

    const defaultContext = browser.browserContexts()[0]
    const page = (await defaultContext.pages())[0]
    const invoiceUrl = core.safeUrl(
      `/invoice/${invoiceNumber}`,
      `https://flowglad-git-complete-checkout-action-flowglad.vercel.app`
    )
    await page.goto(invoiceUrl, {
      // let's make sure the page is fully loaded before taking the screenshot
      waitUntil: 'domcontentloaded',
    })

    logger.info('Page loaded')

    const pdfBuffer = await page.pdf({ format: 'A4' })
    logger.info('PDF generated')
    await cloudflareMethods.putPDF({
      body: pdfBuffer,
      key: `invoices/${invoiceNumber}/${core.nanoid()}.pdf`,
    })

    logger.info('PDF uploaded')
    await page.close()
    logger.info('Page closed')
    await browser.close()
    logger.info('Browser closed')
    try {
      return {
        message: 'PDF generated successfully',
        pdfBuffer: '',
      }
    } catch (error) {
      logger.error('Error generating PDF', { error })
      throw error
    }
  },
})
