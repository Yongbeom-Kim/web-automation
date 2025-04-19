import { Page } from 'patchright'
import { Dimensions, ms, Point } from './types'

export function sleep(ms: ms): Promise<void> {
	return new Promise((res) => setTimeout(res, ms))
}

/**
 * Generates a random number from a Gaussian (normal) distribution.
 * Uses the Box-Muller transform to convert uniform random numbers to normally distributed ones.
 *
 * @param mean - The mean (μ) of the normal distribution
 * @param std - The standard deviation (σ) of the normal distribution
 * @returns A random number following the specified normal distribution
 */
export function randomGaussian(mean: ms, std: ms): ms {
	let u = 0,
		v = 0
	while (u === 0) u = Math.random()
	while (v === 0) v = Math.random()
	const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
	return z * std + mean
}

/**
 * Generates a random number from a Gaussian distribution, capped between min and max values.
 * Uses randomGaussian internally but ensures the result stays within bounds.
 *
 * @param mean - The mean (μ) of the normal distribution
 * @param std - The standard deviation (σ) of the normal distribution
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns A random number following the specified normal distribution, capped between min and max
 */
export function cappedRandomGaussian(mean: ms, std: ms, min: ms, max: ms): ms {
	return Math.min(Math.max(randomGaussian(mean, std), min), max)
}

/**
 * Generates a random number between a minimum and maximum value.
 *
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A random number between the minimum and maximum values
 */
export function randBetween(min: number, max: number): number {
	return Math.random() * (max - min) + min
}

export const sleepRandom = (mean: ms, std: ms): Promise<void> => {
	const delay = randomGaussian(mean, std)
	return sleep(delay)
}

export const getViewportSize = async (page: Page): Promise<Dimensions> => {
	const viewportSize = await page.evaluate(() => ({
		width: window.innerWidth,
		height: window.innerHeight,
	}))
	return viewportSize
}
