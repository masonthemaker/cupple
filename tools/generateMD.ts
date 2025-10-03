import {Groq} from 'groq-sdk';
import {readFile, writeFile, mkdir} from 'fs/promises';
import {basename, dirname, extname, join} from 'path';

export type GenerateMDResult = {
	success: boolean;
	outputPath?: string;
	error?: string;
};

export const generateMarkdownForFile = async (
	filePath: string,
	apiKey: string,
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
					content:
						'You are an expert software documentation generator that only outputs in markdown. Take the file you\'re given and document it in markdown. Include: purpose, structure, key functions/components, usage examples, and any important details.',
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
