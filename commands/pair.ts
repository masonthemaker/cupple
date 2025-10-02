import {mkdir} from 'fs/promises';
import {join} from 'path';
import {loadSettings, saveSettings} from '../utils/settings.js';
import type {PairedInstance} from '../utils/settings.js';
import type {CommandResult, CommandContext} from './types.js';

export const handlePairCommand = async (
	args: string[],
	context: CommandContext,
): Promise<CommandResult> => {
	if (args.length === 0) {
		return {
			success: false,
			message: '✗ Please specify a port: /pair <port>',
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

	try {
		// Get info about the target Cupple instance
		const infoResponse = await fetch(`http://localhost:${port}/cupple/info`);
		
		if (!infoResponse.ok) {
			throw new Error('Not a Cupple server');
		}

		const targetInfo = await infoResponse.json();

		if (targetInfo.app !== 'cupple') {
			throw new Error('Not a Cupple server');
		}

		// Get our own server info from context
		if (!context.serverInfo) {
			throw new Error('Server info not available');
		}

		const settings = await loadSettings();
		if (!settings) {
			throw new Error('Settings not initialized');
		}

		const myPort = context.serverInfo.port;
		const myUrl = context.serverInfo.url;
		const myProjectPath = process.cwd();

		// Notify the target instance about the pairing
		const pairResponse = await fetch(`http://localhost:${port}/cupple/pair`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				port: myPort,
				url: myUrl,
				projectPath: myProjectPath,
			}),
		});

		if (!pairResponse.ok) {
			throw new Error('Failed to notify target instance');
		}

		// Don't save pairing yet - wait for acceptance
		// The other instance will call /cupple/pair/accept if they accept

		// Create docs folder for receiving markdown files
		const docsDir = join(process.cwd(), 'docs');
		try {
			await mkdir(docsDir, {recursive: true});
		} catch (error) {
			// Folder might already exist, which is fine
		}

		return {
			success: true,
			message: `✓ Pairing request sent to localhost:${port} • Waiting for acceptance...`,
			color: '#a855f7',
		};
	} catch (error) {
		return {
			success: false,
			message: `✗ Could not connect to Cupple on port ${port}. Make sure Cupple is running there.`,
			color: '#ef4444',
		};
	}
};

