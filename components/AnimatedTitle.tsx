import React, {useState, useEffect} from 'react';
import {Text, Box} from 'ink';
import {readFileSync} from 'fs';
import {join} from 'path';

interface AnimatedTitleProps {
	title: string;
	interval?: number;
	showVersion?: boolean;
}

const getVersion = (): string => {
	try {
		const packageJsonPath = join(process.cwd(), 'package.json');
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
		return packageJson.version || '1.0.0';
	} catch (error) {
		return '1.0.0';
	}
};

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
	title,
	interval = 400,
	showVersion = true,
}) => {
	const [highlightIndex, setHighlightIndex] = useState(0);
	const version = getVersion();

	useEffect(() => {
		const intervalId = setInterval(() => {
			setHighlightIndex(prev => (prev + 1) % title.length);
		}, interval);

		return () => clearInterval(intervalId);
	}, [title.length, interval]);

	return (
		<Box>
			{title.split('').map((letter, i) => (
				<Text
					key={i}
					bold
					color={i === highlightIndex ? '#f9a8d4' : '#ec4899'}
				>
					{letter}
				</Text>
			))}
			{showVersion && (
				<Text dimColor> v{version}</Text>
			)}
		</Box>
	);
};

