import {loadSettings, saveSettings} from '../utils/settings.js';
import type {PairedInstance} from '../utils/settings.js';
import type {CommandResult, CommandContext} from './types.js';

export const handleUnpairCommand = async (
	args: string[],
	context: CommandContext,
): Promise<CommandResult> => {
	if (args.length === 0) {
		return {
			success: false,
			message: '✗ Please specify a port or "all": /unpair <port|all>',
			color: '#ef4444',
		};
	}

	// Handle /unpair all
	if (args[0].toLowerCase() === 'all') {
		const settings = await loadSettings();
		if (!settings) {
			throw new Error('Settings not initialized');
		}

		const pairedInstances = settings.pairedInstances || [];

		if (pairedInstances.length === 0) {
			return {
				success: false,
				message: '✗ No paired instances found',
				color: '#ef4444',
			};
		}

		const count = pairedInstances.length;

		// Notify all paired instances about unpairing
		for (const instance of pairedInstances) {
			try {
				await fetch(`http://localhost:${instance.port}/cupple/unpair`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						port: context.serverInfo?.port,
					}),
				});
			} catch (error) {
				// Target might be offline, that's okay
			}
		}

		// Clear all paired instances
		await saveSettings({
			...settings,
			pairedInstances: [],
		});

		// Update context with new settings
		context.onSettingsUpdate({
			...settings,
			pairedInstances: [],
		});

		return {
			success: true,
			message: `✓ Unpaired from ${count} instance${count === 1 ? '' : 's'}`,
			color: '#ec4899',
		};
	}

	// Handle /unpair <port>
	const port = parseInt(args[0], 10);

	if (isNaN(port) || port < 1 || port > 65535) {
		return {
			success: false,
			message: '✗ Invalid port number. Must be between 1-65535',
			color: '#ef4444',
		};
	}

	try {
		const settings = await loadSettings();
		if (!settings) {
			throw new Error('Settings not initialized');
		}

		const pairedInstances = settings.pairedInstances || [];
		const existingIndex = pairedInstances.findIndex(
			(instance: PairedInstance) => instance.port === port,
		);

		if (existingIndex === -1) {
			return {
				success: false,
				message: `✗ No paired instance found on port ${port}`,
				color: '#ef4444',
			};
		}

		// Remove the paired instance
		pairedInstances.splice(existingIndex, 1);

		await saveSettings({
			...settings,
			pairedInstances,
		});

		// Update context with new settings
		context.onSettingsUpdate({
			...settings,
			pairedInstances,
		});

		// Notify the target instance about unpairing
		try {
			await fetch(`http://localhost:${port}/cupple/unpair`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					port: context.serverInfo?.port,
				}),
			});
		} catch (error) {
			// Target might be offline, that's okay
		}

		return {
			success: true,
			message: `✓ Unpaired from Cupple at localhost:${port}`,
			color: '#ec4899',
		};
	} catch (error) {
		return {
			success: false,
			message: `✗ Failed to unpair: ${error instanceof Error ? error.message : 'Unknown error'}`,
			color: '#ef4444',
		};
	}
};

