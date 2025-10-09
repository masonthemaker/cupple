import {readFile, writeFile} from 'fs/promises';
import {join} from 'path';

export type HistoryItem = {
	message: string;
	color?: string;
	filename?: string;
	filePath?: string;
	type?: 'file_created' | 'file_modified' | 'directory_created';
	linesChanged?: number;
	linesAdded?: number;
	linesDeleted?: number;
	timestamp?: number;
	loading?: boolean; // Shows spinner when true
};

const getHistoryPath = (): string => {
	return join(process.cwd(), '.cupple', 'history.json');
};

export const loadHistory = async (): Promise<HistoryItem[]> => {
	try {
		const historyPath = getHistoryPath();
		const data = await readFile(historyPath, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		// If file doesn't exist or is invalid, return empty array
		return [];
	}
};

export const saveHistory = async (history: HistoryItem[]): Promise<void> => {
	try {
		const historyPath = getHistoryPath();
		await writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');
	} catch (error) {
		console.error('Failed to save history:', error);
	}
};

export const addHistoryItem = async (item: HistoryItem): Promise<void> => {
	const history = await loadHistory();
	const itemWithTimestamp = {
		...item,
		timestamp: Date.now(),
	};
	history.push(itemWithTimestamp);
	await saveHistory(history);
};

export const clearHistory = async (): Promise<void> => {
	await saveHistory([]);
};

