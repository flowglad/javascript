import chrome from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import core from './core'

const LOCAL_CHROME_EXECUTABLE =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export const initBrowser = async () => {
  const executablePath = core.IS_DEV
    ? LOCAL_CHROME_EXECUTABLE
    : (await chrome.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v127.0.0/chromium-v127.0.0-pack.tar'
      )) || LOCAL_CHROME_EXECUTABLE

  const innerBrowser = await puppeteer.launch({
    executablePath,
    args: [
      ...chrome.args,
      // '--font-render-hinting=none'
    ],
    defaultViewport: chrome.defaultViewport,
    headless: 'new',
    ignoreHTTPSErrors: true,
  })
  return innerBrowser
}
