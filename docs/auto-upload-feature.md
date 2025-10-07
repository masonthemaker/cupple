# Automatic Document Upload Feature

## Overview

When you generate or update documentation using Cupple, the docs are now automatically uploaded to the Cupple server. This allows you to:

- 📚 Store your documentation in the cloud
- 🔄 Keep all your docs synchronized
- 🤝 Share documentation with your team
- 📊 Track documentation changes

## How It Works

### When Docs Are Uploaded

Documentation is automatically uploaded in the following scenarios:

1. **Auto-documentation (Auto Mode)**: When autodoc generates or updates docs based on code changes
2. **Manual documentation (`/redoc` command)**: When you manually regenerate docs for a file

### What Gets Uploaded

- **File name**: The markdown filename (e.g., `App-guide.md`)
- **Title**: Auto-generated from the filename (e.g., "App guide")
- **Content**: Base64-encoded markdown content
- **Category**: Defaults to "guide"

### Server Storage

The server handles all the details:
- ✅ Validates your access token
- ✅ Gets your profile ID from the token
- ✅ Uploads the file to Supabase Storage at `userdocs/{profile_id}/{timestamp}-{filename}`
- ✅ Saves metadata to the database
- ✅ Logs the action for analytics
- ✅ Returns the document details

## Prerequisites

### 1. Authentication Required

Before docs can be uploaded, you need to authenticate with Cupple:

```bash
# In Cupple CLI
/login
```

This will:
1. Open your browser to authenticate
2. Save your access token to `~/.cupple/global-config.json`
3. Enable automatic uploads for all your projects

### 2. Environment Configuration

Make sure you have `CUPPLE_API` set in your `.env.local`:

```bash
CUPPLE_API=https://your-cupple-api-url.com
```

## Usage

### Auto Mode (Automatic Upload)

When in auto mode, docs are uploaded automatically when generated:

```bash
# Example workflow
/mode auto          # Switch to auto mode
/auto medium        # Set threshold to 40 lines

# Now edit your code...
# When 40+ lines change, autodoc will:
# 1. Generate/update documentation
# 2. Automatically upload it to the server
# 3. Show success message: "✅ Documentation generated and uploaded for YourFile.tsx"
```

### Manual Upload (via /redoc)

You can manually regenerate and upload docs:

```bash
/redoc components/App.tsx

# Response: "✓ Updated documentation for App.tsx and uploaded to server"
```

## Upload Status Messages

### Success Messages

- **Full success**: `✓ Updated documentation for App.tsx and uploaded to server`
- **Generated (auto mode)**: `✅ Documentation generated and uploaded for App.tsx`

### When Upload Fails

- **Not authenticated**: `(not uploaded - run /login to enable auto-upload)`
- **Upload error**: `(upload failed: [error message])`
- **Generated but not uploaded**: `✅ Documentation generated (upload failed) for App.tsx`

### Common Upload Errors

1. **401 Unauthorized**
   - Your access token is invalid or expired
   - Solution: Run `/login` again to re-authenticate

2. **400 Bad Request**
   - Missing required fields or invalid data
   - This is usually a bug - please report it

3. **500 Server Error**
   - Could be a storage issue or network problem
   - The system will retry automatically on next doc generation

## Disabling Auto-Upload

Upload is automatic when you're authenticated. To disable:

```bash
/logout
```

This removes your access token, and docs will no longer be uploaded (but still generated locally).

## Privacy & Security

- Your access token is stored securely with restrictive permissions (0600) in `~/.cupple/global-config.json`
- Only authenticated users can upload docs
- Each user's docs are stored in their own folder: `userdocs/{profile_id}/`
- Docs are private and only accessible to your account

## Technical Details

### Upload Process

1. **Check authentication**: Verify access token exists in global config
2. **Read document**: Load the generated markdown file from disk
3. **Encode content**: Convert to base64 for transmission
4. **POST request**: Send to `/api/cli/upload` with:
   - Authorization header: `Bearer {access_token}`
   - JSON body: `{title, file_name, file_content, category}`
5. **Handle response**: Update UI with success/error message

### Files Modified

- `/utils/docUploader.ts` - New utility for uploading documents
- `/utils/globalConfig.ts` - Stores access token and profile ID
- `/tools/updateMD.ts` - Updated to auto-upload after generation
- `/tools/autodoc.ts` - Passes upload status to callbacks
- `/commands/redoc.ts` - Shows upload status in response
- `/components/App.tsx` - Displays upload status in history

## Troubleshooting

### "No access token found"

Run `/login` to authenticate with Cupple.

### "CUPPLE_API environment variable not found"

Add `CUPPLE_API` to your `.env.local` file in your project root.

### Docs generated but not uploaded

Check your network connection and ensure the API URL is correct. The docs are still saved locally even if upload fails.

### Upload works for manual `/redoc` but not for autodoc

Both use the same upload mechanism. If one works, the other should too. Try restarting Cupple if you recently logged in.

## API Endpoint

### POST /api/cli/upload

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "App guide",
  "file_name": "App-guide.md",
  "file_content": "base64-encoded-content",
  "category": "guide"
}
```

**Response (Success):**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "title": "App guide",
    "file_name": "App-guide.md"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Future Enhancements

Planned features:
- 📥 Download/sync docs from server
- 🔍 Search uploaded docs from CLI
- 🗑️ Delete old/unused docs
- 📊 View upload history and statistics
- 👥 Share docs with team members
