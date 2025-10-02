import type {CommandResult, CommandContext} from './types.js';

export const handleClearCommand = async (
	context: CommandContext,
): Promise<CommandResult> => {
	await context.onClearHistory();

	return {
		success: true,
		message: '✓ History cleared',
		color: '#ec4899',
	};
};
