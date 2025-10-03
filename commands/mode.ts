import {saveSettings} from '../utils/index.js';
import type {CuppleSettings} from '../utils/index.js';
import type {CommandResult, CommandContext} from './types.js';

export const handleModeCommand = async (
	context: CommandContext,
): Promise<CommandResult> => {
	const newMode = context.settings.mode === 'auto' ? 'selector' : 'auto';
	
	// Check if trying to switch to auto mode without running /init
	if (newMode === 'auto' && !context.settings.extensionConfigs) {
		return {
			success: false,
			message: '⚠️ Please run /init to configure autodoc before switching to auto mode',
			color: '#f59e0b',
		};
	}
	
	const updatedSettings: CuppleSettings = {
		...context.settings,
		mode: newMode,
	};

	await saveSettings(updatedSettings);
	context.onSettingsUpdate(updatedSettings);

	return {
		success: true,
		message: `✓ Mode switched to ${newMode}`,
		color: '#ec4899',
	};
};

