import React from 'react';
import {Box, Text} from 'ink';

/**
 * Available status types for the indicator
 */
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'processing' | 'pending';

/**
 * Size variants for the status indicator
 */
export type StatusSize = 'small' | 'medium' | 'large';

/**
 * Props for the StatusIndicator component
 */
export interface StatusIndicatorProps {
	/** The type of status to display */
	status: StatusType;
	/** Main status message */
	message: string;
	/** Optional detailed information */
	details?: string;
	/** Whether to show the status icon */
	showIcon?: boolean;
	/** Size variant of the indicator */
	size?: StatusSize;
	/** Whether to show a border around the status */
	bordered?: boolean;
	/** Show timestamp when status was created */
	showTimestamp?: boolean;
	/** Enable animation for loading/processing states */
	animated?: boolean;
	/** Optional action text (e.g., "Press Enter to retry") */
	actionText?: string;
	/** Optional badge text to display next to the message */
	badge?: string;
}

/**
 * Configuration for each status type including icon, color, and label
 */
const STATUS_CONFIG: Record<
	StatusType,
	{icon: string; color: string; label: string; animatable: boolean}
> = {
	success: {
		icon: '✓',
		color: '#22c55e',
		label: 'Success',
		animatable: false,
	},
	error: {
		icon: '✗',
		color: '#ef4444',
		label: 'Error',
		animatable: false,
	},
	warning: {
		icon: '⚠',
		color: '#f59e0b',
		label: 'Warning',
		animatable: false,
	},
	info: {
		icon: 'ℹ',
		color: '#3b82f6',
		label: 'Info',
		animatable: false,
	},
	loading: {
		icon: '⏳',
		color: '#a855f7',
		label: 'Loading',
		animatable: true,
	},
	processing: {
		icon: '⚙',
		color: '#8b5cf6',
		label: 'Processing',
		animatable: true,
	},
	pending: {
		icon: '⋯',
		color: '#64748b',
		label: 'Pending',
		animatable: true,
	},
};

/**
 * Animation frames for animatable statuses
 */
const ANIMATION_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Size configuration for padding and spacing
 */
const SIZE_CONFIG: Record<StatusSize, {padding: number; marginY: number}> = {
	small: {padding: 0, marginY: 0},
	medium: {padding: 1, marginY: 1},
	large: {padding: 2, marginY: 1},
};

/**
 * StatusIndicator component displays a status message with icon and styling
 * based on the status type (success, error, warning, info, loading, processing, pending)
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
	status,
	message,
	details,
	showIcon = true,
	size = 'medium',
	bordered = false,
	showTimestamp = false,
	animated = false,
	actionText,
	badge,
}) => {
	const config = STATUS_CONFIG[status];
	const sizeConfig = SIZE_CONFIG[size];
	const [frameIndex, setFrameIndex] = React.useState(0);
	const [timestamp] = React.useState(() => new Date().toLocaleTimeString());

	// Animation effect for loading/processing states
	React.useEffect(() => {
		if (animated && config.animatable) {
			const interval = setInterval(() => {
				setFrameIndex(prev => (prev + 1) % ANIMATION_FRAMES.length);
			}, 80);
			return () => clearInterval(interval);
		}
	}, [animated, config.animatable]);

	const displayIcon = animated && config.animatable 
		? ANIMATION_FRAMES[frameIndex] 
		: config.icon;

	return (
		<Box
			flexDirection="column"
			marginY={sizeConfig.marginY}
			padding={bordered ? 1 : 0}
			borderStyle={bordered ? 'round' : undefined}
			borderColor={bordered ? config.color : undefined}
		>
			<Box>
				{showIcon && (
					<Text color={config.color} bold>
						{displayIcon}{' '}
					</Text>
				)}
				<Text color={config.color} bold={size === 'large'}>
					{message}
				</Text>
				{badge && (
					<Text color={config.color} dimColor> [{badge}]</Text>
				)}
				{showTimestamp && (
					<Text dimColor> • {timestamp}</Text>
				)}
			</Box>
			{details && (
				<Box marginLeft={showIcon ? 2 : 0} paddingTop={sizeConfig.padding}>
					<Text dimColor>{details}</Text>
				</Box>
			)}
			{actionText && (
				<Box marginLeft={showIcon ? 2 : 0} paddingTop={1}>
					<Text italic dimColor>
						{actionText}
					</Text>
				</Box>
			)}
		</Box>
	);
};

/**
 * Convenience component for success status
 */
export const SuccessStatus: React.FC<
	Omit<StatusIndicatorProps, 'status'>
> = props => <StatusIndicator status="success" {...props} />;

/**
 * Convenience component for error status
 */
export const ErrorStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = props => (
	<StatusIndicator status="error" {...props} />
);

/**
 * Convenience component for warning status
 */
export const WarningStatus: React.FC<
	Omit<StatusIndicatorProps, 'status'>
> = props => <StatusIndicator status="warning" {...props} />;

/**
 * Convenience component for info status
 */
export const InfoStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = props => (
	<StatusIndicator status="info" {...props} />
);

/**
 * Convenience component for loading status
 */
export const LoadingStatus: React.FC<
	Omit<StatusIndicatorProps, 'status'>
> = props => <StatusIndicator status="loading" {...props} />;

/**
 * Convenience component for processing status
 */
export const ProcessingStatus: React.FC<
	Omit<StatusIndicatorProps, 'status'>
> = props => <StatusIndicator status="processing" {...props} />;

/**
 * Convenience component for pending status
 */
export const PendingStatus: React.FC<
	Omit<StatusIndicatorProps, 'status'>
> = props => <StatusIndicator status="pending" {...props} />;

/**
 * Hook to easily create status messages with consistent formatting
 */
export const useStatusMessage = () => {
	const [currentStatus, setCurrentStatus] = React.useState<{
		type: StatusType;
		message: string;
		details?: string;
		actionText?: string;
		badge?: string;
		animated?: boolean;
		showTimestamp?: boolean;
	} | null>(null);

	const showSuccess = (message: string, details?: string, options?: {badge?: string; actionText?: string}) => {
		setCurrentStatus({type: 'success', message, details, ...options});
	};

	const showError = (message: string, details?: string, options?: {badge?: string; actionText?: string}) => {
		setCurrentStatus({type: 'error', message, details, ...options});
	};

	const showWarning = (message: string, details?: string, options?: {badge?: string; actionText?: string}) => {
		setCurrentStatus({type: 'warning', message, details, ...options});
	};

	const showInfo = (message: string, details?: string, options?: {badge?: string; actionText?: string}) => {
		setCurrentStatus({type: 'info', message, details, ...options});
	};

	const showLoading = (message: string, details?: string, options?: {animated?: boolean; badge?: string}) => {
		setCurrentStatus({type: 'loading', message, details, animated: true, ...options});
	};

	const showProcessing = (message: string, details?: string, options?: {animated?: boolean; badge?: string}) => {
		setCurrentStatus({type: 'processing', message, details, animated: true, ...options});
	};

	const showPending = (message: string, details?: string, options?: {badge?: string}) => {
		setCurrentStatus({type: 'pending', message, details, ...options});
	};

	const clearStatus = () => {
		setCurrentStatus(null);
	};

	return {
		currentStatus,
		showSuccess,
		showError,
		showWarning,
		showInfo,
		showLoading,
		showProcessing,
		showPending,
		clearStatus,
	};
};

