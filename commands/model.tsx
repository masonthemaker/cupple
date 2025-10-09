import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {saveSettings} from '../utils/index.js';
import type {CuppleSettings} from '../utils/index.js';
import type {CommandResult, CommandContext} from './types.js';

export type ModelOption = {
	name: string;
	value: string;
	description: string;
};

export const MODEL_OPTIONS: ModelOption[] = [
	{
		name: 'GPT-OSS-20B',
		value: 'openai/gpt-oss-20b',
		description: 'Fast and efficient (default)',
	},
	{
		name: 'GPT-OSS-120B',
		value: 'openai/gpt-oss-120b',
		description: 'Larger model for complex docs',
	},
	{
		name: 'Kimi K2',
		value: 'moonshotai/kimi-k2-instruct-0905',
		description: 'Moonshot AI Kimi K2 Instruct',
	},
	{
		name: 'Llama 3.3 70B',
		value: 'llama-3.3-70b-versatile',
		description: 'Meta Llama 3.3 70B Versatile',
	},
];

interface ModelScreenProps {
	context: CommandContext;
	onComplete: (result: CommandResult) => void;
}

export const ModelScreen: React.FC<ModelScreenProps> = ({context, onComplete}) => {
	const currentModel = context.settings.model || 'openai/gpt-oss-20b';
	const currentIndex = MODEL_OPTIONS.findIndex(opt => opt.value === currentModel);
	const [selectedIndex, setSelectedIndex] = useState(currentIndex >= 0 ? currentIndex : 0);

	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex(prev => (prev > 0 ? prev - 1 : MODEL_OPTIONS.length - 1));
		} else if (key.downArrow) {
			setSelectedIndex(prev => (prev < MODEL_OPTIONS.length - 1 ? prev + 1 : 0));
		} else if (key.return || input === ' ') {
			// Save selected model
			const selectedModel = MODEL_OPTIONS[selectedIndex];
			const updatedSettings: CuppleSettings = {
				...context.settings,
				model: selectedModel.value,
			};

			saveSettings(updatedSettings)
				.then(() => {
					context.onSettingsUpdate(updatedSettings);
					onComplete({
						success: true,
						message: `✓ Model set to ${selectedModel.name}`,
						color: '#10b981',
					});
				})
				.catch(error => {
					onComplete({
						success: false,
						message: `Failed to save model: ${error instanceof Error ? error.message : 'Unknown error'}`,
						color: '#ef4444',
					});
				});
		} else if (key.escape || input === 'q') {
			onComplete({
				success: false,
				message: 'Model selection cancelled',
				color: '#6b7280',
			});
		}
	});

	return (
		<Box flexDirection="column" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold color="#ec4899">
					Select Model for Documentation Generation
				</Text>
			</Box>

			<Box flexDirection="column">
				{MODEL_OPTIONS.map((option, index) => {
					const isSelected = index === selectedIndex;
					const isCurrent = option.value === currentModel;

					return (
						<Box key={option.value} marginBottom={0}>
							<Text color={isSelected ? '#ec4899' : undefined}>
								{isSelected ? '▶ ' : '  '}
								{option.name}
								{isCurrent ? ' (current)' : ''}
							</Text>
							<Text color="#6b7280" dimColor>
								{' - '}
								{option.description}
							</Text>
						</Box>
					);
				})}
			</Box>

			<Box marginTop={1}>
				<Text color="#6b7280" dimColor>
					↑/↓ Navigate • Enter Select • Esc Cancel
				</Text>
			</Box>
		</Box>
	);
};

export const handleModelCommand = async (
	context: CommandContext,
): Promise<CommandResult> => {
	// Return a special result indicating we need to render the ModelScreen
	return {
		success: true,
		message: 'model:show',
	};
};

