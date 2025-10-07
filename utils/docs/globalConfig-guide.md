# Global Config Utility Guide

## Overview

The `globalConfig` utility manages user-level settings stored in the user's home directory. Unlike project-specific settings in `.cupple/cupplesettings.json`, global config is shared across all Cupple instances on the same machine.

## Purpose

Global configuration is used for:
- **Authentication credentials**: Access tokens and profile IDs from the Cupple web app
- **User-level preferences**: Settings that should persist across all projects

## Storage Location

### Windows
```
%USERPROFILE%\.cupple\global-config.json
```
Example: `C:\Users\YourName\.cupple\global-config.json`

### macOS / Linux
```
~/.cupple/global-config.json
```
Example: `/home/username/.cupple/global-config.json`

## Data Structure

```typescript
type GlobalConfig = {
	accessToken?: string;  // Authentication token from Cupple web app
	profileId?: string;    // User profile ID
};
```

## API Functions

### `loadGlobalConfig(): Promise<GlobalConfig>`

Loads the global configuration from disk.

**Returns**: GlobalConfig object (empty object if file doesn't exist)

**Usage**:
```typescript
import {loadGlobalConfig} from './utils/globalConfig.js';

const config = await loadGlobalConfig();
if (config.accessToken) {
	console.log('User is authenticated');
}
```

### `saveGlobalConfig(config: GlobalConfig): Promise<void>`

Saves the global configuration to disk.

**Parameters**:
- `config`: GlobalConfig object to save

**Features**:
- Automatically creates `~/.cupple/` directory if it doesn't exist
- Sets file permissions to `0o600` (owner read/write only) for security
- Formats JSON with 2-space indentation

**Usage**:
```typescript
import {saveGlobalConfig} from './utils/globalConfig.js';

await saveGlobalConfig({
	accessToken: 'abc123...',
	profileId: 'user-uuid'
});
```

### `getAccessToken(): Promise<string | undefined>`

Convenience function to retrieve just the access token.

**Returns**: Access token string or undefined if not set

**Usage**:
```typescript
import {getAccessToken} from './utils/globalConfig.js';

const token = await getAccessToken();
if (token) {
	// Make authenticated API request
	fetch('/api/endpoint', {
		headers: { 'Authorization': `Bearer ${token}` }
	});
}
```

### `getProfileId(): Promise<string | undefined>`

Convenience function to retrieve just the profile ID.

**Returns**: Profile ID string or undefined if not set

**Usage**:
```typescript
import {getProfileId} from './utils/globalConfig.js';

const profileId = await getProfileId();
console.log(`Current user: ${profileId}`);
```

### `clearAuth(): Promise<void>`

Removes authentication credentials from global config (logout).

**Usage**:
```typescript
import {clearAuth} from './utils/globalConfig.js';

await clearAuth();
console.log('User logged out');
```

## Security Features

### File Permissions
The global config file is created with `0o600` permissions on Unix-like systems:
- Owner: read + write
- Group: no access
- Others: no access

On Windows, the `chmod` call is silently ignored (not supported).

### No Project Contamination
Authentication credentials are stored globally, separate from project files:
- Never committed to git
- Not shared when project is moved/copied
- Consistent across all projects on the same machine

## Error Handling

### File Not Found
If the global config file doesn't exist, `loadGlobalConfig()` returns an empty object `{}`.

### Directory Creation Failure
If `~/.cupple/` cannot be created, `saveGlobalConfig()` will throw an error. This typically indicates:
- Insufficient permissions on home directory
- Disk full
- Invalid home directory path

### Permission Errors
If file permissions cannot be set (Windows or permission issues), the error is silently caught. The file is still created, just without restricted permissions.

## Use Cases

### Authentication Flow
```typescript
// After user authenticates in browser
import {saveGlobalConfig} from './utils/globalConfig.js';

await saveGlobalConfig({
	accessToken: responseData.access_token,
	profileId: responseData.profile_id
});
```

### API Requests
```typescript
// Making authenticated API calls
import {getAccessToken} from './utils/globalConfig.js';

const token = await getAccessToken();
if (!token) {
	console.log('Please run /login to authenticate');
	return;
}

const response = await fetch(`${apiUrl}/api/protected`, {
	headers: { 'Authorization': `Bearer ${token}` }
});
```

### Logout
```typescript
// User runs /logout command
import {clearAuth} from './utils/globalConfig.js';

await clearAuth();
console.log('✓ Logged out successfully');
```

## Comparison: Global Config vs Project Settings

| Feature | Global Config | Project Settings |
|---------|---------------|------------------|
| **Location** | `~/.cupple/` | `.cupple/` in project |
| **Scope** | All projects | Single project |
| **Use Case** | User authentication | Project configuration |
| **Examples** | Access tokens, profile ID | Mode, API key, autodoc settings |
| **Shared** | Across all projects | Not shared |
| **Git** | Never in repo | `.gitignore` recommended |

## Implementation Notes

### Why Global Storage?
Authentication credentials should be stored globally because:
1. **User Experience**: Authenticate once, use everywhere
2. **Security**: Reduces token duplication across projects
3. **Consistency**: Same user identity across all Cupple instances
4. **Simplicity**: No need to re-authenticate for each project

### Migration Path
If authentication was previously stored in project settings (deprecated):
```typescript
// Load old project settings
const projectSettings = await loadSettings();
if (projectSettings.accessToken) {
	// Migrate to global config
	await saveGlobalConfig({
		accessToken: projectSettings.accessToken,
		profileId: projectSettings.profileId
	});
	
	// Remove from project settings
	delete projectSettings.accessToken;
	delete projectSettings.profileId;
	await saveSettings(projectSettings);
}
```

## Related Files

- `utils/settings.ts` - Project-specific settings
- `commands/login.ts` - Uses `saveGlobalConfig()` after authentication
- Future `/logout` command - Would use `clearAuth()`

## Future Enhancements

Potential additions to global config:
- User preferences (default modes, themes)
- Recently used projects
- Cloud sync settings
- Update check preferences
