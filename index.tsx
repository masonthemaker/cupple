#!/usr/bin/env tsx
import React from 'react';
import {render} from 'ink';
import {App} from './components/index.js';

// Use stdin/stdout with proper TTY handling
const {stdin, stdout} = process;

render(<App />, {
	stdin,
	stdout,
	exitOnCtrlC: true,
	patchConsole: false,
});
