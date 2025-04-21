import { OpenAI } from 'openai'
import { ToolFamily, type Tool } from './tool'
import { Plan } from './plan'

export abstract class BaseAgent {
	next_step: 'plan' | 'execute' | 'evaluate' | 'done' | 'fail'
	steps: Plan
	stepIdx: number = 0

	constructor(
		goal: Plan.Step.HighLevel,
		private readonly toolFamilies: ToolFamily[],
		protected readonly openai: OpenAI
	) {
		this.steps = [goal]
		this.next_step = 'plan'
	}

	get tools(): Promise<Tool[]> {
		return ToolFamily.getTools(this.toolFamilies)
	}

	async run(): Promise<Record<string, any>> {
		while (this.next_step !== 'done' && this.next_step !== 'fail') {
			await this.step()
		}
		await this.step()
		return {}
	}

	async step(): Promise<void> {
		switch (this.next_step) {
			case 'plan':
				return this.plan()
			case 'execute':
				return this.execute()
			case 'evaluate':
				return this.evaluate()
			case 'done':
				return this.done()
			case 'fail':
				return this.fail()
		}
	}

	abstract plan(): Promise<void>
	abstract execute(): Promise<void>
	abstract evaluate(): Promise<void>
	abstract done(): Promise<void>
	abstract fail(): Promise<void>
}
