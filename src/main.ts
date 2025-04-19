// patchright here!
import { chromium, BrowserContext, Page } from 'patchright'
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
	const page = await browser.newPage()
	await page.goto('http://example.com')
	// other actions...
	await page.waitForTimeout(10000)
	await browser.close()
})()
