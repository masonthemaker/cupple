/**
 * Test file for validating the automatic document upload feature
 */

export type UserProfile = {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'user' | 'guest';
	createdAt: Date;
};

export type UploadConfig = {
	maxFileSize: number;
	allowedTypes: string[];
	autoUpload: boolean;
};

/**
 * Validates a user profile object
 * @param profile - The user profile to validate
 * @returns True if valid, false otherwise
 */
export const validateUserProfile = (profile: UserProfile): boolean => {
	if (!profile.id || !profile.name || !profile.email) {
		return false;
	}
	
	if (!['admin', 'user', 'guest'].includes(profile.role)) {
		return false;
	}
	
	return true;
};

/**
 * Creates a default upload configuration
 * @returns Default upload config
 */
export const createDefaultUploadConfig = (): UploadConfig => {
	return {
		maxFileSize: 10 * 1024 * 1024, // 10MB
		allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
		autoUpload: true,
	};
};

/**
 * Formats a user's display name
 * @param profile - The user profile
 * @returns Formatted display name
 */
export const formatDisplayName = (profile: UserProfile): string => {
	return `${profile.name} (${profile.role})`;
};

/**
 * Checks if a file size is within limits
 * @param fileSize - Size of the file in bytes
 * @param config - Upload configuration
 * @returns True if file size is acceptable
 */
export const isFileSizeValid = (fileSize: number, config: UploadConfig): boolean => {
	return fileSize <= config.maxFileSize;
};

/**
 * Checks if a file type is allowed
 * @param fileType - MIME type of the file
 * @param config - Upload configuration
 * @returns True if file type is allowed
 */
export const isFileTypeAllowed = (fileType: string, config: UploadConfig): boolean => {
	return config.allowedTypes.includes(fileType);
};
