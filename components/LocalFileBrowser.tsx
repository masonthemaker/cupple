import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {readdir, stat, readFile} from 'fs/promises';
import {join} from 'path';

interface FileItem {
	name: string;
	type: 'file' | 'directory';
	size: number;
}

interface LocalFileBrowserProps {
	pairedPort: number;
	onCancel: () => void;
	onFilePushed?: (filename: string) => void;
}

export const LocalFileBrowser: React.FC<LocalFileBrowserProps> = ({
	pairedPort,
	onCancel,
	onFilePushed,
}) => {
	const [items, setItems] = useState<FileItem[]>([]);
	const [currentPath, setCurrentPath] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [pushing, setPushing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadDirectory = async (path: string) => {
		setLoading(true);
		setError(null);

		try {
			const basePath = process.cwd();
			const targetPath = path ? join(basePath, path) : basePath;

			// Security check
			if (!targetPath.startsWith(basePath)) {
				throw new Error('Access denied');
			}

			const dirItems = await readdir(targetPath);
			const itemDetails = await Promise.all(
				dirItems
					// Filter out hidden files/folders
					.filter(item => !item.startsWith('.'))
					.map(async item => {
						try {
							const itemPath = join(targetPath, item);
							const stats = await stat(itemPath);
							return {
								name: item,
								type: stats.isDirectory() ? ('directory' as const) : ('file' as const),
								size: stats.size,
							};
						} catch {
							return null;
						}
					}),
			);

			// Filter and sort
			const validItems = itemDetails
				.filter((item): item is FileItem => item !== null)
				.sort((a, b) => {
					if (a.type === b.type) return a.name.localeCompare(b.name);
					return a.type === 'directory' ? -1 : 1;
				});

			setItems(validItems);
			setCurrentPath(path);
			setSelectedIndex(0);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to load directory',
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDirectory('');
	}, []);

	const pushFile = async (filePath: string, fileName: string) => {
		setPushing(true);
		setError(null);

		try {
			const basePath = process.cwd();
			const fullPath = join(basePath, filePath);

			// Security check
			if (!fullPath.startsWith(basePath)) {
				throw new Error('Access denied');
			}

			const content = await readFile(fullPath, 'utf-8');

			// Push to paired instance
			const response = await fetch(
				`http://localhost:${pairedPort}/cupple/upload`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						filename: fileName,
						content: content,
					}),
				},
			);

			if (!response.ok) {
				throw new Error('Failed to push file');
			}

			// Notify parent component
			if (onFilePushed) {
				onFilePushed(fileName);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to push file');
		} finally {
			setPushing(false);
		}
	};

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}

		if (loading || pushing) return;

		if (key.upArrow) {
			setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
		} else if (key.downArrow) {
			setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
		} else if (key.return) {
			const selectedItem = items[selectedIndex];
			if (selectedItem && selectedItem.type === 'directory') {
				// Navigate into directory
				const newPath = currentPath
					? `${currentPath}/${selectedItem.name}`
					: selectedItem.name;
				loadDirectory(newPath);
			}
		} else if (input === 'p' || input === 'P') {
			// Push the selected file
			const selectedItem = items[selectedIndex];
			if (selectedItem && selectedItem.type === 'file') {
				const filePath = currentPath
					? `${currentPath}/${selectedItem.name}`
					: selectedItem.name;
				pushFile(filePath, selectedItem.name);
			}
		} else if (input === 'b' || input === 'B') {
			// Go back to parent directory
			if (currentPath) {
				const parentPath = currentPath.split('/').slice(0, -1).join('/');
				loadDirectory(parentPath);
			}
		}
	});

	if (loading) {
		return (
			<Box flexDirection="column">
				<Text color="#a855f7">Loading directory...</Text>
			</Box>
		);
	}

	if (pushing) {
		return (
			<Box flexDirection="column">
				<Text color="#a855f7">Pushing file...</Text>
			</Box>
		);
	}

	if (error) {
		return (
			<Box flexDirection="column">
				<Text color="#ef4444">Error: {error}</Text>
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
					📤 Push File to localhost:{pairedPort}
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text dimColor>
					Local Path: /{currentPath || 'root'}
				</Text>
			</Box>

			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor="#f9a8d4"
				paddingX={1}
				paddingY={0}
			>
				{items.length === 0 ? (
					<Text dimColor>Empty directory</Text>
				) : (
					items.map((item, index) => {
						const isFocused = index === selectedIndex;
						const icon = item.type === 'directory' ? '📁' : '📄';
						const prefix = isFocused ? '→ ' : '  ';

						return (
							<Box key={index} flexDirection="row">
								<Text
									color={isFocused ? '#ff69b4' : 'white'}
									bold={isFocused}
								>
									{prefix}{icon} {item.name}
								</Text>
							</Box>
						);
					})
				)}
			</Box>

			<Box marginTop={1}>
				<Text dimColor italic>
					↑/↓ Navigate • Enter Open folder • <Text color="#f9a8d4">P</Text>{' '}
					Push file • <Text color="#f9a8d4">B</Text> Back •{' '}
					<Text color="#f9a8d4">ESC</Text> Cancel
				</Text>
			</Box>
		</Box>
	);
};

