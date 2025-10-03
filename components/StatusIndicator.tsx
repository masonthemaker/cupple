import React from 'react';
import {Box, Text} from 'ink';

/**
 * Available status types for the indicator
 */
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

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
}

/**
 * Configuration for each status type including icon, color, and label
 */
const STATUS_CONFIG: Record<
	StatusType,
	{icon: string; color: string; label: string}
> = {
	success: {
		icon: '✓',
		color: '#22c55e',
		label: 'Success',
	},
	error: {
		icon: '✗',
		color: '#ef4444',
		label: 'Error',
	},
	warning: {
		icon: '⚠',
		color: '#f59e0b',
		label: 'Warning',
	},
	info: {
		icon: 'ℹ',
		color: '#3b82f6',
		label: 'Info',
	},
	loading: {
		icon: '⏳',
		color: '#a855f7',
		label: 'Loading',
	},
};

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
 * based on the status type (success, error, warning, info, loading)
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
	status,
	message,
	details,
	showIcon = true,
	size = 'medium',
	bordered = false,
}) => {
	const config = STATUS_CONFIG[status];
	const sizeConfig = SIZE_CONFIG[size];

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
						{config.icon}{' '}
					</Text>
				)}
				<Text color={config.color} bold={size === 'large'}>
					{message}
				</Text>
			</Box>
			{details && (
				<Box marginLeft={showIcon ? 2 : 0} paddingTop={sizeConfig.padding}>
					<Text dimColor>{details}</Text>
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
 * Hook to easily create status messages with consistent formatting
 */
export const useStatusMessage = () => {
	const [currentStatus, setCurrentStatus] = React.useState<{
		type: StatusType;
		message: string;
		details?: string;
	} | null>(null);

	const showSuccess = (message: string, details?: string) => {
		setCurrentStatus({type: 'success', message, details});
	};

	const showError = (message: string, details?: string) => {
		setCurrentStatus({type: 'error', message, details});
	};

	const showWarning = (message: string, details?: string) => {
		setCurrentStatus({type: 'warning', message, details});
	};

	const showInfo = (message: string, details?: string) => {
		setCurrentStatus({type: 'info', message, details});
	};

	const showLoading = (message: string, details?: string) => {
		setCurrentStatus({type: 'loading', message, details});
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
		clearStatus,
	};
};

