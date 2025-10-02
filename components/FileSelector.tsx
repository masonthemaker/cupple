import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';

interface FileSelectorProps {
	changedFiles: Array<{name: string; path: string; linesAdded?: number; linesDeleted?: number}>;
	onFilesSelected: (files: string[]) => void;
	onCancel: () => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
	changedFiles,
	onFilesSelected,
	onCancel,
}) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex(prev =>
				prev > 0 ? prev - 1 : changedFiles.length - 1,
			);
		} else if (key.downArrow) {
			setSelectedIndex(prev =>
				prev < changedFiles.length - 1 ? prev + 1 : 0,
			);
		} else if (key.return) {
			const file = changedFiles[selectedIndex];
			setSelectedFiles(prev => {
				const newSet = new Set(prev);
				if (newSet.has(file.path)) {
					newSet.delete(file.path);
				} else {
					newSet.add(file.path);
				}
				return newSet;
			});
		} else if (input === 's' || input === 'S') {
			// Submit selection
			onFilesSelected(Array.from(selectedFiles));
		} else if (key.escape) {
			// Cancel
			onCancel();
		}
	});

	if (changedFiles.length === 0) {
		return (
			<Box flexDirection="column">
				<Text color="#ef4444">
					No files have been modified yet. Make some changes first!
				</Text>
				<Box marginTop={1}>
					<Text dimColor italic>
						Press <Text color="#f9a8d4">ESC</Text> to go back
					</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text color="#ec4899" bold>
					📝 Select Modified Files ({selectedFiles.size} selected)
				</Text>
			</Box>

			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor="#f9a8d4"
				padding={1}
				height={Math.min(changedFiles.length + 2, 15)}
			>
				{changedFiles.map((file, index) => {
					const isSelected = selectedFiles.has(file.path);
					const isFocused = index === selectedIndex;

					return (
						<Box key={file.path}>
							<Text
								color={
									isFocused
										? '#ff69b4'
										: isSelected
											? '#22c55e'
											: 'white'
								}
								bold={isFocused}
							>
								{isFocused ? '→ ' : '  '}
								{isSelected ? '✓ ' : '  '}
								{file.name}
								{file.linesAdded !== undefined &&
									file.linesDeleted !== undefined && (
										<>
											{' '}
											<Text color="#22c55e" dimColor={!isFocused}>
												+{file.linesAdded}
											</Text>
											<Text color="#ef4444" dimColor={!isFocused}>
												/-{file.linesDeleted}
											</Text>
										</>
									)}
							</Text>
						</Box>
					);
				})}
			</Box>

			<Box marginTop={1}>
				<Text dimColor italic>
					↑/↓ Navigate • Enter Toggle • <Text color="#f9a8d4">S</Text>{' '}
					Submit • <Text color="#f9a8d4">ESC</Text> Cancel
				</Text>
			</Box>
		</Box>
	);
};

