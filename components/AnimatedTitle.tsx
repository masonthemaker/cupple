import React, {useState, useEffect} from 'react';
import {Text, Box} from 'ink';
import {readFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

interface AnimatedTitleProps {
	title: string;
	interval?: number;
	showVersion?: boolean;
	serverUrl?: string;
	hasApiKey?: boolean;
	updateAvailable?: boolean;
	latestVersion?: string;
}

const getVersion = (): string => {
	try {
		// Get the directory of this file, then go up to package root
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		
		// Try one level up (for source) and two levels up (for compiled dist)
		let packageJsonPath = join(__dirname, '..', 'package.json');
		try {
			const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
			return packageJson.version || '1.0.0';
		} catch {
			// Try two levels up (for dist folder structure)
			packageJsonPath = join(__dirname, '..', '..', 'package.json');
			const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
			return packageJson.version || '1.0.0';
		}
	} catch (error) {
		return '1.0.0';
	}
};

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
	title,
	interval = 300,
	showVersion = true,
	serverUrl,
	hasApiKey,
	updateAvailable,
	latestVersion,
}) => {
	const [highlightIndex, setHighlightIndex] = useState(0);
	const version = getVersion();

	useEffect(() => {
		const intervalId = setInterval(() => {
			setHighlightIndex(prev => (prev + 1) % title.length);
		}, interval);

		return () => clearInterval(intervalId);
	}, [interval, title.length]);

	return (
		<Box 
			borderStyle="round" 
			borderColor="#ec4899" 
			paddingX={2}
			paddingY={1}
			flexShrink={0}
		>
			<Box flexDirection="column">
				{/* Title row */}
				<Box>
					<Text bold>
						{title.split('').map((char, index) => (
							<Text 
								key={index}
								color={index === highlightIndex ? '#ffffff' : '#ec4899'}
							>
								{char}
							</Text>
						))}
					</Text>
					{showVersion && (
						<Text dimColor> v{version}</Text>
					)}
					{serverUrl && (
						<Text color="#a855f7"> • {serverUrl}</Text>
					)}
					{hasApiKey !== undefined && (
						<Text color={hasApiKey ? '#22c55e' : '#ef4444'}>
							{' '}• API {hasApiKey ? '✓' : '✗'}
						</Text>
					)}
					{updateAvailable && latestVersion && (
						<Text color="#f59e0b"> • Update: v{latestVersion}</Text>
					)}
				</Box>
				{/* Discord link */}
				<Box marginTop={1}>
					<Text dimColor>💬 Join our Discord: </Text>
					<Text color="#5865F2">https://discord.gg/S7zRnuTk</Text>
					<Text dimColor> (type </Text>
					<Text color="#f9a8d4">/discord</Text>
					<Text dimColor> to open)</Text>
				</Box>
			</Box>
		</Box>
	);
};

