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

type DocDetailLevel = 'brief' | 'standard' | 'comprehensive';

const getUpdateSystemPrompt = (detailLevel: DocDetailLevel): string => {
	const criticalRules = 
		'CRITICAL RULES:\n' +
		'1. READ THE NEW CODE CAREFULLY - Every line, every constant, every function. Do not make assumptions.\n' +
		'2. If you see new constants, state variables, useEffect hooks, or functions in the code, they ARE IMPLEMENTED. Document them as working features, not "future additions".\n' +
		'3. REMOVE any warnings or "gotchas" that have been FIXED in the new code. Check if old issues are resolved.\n' +
		'4. Verify default values from the actual code destructuring - do not assume or guess.\n' +
		'5. If a prop/feature is declared AND used in the render logic, it IS functional. Document it as such.\n' +
		'6. Document NEW features in detail with their actual implementation, not as placeholders.\n' +
		'7. Keep the same structure and tone as the existing documentation.\n' +
		'8. Be precise and accurate - your documentation must match what the code actually does.';
	
	if (detailLevel === 'brief') {
		return `You are an expert at updating software documentation. Update the markdown to reflect code changes. ${criticalRules}\n\nKEEP IT CONCISE:\n- Brief descriptions only\n- Document only key changes\n- Minimal examples\n- Remove outdated sections`;
	}
	
	if (detailLevel === 'comprehensive') {
		return `You are an expert at updating software documentation. Update the markdown to reflect code changes. ${criticalRules}\n\nBE COMPREHENSIVE:\n- Detailed explanations of all changes\n- Document all new features thoroughly\n- Multiple usage examples\n- Explain rationale and edge cases\n- Include implementation details`;
	}
	
	// Standard (default)
	return `You are an expert at updating software documentation. Update the markdown to reflect code changes. ${criticalRules}\n\nKEEP IT BALANCED:\n- Clear explanations of key changes\n- Document important new features\n- Practical examples\n- Notable considerations`;
};

const getCreateSystemPrompt = (detailLevel: DocDetailLevel): string => {
	const basePrompt = 'You are an expert software documentation generator that only outputs in markdown.';
	
	if (detailLevel === 'brief') {
		return `${basePrompt} Generate CONCISE documentation. Include:\n- Brief purpose (1-2 sentences)\n- Key types/interfaces with minimal descriptions\n- Main props/parameters (only required ones)\n- One basic usage example\n- Keep it short and scannable. Focus on essentials only.`;
	}
	
	if (detailLevel === 'comprehensive') {
		return `${basePrompt} Generate COMPREHENSIVE documentation. Include:\n- Detailed purpose and context\n- Complete structure breakdown\n- All types, interfaces, props with full descriptions\n- Multiple usage examples (basic, intermediate, advanced)\n- Edge cases and gotchas\n- Best practices and recommendations\n- Implementation details and reasoning\n- Related components/files`;
	}
	
	// Standard (default)
	return `${basePrompt} Generate BALANCED documentation. Include:\n- Clear purpose statement\n- Key structure and components\n- Important types/props with descriptions\n- Practical usage examples\n- Notable gotchas or edge cases\n- Keep it informative but not overwhelming.`;
};

export const updateMarkdownForFile = async (
	filePath: string,
	apiKey: string,
	detailLevel: DocDetailLevel = 'standard',
	userNotes?: string,
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

			const userNotesSection = userNotes 
				? `\n\n## User Guidance:\n${userNotes}\n\nPlease incorporate this guidance when updating the documentation.`
				: '';

			const chatCompletion = await groq.chat.completions.create({
				messages: [
					{
						role: 'system',
						content: getUpdateSystemPrompt(detailLevel),
					},
					{
						role: 'user',
						content: `Update this documentation based on the current code:\n\n## Existing Documentation:\n\`\`\`markdown\n${existingDoc}\n\`\`\`\n\n## Current Code:\n\nFilename: ${fileName}\n\n\`\`\`\n${fileContent}\n\`\`\`${userNotesSection}\n\nProvide the complete updated markdown documentation.`,
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
			const userNotesSection = userNotes 
				? `\n\n## User Guidance:\n${userNotes}\n\nPlease incorporate this guidance when creating the documentation.`
				: '';

			const chatCompletion = await groq.chat.completions.create({
				messages: [
					{
						role: 'system',
						content: getCreateSystemPrompt(detailLevel),
					},
					{
						role: 'user',
						content: `Generate markdown documentation for this file:\n\nFilename: ${fileName}\n\n\`\`\`\n${fileContent}\n\`\`\`${userNotesSection}`,
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

