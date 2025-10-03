import React from 'react';
import {Box, Text} from 'ink';

// A customizable progress bar component for terminal displays
export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error';

export interface ProgressBarProps {
	/** Current progress value */
	current: number;
	/** Total/maximum value representing 100% */
	total: number;
	/** Width of the progress bar in characters */
	width?: number;
	/** Whether to show percentage text */
	showPercentage?: boolean;
	/** Custom color override (hex or named color) */
	color?: string;
	/** Optional label text displayed above the bar */
	label?: string;
	/** Predefined color variant */
	variant?: ProgressBarVariant;
	/** Whether to show the count (current/total) below the bar */
	showCount?: boolean;
	/** Enable animated fill characters */
	animated?: boolean;
	/** Optional completion message shown when progress reaches 100% */
	completionMessage?: string;
}

const VARIANT_COLORS: Record<ProgressBarVariant, string> = {
	default: '#22c55e',
	success: '#10b981',
	warning: '#f59e0b',
	error: '#ef4444',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
	current,
	total,
	width = 40,
	showPercentage = true,
	color,
	label,
	variant = 'default',
	showCount = true,
	animated = false,
	completionMessage,
}) => {
	const [animationOffset, setAnimationOffset] = React.useState(0);

	// Animate the bar if animated prop is true
	React.useEffect(() => {
		if (!animated) return;
		
		const interval = setInterval(() => {
			setAnimationOffset(prev => (prev + 1) % 4);
		}, 200);
		
		return () => clearInterval(interval);
	}, [animated]);

	// Guard against division by zero
	const percentage = total === 0 ? 0 : Math.min(100, Math.max(0, (current / total) * 100));
	const filledWidth = Math.round((percentage / 100) * width);
	const emptyWidth = width - filledWidth;

	// Determine the color based on variant or custom color
	const barColor = color || VARIANT_COLORS[variant];

	// Create animated or static fill patterns
	const fillChar = animated ? ['⣾', '⣽', '⣻', '⢿'][animationOffset] : '█';
	const filledBar = fillChar.repeat(filledWidth);
	const emptyBar = '░'.repeat(emptyWidth);

	// Check if progress is complete
	const isComplete = percentage >= 100;

	return (
		<Box flexDirection="column">
			{label && (
				<Box marginBottom={1}>
					<Text>{label}</Text>
				</Box>
			)}
			<Box>
				<Text color={barColor}>{filledBar}</Text>
				<Text dimColor>{emptyBar}</Text>
				{showPercentage && (
					<Text dimColor> {percentage.toFixed(0)}%</Text>
				)}
			</Box>
			{showCount && (
				<Box>
					<Text dimColor>
						{current} / {total}
					</Text>
				</Box>
			)}
			{isComplete && completionMessage && (
				<Box marginTop={1}>
					<Text color={barColor} bold>
						✓ {completionMessage}
					</Text>
				</Box>
			)}
		</Box>
	);
};


