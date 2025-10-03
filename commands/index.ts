export type {CommandResult, CommandContext, CommandHandler} from './types.js';
export {handleModeCommand} from './mode.js';
export {handleClearCommand} from './clear.js';
export {handleStatusCommand} from './status.js';
export {handleExitCommand} from './exit.js';
export {handlePairCommand} from './pair.js';
export {handleUnpairCommand} from './unpair.js';
export {handleBrowseCommand} from './browse.js';
export {handleAutoCommand} from './auto.js';

import type {CommandResult, CommandContext} from './types.js';
import {handleModeCommand} from './mode.js';
import {handleClearCommand} from './clear.js';
import {handleStatusCommand} from './status.js';
import {handleExitCommand} from './exit.js';
import {handlePairCommand} from './pair.js';
import {handleUnpairCommand} from './unpair.js';
import {handleBrowseCommand} from './browse.js';
import {handleAutoCommand} from './auto.js';

export const executeCommand = async (
	command: string,
	context: CommandContext,
): Promise<CommandResult | null> => {
	const trimmedCommand = command.trim().toLowerCase();
	const [cmd, ...args] = trimmedCommand.split(' ');

	switch (cmd) {
		case '/mode':
			return await handleModeCommand(context);

		case '/clear':
			return handleClearCommand(context);

		case '/status':
			return handleStatusCommand(context);

		case '/exit':
			return handleExitCommand(context);

		case '/pair':
			return handlePairCommand(args, context);

		case '/unpair':
			return handleUnpairCommand(args, context);

		case '/browse':
			return handleBrowseCommand(args, context);

		case '/auto':
			return handleAutoCommand(args, context);

		default:
			// Not a command
			return null;
	}
};

