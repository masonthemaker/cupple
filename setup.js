#!/usr/bin/env node
import {mkdir} from 'fs/promises';
import {join} from 'path';

// Use INIT_CWD (npm/yarn sets this to the directory where npm install was run)
// Fallback to current working directory
const projectRoot = process.env.INIT_CWD || process.cwd();
const cuppleDir = join(projectRoot, '.cupple');

try {
	await mkdir(cuppleDir, {recursive: true});
	console.log('✨ .cupple folder created successfully!');
} catch (error) {
	console.error('Error creating .cupple folder:', error);
}

