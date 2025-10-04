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
	interval = 200,
	showVersion = true,
	serverUrl,
	hasApiKey,
	updateAvailable,
	latestVersion,
}) => {
	const [highlightIndex, setHighlightIndex] = useState(0);
	const version = getVersion();

	const logo = [
		' ██████╗██╗   ██╗██████╗ ██████╗ ██╗     ███████╗',
		'██╔════╝██║   ██║██╔══██╗██╔══██╗██║     ██╔════╝',
		'██║     ██║   ██║██████╔╝██████╔╝██║     █████╗  ',
		'██║     ██║   ██║██╔═══╝ ██╔═══╝ ██║     ██╔══╝  ',
		'╚██████╗╚██████╔╝██║     ██║     ███████╗███████╗',
		' ╚═════╝ ╚═════╝ ╚═╝     ╚═╝     ╚══════╝╚══════╝',
	];

	useEffect(() => {
		const maxLength = Math.max(...logo.map(line => line.length));
		const intervalId = setInterval(() => {
			setHighlightIndex(prev => (prev + 1) % maxLength);
		}, interval);

		return () => clearInterval(intervalId);
	}, [interval]);

	return (
		<Box 
			borderStyle="round" 
			borderColor="white" 
			padding={1}
			flexShrink={0}
			overflow="hidden"
		>
			<Box flexDirection="column" flexShrink={0}>
				{logo.map((line, rowIndex) => (
					<Box key={rowIndex} flexShrink={0}>
						{line.split('').map((char, colIndex) => (
							<Text
								key={colIndex}
								bold
								color={
									colIndex === highlightIndex
										? '#ffffff'
										: rowIndex % 2 === 0
										? '#ec4899'
										: '#f9a8d4'
								}
							>
								{char}
							</Text>
						))}
					</Box>
				))}
				<Box>
					{showVersion && (
						<Text dimColor>v{version}</Text>
					)}
					{updateAvailable && latestVersion && (
						<Text color="#f59e0b"> • Update available: v{latestVersion}</Text>
					)}
					{serverUrl && (
						<Text color="#a855f7"> • {serverUrl}</Text>
					)}
					{hasApiKey !== undefined && (
						<Text color={hasApiKey ? '#22c55e' : '#ef4444'}>
							{' '}• API: {hasApiKey ? '✓' : '✗'}
						</Text>
					)}
				</Box>
			</Box>
			
			<Box 
				flexDirection="column" 
				marginLeft={2}
				flexShrink={0}
			>
				{updateAvailable ? (
					<>
						<Text bold color="#f59e0b">  ⚠️  Update Available!</Text>
						<Box marginTop={1} flexShrink={0}>
							<Text>  Run </Text>
							<Text color="#f9a8d4">npm update -g cupple</Text>
						</Box>
						<Box flexShrink={0}>
							<Text dimColor>  to get v{latestVersion}</Text>
						</Box>
					</>
				) : (
					<>
						<Text bold color="#22c55e">🚀 Getting Started</Text>
						<Box marginTop={1} flexShrink={0}>
							<Text dimColor>1. </Text>
							<Text>Choose your mode with </Text>
							<Text color="#f9a8d4">/mode</Text>
						</Box>
						<Box flexShrink={0}>
							<Text dimColor>2. </Text>
							<Text>Configure autodoc with </Text>
							<Text color="#f9a8d4">/init</Text>
						</Box>
						<Box flexShrink={0}>
							<Text dimColor>3. </Text>
							<Text>Run </Text>
							<Text color="#f9a8d4">cupple</Text>
							<Text> in another project</Text>
						</Box>
						<Box flexShrink={0}>
							<Text dimColor>4. </Text>
							<Text>Pair them with </Text>
							<Text color="#f9a8d4">/pair {'<port>'}</Text>
						</Box>
					</>
				)}
			</Box>
		</Box>
	);
};

