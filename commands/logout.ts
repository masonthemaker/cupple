import type {CommandResult, CommandContext} from './types.js';
import {clearAuth, loadGlobalConfig} from '../utils/globalConfig.js';

export const handleLogoutCommand = async (
	context: CommandContext,
): Promise<CommandResult> => {
	try {
		// Check if user is currently logged in
		const config = await loadGlobalConfig();
		
		if (!config.accessToken) {
			return {
				success: false,
				message: '✗ Not currently logged in. Use /login to authenticate.',
				color: '#ef4444',
			};
		}

		// Clear authentication credentials
		await clearAuth();

		return {
			success: true,
			message: '✓ Logged out successfully. Authentication credentials removed from all projects.',
			color: '#10b981',
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			message: `✗ Logout failed: ${errorMessage}`,
			color: '#ef4444',
		};
	}
};
