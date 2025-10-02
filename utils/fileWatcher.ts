import * as fs from 'fs';
import * as path from 'path';

export type FileSystemEvent = {
	type: 'file_created' | 'file_modified' | 'directory_created';
	name: string;
	path: string;
	linesChanged?: number;
	linesAdded?: number;
	linesDeleted?: number;
};

export type FileWatcherCallback = (event: FileSystemEvent) => void;

export class FileWatcher {
	private watchers: fs.FSWatcher[] = [];
	private knownFiles: Set<string> = new Set();
	private knownDirs: Set<string> = new Set();
	private fileContents: Map<string, string> = new Map();
	private callback: FileWatcherCallback;
	private rootDir: string;

	constructor(directory: string, callback: FileWatcherCallback) {
		this.rootDir = directory;
		this.callback = callback;
	}

	async start(): Promise<void> {
		// Initialize known files and directories
		await this.scanDirectory(this.rootDir);
		// Start watching
		this.watchDirectory(this.rootDir);
	}

	private async scanDirectory(dir: string): Promise<void> {
		try {
			const entries = await fs.promises.readdir(dir, {withFileTypes: true});

			for (const entry of entries) {
				// Skip node_modules and hidden files/folders
				if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
					continue;
				}

				const fullPath = path.join(dir, entry.name);

				if (entry.isDirectory()) {
					this.knownDirs.add(fullPath);
					await this.scanDirectory(fullPath);
				} else {
					this.knownFiles.add(fullPath);
					// Store initial content for tracking changes
					try {
						const content = await fs.promises.readFile(
							fullPath,
							'utf-8',
						);
						this.fileContents.set(fullPath, content);
					} catch (error) {
						// Skip files we can't read (binary, etc.)
					}
				}
			}
		} catch (error) {
			// Ignore errors for directories we can't access
		}
	}

	private watchDirectory(dir: string): void {
		try {
			const watcher = fs.watch(
				dir,
				{recursive: true},
				async (eventType, filename) => {
					if (!filename) return;

					// Skip node_modules and hidden files
					if (
						filename.includes('node_modules') ||
						filename.startsWith('.')
					) {
						return;
					}

					const fullPath = path.join(dir, filename);

					try {
						const stats = await fs.promises.stat(fullPath);

						if (stats.isDirectory()) {
							if (!this.knownDirs.has(fullPath)) {
								this.knownDirs.add(fullPath);
								this.callback({
									type: 'directory_created',
									name: filename,
									path: fullPath,
								});
							}
						} else {
							const isNewFile = !this.knownFiles.has(fullPath);
							if (isNewFile) {
								this.knownFiles.add(fullPath);
								// Store initial content and count lines
								try {
									const content = await fs.promises.readFile(
										fullPath,
										'utf-8',
									);
									this.fileContents.set(fullPath, content);
									const lineCount = content.split('\n').length;

									this.callback({
										type: 'file_created',
										name: filename,
										path: fullPath,
										linesChanged: lineCount,
									});
								} catch (error) {
									// Skip files we can't read - send without line count
									this.callback({
										type: 'file_created',
										name: filename,
										path: fullPath,
									});
								}
							} else {
								// File was modified - calculate line changes
								try {
									const newContent = await fs.promises.readFile(
										fullPath,
										'utf-8',
									);
									const oldContent =
										this.fileContents.get(fullPath) || '';
									const diff = this.calculateLineChanges(
										oldContent,
										newContent,
									);

									// Update stored content
									this.fileContents.set(fullPath, newContent);

									this.callback({
										type: 'file_modified',
										name: filename,
										path: fullPath,
										linesChanged: diff.total,
										linesAdded: diff.added,
										linesDeleted: diff.deleted,
									});
								} catch (error) {
									// If we can't read the file, just send event without line count
									this.callback({
										type: 'file_modified',
										name: filename,
										path: fullPath,
									});
								}
							}
						}
					} catch (error) {
						// File might have been deleted immediately after creation
					}
				},
			);

			this.watchers.push(watcher);
		} catch (error) {
			// Ignore errors for directories we can't watch
		}
	}

	private calculateLineChanges(
		oldContent: string,
		newContent: string,
	): {total: number; added: number; deleted: number} {
		const oldLines = oldContent.split('\n');
		const newLines = newContent.split('\n');

		const oldLength = oldLines.length;
		const newLength = newLines.length;

		// Calculate net additions/deletions based on line count change
		let added = 0;
		let deleted = 0;

		if (newLength > oldLength) {
			// File grew - lines were added
			added = newLength - oldLength;
		} else if (oldLength > newLength) {
			// File shrank - lines were deleted
			deleted = oldLength - newLength;
		}

		// Count modified lines (lines at same index that differ)
		const minLength = Math.min(oldLength, newLength);
		let modified = 0;

		for (let i = 0; i < minLength; i++) {
			if (oldLines[i] !== newLines[i]) {
				modified++;
			}
		}

		// Total changes includes modifications plus net additions/deletions
		const total = modified + added + deleted;

		return {
			total,
			added,
			deleted,
		};
	}

	stop(): void {
		for (const watcher of this.watchers) {
			watcher.close();
		}
		this.watchers = [];
		this.knownFiles.clear();
		this.knownDirs.clear();
		this.fileContents.clear();
	}
}


