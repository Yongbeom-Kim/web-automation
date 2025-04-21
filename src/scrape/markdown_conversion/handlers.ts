import TurndownService from 'turndown'

export interface MarkdownConversionHandler {
	convertToMarkdown(html: string): string
}

export class TurndownMarkdownConversionHandler
	implements MarkdownConversionHandler
{
	constructor(private readonly turndown: TurndownService) {}
	convertToMarkdown(html: string): string {
		return this.turndown.turndown(html)
	}
}
