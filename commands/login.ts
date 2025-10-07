import type {CommandResult, CommandContext} from './types.js';
import {exec} from 'child_process';
import {saveGlobalConfig} from '../utils/globalConfig.js';
import {config} from 'dotenv';

// Load environment variables
config({path: '.env.local'});

type SessionResponse = {
	session_token: string;
	auth_url: string;
	expires_at: string;
};

type StatusResponse = {
	status: 'pending' | 'authenticated' | 'expired';
	access_token?: string;
	profile_id?: string;
};

const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_TIME = 300000; // 5 minutes

export const handleLoginCommand = async (
	context: CommandContext,
): Promise<CommandResult> => {
	const apiUrl = process.env.CUPPLE_API;

	if (!apiUrl) {
		return {
			success: false,
			message: '✗ CUPPLE_API environment variable not found. Please add it to your .env.local file',
			color: '#ef4444',
		};
	}

	try {
		// Step 1: Create a new CLI session
		const sessionResponse = await fetch(`${apiUrl}/api/cli/sessions/create`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!sessionResponse.ok) {
			throw new Error(`Failed to create session: ${sessionResponse.statusText}`);
		}

		const sessionData: SessionResponse = await sessionResponse.json();
		const {session_token, auth_url} = sessionData;

		// Step 2: Open browser to auth URL
		const openCommand = process.platform === 'win32' 
			? `start ${auth_url}`
			: process.platform === 'darwin'
			? `open ${auth_url}`
			: `xdg-open ${auth_url}`;

		exec(openCommand, (error) => {
			if (error) {
				console.error('Failed to open browser:', error);
			}
		});

		console.log('\n🔐 Authentication Required');
		console.log(`Opening browser to: ${auth_url}`);
		console.log('Waiting for authentication...\n');

		// Step 3: Poll for authentication status
		const startTime = Date.now();
		
		while (Date.now() - startTime < MAX_POLL_TIME) {
			await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

			try {
				const statusResponse = await fetch(
					`${apiUrl}/api/cli/sessions/${session_token}/status`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);

				if (!statusResponse.ok) {
					throw new Error(`Failed to check status: ${statusResponse.statusText}`);
				}

				const statusData: StatusResponse = await statusResponse.json();

				if (statusData.status === 'authenticated' && statusData.access_token) {
					// Step 4: Save the access token to global config
					await saveGlobalConfig({
						accessToken: statusData.access_token,
						profileId: statusData.profile_id,
					});

					return {
						success: true,
						message: '✓ Successfully authenticated with Cupple! Credentials saved globally for all projects.',
						color: '#10b981',
					};
				} else if (statusData.status === 'expired') {
					return {
						success: false,
						message: '✗ Authentication session expired. Please try again with /login',
						color: '#ef4444',
					};
				}

				// Status is 'pending', continue polling
			} catch (pollError) {
				// Continue polling on temporary errors
				console.error('Poll error:', pollError);
			}
		}

		// Timeout reached
		return {
			success: false,
			message: '✗ Authentication timeout. Please try again with /login',
			color: '#ef4444',
		};

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			message: `✗ Login failed: ${errorMessage}`,
			color: '#ef4444',
		};
	}
};
