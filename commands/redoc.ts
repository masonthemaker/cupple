import {updateMarkdownForFile} from '../tools/index.js';
import type {CommandResult, CommandContext} from './types.js';
import {basename} from 'path';
import {existsSync} from 'fs';
import {join} from 'path';

/**
 * Handle the /redoc command to manually regenerate documentation
 * Format: /redoc <filepath> [optional notes]
 */
export const handleRedocCommand = async (
	context: CommandContext,
	args: string[],
): Promise<CommandResult> => {
	if (args.length === 0) {
		return {
			success: false,
			message: 'Usage: /redoc <filepath> [notes]\nExample: /redoc components/App.tsx Focus on the new autodoc integration',
			color: '#ef4444',
		};
	}

	// Check if API key is configured
	if (!context.settings.apiKey) {
		return {
			success: false,
			message: '✗ No API key configured. Run setup first.',
			color: '#ef4444',
		};
	}

	// Parse filepath and notes
	const filepath = args[0];
	const notes = args.slice(1).join(' ');

	// Resolve full path (support both absolute and relative)
	const fullPath = filepath.startsWith('/')
		? filepath
		: join(process.cwd(), filepath);

	// Check if file exists
	if (!existsSync(fullPath)) {
		return {
			success: false,
			message: `✗ File not found: ${filepath}`,
			color: '#ef4444',
		};
	}

	// Check file extension
	const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.c', '.cpp'];
	const hasValidExt = validExtensions.some(ext => fullPath.endsWith(ext));
	
	if (!hasValidExt) {
		return {
			success: false,
			message: `✗ File type not supported. Must be one of: ${validExtensions.join(', ')}`,
			color: '#ef4444',
		};
	}

	// Determine detail level from settings
	let detailLevel: 'brief' | 'standard' | 'comprehensive' = 'standard';
	
	if (context.settings.extensionConfigs) {
		const ext = fullPath.match(/\.[^.]+$/)?.[0];
		if (ext) {
			const config = context.settings.extensionConfigs.find(c => c.extension === ext);
			detailLevel = config?.detailLevel || 'standard';
		}
	} else {
		detailLevel = context.settings.docDetailLevel || 'standard';
	}

	try {
		// Show loading message
		const filename = basename(fullPath);
		const loadingMsg = notes
			? `🔄 Regenerating docs for ${filename} with your notes...`
			: `🔄 Regenerating docs for ${filename}...`;

		// Generate documentation with optional notes
		const result = await updateMarkdownForFile(
			fullPath,
			context.settings.apiKey,
			detailLevel,
			notes || undefined,
		);

		if (result.success) {
			const action = result.wasCreated ? 'Generated' : 'Updated';
			const notesSuffix = notes ? ' (with guidance)' : '';
			
			return {
				success: true,
				message: `✓ ${action} documentation for ${filename}${notesSuffix}`,
				color: '#22c55e',
			};
		} else {
			return {
				success: false,
				message: `✗ Failed to generate docs: ${result.error}`,
				color: '#ef4444',
			};
		}
	} catch (error) {
		return {
			success: false,
			message: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
			color: '#ef4444',
		};
	}
};

