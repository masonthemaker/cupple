import {FileSystemEvent, FileWatcherCallback} from '../utils/fileWatcher.js';
import type {ExtensionConfig, DocDetailLevel} from '../utils/settings.js';
import {updateMarkdownForFile} from './updateMD.js';
import {basename} from 'path';

// Re-export for consumers of AutodocConfig
export type {ExtensionConfig, DocDetailLevel};

export type AutodocConfig = {
	// Threshold for lines changed before triggering auto-generation
	changeThreshold: number;
	// Whether to generate docs for new files immediately
	generateOnCreate: boolean;
	// File extensions to watch (e.g., ['.ts', '.tsx', '.js', '.jsx'])
	// DEPRECATED: Use extensionConfigs instead
	fileExtensions?: string[];
	// Per-extension documentation configurations
	extensionConfigs?: ExtensionConfig[];
	// Directories to exclude (e.g., ['node_modules', 'dist', '.cupple'])
	excludeDirs?: string[];
	// Cooldown period in milliseconds (default: 30 seconds)
	cooldownMs?: number;
	// Debounce delay in milliseconds - waits for changes to stop before generating (default: 20 seconds)
	debounceMs?: number;
	// DEPRECATED: Use extensionConfigs instead
	docDetailLevel?: DocDetailLevel;
};

export type AutodocResult = {
	filePath: string;
	success: boolean;
	outputPath?: string;
	error?: string;
};

export type AutodocCallback = (result: AutodocResult) => void;

export class AutodocController {
	private config: AutodocConfig;
	private apiKey: string;
	private callback: AutodocCallback;
	// Track cumulative changes per file
	private fileChanges: Map<string, number> = new Map();
	// Track which files have been documented
	private documentedFiles: Set<string> = new Set();
	// Track last documentation time per file for cooldown
	private lastDocumentedTime: Map<string, number> = new Map();
	// Track pending documentation timers per file for debouncing
	private pendingTimers: Map<string, NodeJS.Timeout> = new Map();
	// Cooldown period in milliseconds (default: 30 seconds)
	private cooldownMs: number;
	// Debounce delay in milliseconds (default: 20 seconds)
	private debounceMs: number;
	// Map of extensions to their detail levels for quick lookup
	private extensionDetailMap: Map<string, DocDetailLevel> = new Map();

	constructor(
		apiKey: string,
		config: AutodocConfig,
		callback: AutodocCallback,
	) {
		this.apiKey = apiKey;
		this.config = config;
		this.callback = callback;
		this.cooldownMs = config.cooldownMs || 30000; // Default 30 seconds
		this.debounceMs = config.debounceMs || 20000; // Default 20 seconds
		
		// Build extension to detail level map
		if (config.extensionConfigs) {
			config.extensionConfigs.forEach(cfg => {
				this.extensionDetailMap.set(cfg.extension, cfg.detailLevel);
			});
		} else {
			// Fallback to old config format
			const defaultDetail = config.docDetailLevel || 'standard';
			const extensions = config.fileExtensions || ['.ts', '.tsx', '.js', '.jsx'];
			extensions.forEach(ext => {
				this.extensionDetailMap.set(ext, defaultDetail);
			});
		}
	}
	
	/**
	 * Get the detail level for a file based on its extension
	 */
	private getDetailLevelForFile(filePath: string): DocDetailLevel {
		// Find the extension
		const match = filePath.match(/\.[^.]+$/);
		if (!match) return 'standard';
		
		const ext = match[0];
		return this.extensionDetailMap.get(ext) || 'standard';
	}

