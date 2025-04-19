import { BrowserContext } from 'patchright'
import { humanScrollAround } from '../../human_like/mouse'
import { humanType } from '../../human_like/keyboard'
import { sleepRandom } from '../../common/utils'
export async function newGoogleSearch(
	context: BrowserContext,
	searchQuery: string
) {
	const page = await context.newPage()
	await page.goto(`https://www.google.com/`)
	await humanType(page, searchQuery)
	await humanType(page, '\n')
	await sleepRandom(1500, 250)
	await humanScrollAround(page, 5)
}
