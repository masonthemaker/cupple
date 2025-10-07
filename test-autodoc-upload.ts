/**
 * Test file for validating autodoc + automatic upload integration
 * This file tests if both autodoc generation AND upload work together
 */

export type DocumentCategory = 'guide' | 'api' | 'tutorial' | 'reference';

export type DocumentMetadata = {
	id: string;
	title: string;
	category: DocumentCategory;
	author: string;
	createdAt: Date;
	updatedAt: Date;
	tags: string[];
	isPublished: boolean;
};

export type ProjectInfo = {
	name: string;
	gitRepo?: string;
	gitBranch?: string;
	description: string;
};

/**
 * Creates a new document metadata object
 * @param title - The document title
 * @param category - The category of the document
 * @param author - The author's name
 * @returns A new DocumentMetadata object
 */
export const createDocumentMetadata = (
	title: string,
	category: DocumentCategory,
	author: string,
): DocumentMetadata => {
	return {
		id: generateUniqueId(),
		title,
		category,
		author,
		createdAt: new Date(),
		updatedAt: new Date(),
		tags: [],
		isPublished: false,
	};
};

/**
 * Generates a unique identifier
 * @returns A unique ID string
 */
export const generateUniqueId = (): string => {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Validates a document title
 * @param title - The title to validate
 * @returns True if valid, false otherwise
 */
export const isValidTitle = (title: string): boolean => {
	if (!title || title.trim().length === 0) {
		return false;
	}
	
	if (title.length > 200) {
		return false;
	}
	
	return true;
};

/**
 * Sanitizes a document title for use in filenames
 * @param title - The title to sanitize
 * @returns A sanitized filename-safe string
 */
export const sanitizeTitleForFilename = (title: string): string => {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
};

/**
 * Adds tags to a document
 * @param metadata - The document metadata
 * @param tags - Tags to add
 * @returns Updated metadata
 */
export const addTags = (
	metadata: DocumentMetadata,
	tags: string[],
): DocumentMetadata => {
	const uniqueTags = [...new Set([...metadata.tags, ...tags])];
	return {
		...metadata,
		tags: uniqueTags,
		updatedAt: new Date(),
	};
};

/**
 * Publishes a document
 * @param metadata - The document metadata
 * @returns Updated metadata with published status
 */
export const publishDocument = (
	metadata: DocumentMetadata,
): DocumentMetadata => {
	return {
		...metadata,
		isPublished: true,
		updatedAt: new Date(),
	};
};

/**
 * Unpublishes a document
 * @param metadata - The document metadata
 * @returns Updated metadata with unpublished status
 */
export const unpublishDocument = (
	metadata: DocumentMetadata,
): DocumentMetadata => {
	return {
		...metadata,
		isPublished: false,
		updatedAt: new Date(),
	};
};

/**
 * Formats project information for display
 * @param project - The project info
 * @returns Formatted string
 */
export const formatProjectInfo = (project: ProjectInfo): string => {
	let info = project.name;
	
	if (project.gitRepo) {
		info += ` (${project.gitRepo})`;
	}
	
	if (project.gitBranch) {
		info += ` [${project.gitBranch}]`;
	}
	
	return info;
};

/**
 * Checks if a document belongs to a specific category
 * @param metadata - The document metadata
 * @param category - The category to check
 * @returns True if document is in the category
 */
export const isInCategory = (
	metadata: DocumentMetadata,
	category: DocumentCategory,
): boolean => {
	return metadata.category === category;
};

/**
 * Searches documents by tag
 * @param documents - Array of document metadata
 * @param tag - The tag to search for
 * @returns Filtered array of documents
 */
export const searchByTag = (
	documents: DocumentMetadata[],
	tag: string,
): DocumentMetadata[] => {
	return documents.filter(doc => doc.tags.includes(tag));
};

/**
 * Gets all published documents
 * @param documents - Array of document metadata
 * @returns Filtered array of published documents
 */
export const getPublishedDocuments = (
	documents: DocumentMetadata[],
): DocumentMetadata[] => {
	return documents.filter(doc => doc.isPublished);
};
