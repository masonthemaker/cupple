#!/usr/bin/env node
import {readFileSync, writeFileSync, chmodSync} from 'fs';
import {join} from 'path';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const indexPath = join(__dirname, '..', 'dist', 'index.js');

// Read the file
let content = readFileSync(indexPath, 'utf-8');

// Replace tsx shebang with node shebang
content = content.replace('#!/usr/bin/env tsx', '#!/usr/bin/env node');

// Write back
writeFileSync(indexPath, content, 'utf-8');

// Make executable
chmodSync(indexPath, 0o755);

console.log('✅ Fixed shebang and made executable');

