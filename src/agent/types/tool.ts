import type { FunctionTool as ToolSchema } from 'openai/resources/responses/responses'
export type { ToolSchema }

export type Tool = {
	description: ToolSchema
	callback: (input: Record<string, any>) => Promise<Record<string, any>>
}

export abstract class ToolFamily {
	abstract getTools(): Promise<Tool[]>
}

export namespace ToolFamily {
	export async function getTools(families: ToolFamily[]): Promise<Tool[]> {
		const tools = await Promise.all(families.map((family) => family.getTools()))
		return tools.flat()
	}
}
