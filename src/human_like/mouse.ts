import { chromium, Page, ViewportSize } from 'patchright'
import {
	cappedRandomGaussian,
	getViewportSize,
	randBetween,
	sleep,
	sleepRandom,
} from '../common/utils'
import { debug, error, fatal } from '../common/logging'
import { Point, Rectangle } from '../common/types'

class ElementError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ElementError'
	}
}

// Track last mouse position globally
let mousePos: Point = { x: 0, y: 0 }

// Utility Functions
// Ease function (easeInOutQuad)
const ease = (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

// Generate a point on a cubic Bezier curve
function getBezierPoint(
	start: Point,
	cp1: Point,
	cp2: Point,
	end: Point,
	t: number
): Point {
	const x =
		Math.pow(1 - t, 3) * start.x +
		3 * Math.pow(1 - t, 2) * t * cp1.x +
		3 * (1 - t) * Math.pow(t, 2) * cp2.x +
		Math.pow(t, 3) * end.x
	const y =
		Math.pow(1 - t, 3) * start.y +
		3 * Math.pow(1 - t, 2) * t * cp1.y +
		3 * (1 - t) * Math.pow(t, 2) * cp2.y +
		Math.pow(t, 3) * end.y
	return { x, y }
}

const WHEEL_DELTA = 120

async function humanScrollToY(page: Page, y: number): Promise<void> {
	// TODO: implement horizontal scrolling.
	const vp = await getViewportSize(page)
	const viewportTopY = await page.evaluate(() => window.scrollY) // Coordinate of top of page
	const viewportCenterY = viewportTopY + vp.height / 2
	const diffY = y - viewportCenterY
	debug(
		'Human Scroll: Scroll to Y',
		'viewportPos',
		viewportCenterY,
		'targetPos',
		y
	)

	if (Math.abs(diffY) < WHEEL_DELTA) {
		debug(
			'Human Scroll: Scroll to Y is too close to current scroll position, skipping',
			'viewportPos',
			viewportCenterY,
			'targetPos',
			y
		)
		return
	}

	const steps = Math.round(Math.abs(diffY) / WHEEL_DELTA)
	const stepSize = Math.sign(diffY) * WHEEL_DELTA // Use consistent step size based on direction

	for (let i = 0; i < steps; i++) {
		await page.mouse.wheel(0, stepSize)
		await sleepRandom(100, 25)
	}
}

// Simulate human-like scroll to bring element into view
async function humanScrollElement(page: Page, selector: string): Promise<void> {
	// TODO: only assumes that we scroll vertically, not horizontally.
	const vp = await getViewportSize(page)
	const handle = await page.$(selector)
	if (!handle) {
		error('Human Scroll: Element not found', 'selector', selector)
		throw new ElementError(`Element not found: ${selector}`)
	}

	const boundingBox = await handle.boundingBox()
	if (!boundingBox) {
		error('Human Scroll: Element bounding box not found', 'selector', selector)
		throw new ElementError(`Element bounding box not found: ${selector}`)
	}

	const { y: elemY, height: elemHeight } = boundingBox
	const elemCenterY = elemY + elemHeight / 2
	const minScrollYPos = elemCenterY - vp.height / 2 + 100
	const maxScrollYPos = elemCenterY + vp.height / 2 - 100
	const scrollYPos = cappedRandomGaussian(
		(maxScrollYPos + minScrollYPos) / 2,
		(maxScrollYPos - minScrollYPos) / 4,
		minScrollYPos,
		maxScrollYPos
	)

	await humanScrollToY(page, scrollYPos)
}

export async function humanScrollAround(
	page: Page,
	n_times: number
): Promise<void> {
	// Perform smooth scroll
	for (let i = 0; i < n_times; i++) {
		const totalHeight = await page.evaluate(
			() => document.documentElement.scrollHeight
		)
		const scrollYPosMean = cappedRandomGaussian(
			totalHeight / 2,
			totalHeight / 12,
			totalHeight / 4,
			(totalHeight * 3) / 4
		)
		const scrollYPos = cappedRandomGaussian(
			scrollYPosMean,
			totalHeight / 4,
			0,
			totalHeight
		)
		await humanScrollToY(page, scrollYPos)
		await sleepRandom(500, 250) // Mean: 500ms, Std: 250ms
	}
}

// Move mouse along a noisy, eased Bezier path with mid-motion hesitations and overshoot
async function humanMove(
	page: Page,
	targetX: number,
	targetY: number
): Promise<void> {
	const start = { ...mousePos }
	const end = { x: targetX, y: targetY }
	const cp1 = {
		x: start.x + randBetween(-100, 100),
		y: start.y + randBetween(-100, 100),
	}
	const cp2 = {
		x: end.x + randBetween(-100, 100),
		y: end.y + randBetween(-100, 100),
	}
	const distance = Math.hypot(end.x - start.x, end.y - start.y)
	const steps = Math.round(randBetween(30, 60))
	const duration = randBetween(distance * 2, distance * 4) // ms total

	for (let i = 0; i <= steps; i++) {
		let t = i / steps
		t = ease(t)
		const { x, y } = getBezierPoint(start, cp1, cp2, end, t)
		await page.mouse.move(x, y)
		mousePos = { x, y }

		// Mid-path hesitation
		if (
			i === Math.floor(steps * randBetween(0.3, 0.7)) &&
			Math.random() < 0.3
		) {
			await sleepRandom(200, 50) // Mean: 200ms, Std: 50ms
		}

		const base = duration / steps
		await sleepRandom(base, base * 0.2) // Mean: base, Std: 20% of base
	}

	// Occasional overshoot and correction
	if (Math.random() < 0.1) {
		const ox = randBetween(-20, 20)
		const oy = randBetween(-20, 20)
		await page.mouse.move(end.x + ox, end.y + oy)
		await sleepRandom(100, 25) // Mean: 100ms, Std: 25ms
		await page.mouse.move(end.x, end.y)
		mousePos = { x: end.x, y: end.y }
	}
}

// Human-like click on an element with scroll, jitter, and realistic delays
export async function humanClick(page: Page, selector: string): Promise<void> {
	// Scroll element into view bit by bit
	await humanScrollElement(page, selector)

	// Locate element box
	const rect = await page.$eval(selector, (el: Element): Rectangle => {
		const r = el.getBoundingClientRect()
		return {
			x: r.x + window.scrollX,
			y: r.y + window.scrollY,
			width: r.width,
			height: r.height,
		}
	})
	const clickX = rect.x + randBetween(5, rect.width - 5)
	const clickY = rect.y + randBetween(5, rect.height - 5)

	// Move to element
	await humanMove(page, clickX, clickY)

	// Hover dwell and micro-jitter
	await sleepRandom(500, 150) // Mean: 500ms, Std: 150ms
	for (let i = 0; i < randBetween(1, 3); i++) {
		await page.mouse.move(
			clickX + randBetween(-1, 1),
			clickY + randBetween(-1, 1)
		)
		await sleepRandom(50, 15) // Mean: 50ms, Std: 15ms
	}

	// Click down/up
	await page.mouse.down()
	await sleepRandom(100, 25) // Mean: 100ms, Std: 25ms
	await page.mouse.up()

	// Post-click pause
	await sleepRandom(300, 100) // Mean: 300ms, Std: 100ms

	// Tiny random retry if misclick
	if (Math.random() < 0.02) {
		await humanMove(
			page,
			clickX + randBetween(-3, 3),
			clickY + randBetween(-3, 3)
		)
		await sleepRandom(150, 25) // Mean: 150ms, Std: 25ms
		await humanMove(page, clickX, clickY)
		await page.mouse.down()
		await sleepRandom(75, 12) // Mean: 75ms, Std: 12ms
		await page.mouse.up()
	}
}
