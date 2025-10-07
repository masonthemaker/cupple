# Project Identification for Document Uploads

## Overview

Every document uploaded to Cupple is now tagged with comprehensive project metadata, allowing you to:

- 📂 Distinguish between `navbar-guide.md` from different projects
- 🔗 Link docs to their source repository
- 🌿 Track which branch the docs came from
- 📊 Organize docs by project on the frontend

## What Gets Sent

When uploading a document, Cupple automatically includes:

```json
{
  "title": "navbar guide",
  "file_name": "navbar-guide.md",
  "file_content": "base64-encoded-content",
  "category": "guide",
  
  // ⭐ Project identification fields
  "project_name": "cupple",
  "git_url": "https://github.com/masonthemaker/cupple.git",
  "git_repo": "masonthemaker/cupple",  // ← Primary identifier
  "git_branch": "beta",
  "project_path": "/Users/mason/ink"
}
```

## Primary Identifier: `git_repo`

**The `git_repo` field is the best identifier for projects:**

- Format: `owner/repository` (e.g., `masonthemaker/cupple`)
- Unique across all GitHub/GitLab/Bitbucket repositories
- Stable (doesn't change unless repo is renamed)
- Human-readable

### Frontend Usage Example

```typescript
// On your frontend, you can now filter/group docs by project:
const docs = await fetchUserDocs();

// Group by project
const docsByProject = docs.reduce((acc, doc) => {
  const key = doc.git_repo || doc.project_name;
  if (!acc[key]) acc[key] = [];
  acc[key].push(doc);
  return acc;
}, {});

// Result:
// {
//   "masonthemaker/cupple": [navbar-guide.md, App-guide.md, ...],
//   "masonthemaker/other-project": [navbar-guide.md, ...]
// }
```

## Fallback Strategy

The system uses a waterfall approach to identify projects:

### 1. Git Remote URL (Best)
- **Source**: `git remote get-url origin`
- **Example**: `https://github.com/masonthemaker/cupple.git`
- **Reliability**: ⭐⭐⭐⭐⭐
- **Handles**: HTTPS and SSH formats
  - `https://github.com/owner/repo.git`
  - `git@github.com:owner/repo.git`

### 2. Package.json Name
- **Source**: `package.json` → `name` field
- **Example**: `cupple`
- **Reliability**: ⭐⭐⭐⭐
- **Best for**: Node.js projects

### 3. Directory Name (Fallback)
- **Source**: Current working directory basename
- **Example**: `ink` (from `/Users/mason/ink`)
- **Reliability**: ⭐⭐
- **Only used when**: No git repo and no package.json

## Supported Git Platforms

The URL parser supports all major git platforms:

- ✅ **GitHub**: `github.com/owner/repo`
- ✅ **GitLab**: `gitlab.com/owner/repo`
- ✅ **Bitbucket**: `bitbucket.org/owner/repo`
- ✅ **Self-hosted**: Any git remote URL

## Branch Tracking

The `git_branch` field tells you which branch the docs were generated from:

```json
{
  "git_repo": "masonthemaker/cupple",
  "git_branch": "beta"
}
```

This is useful for:
- Tracking docs from feature branches
- Separating staging vs production docs
- Knowing which branch to update when code changes

## Performance & Caching

**Metadata is cached for 1 minute** to avoid repeated git calls:

```typescript
// First call: Executes git commands
const metadata1 = await getCachedProjectMetadata();

// Subsequent calls within 1 minute: Returns cached data
const metadata2 = await getCachedProjectMetadata(); // Instant!
```

This means:
- Fast uploads (no repeated git calls)
- No performance impact on autodoc
- Automatically refreshes after 1 minute

## Database Schema Suggestion

For your backend/database, we recommend storing:

```sql
CREATE TABLE user_documents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_content TEXT NOT NULL,
  category TEXT,
  
  -- Project identification
  project_name TEXT NOT NULL,
  git_url TEXT,
  git_repo TEXT,           -- INDEX this for fast lookups!
  git_branch TEXT,
  project_path TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Important indexes
CREATE INDEX idx_user_documents_git_repo ON user_documents(user_id, git_repo);
CREATE INDEX idx_user_documents_project_name ON user_documents(user_id, project_name);
```

## Frontend Display Examples

### Option 1: Group by Repository

```
Your Documentation

📦 masonthemaker/cupple (main)
  - App-guide.md
  - navbar-guide.md
  - updateMD-guide.md

📦 masonthemaker/other-project (develop)
  - navbar-guide.md
  - utils-guide.md
```

### Option 2: Search/Filter

```
Search: "navbar"

Results:
  ├─ navbar-guide.md (masonthemaker/cupple)
  └─ navbar-guide.md (masonthemaker/other-project)
```

### Option 3: Project Selector

```
[Project: masonthemaker/cupple ▼]

Showing 12 documents for masonthemaker/cupple:
- App-guide.md
- navbar-guide.md
- ...
```

## Handling Edge Cases

### No Git Repository

If the project isn't a git repo:
```json
{
  "project_name": "my-local-project",
  "git_url": null,
  "git_repo": null,
  "git_branch": null,
  "project_path": "/Users/mason/my-local-project"
}
```

**Frontend handling**: Use `project_name` as fallback identifier.

### Monorepo Projects

For monorepos, all packages will share the same `git_repo`:
```json
{
  "git_repo": "company/monorepo",
  "project_path": "/Users/mason/monorepo/packages/api"
}
```

**Recommendation**: Use `project_path` to differentiate between packages.

### Git Repo Renamed

If a user renames their GitHub repo:
- Old docs: `oldowner/oldrepo`
- New docs: `newowner/newrepo`

**Frontend handling**: Consider adding a "merge projects" feature.

## API Response Structure

When your backend returns documents, include the project fields:

```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "title": "navbar guide",
      "file_name": "navbar-guide.md",
      "project_name": "cupple",
      "git_repo": "masonthemaker/cupple",
      "git_branch": "beta",
      "git_url": "https://github.com/masonthemaker/cupple.git",
      "created_at": "2025-10-07T10:30:00Z"
    }
  ]
}
```

## Testing

You can test metadata extraction:

```bash
node -e "import('./dist/utils/projectMetadata.js').then(m => m.getProjectMetadata().then(console.log))"
```

Output:
```json
{
  "projectName": "cupple",
  "gitUrl": "https://github.com/masonthemaker/cupple.git",
  "gitRepo": "masonthemaker/cupple",
  "gitOwner": "masonthemaker",
  "gitRepoName": "cupple",
  "gitBranch": "beta",
  "projectPath": "/Users/mason/ink"
}
```

## Summary

✅ **Best Practices:**
1. Use `git_repo` as the primary project identifier
2. Fallback to `project_name` for non-git projects
3. Use `git_branch` to separate feature branch docs
4. Index `git_repo` in your database for fast queries
5. Show repository name in UI for clarity

✅ **What Makes This Reliable:**
- Git remote URLs are stable and unique
- Handles all git URL formats (HTTPS, SSH)
- Caches metadata for performance
- Multiple fallback strategies
- Works with all git platforms

Now your frontend can easily differentiate between:
- `navbar-guide.md` from `masonthemaker/cupple`
- `navbar-guide.md` from `masonthemaker/other-project`
- `navbar-guide.md` from `company/internal-tool`

All with a simple check: `doc.git_repo`! 🎉
