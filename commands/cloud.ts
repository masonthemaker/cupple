import type {CommandResult, CommandContext} from './types.js';
import {exec} from 'child_process';

const CLOUD_URL = 'https://cuppleweb.vercel.app';

export const handleCloudCommand = async (
	context: CommandContext,
): Promise<CommandResult> => {
	// Open Cupple Cloud in default browser
	const command = process.platform === 'win32' 
		? `start ${CLOUD_URL}`
		: process.platform === 'darwin'
		? `open ${CLOUD_URL}`
		: `xdg-open ${CLOUD_URL}`;

	exec(command, (error) => {
		if (error) {
			console.error('Failed to open Cupple Cloud link:', error);
		}
	});

	return {
		success: true,
		message: `☁️  Opening Cupple Cloud in your browser: ${CLOUD_URL}`,
		color: '#3b82f6',
	};
};

