import React from 'react';
import {Text, Box} from 'ink';
import Spinner from 'ink-spinner';

type HistoryItem = {
	message: string;
	color?: string;
	filename?: string;
	type?: 'file_created' | 'file_modified' | 'directory_created';
	linesAdded?: number;
	linesDeleted?: number;
	loading?: boolean; // Shows spinner when true
};

interface HistoryDisplayProps {
	history: HistoryItem[];
}

export const HistoryDisplay: React.FC<HistoryDisplayProps> = ({history}) => {
	return (
		<>
			{history.map((item, i) => {
				// Render warning messages in a box
				if (item.message.startsWith('⚠️') || item.message.startsWith('⚠')) {
					return (
						<Box
							key={i}
							borderStyle="round"
							borderColor={item.color || '#f59e0b'}
							paddingX={1}
							marginY={1}
						>
							<Text color={item.color}>{item.message}</Text>
						</Box>
					);
				}
				
			// Regular message rendering
			return (
				<Text key={i} color={item.color}>
					{item.loading && (
						<>
							<Text color="#a855f7">
								<Spinner type="dots" />
							</Text>
							{' '}
						</>
					)}
					{item.message}
					{item.filename && (
						<Text bold dimColor={false} underline>
							{item.filename}
						</Text>
					)}
				</Text>
			);
			})}
		</>
	);
};

