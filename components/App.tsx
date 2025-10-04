import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import {mkdir} from 'fs/promises';
import {join, basename} from 'path';
import {watch, existsSync} from 'fs';
import {AnimatedTitle} from './AnimatedTitle.js';
import {HistoryDisplay} from './HistoryDisplay.js';
import {InputPrompt} from './InputPrompt.js';
import {SetupScreen} from './SetupScreen.js';
import {HelpScreen} from './HelpScreen.js';
import {FileSelector} from './FileSelector.js';
import {FileBrowser} from './FileBrowser.js';
import {LocalFileBrowser} from './LocalFileBrowser.js';
import {PairingRequest} from './PairingRequest.js';
import {
	FileWatcher,
	loadSettings,
	saveSettings,
	loadHistory,
	saveHistory,
	checkForUpdates,
} from '../utils/index.js';
import type {CuppleSettings, HistoryItem} from '../utils/index.js';
import {executeCommand, InitScreen} from '../commands/index.js';
import type {CommandContext} from '../commands/index.js';
import {CuppleServer} from '../api/index.js';
import type {ServerInfo} from '../api/index.js';
import {updateMarkdownForFile, AutodocController} from '../tools/index.js';
import type {FileSystemEvent} from '../utils/fileWatcher.js';

export const App: React.FC = () => {
	const [query, setQuery] = useState('');
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [settings, setSettings] = useState<CuppleSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
	const [showHelp, setShowHelp] = useState(false);
	const [showFileSelector, setShowFileSelector] = useState(false);
	const [showInit, setShowInit] = useState(false);
	const [browsePairedPort, setBrowsePairedPort] = useState<number | null>(null);
	const [pushToPairedPort, setPushToPairedPort] = useState<number | null>(null);
	const [, forceUpdate] = useState({});
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [latestVersion, setLatestVersion] = useState<string | undefined>();


	// Ensure .cupple folder exists, start server, and load settings
	useEffect(() => {
		const initialize = async () => {
			const cuppleDir = join(process.cwd(), '.cupple');
			try {
				await mkdir(cuppleDir, {recursive: true});
			} catch (error) {
				// Folder might already exist, which is fine
			}

		// Start server
		const server = new CuppleServer();
		const info = await server.start();
		setServerInfo(info);

		// Load settings
		const loadedSettings = await loadSettings();
		setSettings(loadedSettings);

		// Load history
		const loadedHistory = await loadHistory();
		
		// Check if /init has been run (indicated by extensionConfigs)
		if (loadedSettings?.apiKey && !loadedSettings.extensionConfigs) {
			// Add a warning message to history if /init hasn't been run
			const initWarning: HistoryItem = {
				message: '⚠️ - Please run /init to configure autodoc before getting started',
				color: '#f59e0b',
				timestamp: Date.now(),
			};
			
			// Only add if not already the most recent message
			const lastMessage = loadedHistory[loadedHistory.length - 1];
			if (!lastMessage || !lastMessage.message.includes('/init to configure')) {
				const updatedHistory = [...loadedHistory, initWarning];
				await saveHistory(updatedHistory);
				setHistory(updatedHistory);
			} else {
				setHistory(loadedHistory);
			}
		} else {
			setHistory(loadedHistory);
		}

		setIsLoading(false);
		
		// Check for updates in the background
		checkForUpdates().then(result => {
			if (result.hasUpdate) {
				setUpdateAvailable(true);
				setLatestVersion(result.latestVersion);
			}
		}).catch(() => {
			// Silently fail - don't interrupt the app
		});
		};

		initialize();
	}, []);
	
	const handleSetupComplete = async (
		mode: 'auto' | 'selector',
		apiKey: string,
	) => {
		const newSettings: CuppleSettings = {
			mode,
			apiKey,
		};
		await saveSettings(newSettings);
		setSettings(newSettings);
	};

	// Watch history.json for external changes (like API pairing notifications)
	useEffect(() => {
		const historyPath = join(process.cwd(), '.cupple', 'history.json');
		
		// Check if history file exists before watching
		if (!existsSync(historyPath)) {
			return; // Skip watching if file doesn't exist yet
		}
		
		const historyWatcher = watch(historyPath, async (eventType) => {
			if (eventType === 'change') {
				// Reload history when the file changes
				const updatedHistory = await loadHistory();
				setHistory(updatedHistory);
			}
		});

		return () => {
			historyWatcher.close();
		};
	}, []);

	// Watch settings for external changes (like API pairing/unpairing)
	useEffect(() => {
		const settingsPath = join(process.cwd(), '.cupple', 'cupplesettings.json');
		
		// Check if settings file exists before watching
		if (!existsSync(settingsPath)) {
			return; // Skip watching if file doesn't exist yet
		}
		
		const settingsWatcher = watch(settingsPath, async (eventType) => {
			if (eventType === 'change') {
				// Reload settings when the file changes
				const updatedSettings = await loadSettings();
				if (updatedSettings) {
					setSettings(updatedSettings);
				}
			}
		});

		return () => {
			settingsWatcher.close();
		};
	}, []);

	// Handle terminal resize - clear and re-render
	useEffect(() => {
		const handleResize = () => {
			// Clear the screen
			process.stdout.write('\x1Bc');
			// Force re-render
			forceUpdate({});
		};

		process.stdout.on('resize', handleResize);

		return () => {
			process.stdout.off('resize', handleResize);
		};
	}, []);

	useEffect(() => {
		// Don't start watcher until settings are loaded
		if (!settings) return;

		// Initialize autodoc controller if in auto mode and has API key
		let autodoc: AutodocController | null = null;
		let autodocCallback: ((event: FileSystemEvent) => void) | null = null;
		
		if (settings.mode === 'auto' && settings.apiKey) {
			const threshold = settings.autodocThreshold || 40; // Default to medium (40 lines)
			
			// Use new extensionConfigs if available, otherwise fallback to old format
			const extensionConfigs = settings.extensionConfigs || 
				(settings.autodocExtensions || ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go']).map(ext => ({
					extension: ext,
					detailLevel: settings.docDetailLevel || 'standard',
				}));
			
			autodoc = new AutodocController(
				settings.apiKey,
				{
					changeThreshold: threshold,
					generateOnCreate: false, // Don't generate immediately on create
					extensionConfigs,
				},
				async (result) => {
					// Handle autodoc results - add to history
					const currentHistory = await loadHistory();
					const item: HistoryItem = result.success
						? {
								message: `🤖 Auto-generated docs for `,
								color: '#a855f7',
								filename: basename(result.filePath),
								timestamp: Date.now(),
							}
						: {
								message: `✗ Auto-doc failed for ${basename(result.filePath)}: ${result.error}`,
								color: '#ef4444',
								timestamp: Date.now(),
							};
					
					await saveHistory([...currentHistory, item]);
					setHistory(await loadHistory());
				}
			);
			// Create the callback ONCE
			autodocCallback = autodoc.createWatcherCallback();
		}

		const watcher = new FileWatcher(process.cwd(), async event => {
			// Pass event to autodoc controller if in auto mode
			if (autodocCallback) {
				autodocCallback(event);
			}

			const currentHistory = await loadHistory();

			// For file modifications, check if we already have an entry for this file
			if (event.type === 'file_modified') {
				const existingIndex = currentHistory.findIndex(
					item =>
						item.filePath === event.path &&
						item.type === 'file_modified',
				);

				if (existingIndex !== -1) {
					// Update existing entry with cumulative line changes
					const existingItem = currentHistory[existingIndex];
					const newLinesAdded =
						(existingItem.linesAdded || 0) +
						(event.linesAdded || 0);
					const newLinesDeleted =
						(existingItem.linesDeleted || 0) +
						(event.linesDeleted || 0);
					const newLinesChanged = newLinesAdded + newLinesDeleted;

					currentHistory[existingIndex] = {
						...existingItem,
						linesChanged: newLinesChanged,
						linesAdded: newLinesAdded,
						linesDeleted: newLinesDeleted,
						timestamp: Date.now(),
					};

					await saveHistory(currentHistory);
					setHistory(currentHistory);
					return;
				}
			}

			// Create new entry
			let item: HistoryItem;

			switch (event.type) {
				case 'file_created':
					const createdLinesInfo =
						event.linesChanged !== undefined
							? ` (${event.linesChanged} ${event.linesChanged === 1 ? 'line' : 'lines'})`
							: '';
					item = {
						message: `💕 new file created${createdLinesInfo} `,
						color: '#ff69b4',
						filename: event.name,
						filePath: event.path,
						type: 'file_created',
						linesChanged: event.linesChanged,
						timestamp: Date.now(),
					};
					break;
				case 'file_modified':
					item = {
						message: `✓ file saved `,
						color: '#ec4899',
						filename: event.name,
						filePath: event.path,
						type: 'file_modified',
						linesChanged: event.linesChanged,
						linesAdded: event.linesAdded,
						linesDeleted: event.linesDeleted,
						timestamp: Date.now(),
					};
					break;
				case 'directory_created':
					item = {
						message: '💝 new directory created ',
						color: '#f9a8d4',
						filename: event.name,
						filePath: event.path,
						type: 'directory_created',
						timestamp: Date.now(),
					};
					break;
			}

			const updatedHistory = [...currentHistory, item];
			await saveHistory(updatedHistory);
			setHistory(updatedHistory);
		});

		watcher.start();

		return () => {
			watcher.stop();
		};
	}, [settings]);

	const handleSubmit = async (value: string) => {
		const trimmedValue = value.trim();

		if (!trimmedValue) return;

		// Handle /help command separately
		if (trimmedValue === '/help') {
			setShowHelp(true);
			setQuery('');
			return;
		}

		// Handle /select command for selector mode
		if (trimmedValue === '/select') {
			if (settings?.mode === 'selector') {
				setShowFileSelector(true);
				setQuery('');
				return;
			} else if (settings?.mode === 'auto') {
				// User tried to use /select in auto mode
				const currentHistory = await loadHistory();
				await saveHistory([
					...currentHistory,
					{
						message: '⚠ /select is only available in selector mode. Use /mode to switch modes.',
						color: '#f59e0b',
						timestamp: Date.now(),
					},
				]);
				setHistory(await loadHistory());
				setQuery('');
				return;
			}
		}

		// Check if it's a command
		if (trimmedValue.startsWith('/')) {
			const context: CommandContext = {
				settings: settings!,
				serverInfo: serverInfo || undefined,
				onSettingsUpdate: (newSettings: CuppleSettings) => {
					setSettings(newSettings);
				},
				onClearHistory: async () => {
					await saveHistory([]);
					setHistory([]);
				},
				onExit: () => {
					process.exit(0);
				},
			};

		const result = await executeCommand(trimmedValue, context);

		if (result) {
			// Special handling for /clear - don't add to history after clearing
			if (trimmedValue === '/clear') {
				// History was already cleared in the command
				setQuery('');
				return;
			}

			// Special handling for /browse - show file browser
			if (result.message.startsWith('browse:')) {
				const port = parseInt(result.message.split(':')[1], 10);
				setBrowsePairedPort(port);
				setQuery('');
				return;
			}

			// Special handling for /init - show init screen
			if (result.message === 'init:show') {
				setShowInit(true);
				setQuery('');
				return;
			}

			const currentHistory = await loadHistory();
			const newHistory = [
				...currentHistory,
				{
					message: result.message,
					color: result.color,
					timestamp: Date.now(),
				},
			];
			await saveHistory(newHistory);
			setHistory(newHistory);
		}

		setQuery('');
		return;
		}

		// Add to history for non-command input
		const newItem: HistoryItem = {
			message: `> ${trimmedValue}`,
			timestamp: Date.now(),
		};
		const updatedHistory = [...history, newItem];
		await saveHistory(updatedHistory);
		setHistory(updatedHistory);
		setQuery('');
	};

	// Show loading state
	if (isLoading) {
		return (
			<Box flexDirection="column">
				<AnimatedTitle title="Cupple" interval={200} />
				<Text dimColor>─────────────────────────────────────────</Text>
				<Text dimColor>
					Living docs that sync across IDEs and agents
				</Text>
				<Text dimColor>─────────────────────────────────────────</Text>
				<Text dimColor>Loading...</Text>
			</Box>
		);
	}

	// Show setup screen if no settings exist
	if (!settings) {
		return <SetupScreen onComplete={handleSetupComplete} />;
	}
	// Show help screen
	if (showHelp) {
		return (
			<HelpScreen
				onBack={() => setShowHelp(false)}
				serverUrl={serverInfo?.url}
			/>
		);
	}

	// Show init screen
	if (showInit) {
		const context: CommandContext = {
			settings: settings!,
			serverInfo: serverInfo || undefined,
			onSettingsUpdate: (newSettings: CuppleSettings) => {
				setSettings(newSettings);
			},
			onClearHistory: async () => {
				await saveHistory([]);
				setHistory([]);
			},
			onExit: () => {
				process.exit(0);
			},
		};

		return (
			<Box flexDirection="column">
				<Box>
					<AnimatedTitle title="Cupple" interval={200} />
					{serverInfo && (
						<Text color="#a855f7"> • {serverInfo.url}</Text>
					)}
				</Box>
				<Text dimColor>─────────────────────────────────────────</Text>
				<Text dimColor>
					Living docs that sync across IDEs and agents
				</Text>
				<Text dimColor>─────────────────────────────────────────</Text>
				<InitScreen
					context={context}
					onComplete={async result => {
						setShowInit(false);
						const currentHistory = await loadHistory();
						await saveHistory([...currentHistory, {
							message: result.message,
							color: result.color,
							timestamp: Date.now(),
						}]);
						setHistory(await loadHistory());
					}}
				/>
			</Box>
		);
	}

	// Main app
	const hasApiKey = settings.apiKey && settings.apiKey.length > 0;

	// Show file browser (remote files)
	if (browsePairedPort !== null) {
		return (
			<Box flexDirection="column">
				<Box>
					<AnimatedTitle title="Cupple" interval={200} />
					{serverInfo && (
						<Text color="#a855f7"> • {serverInfo.url}</Text>
					)}
					<Text color={hasApiKey ? '#22c55e' : '#ef4444'}>
						{' '}
						• API: {hasApiKey ? '✓' : '✗'}
					</Text>
				</Box>
				<Text dimColor>─────────────────────────────────────────</Text>
				<Text dimColor>
					Living docs that sync across IDEs and agents
				</Text>
				<Text dimColor>─────────────────────────────────────────</Text>
				<FileBrowser
					pairedPort={browsePairedPort}
					onCancel={() => setBrowsePairedPort(null)}
					onFileDownloaded={async (filename, localPath) => {
						// Add to history
						const currentHistory = await loadHistory();
						await saveHistory([
							...currentHistory,
							{
								message: `✓ Downloaded `,
								color: '#22c55e',
								filename: filename,
								timestamp: Date.now(),
							},
						]);
						setHistory(await loadHistory());
						
						// Close the browser
						setBrowsePairedPort(null);
					}}
					onPushRequested={() => {
						// Switch to local file browser for pushing
						setPushToPairedPort(browsePairedPort);
						setBrowsePairedPort(null);
					}}
				/>
			</Box>
		);
	}

	// Show local file browser for pushing
	if (pushToPairedPort !== null) {
		return (
			<Box flexDirection="column">
				<Box>
					<AnimatedTitle title="Cupple" interval={200} />
					{serverInfo && (
						<Text color="#a855f7"> • {serverInfo.url}</Text>
					)}
					<Text color={hasApiKey ? '#22c55e' : '#ef4444'}>
						{' '}
						• API: {hasApiKey ? '✓' : '✗'}
					</Text>
				</Box>
				<Text dimColor>─────────────────────────────────────────</Text>
				<Text dimColor>
					Living docs that sync across IDEs and agents
				</Text>
				<Text dimColor>─────────────────────────────────────────</Text>
				<LocalFileBrowser
					pairedPort={pushToPairedPort}
					onCancel={() => setPushToPairedPort(null)}
					onFilePushed={async (filename) => {
						// Add to history
						const currentHistory = await loadHistory();
						await saveHistory([
							...currentHistory,
							{
								message: `✓ Pushed `,
								color: '#22c55e',
								filename: filename,
								timestamp: Date.now(),
							},
						]);
						setHistory(await loadHistory());
						
						// Close the browser
						setPushToPairedPort(null);
					}}
				/>
			</Box>
		);
	}

	// Show file selector (for selector mode)
	if (showFileSelector) {
		return (
			<Box flexDirection="column">
			<Box>
				<AnimatedTitle title="Cupple" interval={200} />
				{serverInfo && (
					<Text color="#a855f7"> • {serverInfo.url}</Text>
				)}
				<Text color={hasApiKey ? '#22c55e' : '#ef4444'}>
					{' '}
					• API: {hasApiKey ? '✓' : '✗'}
				</Text>
			</Box>
				<Text dimColor>─────────────────────────────────────────</Text>
				<Text dimColor>
					Living docs that sync across IDEs and agents
				</Text>
				<Text dimColor>─────────────────────────────────────────</Text>
				<FileSelector
					changedFiles={(() => {
						// Get unique files by filePath (keep the entry for each unique file)
						const fileMap = new Map<string, HistoryItem>();
						
						// Process history in order to build up the map
						for (const item of history) {
							if (
								(item.type === 'file_modified' || item.type === 'file_created') &&
								item.filename &&
								item.filePath
							) {
								fileMap.set(item.filePath, item);
							}
						}
						
						return Array.from(fileMap.values()).map(item => ({
							name: item.filename!,
							path: item.filePath!,
							linesAdded: item.linesAdded || 0,
							linesDeleted: item.linesDeleted || 0,
						}));
					})()}
					onFilesSelected={async files => {
						setShowFileSelector(false);
						
						const newItem: HistoryItem = {
							message: `✓ Generating markdown for ${files.length} file${files.length === 1 ? '' : 's'}...`,
							color: '#a855f7',
							timestamp: Date.now(),
						};
						const updatedHistory = [...history, newItem];
						await saveHistory(updatedHistory);
						setHistory(updatedHistory);

						const generationResults: HistoryItem[] = [];

					// Generate or update markdown for each selected file
					for (const filePath of files) {
						// Determine detail level based on file extension
						const match = filePath.match(/\.[^.]+$/);
						const ext = match ? match[0] : '';
						
						let detailLevel: 'brief' | 'standard' | 'comprehensive' = 'standard';
						if (settings!.extensionConfigs) {
							const config = settings!.extensionConfigs.find(c => c.extension === ext);
							detailLevel = config?.detailLevel || 'standard';
						} else {
							detailLevel = settings!.docDetailLevel || 'standard';
						}
						
						const result = await updateMarkdownForFile(
							filePath,
							settings!.apiKey!,
							detailLevel,
						);

							if (result.success) {
								const action = result.wasCreated ? 'Generated' : 'Updated';
								const successItem: HistoryItem = {
									message: `✓ ${action} guide for `,
									color: '#22c55e',
									filename: basename(filePath),
									timestamp: Date.now(),
								};
								generationResults.push(successItem);
							} else {
								const errorItem: HistoryItem = {
									message: `✗ Failed to update guide for ${basename(filePath)}: ${result.error}`,
									color: '#ef4444',
									timestamp: Date.now(),
								};
								generationResults.push(errorItem);
							}
						}

						// Clear file change history, keep only generation results
						const currentHistory = await loadHistory();
						const filteredHistory = currentHistory.filter(
							item => item.type !== 'file_modified' && item.type !== 'file_created' && item.type !== 'directory_created'
						);
						const finalHistory = [...filteredHistory, ...generationResults];
						await saveHistory(finalHistory);
						setHistory(finalHistory);
					}}
					onCancel={() => setShowFileSelector(false)}
				/>
			</Box>
		);
	}

	// Handle pairing request accept/decline
	const handleAcceptPairing = async () => {
		if (!settings?.pendingPairingRequest) return;

		const request = settings.pendingPairingRequest;

		// Add to paired instances
		const pairedInstances = settings.pairedInstances || [];
		pairedInstances.push({
			port: request.port,
			url: request.url,
			projectPath: request.projectPath,
			pairedAt: Date.now(),
		});

		await saveSettings({
			...settings,
			pairedInstances,
			pendingPairingRequest: null,
		});

		setSettings({
			...settings,
			pairedInstances,
			pendingPairingRequest: null,
		});

		// Create docs folder for receiving files
		const docsDir = join(process.cwd(), 'docs');
		try {
			await mkdir(docsDir, {recursive: true});
		} catch (error) {
			// Folder might already exist, which is fine
		}

		// Notify the other instance and get their info
		try {
			const response = await fetch(`http://localhost:${request.port}/cupple/pair/accept`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({port: serverInfo?.port}),
			});

			if (response.ok) {
				const data = await response.json();
				// Update our paired instance with their actual project path
				if (data.myProjectPath) {
					pairedInstances[pairedInstances.length - 1].projectPath = data.myProjectPath;
					await saveSettings({
						...settings,
						pairedInstances,
						pendingPairingRequest: null,
					});
				}
			}
		} catch (error) {
			// Ignore if they're offline
		}

		// Add to history
		const currentHistory = await loadHistory();
		await saveHistory([
			...currentHistory,
			{
				message: `✓ Accepted pairing with ${request.url}`,
				color: '#22c55e',
				timestamp: Date.now(),
			},
		]);
		setHistory(await loadHistory());
	};

	const handleDeclinePairing = async () => {
		if (!settings?.pendingPairingRequest) return;

		const request = settings.pendingPairingRequest;

		await saveSettings({
			...settings,
			pendingPairingRequest: null,
		});

		setSettings({
			...settings,
			pendingPairingRequest: null,
		});

		// Notify the other instance
		try {
			await fetch(`http://localhost:${request.port}/cupple/pair/decline`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({port: serverInfo?.port}),
			});
		} catch (error) {
			// Ignore if they're offline
		}

		// Add to history
		const currentHistory = await loadHistory();
		await saveHistory([
			...currentHistory,
			{
				message: `✗ Declined pairing request`,
				color: '#ef4444',
				timestamp: Date.now(),
			},
		]);
		setHistory(await loadHistory());
	};

	return (
		<Box flexDirection="column">
			<AnimatedTitle 
				title="Cupple" 
				interval={200} 
				serverUrl={serverInfo?.url}
				hasApiKey={!!hasApiKey}
				updateAvailable={updateAvailable}
				latestVersion={latestVersion}
			/>
			<Text dimColor>─────────────────────────────────────────</Text>
			<Text dimColor>
				Living docs that sync across IDEs and agents
			</Text>
			<Text dimColor>─────────────────────────────────────────</Text>
			{settings?.pendingPairingRequest && (
				<PairingRequest
					port={settings.pendingPairingRequest.port}
					url={settings.pendingPairingRequest.url}
					projectPath={settings.pendingPairingRequest.projectPath}
					onAccept={handleAcceptPairing}
					onDecline={handleDeclinePairing}
				/>
			)}
			<HistoryDisplay history={history} />
			<InputPrompt
				value={query}
				onChange={setQuery}
				onSubmit={handleSubmit}
				mode={settings.mode}
			/>
		</Box>
	);
};

