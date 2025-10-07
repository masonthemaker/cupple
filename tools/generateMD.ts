import {Groq} from 'groq-sdk';
import {readFile, writeFile, mkdir} from 'fs/promises';
import {basename, dirname, extname, join} from 'path';

export type GenerateMDResult = {
	success: boolean;
	outputPath?: string;
	error?: string;
};

type DocDetailLevel = 'brief' | 'standard' | 'comprehensive';

const getSystemPrompt = (detailLevel: DocDetailLevel): string => {
	const basePrompt = 'You are an expert software documentation generator that only outputs in markdown.';
	
	const formattingRules = '\n\nFORMATTING RULES:\n' +
		'- DO NOT use markdown tables - they render poorly\n' +
		'- Use bullet lists, numbered lists, and clear headings instead\n' +
		'- Use code blocks with proper syntax highlighting\n' +
		'- Use bold for emphasis, not tables\n' +
		'- Keep line length reasonable for readability';
	
	if (detailLevel === 'brief') {
		return `${basePrompt} Generate CONCISE documentation. Include:\n- Brief purpose (1-2 sentences)\n- Key types/interfaces with minimal descriptions\n- Main props/parameters (only required ones)\n- One basic usage example\n- Keep it short and scannable. Focus on essentials only.${formattingRules}`;
	}
	
	if (detailLevel === 'comprehensive') {
		return `${basePrompt} Generate COMPREHENSIVE documentation. Include:\n- Detailed purpose and context\n- Complete structure breakdown\n- All types, interfaces, props with full descriptions\n- Multiple usage examples (basic, intermediate, advanced)\n- Edge cases and gotchas\n- Best practices and recommendations\n- Implementation details and reasoning\n- Related components/files${formattingRules}`;
	}
	
	// Standard (default)
	return `${basePrompt} Generate BALANCED documentation. Include:\n- Clear purpose statement\n- Key structure and components\n- Important types/props with descriptions\n- Practical usage examples\n- Notable gotchas or edge cases\n- Keep it informative but not overwhelming.${formattingRules}`;
};

export const generateMarkdownForFile = async (
	filePath: string,
	apiKey: string,
	detailLevel: DocDetailLevel = 'standard',
): Promise<GenerateMDResult> => {
	try {
		// Read the file content
		const fileContent = await readFile(filePath, 'utf-8');
		const fileName = basename(filePath);

		// Initialize Groq with API key
		const groq = new Groq({apiKey});

		// Generate markdown documentation
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: 'system',
					content: getSystemPrompt(detailLevel),
				},
				{
					role: 'user',
					content: `Generate markdown documentation for this file:\n\nFilename: ${fileName}\n\n\`\`\`\n${fileContent}\n\`\`\``,
				},
			],
			model: 'openai/gpt-oss-120b',
			temperature: 0.7,
			max_completion_tokens: 8192,
			stream: false,
		});

		const markdownContent = chatCompletion.choices[0]?.message?.content || '';

		// Create output filename: originalname-guide.md
		const fileNameWithoutExt = basename(filePath, extname(filePath));
		const outputFileName = `${fileNameWithoutExt}-guide.md`;
		
		// Get the directory and create a docs subdirectory inside it
		const fileDir = dirname(filePath);
		const docsDir = join(fileDir, 'docs');
		
		// Create docs directory if it doesn't exist
		await mkdir(docsDir, {recursive: true});
		
		const outputPath = join(docsDir, outputFileName);
		// Write the markdown file
		await writeFile(outputPath, markdownContent, 'utf-8');

		return {
			success: true,
			outputPath,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
};
