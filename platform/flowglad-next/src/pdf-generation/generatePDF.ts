// utils/invoice/pdfGenerator.ts
import fs from 'fs/promises'
import path from 'path'
import { Invoice } from '@/db/schema/invoices'
import { initBrowser } from '@/utils/browser'
import cloudflareMethods from '@/utils/cloudflare'

export interface InvoicePdfContext {
  invoice: Invoice.Record
}

export const generatePdf = async ({
  url,
  bucketKey,
}: {
  url: string
  bucketKey: string
}) => {
  const browser = await initBrowser()
  try {
    const page = await browser.newPage()

    // Set content-type to ensure proper font loading
    await page.setExtraHTTPHeaders({
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    })

    // Intercept requests to ensure fonts are properly loaded
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      request.continue()
    })

    await page.goto(url, {
      waitUntil: 'networkidle0',
    })
    /**
     * We must manually inject the font because puppeteer does not load it
     * automatically.
     */
    const interRegularWoff2 = await fs.readFile(
      path.join(process.cwd(), 'public/fonts/Inter-Regular.woff2'),
      'base64'
    )
    await page.addStyleTag({
      content: `
        @font-face {
          font-family: 'Inter';
          src: url(data:font/woff2;base64,${interRegularWoff2}) format('woff2');
          font-weight: normal;
          font-style: normal;
        }
        body {
          font-family: 'Inter', sans-serif;
        }
      `,
    })

    // More robust font loading check
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            // Add a small delay to ensure rendering completes
            setTimeout(resolve, 500)
          })
        } else {
          // Fallback for browsers not supporting document.fonts
          setTimeout(resolve, 2000)
        }
      })
    })

    // Generate PDF with embedded fonts
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    })

    await cloudflareMethods.putPDF({
      body: pdfBuffer,
      key: bucketKey,
    })
  } finally {
    await browser.close()
  }
}
