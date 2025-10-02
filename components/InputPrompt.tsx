import React from 'react';
import {Text, Box} from 'ink';
import TextInput from 'ink-text-input';

interface InputPromptProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
	mode?: 'auto' | 'selector';
}

export const InputPrompt: React.FC<InputPromptProps> = ({
	value,
	onChange,
	onSubmit,
	mode,
}) => {
	return (
		<Box flexDirection="column">
			<Box marginTop={1}>
				<Text color="white">❯ </Text>
				<Text color="#fecdd3">
					<TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
				</Text>
			</Box>
			<Box
				flexDirection="row"
				marginTop={1}
				borderStyle="single"
				borderTop
				justifyContent="space-between"
			>
				<Text dimColor italic>
					💡 Need assistance? Type /help
				</Text>
				{mode && (
					<Text dimColor>
						Mode: <Text color="#f9a8d4">{mode}</Text>
					</Text>
				)}
			</Box>
		</Box>
	);
};

