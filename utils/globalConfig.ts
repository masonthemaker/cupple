import {readFile, writeFile, chmod, mkdir} from 'fs/promises';
import {join} from 'path';
import {homedir} from 'os';

export type GlobalConfig = {
	accessToken?: string;
	profileId?: string;
};

/**
 * Get the path to the global Cupple config directory in the user's home directory
 * - Windows: %USERPROFILE%\.cupple\
 * - macOS/Linux: ~/.cupple/
 */
const getGlobalConfigDir = (): string => {
	return join(homedir(), '.cupple');
};

/**
 * Get the path to the global config file
 */
const getGlobalConfigPath = (): string => {
	return join(getGlobalConfigDir(), 'global-config.json');
};

/**
 * Ensure the global config directory exists
 */
const ensureGlobalConfigDir = async (): Promise<void> => {
	const configDir = getGlobalConfigDir();
	await mkdir(configDir, {recursive: true});
};

/**
 * Load global configuration (authentication, user-level settings)
 */
export const loadGlobalConfig = async (): Promise<GlobalConfig> => {
	try {
		const configPath = getGlobalConfigPath();
		const data = await readFile(configPath, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		// Return empty config if file doesn't exist
		return {};
	}
};

/**
 * Save global configuration (authentication, user-level settings)
 */
export const saveGlobalConfig = async (config: GlobalConfig): Promise<void> => {
	await ensureGlobalConfigDir();
	const configPath = getGlobalConfigPath();
	await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
	
	// Set restrictive permissions (owner read/write only) for security
	try {
		await chmod(configPath, 0o600);
	} catch (error) {
		// Ignore if chmod fails (Windows compatibility)
	}
};

/**
 * Get the current access token from global config
 */
export const getAccessToken = async (): Promise<string | undefined> => {
	const config = await loadGlobalConfig();
	return config.accessToken;
};

/**
 * Get the current profile ID from global config
 */
export const getProfileId = async (): Promise<string | undefined> => {
	const config = await loadGlobalConfig();
	return config.profileId;
};

/**
 * Clear authentication from global config (logout)
 */
export const clearAuth = async (): Promise<void> => {
	const config = await loadGlobalConfig();
	delete config.accessToken;
	delete config.profileId;
	await saveGlobalConfig(config);
};
