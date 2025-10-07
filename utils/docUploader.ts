import {readFile} from 'fs/promises';
import {basename} from 'path';
import {getAccessToken, getProfileId} from './globalConfig.js';
import {getCachedProjectMetadata} from './projectMetadata.js';
import {config} from 'dotenv';

// Load environment variables
config({path: '.env.local'});

export type UploadResult = {
	success: boolean;
	message?: string;
	documentId?: string;
	error?: string;
	needsAuth?: boolean; // True if user needs to login
};

type UploadResponse = {
	success: boolean;
	document?: {
		id: string;
		title: string;
		file_name: string;
	};
	message?: string;
};

/**
 * Upload a document to the Cupple server
 * @param filePath - Path to the markdown file to upload
 * @param category - Optional category for the document (defaults to 'guide')
 * @returns Upload result with success status and details
 */
export const uploadDocument = async (
	filePath: string,
	category: string = 'guide',
): Promise<UploadResult> => {
	try {
		// Step 1: Check if access token exists
		const accessToken = await getAccessToken();
		const profileId = await getProfileId();

		if (!accessToken) {
			return {
				success: false,
				error: 'No access token found. Please run /login first.',
				needsAuth: true,
			};
		}

		// Step 2: Get the API URL
		const apiUrl = process.env.CUPPLE_API;
		if (!apiUrl) {
			return {
				success: false,
				error: 'CUPPLE_API environment variable not found',
			};
		}

		// Step 3: Read the document from disk
		let fileContent: string;
		try {
			fileContent = await readFile(filePath, 'utf-8');
		} catch (error) {
			return {
				success: false,
				error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}

		// Step 4: Base64 encode the content
		const base64Content = Buffer.from(fileContent, 'utf-8').toString('base64');

		// Step 5: Extract file name and create title
		const fileName = basename(filePath);
		const title = fileName.replace(/\.(md|markdown)$/i, '').replace(/-/g, ' ');

		// Step 5.5: Get project metadata
		const projectMetadata = await getCachedProjectMetadata();

		// Step 6: POST to /api/cli/upload
		try {
			const response = await fetch(`${apiUrl}/api/cli/upload`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					title,
					file_name: fileName,
					file_content: base64Content,
					category,
					// Project identification fields
					project_name: projectMetadata.projectName,
					git_url: projectMetadata.gitUrl,
					git_repo: projectMetadata.gitRepo,
					git_branch: projectMetadata.gitBranch,
					project_path: projectMetadata.projectPath,
				}),
			});

			// Step 7: Handle errors
			if (response.status === 401) {
				return {
					success: false,
					error: 'Access token is invalid or expired. Please run /login again.',
					needsAuth: true,
				};
			}

			if (response.status === 400) {
				const errorData = await response.json().catch(() => ({}));
				return {
					success: false,
					error: `Invalid request: ${errorData.message || 'Missing required fields'}`,
				};
			}

			if (response.status === 500) {
				return {
					success: false,
					error: 'Server error. Please try again later.',
				};
			}

			if (!response.ok) {
				return {
					success: false,
					error: `Upload failed with status ${response.status}`,
				};
			}

			// Step 8: Parse success response
			const data: UploadResponse = await response.json();

			if (data.success) {
				return {
					success: true,
					message: `Document uploaded successfully: ${title}`,
					documentId: data.document?.id,
				};
			} else {
				return {
					success: false,
					error: data.message || 'Upload failed',
				};
			}
		} catch (fetchError) {
			// Network or fetch error
			return {
				success: false,
				error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
			};
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
};

/**
 * Check if the user is authenticated and ready to upload documents
 * @returns True if user has valid credentials
 */
export const canUploadDocuments = async (): Promise<boolean> => {
	const accessToken = await getAccessToken();
	const apiUrl = process.env.CUPPLE_API;
	return !!(accessToken && apiUrl);
};
