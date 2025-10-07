import {readFile} from 'fs/promises';
import {join, basename} from 'path';
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

export type ProjectMetadata = {
	projectName: string; // From package.json or directory name
	gitUrl?: string; // Full git remote URL
	gitRepo?: string; // e.g., "masonthemaker/cupple"
	gitOwner?: string; // e.g., "masonthemaker"
	gitRepoName?: string; // e.g., "cupple"
	gitBranch?: string; // Current git branch
	projectPath: string; // Full path to project directory
};

/**
 * Get git remote URL for the current project
 */
const getGitRemoteUrl = async (): Promise<string | undefined> => {
	try {
		const {stdout} = await execAsync('git remote get-url origin');
		return stdout.trim();
	} catch {
		return undefined;
	}
};

/**
 * Get current git branch
 */
const getGitBranch = async (): Promise<string | undefined> => {
	try {
		const {stdout} = await execAsync('git rev-parse --abbrev-ref HEAD');
		return stdout.trim();
	} catch {
		return undefined;
	}
};

/**
 * Parse GitHub/GitLab/Bitbucket repository info from git URL
 * Handles both HTTPS and SSH formats:
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 */
const parseGitUrl = (gitUrl: string): {
	owner?: string;
	repoName?: string;
	fullRepo?: string;
} => {
	try {
		// Remove trailing .git if present
		const cleanUrl = gitUrl.replace(/\.git$/, '');
		
		// Handle SSH format: git@github.com:owner/repo
		if (cleanUrl.includes('@')) {
			const match = cleanUrl.match(/[@:]([^/:]+)\/([^/:]+)$/);
			if (match) {
				const owner = match[1];
				const repoName = match[2];
				return {
					owner,
					repoName,
					fullRepo: `${owner}/${repoName}`,
				};
			}
		}
		
		// Handle HTTPS format: https://github.com/owner/repo
		const match = cleanUrl.match(/\/([^/]+)\/([^/]+)$/);
		if (match) {
			const owner = match[1];
			const repoName = match[2];
			return {
				owner,
				repoName,
				fullRepo: `${owner}/${repoName}`,
			};
		}
		
		return {};
	} catch {
		return {};
	}
};

/**
 * Get project name from package.json
 */
const getPackageJsonName = async (): Promise<string | undefined> => {
	try {
		const packageJsonPath = join(process.cwd(), 'package.json');
		const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
		const packageJson = JSON.parse(packageJsonContent);
		return packageJson.name;
	} catch {
		return undefined;
	}
};

/**
 * Get comprehensive project metadata
 * Tries multiple sources to build a complete picture
 */
export const getProjectMetadata = async (): Promise<ProjectMetadata> => {
	const projectPath = process.cwd();
	
	// Try to get git information
	const gitUrl = await getGitRemoteUrl();
	const gitBranch = await getGitBranch();
	
	// Parse git URL if available
	const gitInfo = gitUrl ? parseGitUrl(gitUrl) : {};
	
	// Try to get package.json name
	const packageName = await getPackageJsonName();
	
	// Fallback to directory name if no package.json
	const directoryName = basename(projectPath);
	
	// Determine best project name (prefer package.json, then git repo, then directory)
	const projectName = packageName || gitInfo.repoName || directoryName;
	
	return {
		projectName,
		gitUrl,
		gitRepo: gitInfo.fullRepo,
		gitOwner: gitInfo.owner,
		gitRepoName: gitInfo.repoName,
		gitBranch,
		projectPath,
	};
};

/**
 * Get a unique project identifier
 * Returns the most unique identifier available (git repo > package name > directory)
 */
export const getProjectIdentifier = async (): Promise<string> => {
	const metadata = await getProjectMetadata();
	
	// Best case: git repo with branch
	if (metadata.gitRepo && metadata.gitBranch) {
		return `${metadata.gitRepo}@${metadata.gitBranch}`;
	}
	
	// Good case: git repo
	if (metadata.gitRepo) {
		return metadata.gitRepo;
	}
	
	// Fallback: project name
	return metadata.projectName;
};

/**
 * Cache for project metadata (to avoid repeated git calls)
 */
let cachedMetadata: ProjectMetadata | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get project metadata with caching
 */
export const getCachedProjectMetadata = async (): Promise<ProjectMetadata> => {
	const now = Date.now();
	
	if (cachedMetadata && (now - cacheTime) < CACHE_TTL) {
		return cachedMetadata;
	}
	
	cachedMetadata = await getProjectMetadata();
	cacheTime = now;
	return cachedMetadata;
};
