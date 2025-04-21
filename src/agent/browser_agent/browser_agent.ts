import { BaseAgent } from '../types/base_agent'
import { Plan } from '../types/plan'
import { BrowserContext, chromium } from 'patchright'
import { Tool, ToolFamily } from '../types/tool'
import { error, info } from '../../common/logging'
import OpenAI from 'openai'
import { Message } from '../types/message'

export class BrowserContextToolFamily extends ToolFamily {
	constructor(public readonly browserCtx: BrowserContext) {
		super()
	}
	override getTools(): Promise<Tool[]> {
		const createPageTool: Tool = {
			description: {
				name: 'createPage',
				description: 'Create a new page with the given URL',
				parameters: {
					type: 'object',
					properties: {
						url: {
							type: 'string',
							description: 'The URL to create the page on',
						},
					},
					required: ['url'],
					additionalProperties: false,
				},
				strict: true,
				type: 'function',
			},
			callback: async (
				input: Record<string, any>
			): Promise<Record<string, any>> => {
				if (!input['url'] || typeof input['url'] !== 'string') {
					error('Invalid input for createPage tool', 'input', input)
					throw new Error('createPage tool requires a string url parameter')
				}
				const { url } = input as { url: string }
				const page = await this.browserCtx.newPage()
				await page.goto(url)
				await page.waitForLoadState('domcontentloaded')
				return {
					page,
					url: page.url(),
				}
			},
		}
		return Promise.resolve([createPageTool])
	}
}

export class BrowserContextAgent extends BaseAgent {
	constructor(
		public readonly goal: Plan.Step.HighLevel,
		public readonly toolFamily: BrowserContextToolFamily,
		openai: OpenAI = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] }),
		private readonly model: string = 'gpt-4o-mini'
	) {
		super(goal, [toolFamily], openai)
	}

	async baseSystemPrompt(): Promise<Message> {
		return {
			role: 'system',
			content: `
      You are a helpful assistant that can help with tasks in the browser.
      Specifically, you are a browser context agent.
      Currently, you have the following tools available to you (this may change in the future):
      ${(await this.toolFamily.getTools()).map((tool) => tool.description.name).join(', ')}
      `,
		}
	}

	async planSystemPrompt(): Promise<Message> {
		return {
			role: 'user',
			content: `
Decompose the current task into a list of smaller steps.

Each step should:
- Be either a high-level or low-level task.
- Include a short description.
- Include a precondition: a condition that must be true before the step can be executed.
- Inherit the full parent context chain of the current task.

Use the following JSON format:
[
  {
    "type": "high-level",
    "description": "...",
    "precondition": { ... },
    "parentContexts": [ ... ]
  },
  {
    "type": "low-level",
    "action": "tool_use" | "prompt",
    "description": "...",
    "precondition": { ... },
    "parentContexts": [ ... ]
  }
]
Return only the JSON array.
      `.trim(),
		}
	}

	override async run(): Promise<Record<string, any>> {
		info('BrowserContextAgent running', 'goal', this.goal.description)
		info('Tools', 'toolFamily', this.toolFamily)
		info('Tools', 'tools', await this.tools)
		await this.step()
		return {}
	}

	override async plan(): Promise<void> {
		info('Planning', 'goal', this.goal.description)
		const response = await this.openai.responses.create({
			model: this.model,
			input: [
				await this.baseSystemPrompt(),
				Plan.Step.ToMessage(this.goal),
				await this.planSystemPrompt(),
			],
			tools: (await this.tools).map((tool) => tool.description),
		})
	}
	override execute(): Promise<void> {
		throw new Error('Method not implemented.')
	}
	override evaluate(): Promise<void> {
		throw new Error('Method not implemented.')
	}
	override done(): Promise<void> {
		throw new Error('Method not implemented.')
	}
	override fail(): Promise<void> {
		throw new Error('Method not implemented.')
	}
}

;(async () => {
	const browser: BrowserContext = await chromium.launchPersistentContext(
		'...',
		{
			channel: 'chrome',
			headless: false,
			viewport: null,
			// do NOT add custom browser headers or userAgent
		}
	)
	const goal: Plan.Step.HighLevel = Plan.Step.HighLevelStep(
		'Find the best LLM to do research on large language models.'
	)
	const toolFamily = new BrowserContextToolFamily(browser)
	const agent = new BrowserContextAgent(goal, toolFamily)
	await agent.run()
})()
