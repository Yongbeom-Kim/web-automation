import type { Page } from 'patchright'
import { ms } from '../common/types'
import { warn } from '../common/logging'
import { sleep, randomGaussian } from '../common/utils'

export type HumanTypeOptions = {
	delayMean: ms // avg ms between keystrokes
	delayStd: ms // ms jitter
	mistakeRate: number // prob. of a typo per char
	correctionDelayMean: ms // avg ms before hitting Backspace
	correctionDelayStd: ms // jitter
	wordPauseMean: ms // avg ms after space
	wordPauseStd: ms // jitter
}

const DEFAULT_OPTS: HumanTypeOptions = {
	delayMean: 60,
	delayStd: 30,
	mistakeRate: 0.02,
	correctionDelayMean: 200,
	correctionDelayStd: 100,
	wordPauseMean: 300,
	wordPauseStd: 150,
}

const SHIFT_CHAR_MAP: Record<string, string> = {
	'!': '1',
	'@': '2',
	'#': '3',
	$: '4',
	'%': '5',
	'^': '6',
	'&': '7',
	'*': '8',
	'(': '9',
	')': '0',
	_: 'Minus',
	'+': 'Equal',
	'{': 'BracketLeft',
	'}': 'BracketRight',
	'|': 'Backslash',
	':': 'Semicolon',
	'"': 'Quote',
	'<': 'Comma',
	'>': 'Period',
	'?': 'Slash',
	'~': 'Backquote',
}

const DIRECT_CHAR_MAP: Record<string, string> = {
	' ': 'Space',
	'-': 'Minus',
	'=': 'Equal',
	'[': 'BracketLeft',
	']': 'BracketRight',
	'\\': 'Backslash',
	';': 'Semicolon',
	"'": 'Quote',
	',': 'Comma',
	'.': 'Period',
	'/': 'Slash',
	'`': 'Backquote',
  '\n': 'Enter',
}

// Chars that map to themselves
const LITERAL_CHARS = new Set([
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
])

async function pressChar(page: Page, char: string) {
	if (char >= 'A' && char <= 'Z') {
		await page.keyboard.down('Shift')
		await page.keyboard.press(char.toLowerCase())
		await page.keyboard.up('Shift')
	} else if (SHIFT_CHAR_MAP[char]) {
		await page.keyboard.down('Shift')
		await page.keyboard.press(SHIFT_CHAR_MAP[char])
		await page.keyboard.up('Shift')
	} else if (DIRECT_CHAR_MAP[char]) {
		await page.keyboard.press(DIRECT_CHAR_MAP[char])
	} else if (LITERAL_CHARS.has(char)) {
		await page.keyboard.press(char)
	} else {
		warn('Unknown character pressed', char)
		await page.keyboard.press(char)
	}
}

// the main typing routine
export async function humanType(
	page: Page,
	text: string,
	optsPartial: Partial<HumanTypeOptions> = {}
): Promise<void> {
	const opts = { ...DEFAULT_OPTS, ...optsPartial }

	for (let i = 0; i < text.length; i++) {
		const ch = text[i]!

		// random typo + correction
		const isAlpha = /[a-zA-Z]/.test(ch)
		const isDigit = /[0-9]/.test(ch)
		if ((isAlpha || isDigit) && Math.random() < opts.mistakeRate) {
			const pool = isAlpha ? 'abcdefghijklmnopqrstuvwxyz' : '0123456789'
			const wrong = pool[Math.floor(Math.random() * pool.length)]!
			await pressChar(page, wrong)
			await sleep(
				Math.max(
					50,
					randomGaussian(opts.correctionDelayMean, opts.correctionDelayStd)
				)
			)
			await page.keyboard.press('Backspace')
		}

		// actual character
		await pressChar(page, ch)

		// pause
		if (ch === ' ') {
			await sleep(
				Math.max(50, randomGaussian(opts.wordPauseMean, opts.wordPauseStd))
			)
		} else {
			await sleep(Math.max(50, randomGaussian(opts.delayMean, opts.delayStd)))
		}
	}
}
