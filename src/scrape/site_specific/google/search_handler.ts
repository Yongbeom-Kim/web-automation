import { BrowserContext, Page } from 'patchright'
import { humanClick, humanScrollAround } from '../../human_like/mouse'
import { humanType } from '../../human_like/keyboard'
import { sleepRandom } from '../../../common/utils'
import { Link, WebsiteHandler } from '../../handler_type'
import { MarkdownConversionHandler } from '../../markdown_conversion/handlers'
import { error, warn } from 'console'
import { Tool } from '../../../agent/types/base_agent'

export class GoogleSearchHandler implements WebsiteHandler {
	constructor(private readonly page: Page) {
		if (page.url() !== 'https://www.google.com/') {
			error(
				'Page is not google.com',
				'URL',
				page.url(),
				'Expected',
				'https://www.google.com/'
			)
			throw new Error('Page is not google.com')
		}
		this.page = page
	}

	getAgentState(): string {
		return 'Current page is ' + this.page.url()
	}

	getAgentTools(): Tool[] {
		return [
			{
				callback: async (args: Record<string, any>) => {
					await this.search(args['query'])
					return 'Search completed'
				},
				ToolDesc: {
					type: 'function',
					name: 'search',
					description: 'Search for a query on google.',
					parameters: {
						type: 'object',
						properties: {
							query: { type: 'string' },
						},
						required: ['query'],
						additionalProperties: false,
					},
					strict: true,
				},
			},
		]
	}

	async getContentAsMarkdown(
		conversionHandler: MarkdownConversionHandler
	): Promise<string> {
		return ''
	}

	async getLinks(): Promise<Link[]> {
		return []
	}

	async search(query: string): Promise<void> {
		await sleepRandom(1000, 250)
		if (!(await this.searchInputIsFocused())) {
			await this.clickSearchInput()
		}
		await humanType(this.page, query)
		await humanType(this.page, '\n')
		await sleepRandom(1500, 250)
		await humanScrollAround(this.page, 5)
	}

	async searchInputIsFocused(): Promise<boolean> {
		const focusedElement = await this.page.evaluate(
			() => document.activeElement
		)
		if (focusedElement === null) {
			warn('No focused element found', 'url', this.page.url())
			return false
		}
		const searchInputElement = await this.page.evaluate(() =>
			document.querySelector('textarea[name="q"]')
		)
		if (searchInputElement === null) {
			error('Google search input not found', 'url', this.page.url())
			throw new Error('Google search input not found')
		}
		return focusedElement === searchInputElement
	}

	async clickSearchInput(): Promise<void> {
		const searchInput = await this.page.locator('textarea[name="q"]')
		if ((await searchInput.count()) !== 1) {
			error(
				'Google search input not found',
				'Found elements',
				searchInput.count()
			)
			throw new Error('Google search input not found')
		}
		await humanClick(this.page, 'textarea[name="q"]')
	}
}

export class GoogleSearchResultsHandler implements WebsiteHandler {
	constructor(private readonly page: Page) {
		if (!page.url().startsWith('https://www.google.com/')) {
			error('Page is not a google search page', 'URL', page.url())
			throw new Error('Page is not a google search page')
		}
		const searchlocator = page.locator('css=div#search')
	}

	getAgentState(): string {
		return 'Current page is ' + this.page.url() + ' (google search results)'
	}

	getAgentTools(): Tool[] {
		throw new Error('Method not implemented.')
	}
	search(query: string): Promise<void> {
		throw new Error('Method not implemented.')
	}
	async getContentAsMarkdown(
		conversionHandler: MarkdownConversionHandler
	): Promise<string> {
		return ''
	}

	async getLinks(): Promise<Link[]> {
		return []
	}
}
