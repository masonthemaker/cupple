# Backend Integration: CLI Document Upload

## Overview

The Cupple CLI now sends project metadata with every document upload. This guide explains what you'll receive and how to store it in Supabase.

---

## 📥 Request Format

### **Endpoint:** `POST /api/cli/upload`

### **Headers:**
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### **Request Body:**
```json
{
  "title": "navbar guide",
  "file_name": "navbar-guide.md",
  "file_content": "IyBOYXZiYXIgQ29tcG9uZW50Cg==",
  "category": "guide",
  
  "project_name": "cupple",
  "git_url": "https://github.com/masonthemaker/cupple.git",
  "git_repo": "masonthemaker/cupple",
  "git_branch": "beta",
  "project_path": "/Users/mason/ink"
}
```

---

## 📋 Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `title` | string | ✅ Yes | Document title | `"navbar guide"` |
| `file_name` | string | ✅ Yes | Original markdown filename | `"navbar-guide.md"` |
| `file_content` | string | ✅ Yes | Base64-encoded file content | `"IyBOYXZi..."` |
| `category` | string | ⚠️ Optional | Document category | `"guide"` |
| `project_name` | string | ✅ Yes | Project name (from package.json or directory) | `"cupple"` |
| `git_url` | string | ⚠️ Optional | Full git remote URL | `"https://github.com/user/repo.git"` |
| `git_repo` | string | ⚠️ Optional | Repository in `owner/repo` format (PRIMARY IDENTIFIER) | `"masonthemaker/cupple"` |
| `git_branch` | string | ⚠️ Optional | Current git branch | `"beta"` |
| `project_path` | string | ⚠️ Optional | User's local path (don't expose publicly) | `"/Users/mason/ink"` |

### **When Optional Fields Are `null`:**
- User's project isn't in a git repository
- User's project doesn't have a package.json
- Git commands failed on user's machine

---

## 🔧 Backend Implementation

### **Step 1: Validate the Request**

```typescript
// Verify access token
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// Parse body
const {
  title,
  file_name,
  file_content,
  category,
  project_name,
  git_url,
  git_repo,
  git_branch,
  project_path,
} = await request.json();

// Validate required fields
if (!title || !file_name || !file_content || !project_name) {
  return Response.json(
    { error: 'Missing required fields' },
    { status: 400 }
  );
}
```

### **Step 2: Decode Base64 Content**

```typescript
const decodedContent = Buffer.from(file_content, 'base64').toString('utf-8');
```

### **Step 3: Upload to Supabase Storage**

```typescript
const timestamp = Date.now();
const storageFileName = `${timestamp}-${file_name}`;
const storagePath = `userdocs/${user.id}/${storageFileName}`;

const { error: uploadError } = await supabase.storage
  .from('documents')  // Your storage bucket name
  .upload(storagePath, decodedContent, {
    contentType: 'text/markdown',
    upsert: true,
  });

if (uploadError) {
  return Response.json({ error: 'Storage upload failed' }, { status: 500 });
}
```

### **Step 4: Save Metadata to Database**

```typescript
const { data: document, error: dbError } = await supabase
  .from('userdocs')
  .insert({
    profile_id: user.id,
    title: title,
    file_path: storagePath,
    category: category || 'guide',
    
    // Project metadata
    project_name: project_name,
    git_url: git_url || null,
    git_repo: git_repo || null,
    git_branch: git_branch || null,
    project_path: project_path || null,
  })
  .select()
  .single();

if (dbError) {
  return Response.json({ error: 'Database insert failed' }, { status: 500 });
}
```

### **Step 5: Return Success Response**

```typescript
return Response.json({
  success: true,
  document: {
    id: document.id,
    title: document.title,
    file_name: file_name,
    project_name: document.project_name,
    git_repo: document.git_repo,
    created_at: document.created_at,
  },
});
```

---

## 🗄️ Database Schema

The `userdocs` table already has these columns:

```sql
CREATE TABLE public.userdocs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL UNIQUE,
  category TEXT,
  
  -- Project metadata (already added via migration)
  project_name TEXT NOT NULL,
  git_url TEXT,
  git_repo TEXT,
  git_branch TEXT,
  project_path TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_userdocs_git_repo ON userdocs(profile_id, git_repo);
CREATE INDEX idx_userdocs_project_name ON userdocs(profile_id, project_name);
```

---

## ⚠️ Important Notes

1. **`project_name` is always present** - It's the fallback identifier
2. **`git_repo` is the primary identifier** - Use this to group documents by project (format: `owner/repo`)
3. **Don't expose `project_path`** - It contains the user's local file system path (security concern)
4. **Optional fields can be `null`** - Always handle nullable values for `git_url`, `git_repo`, `git_branch`
5. **File content is Base64** - Must decode before storing

---

## 🧪 Test Request

```bash
curl -X POST https://your-api.com/api/cli/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "test guide",
    "file_name": "test-guide.md",
    "file_content": "IyBUZXN0IEd1aWRl",
    "category": "guide",
    "project_name": "my-project",
    "git_url": "https://github.com/user/repo.git",
    "git_repo": "user/repo",
    "git_branch": "main",
    "project_path": "/Users/user/project"
  }'
```

---

## ✅ Complete Handler Example

```typescript
export async function POST(request: Request) {
  try {
    // 1. Auth
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse & validate
    const body = await request.json();
    const {
      title, file_name, file_content, category,
      project_name, git_url, git_repo, git_branch, project_path
    } = body;
    
    if (!title || !file_name || !file_content || !project_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Decode content
    const decodedContent = Buffer.from(file_content, 'base64').toString('utf-8');

    // 4. Upload to storage
    const timestamp = Date.now();
    const storagePath = `userdocs/${user.id}/${timestamp}-${file_name}`;
    
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, decodedContent, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (storageError) throw storageError;

    // 5. Save to database
    const { data: document, error: dbError } = await supabase
      .from('userdocs')
      .insert({
        profile_id: user.id,
        title,
        file_path: storagePath,
        category: category || 'guide',
        project_name,
        git_url: git_url || null,
        git_repo: git_repo || null,
        git_branch: git_branch || null,
        project_path: project_path || null,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 6. Return success
    return Response.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        file_name,
        project_name: document.project_name,
        git_repo: document.git_repo,
        created_at: document.created_at,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Upload failed', message: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🎯 Summary

**What Changed:**
- CLI now sends 5 additional project metadata fields
- All fields are included in every upload request

**What You Need to Do:**
1. Accept the new fields in your API endpoint
2. Decode the Base64 `file_content`
3. Upload decoded content to Supabase Storage
4. Save all fields (including project metadata) to the `userdocs` table
5. Return success response with document details

**Database is already updated** - the migration added all required columns and indexes. You just need to update your API endpoint to accept and store the new fields.
