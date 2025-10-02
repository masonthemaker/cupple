import type {CommandResult, CommandContext} from './types.js';

export const handleBrowseCommand = async (
	args: string[],
	context: CommandContext,
): Promise<CommandResult> => {
	if (args.length === 0) {
		return {
			success: false,
			message: '✗ Please specify a port: /browse <port>',
			color: '#ef4444',
		};
	}

	const port = parseInt(args[0], 10);

	if (isNaN(port) || port < 1 || port > 65535) {
		return {
			success: false,
			message: '✗ Invalid port number. Must be between 1-65535',
			color: '#ef4444',
		};
	}

	// Check if this port is actually paired
	const pairedInstances = context.settings.pairedInstances || [];
	const isPaired = pairedInstances.some(instance => instance.port === port);

	if (!isPaired) {
		return {
			success: false,
			message: `✗ Not paired with instance on port ${port}. Use /pair ${port} first.`,
			color: '#ef4444',
		};
	}

	// Signal to open file browser (handled in App.tsx)
	return {
		success: true,
		message: `browse:${port}`,
		color: '#a855f7',
	};
};

