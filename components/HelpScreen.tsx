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
			<Box>
				<AnimatedTitle title="Cupple" interval={200} />
				{serverUrl && (
					<Text color="#a855f7"> • {serverUrl}</Text>
				)}
			</Box>
			<Text dimColor>
				Bridge your frontend & backend—seamlessly share context between AI
				agents via markdown
			</Text>
			<Text dimColor>─────────</Text>

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
				<Box>
					<Text color="#f9a8d4" bold>
						/help
					</Text>
					<Text dimColor> - Show this help menu</Text>
				</Box>


				<Box>
					<Text color="#f9a8d4" bold>
						/pair {'<port>'}
					</Text>
					<Text dimColor> - Connect to another Cupple instance</Text>
				</Box>

				<Box>
					<Text color="#f9a8d4" bold>
						/unpair {'<port|all>'}
					</Text>
					<Text dimColor> - Disconnect from one or all paired instances</Text>
				</Box>

				<Box>
					<Text color="#f9a8d4" bold>
						/browse {'<port>'}
					</Text>
					<Text dimColor> - Browse files on a paired instance</Text>
				</Box>

				<Box>
					<Text color="#f9a8d4" bold>
						/select
					</Text>
					<Text dimColor> - Open file selector (selector mode only)</Text>
				</Box>

				<Box>
					<Text color="#f9a8d4" bold>
						/status
					</Text>
					<Text dimColor> - Check server and file watcher status</Text>
				</Box>

				<Box>
					<Text color="#f9a8d4" bold>
						/clear
					</Text>
					<Text dimColor> - Clear the history</Text>
				</Box>

				<Box>
					<Text color="#f9a8d4" bold>
						/mode
					</Text>
					<Text dimColor> - Switch between auto and selector mode</Text>
				</Box>

				<Box>
					<Text color="#f9a8d4" bold>
						/auto {'<tiny|small|medium|big>'}
					</Text>
					<Text dimColor> - Set autodoc threshold (auto mode only)</Text>
				</Box>

				<Box>
					<Text color="#f9a8d4" bold>
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

