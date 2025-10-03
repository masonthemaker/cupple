import {Groq} from 'groq-sdk';
import {readFile, writeFile, mkdir} from 'fs/promises';
import {basename, dirname, extname, join} from 'path';
import {existsSync} from 'fs';

export type UpdateMDResult = {
	success: boolean;
	outputPath?: string;
	error?: string;
	wasCreated?: boolean; // True if doc didn't exist and was created instead
};

export const updateMarkdownForFile = async (
	filePath: string,
	apiKey: string,
): Promise<UpdateMDResult> => {
	try {
		// Read the file content
		const fileContent = await readFile(filePath, 'utf-8');
		const fileName = basename(filePath);

		// Determine the doc path in docs directory
		const fileNameWithoutExt = basename(filePath, extname(filePath));
		const outputFileName = `${fileNameWithoutExt}-guide.md`;
		
		// Get the directory and create a docs subdirectory inside it
		const fileDir = dirname(filePath);
		const docsDir = join(fileDir, 'docs');
		const outputPath = join(docsDir, outputFileName);

		// Check if documentation already exists
		const docExists = existsSync(outputPath);

		// Initialize Groq with API key
		const groq = new Groq({apiKey});

		if (docExists) {
			// Update existing documentation
			const existingDoc = await readFile(outputPath, 'utf-8');

			const chatCompletion = await groq.chat.completions.create({
				messages: [
				{
					role: 'system',
					content:
						'You are an expert at updating software documentation. Your task is to update existing markdown documentation to reflect changes in the code. CRITICAL RULES:\n\n' +
						'1. READ THE NEW CODE CAREFULLY - Every line, every constant, every function. Do not make assumptions.\n' +
						'2. If you see new constants, state variables, useEffect hooks, or functions in the code, they ARE IMPLEMENTED. Document them as working features, not "future additions".\n' +
						'3. REMOVE any warnings or "gotchas" that have been FIXED in the new code. Check if old issues are resolved.\n' +
						'4. Verify default values from the actual code destructuring - do not assume or guess.\n' +
						'5. If a prop/feature is declared AND used in the render logic, it IS functional. Document it as such.\n' +
						'6. Document NEW features in detail with their actual implementation, not as placeholders.\n' +
						'7. Keep the same structure and tone as the existing documentation.\n' +
						'8. Be precise and accurate - your documentation must match what the code actually does.',
				},
					{
						role: 'user',
						content: `Update this documentation based on the current code:\n\n## Existing Documentation:\n\`\`\`markdown\n${existingDoc}\n\`\`\`\n\n## Current Code:\n\nFilename: ${fileName}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nProvide the complete updated markdown documentation.`,
					},
				],
				model: 'openai/gpt-oss-120b',
				temperature: 0.7,
				max_completion_tokens: 8192,
				stream: false,
			});

			const markdownContent = chatCompletion.choices[0]?.message?.content || '';

			// Ensure docs directory exists
			await mkdir(docsDir, {recursive: true});
			
			// Write the updated markdown file
			await writeFile(outputPath, markdownContent, 'utf-8');

			return {
				success: true,
				outputPath,
				wasCreated: false,
			};
		} else {
			// Documentation doesn't exist, create it fresh
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

			// Ensure docs directory exists
			await mkdir(docsDir, {recursive: true});
			
			// Write the new markdown file
			await writeFile(outputPath, markdownContent, 'utf-8');

			return {
				success: true,
				outputPath,
				wasCreated: true,
			};
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
};

