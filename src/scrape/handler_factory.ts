import { BrowserContext, Page } from 'patchright'
import {
	GoogleSearchHandler,
	GoogleSearchResultsHandler,
} from './site_specific/google/search_handler'

export function newHandler(page: Page) {
	if (page.url().startsWith('https://www.google.com/')) {
		if (page.url().includes('search')) {
			return new GoogleSearchResultsHandler(page)
		}
		return new GoogleSearchHandler(page)
	}
	throw new Error('Unknown page')
}
