import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {saveSettings} from '../utils/index.js';
import type {CuppleSettings, ExtensionConfig, DocDetailLevel} from '../utils/index.js';
import type {CommandResult, CommandContext} from './types.js';

type ThresholdOption = {
	name: string;
	value: number;
	description: string;
};

const THRESHOLD_OPTIONS: ThresholdOption[] = [
	{
		name: 'tiny',
		value: 10,
		description: 'Very aggressive - docs every ~10 line change',
	},
	{
		name: 'small',
		value: 20,
		description: 'Aggressive - docs every ~20 line change',
	},
	{
		name: 'medium',
		value: 40,
		description: 'Balanced - docs every ~40 line change (recommended)',
	},
	{
		name: 'big',
		value: 200,
		description: 'Conservative - docs only on major changes (200+ lines)',
	},
];

type ExtensionOption = {
	name: string;
	extensions: string[];
};

const EXTENSION_PRESETS: ExtensionOption[] = [
	{
		name: 'JavaScript/TypeScript',
		extensions: ['.js', '.jsx', '.ts', '.tsx'],
	},
	{
		name: 'Python',
		extensions: ['.py'],
	},
	{
		name: 'Java',
		extensions: ['.java'],
	},
	{
		name: 'Go',
		extensions: ['.go'],
	},
	{
		name: 'Rust',
		extensions: ['.rs'],
	},
	{
		name: 'C/C++',
		extensions: ['.c', '.cpp', '.h', '.hpp'],
	},
	{
		name: 'All code files',
		extensions: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.c', '.cpp'],
	},
];

interface InitScreenProps {
	context: CommandContext;
	onComplete: (result: CommandResult) => void;
}

type DetailOption = {
	name: string;
	value: DocDetailLevel;
	description: string;
};

const DETAIL_OPTIONS: DetailOption[] = [
	{
		name: 'Brief',
		value: 'brief',
		description: 'Concise docs - key types, props, and basic usage (~30% tokens)',
	},
	{
		name: 'Standard',
		value: 'standard',
		description: 'Balanced docs - includes examples and details (recommended)',
	},
	{
		name: 'Comprehensive',
		value: 'comprehensive',
		description: 'Detailed docs - extensive examples, gotchas, all features (~70% more tokens)',
	},
];

