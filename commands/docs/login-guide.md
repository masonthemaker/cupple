# /login Command Guide

## Overview

The `/login` command authenticates your Cupple CLI with the Cupple web application, enabling access to cloud features and synchronized settings.

## Usage

```bash
/login
```

## What It Does

1. **Creates CLI Session**: Initiates a secure authentication session with the Cupple backend
2. **Opens Browser**: Automatically opens your default browser to the authentication page
3. **Waits for Authentication**: Polls the server until you complete login/signup in the browser
4. **Saves Credentials**: Stores your access token securely in `.cupple/cupplesettings.json`

## Authentication Flow

### Step 1: Session Creation
The command creates a new CLI session by calling:
```
POST /api/cli/sessions/create
```

Response includes:
- `session_token`: Unique token for this login attempt
- `auth_url`: Browser URL for authentication (e.g., `https://cupple.com/cli-auth?session=abc123...`)
- `expires_at`: Session expiration time

### Step 2: Browser Authentication
The command opens your browser to the auth URL where you can:
- **Login** with existing credentials
- **Sign up** for a new account

After successful authentication in the browser, the frontend calls:
```
POST /api/cli/sessions/{token}/authenticate
```

### Step 3: Status Polling
While you authenticate in the browser, the CLI polls:
```
GET /api/cli/sessions/{token}/status
```

Every 3 seconds until:
- ✅ **Authenticated**: Returns access token and profile ID
- ❌ **Expired**: Session timeout (5 minutes)
- ⏳ **Pending**: Still waiting for authentication

### Step 4: Token Storage
Once authenticated, the command saves:
- `accessToken`: For API authentication
- `profileId`: Your user profile identifier

These are stored **globally** in your home directory with secure file permissions:
- **Windows**: `%USERPROFILE%\.cupple\global-config.json`
- **macOS/Linux**: `~/.cupple/global-config.json`

This means you only need to authenticate once, and all Cupple instances across all projects will use the same credentials.

## Requirements

### Environment Variable
The command requires `CUPPLE_API` to be set in your `.env.local` file:

```env
CUPPLE_API=https://cupple.com
```

Or for local development:
```env
CUPPLE_API=http://localhost:3000
```

### Settings File
Your project must have a `.cupple/cupplesettings.json` file (created by `/init`).

## Success Response

```
✓ Successfully authenticated with Cupple! Credentials saved globally for all projects.
```

The access token is now stored globally and will be used for authenticated API requests in all Cupple instances.

## Error Scenarios

### Missing Environment Variable
```
✗ CUPPLE_API environment variable not found. Please add it to your .env.local file
```

**Solution**: Create `.env.local` in your project root with `CUPPLE_API` set.

### Session Creation Failed
```
✗ Login failed: Failed to create session: [error]
```

**Solution**: Check that the Cupple API server is running and accessible.

### Authentication Timeout
```
✗ Authentication timeout. Please try again with /login
```

**Solution**: Complete authentication within 5 minutes, or run `/login` again.

### Session Expired
```
✗ Authentication session expired. Please try again with /login
```

**Solution**: Run `/login` again and complete authentication more quickly.

### Global Config Directory Error
If there are issues creating the global config directory, check permissions on your home directory.

## Security Features

1. **Global Storage**: Credentials are stored once in your home directory, not per-project
2. **Secure Token Storage**: Access tokens are stored with `0o600` permissions (owner read/write only)
3. **Session Expiration**: Auth sessions expire after 5 minutes if unused
4. **One-Time Use**: Session tokens can only be authenticated once
5. **Browser-Based Auth**: No password entry in the terminal

## Use Cases

### First Time Setup (Once Per Computer)
```bash
/login         # Authenticate with Cupple (only needed once)
```

### After Token Expiration
```bash
/login         # Re-authenticate
```

### Switching Accounts
```bash
/login         # Authenticate with different account
```

The new credentials will overwrite the previous ones globally.

### Using Multiple Projects
No need to authenticate again! Once authenticated, all Cupple instances across all projects will use the same credentials automatically.

## Implementation Details

### Polling Strategy
- **Interval**: 3 seconds between status checks
- **Timeout**: 5 minutes maximum wait time
- **Error Handling**: Continues polling on temporary network errors

### Platform Support
Browser opening supports:
- **Windows**: `start` command
- **macOS**: `open` command  
- **Linux**: `xdg-open` command

### Settings Integration
The command automatically:
- Updates the in-memory settings context
- Persists changes to disk
- Notifies the application of settings changes

## Related Commands

- `/status` - View current authentication status
- `/exit` - Exit the Cupple CLI

Note: `/login` does not require `/init` to be run first, as authentication is stored globally.

## API Endpoints Used

1. `POST /api/cli/sessions/create` - Create authentication session
2. `GET /api/cli/sessions/{token}/status` - Poll authentication status

Note: The frontend handles `POST /api/cli/sessions/{token}/authenticate` when you complete login in the browser.

## Example Session

```
> /login

🔐 Authentication Required
Opening browser to: https://cupple.com/cli-auth?session=abc123def456...
Waiting for authentication...

[Browser opens, user logs in]

✓ Successfully authenticated with Cupple! You can now use authenticated features.
```

## Troubleshooting

### Browser Doesn't Open
Manually navigate to the URL shown in the terminal.

### Authentication Completes but CLI Shows Timeout
Check network connectivity. The CLI polls the server every 3 seconds.

### Token Not Found in Other Projects
Make sure you've run `/login` at least once on your machine. The credentials are stored globally and should work across all projects.

### CUPPLE_API Not Found
Ensure `.env.local` exists in your project root with the correct API URL.
