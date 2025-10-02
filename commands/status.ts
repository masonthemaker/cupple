import type {CommandResult, CommandContext} from './types.js';

export const handleStatusCommand = (context: CommandContext): CommandResult => {
	const mode = context.settings.mode;
	const port = context.serverInfo?.port || 'unknown';
	const url = context.serverInfo?.url || 'unknown';
	const pairedCount = context.settings.pairedInstances?.length || 0;

	return {
		success: true,
		message: `✓ Server: ${url} • Mode: ${mode} • Paired instances: ${pairedCount}`,
		color: '#a855f7',
	};
};

