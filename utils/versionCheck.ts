import {readFileSync} from 'fs';
import {join} from 'path';

export type VersionCheckResult = {
	hasUpdate: boolean;
	currentVersion: string;
	latestVersion: string;
};

const getCurrentVersion = (): string => {
	try {
		const packageJsonPath = join(process.cwd(), 'package.json');
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
		return packageJson.version || '1.0.0';
	} catch (error) {
		return '1.0.0';
	}
};

const compareVersions = (current: string, latest: string): boolean => {
	const currentParts = current.split('.').map(Number);
	const latestParts = latest.split('.').map(Number);

	for (let i = 0; i < 3; i++) {
		if (latestParts[i] > currentParts[i]) return true;
		if (latestParts[i] < currentParts[i]) return false;
	}
	return false;
};

export const checkForUpdates = async (): Promise<VersionCheckResult> => {
	const currentVersion = getCurrentVersion();

	try {
		const response = await fetch('https://registry.npmjs.org/cupple/latest', {
			headers: {
				'Accept': 'application/json',
			},
		});

		if (!response.ok) {
			return {
				hasUpdate: false,
				currentVersion,
				latestVersion: currentVersion,
			};
		}

		const data = await response.json();
		const latestVersion = data.version;

		return {
			hasUpdate: compareVersions(currentVersion, latestVersion),
			currentVersion,
			latestVersion,
		};
	} catch (error) {
		// Fail silently - don't interrupt the app if version check fails
		return {
			hasUpdate: false,
			currentVersion,
			latestVersion: currentVersion,
		};
	}
};