	/**
	 * Create a FileWatcher callback that processes events for auto-documentation
	 */
	createWatcherCallback(): FileWatcherCallback {
		return async (event: FileSystemEvent) => {
			// Skip directories
			if (event.type === 'directory_created') {
				return;
			}

			// Check if file should be excluded
			if (this.shouldExclude(event.path)) {
				return;
			}

			// Handle file creation
			if (event.type === 'file_created') {
				if (this.config.generateOnCreate) {
					await this.generateDocumentation(event.path, event.linesChanged || 0);
				} else if (event.linesChanged) {
					// Track initial lines for threshold checking
					this.fileChanges.set(event.path, event.linesChanged);
				}
				return;
			}

			// Handle file modification
			if (event.type === 'file_modified') {
				const currentChanges = this.fileChanges.get(event.path) || 0;
				const totalChanges = currentChanges + (event.linesChanged || 0);
				
				// Update cumulative changes
				this.fileChanges.set(event.path, totalChanges);

				// Check if threshold is reached
				if (totalChanges >= this.config.changeThreshold) {
					// Check if we already have a pending timer for this file
					const existingTimer = this.pendingTimers.get(event.path);
					
					if (existingTimer) {
						// Clear the existing timer and restart debounce
						clearTimeout(existingTimer);
					}

					// Only create a new timer if not in cooldown
					if (!this.isInCooldown(event.path)) {
						// Start a new debounce timer
						const timer = setTimeout(async () => {
							// Remove the timer from tracking first
							this.pendingTimers.delete(event.path);
							
							// Double-check cooldown before generating (in case it was set by another timer)
							if (!this.isInCooldown(event.path)) {
								// Set cooldown BEFORE starting generation to prevent race conditions
								this.lastDocumentedTime.set(event.path, Date.now());
								
								// Get the current accumulated changes
								const finalChanges = this.fileChanges.get(event.path) || 0;
								// Generate documentation after debounce period
								await this.generateDocumentation(event.path, finalChanges);
								// Reset the change counter after generating
								this.fileChanges.set(event.path, 0);
							}
						}, this.debounceMs);

						// Track the timer
						this.pendingTimers.set(event.path, timer);
					}
					// If in cooldown, keep accumulating changes but don't create timers
				}
			}
		};
	}

	/**
	 * Check if a file is in cooldown period
	 */
	private isInCooldown(filePath: string): boolean {
		const lastTime = this.lastDocumentedTime.get(filePath);
		if (!lastTime) return false;
		
		const now = Date.now();
		const timeSinceLastDoc = now - lastTime;
		return timeSinceLastDoc < this.cooldownMs;
	}

	/**
	 * Generate or update documentation for a file
	 * Uses updateMarkdownForFile which intelligently updates existing docs or creates new ones
	 */
	private async generateDocumentation(
		filePath: string,
		linesChanged: number,
	): Promise<void> {
		try {
			const detailLevel = this.getDetailLevelForFile(filePath);
			const result = await updateMarkdownForFile(
				filePath,
				this.apiKey,
				detailLevel,
			);
			
			if (result.success) {
				this.documentedFiles.add(filePath);
				// Note: Cooldown is already set before this method is called
				
				this.callback({
					filePath,
					success: true,
					outputPath: result.outputPath,
				});
			} else {
				this.callback({
					filePath,
					success: false,
					error: result.error,
				});
			}
		} catch (error) {
			this.callback({
				filePath,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Check if a file should be excluded from auto-documentation
	 */
	private shouldExclude(filePath: string): boolean {
		// Check excluded directories
		const excludeDirs = this.config.excludeDirs || [
			'node_modules',
			'dist',
			'.cupple',
			'.git',
			'docs',
		];
		
		for (const dir of excludeDirs) {
			if (filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`)) {
				return true;
			}
		}

		// Skip markdown files (don't generate docs for docs)
		if (filePath.endsWith('.md')) {
			return true;
		}

		// Check if file extension is configured for documentation
		const match = filePath.match(/\.[^.]+$/);
		if (!match) {
			return true; // No extension, skip
		}
		
		const ext = match[0];
		if (!this.extensionDetailMap.has(ext)) {
			return true; // Extension not configured, skip
		}

		return false;
	}

	/**
	 * Manually trigger documentation generation for a specific file
	 */
	async documentFile(filePath: string): Promise<void> {
		if (this.shouldExclude(filePath)) {
			this.callback({
				filePath,
				success: false,
				error: 'File is excluded from auto-documentation',
			});
			return;
		}

		const changes = this.fileChanges.get(filePath) || 0;
		await this.generateDocumentation(filePath, changes);
	}

	/**
	 * Reset change tracking for a specific file
	 */
	resetFileTracking(filePath: string): void {
		this.fileChanges.delete(filePath);
		this.lastDocumentedTime.delete(filePath);
		
		// Clear any pending timer
		const timer = this.pendingTimers.get(filePath);
		if (timer) {
			clearTimeout(timer);
			this.pendingTimers.delete(filePath);
		}
	}

	/**
	 * Get current change count for a file
	 */
	getFileChanges(filePath: string): number {
		return this.fileChanges.get(filePath) || 0;
	}

	/**
	 * Check if a file has been documented
	 */
	isFileDocumented(filePath: string): boolean {
		return this.documentedFiles.has(filePath);
	}

	/**
	 * Clear all tracking data
	 */
	reset(): void {
		// Clear all pending timers
		for (const timer of this.pendingTimers.values()) {
			clearTimeout(timer);
		}
		
		this.fileChanges.clear();
		this.documentedFiles.clear();
		this.lastDocumentedTime.clear();
		this.pendingTimers.clear();
	}
}

