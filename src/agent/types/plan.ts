import OpenAI from 'openai'
import { Message } from './message'

export namespace Plan {
	export namespace Step {
		type BaseStep = {
			description: string
			precondition: Record<string, any>
			parentContexts: string[] // context[0] = goal of immediate parent, context[context.length-1] = original goal
		}
		export type HighLevel = BaseStep & {
			level: 'high'
		}

		export type LowLevel = BaseStep & {
			level: 'low'
			action: 'prompt' | 'tool_use'
		}

		export function HighLevelStep(
			description: string,
			precondition: Record<string, any> = {},
			parentContexts: string[] = []
		): HighLevel {
			return {
				description,
				precondition,
				parentContexts,
				level: 'high',
			}
		}

		export function LowLevelStep(
			description: string,
			precondition: Record<string, any>,
			parentContexts: string[],
			action: 'prompt' | 'tool_use'
		): LowLevel {
			return {
				description,
				precondition,
				parentContexts,
				level: 'low',
				action,
			}
		}

		export function ToMessage(step: Step): Message {
			const lines = []
			lines.push(
				"You are part of a multi-step goal decomposition. Here's the reasoning chain:"
			)

			step.parentContexts.forEach((parent, i) => {
				lines.push(`${i + 1}. ${i === 0 ? 'Root goal: ' : ''} ${parent}`)
			})
			lines.push('')
			lines.push(`Currently, your task is: ${step.description}`)

			return {
				role: 'system',
				content: lines.join('\n'),
			}
		}
	}

	export const PlanJsonSchema: OpenAI.Responses.ResponseFormatTextConfig = {
		type: 'json_schema',
		name: 'plan',
		schema: {
			type: 'array',
			description: 'An array of planning steps to accomplish a task.',
			items: {
				type: 'object',
				oneOf: [
					{
						type: 'object',
						description:
							'A high-level planning step. This is a step that is not directly executed, but rather a description of what to do in the next step. Expect this step to be decomposed into more high- or low-level steps.',
						properties: {
							type: {
								type: 'string',
								enum: ['high-level'],
							},
							description: {
								type: 'string',
								description:
									'A detailed description of what to do in this step',
							},
						},
					},
					{
						type: 'object',
						description:
							'A low-level planning step. This is a step that is directly executed. Expect this step to be a tool call or a prompt.',
						properties: {
							type: {
								type: 'string',
								enum: ['low-level'],
							},
							action: {
								type: 'string',
								enum: ['prompt', 'tool_use'],
							},
							description: {
								type: 'string',
								description:
									'A detailed description of what to do in this step',
							},
						},
					},
				],
			},
		},
	}

	export type Step = Step.HighLevel | Step.LowLevel
}

export type Plan = Plan.Step[]
