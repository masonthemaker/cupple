import React from 'react';
import {Box, Text, useInput} from 'ink';

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
		<Box flexDirection="column">
			<Text bold>Available Commands:</Text>

			<Box marginTop={1} flexDirection="column">
				<Text><Text color="#22c55e">/select</Text> - Browse & document files (selector mode)</Text>
				<Text><Text color="#22c55e">/redoc {'<file>'}</Text> - Regenerate docs with custom notes</Text>
				<Text><Text color="#22c55e">/init</Text> - Configure autodoc settings</Text>
				<Text><Text color="#22c55e">/auto {'<size>'}</Text> - Set autodoc threshold</Text>
				<Text dimColor>  Options: tiny (10 lines), small (20), medium (40), big (200)</Text>
				
				<Box marginTop={1}/>
				<Text><Text color="#3b82f6">/pair {'<port>'}</Text> - Connect to another instance</Text>
				<Text><Text color="#3b82f6">/unpair {'<port>'}</Text> - Disconnect from instance</Text>
				<Text><Text color="#3b82f6">/browse {'<port>'}</Text> - Browse paired instance files</Text>
				
				<Box marginTop={1}/>
				<Text><Text color="#f59e0b">/mode</Text> - Switch between auto/selector mode</Text>
				<Text><Text color="#f59e0b">/status</Text> - Check server status</Text>
				<Text><Text color="#f59e0b">/clear</Text> - Clear history</Text>
				<Text><Text color="#f59e0b">/discord</Text> - Open Discord community</Text>
				<Text><Text color="#f59e0b">/help</Text> - Show this help</Text>
				<Text><Text color="#f59e0b">/exit</Text> - Exit Cupple</Text>
			</Box>

			<Box marginTop={2}>
				<Text dimColor>Press ESC to go back</Text>
			</Box>
		</Box>
	);
};
