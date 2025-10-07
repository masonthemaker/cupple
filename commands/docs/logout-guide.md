# /logout Command Guide

## Overview

The `/logout` command removes your authentication credentials from the Cupple CLI, disconnecting all Cupple instances on your machine from the web app.

## Usage

```bash
/logout
```

No arguments required.

## What It Does

1. **Checks Authentication Status**: Verifies if you're currently logged in
2. **Removes Credentials**: Deletes `accessToken` and `profileId` from global config
3. **Confirms Logout**: Shows success message

## Storage Location

Credentials are removed from the global config file:
- **Windows**: `%USERPROFILE%\.cupple\global-config.json`
- **macOS/Linux**: `~/.cupple/global-config.json`

After logout, this file will be empty or the authentication fields will be removed.

## Success Response

```
✓ Logged out successfully. Authentication credentials removed from all projects.
```

All Cupple instances across all projects will no longer have access to authenticated features.

## Error Scenarios

### Not Currently Logged In

```
✗ Not currently logged in. Use /login to authenticate.
```

**Explanation**: No credentials found in global config. You're already logged out.

**Solution**: No action needed. Use `/login` if you want to authenticate.

### Logout Failed

```
✗ Logout failed: [error message]
```

**Explanation**: An error occurred while trying to clear the global config file.

**Possible causes**:
- File permission issues
- Disk errors
- Corrupted global config file

**Solution**: 
1. Check file permissions on `~/.cupple/global-config.json`
2. Manually delete the file if necessary
3. Check disk space and health

## Use Cases

### Switching Accounts

```bash
/logout        # Remove current credentials
/login         # Authenticate with different account
```

### Security - Shared Computer

```bash
/logout        # Remove credentials before leaving computer
```

Important for shared or public workstations.

### Troubleshooting Authentication Issues

```bash
/logout        # Clear potentially invalid tokens
/login         # Fresh authentication
```

If you're experiencing authentication errors, logging out and back in can resolve token issues.

### Removing Cupple Access

```bash
/logout        # Disconnect CLI from web app
```

If you no longer want the CLI connected to your Cupple web account, simply logout.

## What Happens After Logout

### Immediate Effects
- ✅ Authentication credentials removed from global config
- ✅ All Cupple instances lose web app access
- ✅ No more authenticated API requests possible

### What Remains Unaffected
- ✅ Project-specific settings (`.cupple/cupplesettings.json`)
- ✅ Local documentation continues to work
- ✅ Paired instances remain paired
- ✅ Autodoc and file watching continue normally
- ✅ All local features work as before

Logout **only** affects cloud/web app integration. All local Cupple features continue to work perfectly.

## Security Notes

### Global Logout
Logging out affects **all Cupple instances** on your machine, not just the current project.

### Server-Side Token
The `/logout` command only removes credentials locally. The token may still be valid on the server until it expires naturally.

For complete security on shared computers:
1. Run `/logout` in the CLI
2. Log out of the Cupple web app in your browser

### File Cleanup
The global config file remains after logout but without authentication fields:

**Before logout**:
```json
{
  "accessToken": "abc123...",
  "profileId": "user-uuid"
}
```

**After logout**:
```json
{}
```

## Implementation Details

The logout command uses the `clearAuth()` function from `utils/globalConfig.ts`:

```typescript
export const clearAuth = async (): Promise<void> => {
	const config = await loadGlobalConfig();
	delete config.accessToken;
	delete config.profileId;
	await saveGlobalConfig(config);
};
```

This ensures:
- Only authentication fields are removed
- Other potential global config fields remain intact
- File is properly saved with updated content

## Related Commands

- `/login` - Authenticate with Cupple web app
- `/status` - Check current authentication status (future enhancement)

## Comparison: Logout vs Exit

| Command | `/logout` | `/exit` |
|---------|-----------|---------|
| **Purpose** | Remove auth credentials | Close Cupple CLI |
| **Scope** | All projects on machine | Current instance only |
| **What it affects** | Authentication only | Entire CLI session |
| **After running** | CLI continues running | CLI terminates |
| **Reversible** | Yes (run `/login`) | Yes (restart Cupple) |

## Example Session

```
> /status
✓ Server: http://localhost:3000 • Mode: auto • Authenticated: Yes

> /logout
✓ Logged out successfully. Authentication credentials removed from all projects.

> /status
✓ Server: http://localhost:3000 • Mode: auto • Authenticated: No

> /login
🔐 Authentication Required
Opening browser to: https://cupple.com/cli-auth?session=xyz...

[After authenticating in browser]

✓ Successfully authenticated with Cupple! Credentials saved globally for all projects.
```

## Troubleshooting

### "Not currently logged in" but I was logged in before
The global config file may have been manually deleted or corrupted. Simply run `/login` again.

### Logout completes but other Cupple instances still authenticated
This shouldn't happen since global config is shared. Try:
1. Restart other Cupple instances
2. Check if they're reading from the same global config path
3. Verify only one `.cupple` folder exists in home directory

### Cannot delete global config file
Check file permissions:
```bash
# Unix/Mac
ls -la ~/.cupple/global-config.json
chmod 600 ~/.cupple/global-config.json

# Windows
icacls %USERPROFILE%\.cupple\global-config.json
```

### Want to completely remove Cupple authentication
```bash
# After running /logout, manually delete the folder:

# Unix/Mac
rm -rf ~/.cupple/

# Windows  
rmdir /s %USERPROFILE%\.cupple\
```

Note: This also removes global config and any other global Cupple data.

## Privacy & Data

### What's Deleted
- Access token (authentication credential)
- Profile ID (user identifier)

### What's NOT Deleted
- Project settings in `.cupple/cupplesettings.json`
- Documentation in `docs/` folders
- History in `.cupple/history.json`
- Any project-specific data

### Server-Side Data
Logout does NOT affect:
- Your Cupple web account
- Settings stored in the cloud
- Your project dashboard on cupple.com

To remove your account completely, you must do so through the Cupple web app.