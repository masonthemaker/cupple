import express, {Express, Request, Response} from 'express';
import cors from 'cors';
import {Server} from 'http';
import {loadSettings, saveSettings} from '../utils/settings.js';
import type {PairedInstance} from '../utils/settings.js';
import {loadHistory, saveHistory} from '../utils/history.js';
import type {HistoryItem} from '../utils/history.js';

export type ServerInfo = {
	port: number;
	url: string;
};

export class CuppleServer {
	private app: Express;
	private server: Server | null = null;
	private port: number;

	constructor(port = 3456) {
		this.port = port;
		this.app = express();
		this.setupMiddleware();
		this.setupRoutes();
	}

	private setupMiddleware(): void {
		this.app.use(cors());
		this.app.use(express.json());
	}

	private setupRoutes(): void {
		// Cupple identity endpoint for pairing
		this.app.get('/cupple/info', (req: Request, res: Response) => {
			res.json({
				app: 'cupple',
				version: '2.0.0',
				port: this.port,
				projectPath: process.cwd(),
			});
		});

		// Unpairing endpoint - receives unpairing notifications from other instances
		this.app.post('/cupple/unpair', async (req: Request, res: Response) => {
			try {
				const {port} = req.body;

				if (!port) {
					res.status(400).json({error: 'Missing port'});
					return;
				}

				// Load current settings
				const settings = await loadSettings();
				if (!settings) {
					res.status(500).json({error: 'Settings not initialized'});
					return;
				}

				// Remove the paired instance
				const pairedInstances = settings.pairedInstances || [];
				const filteredInstances = pairedInstances.filter(
					(instance: PairedInstance) => instance.port !== port,
				);

				// Save updated settings
				await saveSettings({
					...settings,
					pairedInstances: filteredInstances,
				});

				// Add to history
				const currentHistory = await loadHistory();
				const historyItem: HistoryItem = {
					message: `💔 Unpaired from Cupple at localhost:${port}`,
					color: '#ec4899',
					timestamp: Date.now(),
				};
				await saveHistory([...currentHistory, historyItem]);

				res.json({
					success: true,
					message: 'Unpairing received',
				});
			} catch (error) {
				res.status(500).json({error: 'Failed to save unpairing'});
			}
		});

		// Pairing endpoint - receives pairing notifications from other instances
		this.app.post('/cupple/pair', async (req: Request, res: Response) => {
			try {
				const {port, url, projectPath} = req.body;

				if (!port || !url || !projectPath) {
					res.status(400).json({error: 'Missing required fields'});
					return;
				}

				// Load current settings
				const settings = await loadSettings();
				if (!settings) {
					res.status(500).json({error: 'Settings not initialized'});
					return;
				}

				// Save as pending pairing request (not auto-accept)
				await saveSettings({
					...settings,
					pendingPairingRequest: {
						port,
						url,
						projectPath,
						requestedAt: Date.now(),
					},
				});

				res.json({
					success: true,
					message: 'Pairing request sent',
					myPort: this.port,
					myUrl: `http://localhost:${this.port}`,
					myProjectPath: process.cwd(),
				});
			} catch (error) {
				res.status(500).json({error: 'Failed to save pairing request'});
			}
		});

		// Accept pairing endpoint
		this.app.post('/cupple/pair/accept', async (req: Request, res: Response) => {
			try {
				const {port} = req.body;

				if (!port) {
					res.status(400).json({error: 'Missing port'});
					return;
				}

				const settings = await loadSettings();
				if (!settings) {
					res.status(500).json({error: 'Settings not initialized'});
					return;
				}

				// Add to paired instances
				const pairedInstances = settings.pairedInstances || [];
				const existingIndex = pairedInstances.findIndex(
					(instance: PairedInstance) => instance.port === port,
				);

				const newPairing: PairedInstance = {
					port,
					url: `http://localhost:${port}`,
					projectPath: process.cwd(),
					pairedAt: Date.now(),
				};

				if (existingIndex === -1) {
					pairedInstances.push(newPairing);
				}

				await saveSettings({
					...settings,
					pairedInstances,
				});

				// Add to history
				const currentHistory = await loadHistory();
				const historyItem: HistoryItem = {
					message: `💕 Pairing accepted by localhost:${port}`,
					color: '#22c55e',
					timestamp: Date.now(),
				};
				await saveHistory([...currentHistory, historyItem]);

				res.json({
					success: true,
					myUrl: `http://localhost:${this.port}`,
					myProjectPath: process.cwd(),
				});
			} catch (error) {
				res.status(500).json({error: 'Failed to accept pairing'});
			}
		});

		// Decline pairing endpoint
		this.app.post('/cupple/pair/decline', async (req: Request, res: Response) => {
			try {
				const {port} = req.body;

				if (!port) {
					res.status(400).json({error: 'Missing port'});
					return;
				}

				// Add to history
				const currentHistory = await loadHistory();
				const historyItem: HistoryItem = {
					message: `💔 Pairing declined by localhost:${port}`,
					color: '#ef4444',
					timestamp: Date.now(),
				};
				await saveHistory([...currentHistory, historyItem]);

				res.json({success: true});
			} catch (error) {
				res.status(500).json({error: 'Failed to notify decline'});
			}
		});

		// Test endpoint
		this.app.get('/api/ping', (req: Request, res: Response) => {
			res.json({
				message: '💕 Cupple is running!',
				timestamp: new Date().toISOString(),
			});
		});

		// Health check
		this.app.get('/api/health', (req: Request, res: Response) => {
			res.json({status: 'healthy'});
		});

		// Browse files endpoint - list files and folders in a directory
		this.app.get('/cupple/browse', async (req: Request, res: Response) => {
			try {
				const {path: requestedPath} = req.query;
				const {readdir, stat} = await import('fs/promises');
				const {join: pathJoin} = await import('path');

				// Default to project root if no path specified
				const basePath = process.cwd();
				const targetPath = requestedPath
					? pathJoin(basePath, requestedPath as string)
					: basePath;

				// Security check: ensure path is within project directory
				if (!targetPath.startsWith(basePath)) {
					res.status(403).json({error: 'Access denied'});
					return;
				}

				const items = await readdir(targetPath);
				const itemDetails = await Promise.all(
					items
						// Filter out hidden files/folders (starting with .)
						.filter(item => !item.startsWith('.'))
						.map(async item => {
							try {
								const itemPath = pathJoin(targetPath, item);
								const stats = await stat(itemPath);
								return {
									name: item,
									type: stats.isDirectory() ? 'directory' : 'file',
									size: stats.size,
								};
							} catch (error) {
								return null;
							}
						}),
				);

				// Filter out null items (errors) and sort: directories first, then files
				const validItems = itemDetails
					.filter(item => item !== null)
					.sort((a, b) => {
						if (a!.type === b!.type) return a!.name.localeCompare(b!.name);
						return a!.type === 'directory' ? -1 : 1;
					});

				res.json({
					currentPath: requestedPath || '',
					items: validItems,
				});
			} catch (error) {
				res.status(500).json({error: 'Failed to browse directory'});
			}
		});

		// Download file endpoint - retrieve a specific file's content
		this.app.get('/cupple/download', async (req: Request, res: Response) => {
			try {
				const {path: requestedPath} = req.query;
				const {readFile} = await import('fs/promises');
				const {join: pathJoin} = await import('path');

				if (!requestedPath) {
					res.status(400).json({error: 'Missing path parameter'});
					return;
				}

				// Default to project root
				const basePath = process.cwd();
				const targetPath = pathJoin(basePath, requestedPath as string);

				// Security check: ensure path is within project directory
				if (!targetPath.startsWith(basePath)) {
					res.status(403).json({error: 'Access denied'});
					return;
				}

				// Read the file
				const content = await readFile(targetPath, 'utf-8');

				res.json({
					success: true,
					content,
					filename: requestedPath,
				});
			} catch (error) {
				res.status(500).json({error: 'Failed to download file'});
			}
		});

		// Upload file endpoint - receive a file from another instance
		this.app.post('/cupple/upload', async (req: Request, res: Response) => {
			try {
				const {filename, content} = req.body;
				const {writeFile, mkdir} = await import('fs/promises');
				const {join: pathJoin, basename: baseName} = await import('path');

				if (!filename || !content) {
					res.status(400).json({error: 'Missing filename or content'});
					return;
				}

				// Ensure docs folder exists
				const docsDir = pathJoin(process.cwd(), 'docs');
				await mkdir(docsDir, {recursive: true});

				// Save file to docs folder (use basename to prevent path traversal)
				const safeFilename = baseName(filename);
				const targetPath = pathJoin(docsDir, safeFilename);
				await writeFile(targetPath, content, 'utf-8');

				// Add to history
				const currentHistory = await loadHistory();
				const historyItem: HistoryItem = {
					message: `💕 Received file `,
					color: '#22c55e',
					filename: safeFilename,
					timestamp: Date.now(),
				};
				await saveHistory([...currentHistory, historyItem]);

				res.json({
					success: true,
					message: 'File uploaded successfully',
					path: `docs/${safeFilename}`,
				});
			} catch (error) {
				res.status(500).json({error: 'Failed to upload file'});
			}
		});
	}

	async start(): Promise<ServerInfo> {
		return new Promise((resolve, reject) => {
			const attemptStart = () => {
				// Close existing server if any
				if (this.server) {
					this.server.removeAllListeners();
					this.server.close();
				}

				this.server = this.app.listen(this.port);

				// Set up error handler BEFORE listening completes
				this.server.once('error', (error: NodeJS.ErrnoException) => {
					if (error.code === 'EADDRINUSE') {
						// Port is in use, try next one
						this.port++;
						attemptStart();
					} else {
						reject(error);
					}
				});

				// Set up success handler
				this.server.once('listening', () => {
					const info: ServerInfo = {
						port: this.port,
						url: `http://localhost:${this.port}`,
					};
					resolve(info);
				});
			};

			attemptStart();
		});
	}

	stop(): void {
		if (this.server) {
			this.server.close();
		}
	}
}
