export {FileWatcher} from './fileWatcher.js';
export type {FileSystemEvent, FileWatcherCallback} from './fileWatcher.js';
export {loadSettings, saveSettings, validateApiKey} from './settings.js';
export type {CuppleSettings, PairedInstance, PendingPairingRequest, ExtensionConfig, DocDetailLevel} from './settings.js';
export {loadHistory, saveHistory, addHistoryItem, clearHistory} from './history.js';
export type {HistoryItem} from './history.js';
export {checkForUpdates} from './versionCheck.js';
export type {VersionCheckResult} from './versionCheck.js';
export {loadGlobalConfig, saveGlobalConfig, getAccessToken, getProfileId, clearAuth} from './globalConfig.js';
export type {GlobalConfig} from './globalConfig.js';

