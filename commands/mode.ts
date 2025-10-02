import {saveSettings} from '../utils/index.js';
import type {CuppleSettings} from '../utils/index.js';
import type {CommandResult, CommandContext} from './types.js';

export const handleModeCommand = async (
	context: CommandContext,
): Promise<CommandResult> => {
	const newMode = context.settings.mode === 'auto' ? 'selector' : 'auto';
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

