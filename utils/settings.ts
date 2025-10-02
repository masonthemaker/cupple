import {readFile, writeFile, chmod} from 'fs/promises';
import {join} from 'path';

export type PairedInstance = {
	port: number;
	url: string;
	projectPath: string;
	pairedAt: number;
};

export type PendingPairingRequest = {
	port: number;
	url: string;
	projectPath: string;
	requestedAt: number;
};

export type CuppleSettings = {
	mode: 'auto' | 'selector';
	apiKey?: string;
	pairedInstances?: PairedInstance[];
	pendingPairingRequest?: PendingPairingRequest | null;
};

const getSettingsPath = (): string => {
	return join(process.cwd(), '.cupple', 'cupplesettings.json');
};

export const loadSettings = async (): Promise<CuppleSettings | null> => {
	try {
		const settingsPath = getSettingsPath();
		const data = await readFile(settingsPath, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		return null;
	}
};

export const saveSettings = async (settings: CuppleSettings): Promise<void> => {
	const settingsPath = getSettingsPath();
	await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
	
	// Set restrictive permissions (owner read/write only) for security
	try {
		await chmod(settingsPath, 0o600);
	} catch (error) {
		// Ignore if chmod fails (Windows compatibility)
	}
};

export const validateApiKey = (key: string): boolean => {
	// Basic validation: ensure key has minimum length
	return key.length >= 10;
};

