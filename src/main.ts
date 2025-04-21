// patchright here!
import { chromium, BrowserContext, Page } from 'patchright'
import {
	GoogleSearchHandler,
	newGoogleSearch,
} from './scrape/site_specific/google/search_handler'
import { sleep } from './common/utils'
import { newHandler } from './scrape/handler_factory'
import OpenAI from 'openai'
import { ResponseInput } from 'openai/resources/responses/responses'
import { BaseAgent } from './agent/types/base_agent'
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
	const task = 'Find the best LLM to do research on large language models.'
	const input: ResponseInput = [{ role: 'system', content: task }]
	const searchPage = await browser.newPage()
	await searchPage.goto('https://www.google.com')
	while (true) {
		const pageHandler = newHandler(searchPage)
		const tools = pageHandler.getAgentTools()
		const agent = new BaseAgent('gpt-4o-mini')
		console.log(tools, agent)
		// await pageHandler.search('large language models')
		await searchPage.waitForTimeout(10000)
		await sleep(10000)
	}
})()
