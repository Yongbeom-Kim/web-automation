// patchright here!
import { chromium, BrowserContext, Page } from 'patchright'
import { newGoogleSearch } from './site_specific/google/search'
import { sleep } from './common/utils'
;(async (): Promise<void> => {
	const browser: BrowserContext = await chromium.launchPersistentContext(
		'...',
		{
			channel: 'chrome',
			headless: false,
			viewport: null,
			// do NOT add custom browser headers or userAgent
		}
	)
	// const page = await browser.newPage()
	// await page.goto('https://www.google.com')
	// // other actions...
	// await page.waitForTimeout(10000)
	// await browser.close()

	await newGoogleSearch(browser, 'large language models')
	await sleep(10000)
})()
