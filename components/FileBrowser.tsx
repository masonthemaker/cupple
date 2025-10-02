import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {join} from 'path';
import {writeFile, mkdir} from 'fs/promises';

interface FileItem {
	name: string;
	type: 'file' | 'directory';
	size: number;
}

interface FileBrowserProps {
	pairedPort: number;
	onCancel: () => void;
	onFileDownloaded?: (filename: string, localPath: string) => void;
	onPushRequested?: () => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
	pairedPort,
	onCancel,
	onFileDownloaded,
	onPushRequested,
}) => {
	const [items, setItems] = useState<FileItem[]>([]);
	const [currentPath, setCurrentPath] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [downloading, setDownloading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadDirectory = async (path: string) => {
		setLoading(true);
		setError(null);

		try {
			const queryPath = path ? `?path=${encodeURIComponent(path)}` : '';
			const response = await fetch(
				`http://localhost:${pairedPort}/cupple/browse${queryPath}`,
			);

			if (!response.ok) {
				throw new Error('Failed to fetch directory');
			}

		const data = await response.json();
		setItems(data.items || []);
			setCurrentPath(data.currentPath || '');
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
	}, [pairedPort]);

	const downloadFile = async (filePath: string, fileName: string) => {
		setDownloading(true);
		setError(null);

		try {
			const queryPath = `?path=${encodeURIComponent(filePath)}`;
			const response = await fetch(
				`http://localhost:${pairedPort}/cupple/download${queryPath}`,
			);

			if (!response.ok) {
				throw new Error('Failed to download file');
			}

			const data = await response.json();

			// Ensure docs folder exists
			const docsDir = join(process.cwd(), 'docs');
			await mkdir(docsDir, {recursive: true});

			// Save file to docs folder
			const localPath = join(docsDir, fileName);
			await writeFile(localPath, data.content, 'utf-8');

			// Notify parent component
			if (onFileDownloaded) {
				onFileDownloaded(fileName, localPath);
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to download file',
			);
		} finally {
			setDownloading(false);
		}
	};


	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}

		if (loading || downloading) return;

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
		} else if (input === 'd' || input === 'D') {
			// Download the selected file
			const selectedItem = items[selectedIndex];
			if (selectedItem && selectedItem.type === 'file') {
				const filePath = currentPath
					? `${currentPath}/${selectedItem.name}`
					: selectedItem.name;
				downloadFile(filePath, selectedItem.name);
			}
		} else if (input === 'p' || input === 'P') {
			// Request to push a local file
			if (onPushRequested) {
				onPushRequested();
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

	if (downloading) {
		return (
			<Box flexDirection="column">
				<Text color="#a855f7">Transferring file...</Text>
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
					📁 Browse Files on localhost:{pairedPort}
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text dimColor>
					Path: /{currentPath || 'root'}
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
				↑/↓ Navigate • Enter Open folder • <Text color="#f9a8d4">D</Text>{' '}
				Download • <Text color="#f9a8d4">P</Text> Push •{' '}
				<Text color="#f9a8d4">B</Text> Back • <Text color="#f9a8d4">ESC</Text>{' '}
				Exit
			</Text>
		</Box>
		</Box>
	);
};

