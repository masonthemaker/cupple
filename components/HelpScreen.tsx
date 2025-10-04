import React from 'react';
import {Box, Text, useInput} from 'ink';
import {AnimatedTitle} from './AnimatedTitle.js';

interface HelpScreenProps {
	onBack: () => void;
	serverUrl?: string;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({onBack, serverUrl}) => {
	useInput((input, key) => {
		if (key.escape) {
			onBack();
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			<AnimatedTitle 
				title="Cupple" 
				interval={200} 
				serverUrl={serverUrl}
			/>
			<Text dimColor>─────────────────────────────────────────</Text>
			<Text dimColor>
				Living docs that sync across IDEs and agents
			</Text>
			<Text dimColor>─────────────────────────────────────────</Text>

			<Box marginTop={1} marginBottom={1}>
				<Text color="#FFFFFF" bold>
					Available Commands
				</Text>
			</Box>

			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor="#f9a8d4"
				padding={1}
			>
			{/* Documentation */}
			<Box marginBottom={1}>
				<Text bold color="#22c55e">📚 Documentation</Text>
			</Box>
			
			<Box marginLeft={2}>
				<Text color="#22c55e" bold>
					/select
				</Text>
				<Text dimColor> - Browse & document files (selector mode)</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#22c55e" bold>
					/redoc {'<filepath> [notes]'}
				</Text>
				<Text dimColor> - Regenerate docs with custom guidance</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#22c55e" bold>
					/init
				</Text>
				<Text dimColor> - Configure autodoc file types & threshold</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#22c55e" bold>
					/auto {'<tiny|small|medium|big>'}
				</Text>
				<Text dimColor> - Set autodoc threshold (auto mode only)</Text>
			</Box>

			{/* Pairing */}
			<Box marginTop={1} marginBottom={1}>
				<Text bold color="#3b82f6">🔗 Pairing</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#3b82f6" bold>
					/pair {'<port>'}
				</Text>
				<Text dimColor> - Connect to another Cupple instance</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#3b82f6" bold>
					/unpair {'<port|all>'}
				</Text>
				<Text dimColor> - Disconnect from one or all paired instances</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#3b82f6" bold>
					/browse {'<port>'}
				</Text>
				<Text dimColor> - Browse files on a paired instance</Text>
			</Box>

			{/* General */}
			<Box marginTop={1} marginBottom={1}>
				<Text bold color="#f59e0b">⚙️  General</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#f59e0b" bold>
					/mode
				</Text>
				<Text dimColor> - Switch between auto and selector mode</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#f59e0b" bold>
					/status
				</Text>
				<Text dimColor> - Check server and file watcher status</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#f59e0b" bold>
					/clear
				</Text>
				<Text dimColor> - Clear the history</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#f59e0b" bold>
					/help
				</Text>
				<Text dimColor> - Show this help menu</Text>
			</Box>

			<Box marginLeft={2}>
				<Text color="#f59e0b" bold>
					/exit
				</Text>
				<Text dimColor> - Exit Cupple</Text>
			</Box>
			</Box>

			<Box
				flexDirection="row"
				marginTop={2}
				borderStyle="single"
				borderTop
				justifyContent="center"
			>
				<Text dimColor italic>
					Press <Text color="#f9a8d4">ESC</Text> to go back
				</Text>
			</Box>
		</Box>
	);
};
