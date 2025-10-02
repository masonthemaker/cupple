import React from 'react';
import {Box, Text, useInput} from 'ink';

interface PairingRequestProps {
	port: number;
	url: string;
	projectPath: string;
	onAccept: () => void;
	onDecline: () => void;
}

export const PairingRequest: React.FC<PairingRequestProps> = ({
	port,
	url,
	projectPath,
	onAccept,
	onDecline,
}) => {
	useInput((input, key) => {
		if (input === 'y' || input === 'Y') {
			onAccept();
		} else if (input === 'n' || input === 'N' || key.escape) {
			onDecline();
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="#f9a8d4"
			padding={1}
			marginTop={1}
			marginBottom={1}
		>
			<Box marginBottom={1}>
				<Text color="#ec4899" bold>
					💕 Pairing Request
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text>
					A Cupple instance wants to pair with you:
				</Text>
			</Box>

			<Box marginBottom={1} paddingLeft={2}>
				<Text dimColor>URL: </Text>
				<Text color="#a855f7">{url}</Text>
			</Box>

			<Box marginBottom={1} paddingLeft={2}>
				<Text dimColor>Port: </Text>
				<Text color="#a855f7">{port}</Text>
			</Box>

			<Box marginBottom={1} paddingLeft={2}>
				<Text dimColor>Path: </Text>
				<Text color="#a855f7">{projectPath}</Text>
			</Box>

			<Box marginTop={1}>
				<Text>
					<Text color="#22c55e" bold>Y</Text> Accept • <Text color="#ef4444" bold>N</Text> Decline
				</Text>
			</Box>
		</Box>
	);
};

