import type {CommandContext} from './types.js';

export const handleExitCommand = (context: CommandContext): null => {
	context.onExit();
	return null;
};

