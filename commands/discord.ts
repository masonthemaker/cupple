import type {CommandResult, CommandContext} from './types.js';
import {exec} from 'child_process';

const DISCORD_URL = 'https://discord.gg/S7zRnuTk';

export const handleDiscordCommand = async (
	context: CommandContext,
): Promise<CommandResult> => {
	// Open Discord link in default browser
	const command = process.platform === 'win32' 
		? `start ${DISCORD_URL}`
		: process.platform === 'darwin'
		? `open ${DISCORD_URL}`
		: `xdg-open ${DISCORD_URL}`;

	exec(command, (error) => {
		if (error) {
			console.error('Failed to open Discord link:', error);
		}
	});

	return {
		success: true,
		message: `🚀 Opening Discord in your browser: ${DISCORD_URL}`,
		color: '#5865F2',
	};
};
