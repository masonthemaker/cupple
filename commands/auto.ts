import {saveSettings} from '../utils/index.js';
import type {CuppleSettings} from '../utils/index.js';
import type {CommandResult, CommandContext} from './types.js';

type ThresholdSize = 'tiny' | 'small' | 'medium' | 'big';

const THRESHOLDS: Record<ThresholdSize, number> = {
	tiny: 10,
	small: 20,
	medium: 40,
	big: 200,
};

export const handleAutoCommand = async (
	args: string[],
	context: CommandContext,
): Promise<CommandResult> => {
	// Check if /init has been run
	if (!context.settings.extensionConfigs) {
		return {
			success: false,
			message: '⚠️ Please run /init to configure autodoc first',
			color: '#f59e0b',
		};
	}

	// Only works in auto mode
	if (context.settings.mode !== 'auto') {
		return {
			success: false,
			message: '✗ /auto command only works in auto mode. Use /mode to switch to auto mode.',
			color: '#ef4444',
		};
	}

	// No args - show current threshold
	if (args.length === 0) {
		const currentThreshold = context.settings.autodocThreshold || 40;
		const size = Object.entries(THRESHOLDS).find(
			([_, value]) => value === currentThreshold,
		)?.[0] || 'custom';
		
		return {
			success: true,
			message: `ℹ️ Current autodoc threshold: ${currentThreshold} lines (${size})`,
			color: '#a855f7',
		};
	}

	const size = args[0].toLowerCase() as ThresholdSize;

	// Validate size
	if (!THRESHOLDS[size]) {
		return {
			success: false,
			message: `✗ Invalid size. Use: tiny (10), small (20), medium (40), or big (200)`,
			color: '#ef4444',
		};
	}

	const threshold = THRESHOLDS[size];

	const updatedSettings: CuppleSettings = {
		...context.settings,
		autodocThreshold: threshold,
	};

	await saveSettings(updatedSettings);
	context.onSettingsUpdate(updatedSettings);

	return {
		success: true,
		message: `✓ Autodoc threshold set to ${size} (${threshold} lines)`,
		color: '#22c55e',
	};
};