export const InitScreen: React.FC<InitScreenProps> = ({context, onComplete}) => {
	const [step, setStep] = useState<'main' | 'custom' | 'detail' | 'threshold'>('main');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [selectedDetailIndex, setSelectedDetailIndex] = useState(1); // Default to standard
	const [selectedThresholdIndex, setSelectedThresholdIndex] = useState(2); // Default to medium
	const [configurations, setConfigurations] = useState<ExtensionConfig[]>([]);
	const [currentPresetIndex, setCurrentPresetIndex] = useState<number | null>(null);
	const [customInput, setCustomInput] = useState('');

	useInput((input, key) => {
		if (step === 'main') {
			const totalOptions = EXTENSION_PRESETS.length + 1; // +1 for custom option
			
			if (key.upArrow) {
				setSelectedIndex(prev =>
					prev > 0 ? prev - 1 : totalOptions - 1,
				);
			} else if (key.downArrow) {
				setSelectedIndex(prev =>
					prev < totalOptions - 1 ? prev + 1 : 0,
				);
			} else if (key.return || input === ' ') {
				// Select preset or custom
				if (selectedIndex < EXTENSION_PRESETS.length) {
					const preset = EXTENSION_PRESETS[selectedIndex];
					
					// Check if this preset is already configured
					const isConfigured = preset.extensions.some(ext => 
						configurations.find(c => c.extension === ext)
					);
					
					if (isConfigured) {
						// Remove all extensions from this preset
						const updatedConfigs = configurations.filter(config => 
							!preset.extensions.includes(config.extension)
						);
						setConfigurations(updatedConfigs);
					} else {
						// Preset not configured - go to detail selection
						setCurrentPresetIndex(selectedIndex);
						setSelectedDetailIndex(1); // Reset to standard
						setStep('detail');
					}
				} else {
					// Custom option selected - go to custom input
					setStep('custom');
				}
			} else if (input.toLowerCase() === 's') {
				// Save and continue to threshold
				if (configurations.length === 0) {
					// Need at least one configuration
					return;
				}
				setStep('threshold');
			} else if (input.toLowerCase() === 'd' && configurations.length > 0) {
				// Delete the most recently added configuration
				const updatedConfigs = [...configurations];
				updatedConfigs.pop();
				setConfigurations(updatedConfigs);
			} else if (key.escape) {
				onComplete({
					success: false,
					message: '✗ Init cancelled',
					color: '#ef4444',
				});
			}
		} else if (step === 'custom') {
			if (key.return) {
				// Parse custom input (comma-separated extensions)
				const customExts = customInput
					.split(',')
					.map(ext => ext.trim())
					.filter(ext => ext.length > 0)
					.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
				
				if (customExts.length > 0) {
					// Go to detail selection for these custom extensions
					setCurrentPresetIndex(-1); // -1 indicates custom
					setSelectedDetailIndex(1); // Reset to standard
					setStep('detail');
				}
			} else if (key.escape) {
				setCustomInput(''); // Clear input
				setStep('main');
			} else if (key.backspace || key.delete) {
				setCustomInput(prev => prev.slice(0, -1));
			} else if (input && !key.ctrl && !key.meta) {
				setCustomInput(prev => prev + input);
			}
		} else if (step === 'detail') {
			if (key.upArrow) {
				setSelectedDetailIndex(prev =>
					prev > 0 ? prev - 1 : DETAIL_OPTIONS.length - 1,
				);
			} else if (key.downArrow) {
				setSelectedDetailIndex(prev =>
					prev < DETAIL_OPTIONS.length - 1 ? prev + 1 : 0,
				);
			} else if (key.return) {
				// Save this configuration
				const detailLevel = DETAIL_OPTIONS[selectedDetailIndex].value;
				
				if (currentPresetIndex !== null && currentPresetIndex >= 0) {
					// Preset configuration
					const preset = EXTENSION_PRESETS[currentPresetIndex];
					const newConfigs = preset.extensions.map(ext => ({
						extension: ext,
						detailLevel,
					}));
					
					// Remove duplicates and add new configs
					const updatedConfigs = [...configurations];
					newConfigs.forEach(newConfig => {
						const existingIndex = updatedConfigs.findIndex(c => c.extension === newConfig.extension);
						if (existingIndex >= 0) {
							updatedConfigs[existingIndex] = newConfig;
						} else {
							updatedConfigs.push(newConfig);
						}
					});
					setConfigurations(updatedConfigs);
				} else if (currentPresetIndex === -1) {
					// Custom extensions
					const customExts = customInput
						.split(',')
						.map(ext => ext.trim())
						.filter(ext => ext.length > 0)
						.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
					
					const newConfigs = customExts.map(ext => ({
						extension: ext,
						detailLevel,
					}));
					
					// Remove duplicates and add new configs
					const updatedConfigs = [...configurations];
					newConfigs.forEach(newConfig => {
						const existingIndex = updatedConfigs.findIndex(c => c.extension === newConfig.extension);
						if (existingIndex >= 0) {
							updatedConfigs[existingIndex] = newConfig;
						} else {
							updatedConfigs.push(newConfig);
						}
					});
					setConfigurations(updatedConfigs);
					setCustomInput(''); // Clear input
				}
				
				// Go back to main screen
				setCurrentPresetIndex(null);
				setStep('main');
			} else if (key.escape) {
				setCurrentPresetIndex(null);
				if (currentPresetIndex === -1) {
					setStep('custom');
				} else {
					setStep('main');
				}
			}
		} else if (step === 'threshold') {
			if (key.upArrow) {
				setSelectedThresholdIndex(prev =>
					prev > 0 ? prev - 1 : THRESHOLD_OPTIONS.length - 1,
				);
			} else if (key.downArrow) {
				setSelectedThresholdIndex(prev =>
					prev < THRESHOLD_OPTIONS.length - 1 ? prev + 1 : 0,
				);
			} else if (key.return) {
				handleComplete();
			} else if (key.escape) {
				setStep('main');
			}
		}
	});

	const handleComplete = async () => {
		const threshold = THRESHOLD_OPTIONS[selectedThresholdIndex];

		const updatedSettings: CuppleSettings = {
			...context.settings,
			autodocThreshold: threshold.value,
			extensionConfigs: configurations,
		};

		await saveSettings(updatedSettings);
		context.onSettingsUpdate(updatedSettings);

		// Create summary
		const configSummary = configurations.slice(0, 3).map(c => c.extension).join(', ') + 
			(configurations.length > 3 ? '...' : '');
		const detailCounts = {
			brief: configurations.filter(c => c.detailLevel === 'brief').length,
			standard: configurations.filter(c => c.detailLevel === 'standard').length,
			comprehensive: configurations.filter(c => c.detailLevel === 'comprehensive').length,
		};
		const detailSummary = Object.entries(detailCounts)
			.filter(([, count]) => count > 0)
			.map(([level, count]) => `${count}×${level}`)
			.join(', ');
		
		onComplete({
			success: true,
			message: `✓ Autodoc configured: ${configurations.length} extensions (${configSummary}) with ${detailSummary}, ${threshold.name} threshold (${threshold.value} lines)`,
			color: '#22c55e',
		});
	};

	if (step === 'main') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="#a855f7">
						Configure autodoc file types:
					</Text>
					<Text dimColor> Select presets or add custom extensions</Text>
				</Box>

				<Box marginBottom={1}>
					<Text bold color="#60a5fa">Presets:</Text>
				</Box>

				{EXTENSION_PRESETS.map((preset, index) => {
					const isCurrent = index === selectedIndex;
					const configured = preset.extensions.some(ext => 
						configurations.find(c => c.extension === ext)
					);
					
					return (
						<Box key={preset.name} marginLeft={2}>
							<Text color={isCurrent ? '#22c55e' : undefined}>
								{isCurrent ? '▸ ' : '  '}
								{configured ? '[✓] ' : '    '}
								{preset.name}
							</Text>
							<Text dimColor> ({preset.extensions.join(', ')})</Text>
						</Box>
					);
				})}

				<Box marginLeft={2} marginTop={1}>
					<Text color={selectedIndex === EXTENSION_PRESETS.length ? '#22c55e' : undefined}>
						{selectedIndex === EXTENSION_PRESETS.length ? '▸ ' : '  '}
						[+] Add custom extensions...
					</Text>
				</Box>

				{configurations.length > 0 && (
					<>
						<Box marginTop={1}>
							<Text bold color="#60a5fa">Configured Extensions:</Text>
						</Box>
						{configurations.map((config, index) => (
							<Box key={index} marginLeft={2}>
								<Text color="#22c55e">{config.extension}</Text>
								<Text dimColor> → {config.detailLevel}</Text>
							</Box>
						))}
					</>
				)}

				<Box marginTop={1}>
					<Text dimColor>
						↑/↓ Navigate • Enter/Space Toggle • {configurations.length > 0 && 'D Delete Last • S Save • '}Esc Cancel
					</Text>
				</Box>
			</Box>
		);
	}

	if (step === 'custom') {
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="#a855f7">
						Enter custom file extensions:
					</Text>
				</Box>

				<Box marginLeft={2} marginBottom={1}>
					<Text dimColor>
						Enter extensions separated by commas (e.g., .vue, .svelte, .rb)
					</Text>
				</Box>

				<Box marginLeft={2} marginBottom={1}>
					<Text color="#22c55e">
						{customInput || <Text dimColor>(type extensions...)</Text>}
					</Text>
				</Box>

				<Box marginTop={1}>
					<Text dimColor>
						Enter Confirm • Esc Back
					</Text>
				</Box>
			</Box>
		);
	}

	if (step === 'detail') {
		// Determine what we're configuring
		let configTitle = '';
		let extensions: string[] = [];
		
		if (currentPresetIndex !== null && currentPresetIndex >= 0) {
			const preset = EXTENSION_PRESETS[currentPresetIndex];
			configTitle = preset.name;
			extensions = preset.extensions;
		} else if (currentPresetIndex === -1) {
			configTitle = 'Custom extensions';
			extensions = customInput
				.split(',')
				.map(ext => ext.trim())
				.filter(ext => ext.length > 0)
				.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
		}
		
		return (
			<Box flexDirection="column" paddingY={1}>
				<Box marginBottom={1}>
					<Text bold color="#a855f7">
						Select detail level for {configTitle}:
					</Text>
					<Text dimColor> ({extensions.join(', ')})</Text>
				</Box>

				{DETAIL_OPTIONS.map((option, index) => (
					<Box key={option.value} flexDirection="column" marginLeft={2} marginBottom={1}>
						<Box>
							<Text color={index === selectedDetailIndex ? '#22c55e' : undefined} bold>
								{index === selectedDetailIndex ? '▸ ' : '  '}
								{option.name}
							</Text>
						</Box>
						<Box marginLeft={4}>
							<Text dimColor>{option.description}</Text>
						</Box>
					</Box>
				))}

				<Box marginTop={1}>
					<Text dimColor>
						↑/↓ Navigate • Enter Save • Esc Back
					</Text>
				</Box>
			</Box>
		);
	}

	// Threshold selection
	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="#a855f7">
					Select documentation trigger threshold:
				</Text>
			</Box>

			{THRESHOLD_OPTIONS.map((option, index) => (
				<Box key={option.name} flexDirection="column" marginLeft={2} marginBottom={1}>
					<Box>
						<Text color={index === selectedThresholdIndex ? '#22c55e' : undefined} bold>
							{index === selectedThresholdIndex ? '▸ ' : '  '}
							{option.name} ({option.value} lines)
						</Text>
					</Box>
					<Box marginLeft={4}>
						<Text dimColor>{option.description}</Text>
					</Box>
				</Box>
			))}

			<Box marginTop={1}>
				<Text dimColor>
					↑/↓ Navigate • Enter Confirm • Esc Back
				</Text>
			</Box>
		</Box>
	);
};

export const handleInitCommand = async (
	context: CommandContext,
): Promise<CommandResult> => {
	// This command needs UI interaction, so we return a special result
	// that tells the app to render the InitScreen
	return {
		success: true,
		message: 'init:show',
		color: '#a855f7',
	};
};

