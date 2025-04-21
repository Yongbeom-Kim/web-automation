import { MarkdownConversionHandler } from './markdown_conversion/handlers'
import { FunctionTool, Tool } from 'openai/resources/responses/responses'

export type Link = {
	url: string
	text: string
}

export interface WebsiteHandler {
	getContentAsMarkdown(
		conversionHandler: MarkdownConversionHandler
	): Promise<string>
	getLinks(): Promise<Link[]>

	// Operations
	search(query: string): Promise<void>

	// Agent
	getAgentState(): string
	getAgentTools(): Tool[]
}
