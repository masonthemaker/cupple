import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {AnimatedTitle} from './AnimatedTitle.js';

interface SetupScreenProps {
	onComplete: (mode: 'auto' | 'selector', apiKey: string) => void;
}

type SetupStep = 'api-key' | 'mode';

export const SetupScreen: React.FC<SetupScreenProps> = ({onComplete}) => {
	const [step, setStep] = useState<SetupStep>('api-key');
	const [apiKey, setApiKey] = useState('');
	const [apiKeyError, setApiKeyError] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);

	const handleApiKeySubmit = () => {
		const trimmedValue = apiKey.trim();
		
		if (trimmedValue.length < 10) {
			setApiKeyError('Invalid API key. Must be at least 10 characters.');
			return;
		}
		setApiKeyError('');
		setStep('mode');
	};

	// Handle API key input
	useInput(
		(input, key) => {
			if (step !== 'api-key') return;

			if (key.return) {
				handleApiKeySubmit();
			} else if (key.backspace || key.delete) {
				setApiKey(prev => prev.slice(0, -1));
				setApiKeyError('');
			} else if ((key.ctrl && input === 'u') || (key.ctrl && input === 'c')) {
				// Ctrl+U or Ctrl+C to clear
				setApiKey('');
				setApiKeyError('');
			} else if (input && !key.ctrl && !key.meta && !key.escape) {
				// Add any printable character (including pasted content)
				setApiKey(prev => prev + input);
				setApiKeyError('');
			}
		},
		{isActive: step === 'api-key'},
	);

	// Handle arrow keys and enter for mode selection
	useInput(
		(input, key) => {
			if (step !== 'mode') return;

			if (key.upArrow) {
				setSelectedIndex(prev => (prev === 0 ? 1 : 0));
			} else if (key.downArrow) {
				setSelectedIndex(prev => (prev === 1 ? 0 : 1));
			} else if (key.return) {
				const mode = selectedIndex === 0 ? 'auto' : 'selector';
				onComplete(mode, apiKey);
			}
		},
		{isActive: step === 'mode'},
	);

	// API Key Step
	if (step === 'api-key') {
		return (
			<Box flexDirection="column" padding={1}>
				<AnimatedTitle title="Cupple" interval={200} />
				<Text dimColor>─────────────────────────────────────────</Text>
				<Text dimColor>
					Living docs that sync across IDEs and agents
				</Text>
				<Text dimColor>─────────────────────────────────────────</Text>

				<Box marginTop={1} marginBottom={1}>
					<Text color="#ec4899" bold>
						💕 Welcome to Cupple!
					</Text>
				</Box>

				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor="#f9a8d4"
					padding={1}
					marginBottom={1}
				>
					<Text color="#FFFFFF" bold>
						Quick Getting Started
					</Text>
					<Box marginTop={1}>
						<Text dimColor>
							1. Install Cupple on both your frontend and backend projects
						</Text>
					</Box>
					<Box>
						<Text dimColor>2. Run Cupple in each project directory</Text>
					</Box>
					<Box>
						<Text dimColor>
							3. Use <Text color="#f9a8d4">/pair</Text> to link them together
						</Text>
					</Box>
					<Box>
						<Text dimColor>
							4. Share context seamlessly between AI agents!
						</Text>
					</Box>
				</Box>

				<Box marginBottom={1}>
					<Text color="#f9a8d4">Enter your API Key:</Text>
				</Box>

			<Box marginBottom={1} flexDirection="column">
				<Box>
					<Text color="#f9a8d4">❯ </Text>
					{apiKey.length > 0 ? (
						<Text color="#f9a8d4">••••••••</Text>
					) : (
						<Text dimColor>Paste your API key here...</Text>
					)}
				</Box>
				{apiKey.length > 0 && (
					<Box marginTop={1}>
						<Text color="#22c55e">
							✓ {apiKey.length} characters captured (press Enter to continue)
						</Text>
					</Box>
				)}
			</Box>

				{apiKeyError && (
					<Box marginBottom={1}>
						<Text color="#ef4444">{apiKeyError}</Text>
					</Box>
				)}

				<Box flexDirection="column">
					<Text dimColor italic>
						Your API key is stored securely in .cupple/cupplesettings.json
					</Text>
					<Text dimColor italic>
						Press Enter when done • Backspace to clear
					</Text>
				</Box>
			</Box>
		);
	}

	// Mode Selection Step
	return (
		<Box flexDirection="column" padding={1}>
			<AnimatedTitle title="Cupple" interval={200} />
			<Text dimColor>
				Bridge your frontend & backend—seamlessly share context between AI
				agents via markdown
			</Text>
			<Text dimColor>─────────</Text>

			<Box marginTop={1} marginBottom={1}>
				<Text color="#FFFFFF" bold>
					Choose Your Mode
				</Text>
			</Box>

			<Text color="#f9a8d4">Select how Cupple should work:</Text>

			<Box marginTop={1} flexDirection="column" gap={1}>
				<Box>
					<Text color={selectedIndex === 0 ? '#ff69b4' : 'gray'}>
						{selectedIndex === 0 ? '→ ' : '  '}
					</Text>
					<Text
						color={selectedIndex === 0 ? '#ff69b4' : 'white'}
						bold={selectedIndex === 0}
					>
						Auto Mode
					</Text>
				</Box>
				<Box marginLeft={3}>
					<Text dimColor>Automatically create and send MD files</Text>
				</Box>

				<Box marginTop={1}>
					<Text color={selectedIndex === 1 ? '#ff69b4' : 'gray'}>
						{selectedIndex === 1 ? '→ ' : '  '}
					</Text>
					<Text
						color={selectedIndex === 1 ? '#ff69b4' : 'white'}
						bold={selectedIndex === 1}
					>
						Selector Mode
					</Text>
				</Box>
				<Box marginLeft={3}>
					<Text dimColor>Select which files to generate MD for</Text>
				</Box>
			</Box>

			<Box marginTop={2}>
				<Text dimColor>Use ↑/↓ arrows to navigate, Enter to select</Text>
			</Box>
		</Box>
	);
};

