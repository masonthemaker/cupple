## 📄 test‑autodoc‑upload.ts  

**Purpose**  
A tiny library used in tests to verify that *autodoc generation* and *automatic upload* work together. It defines document‑related types and a handful of utility functions for creating, validating, and managing document metadata.

---

### 🔑 Types / Interfaces  

| Type | Description |
|------|-------------|
| `DocumentCategory` | Union of allowed categories: `'guide' | 'api' | 'tutorial' | 'reference'`. |
| `DocumentMetadata` | Core metadata for a document. <br>`id`, `title`, `category`, `author`, `createdAt`, `updatedAt`, `tags`, `isPublished`. |
| `ProjectInfo` | Basic project data. <br>`name`, optional `gitRepo`, optional `gitBranch`, `description`. |

---

### ⚙️ Functions (required parameters only)

| Function | Required Params | Returns |
|----------|----------------|---------|
| `createDocumentMetadata(title, category, author)` | `title: string`, `category: DocumentCategory`, `author: string` | `DocumentMetadata` |
| `generateUniqueId()` | *(none)* | `string` |
| `isValidTitle(title)` | `title: string` | `boolean` |
| `sanitizeTitleForFilename(title)` | `title: string` | `string` |
| `addTags(metadata, tags)` | `metadata: DocumentMetadata`, `tags: string[]` | `DocumentMetadata` |
| `publishDocument(metadata)` | `metadata: DocumentMetadata` | `DocumentMetadata` |
| `unpublishDocument(metadata)` | `metadata: DocumentMetadata` | `DocumentMetadata` |
| `formatProjectInfo(project)` | `project: ProjectInfo` | `string` |
| `isInCategory(metadata, category)` | `metadata: DocumentMetadata`, `category: DocumentCategory` | `boolean` |
| `searchByTag(documents, tag)` | `documents: DocumentMetadata[]`, `tag: string` | `DocumentMetadata[]` |
| `getPublishedDocuments(documents)` | `documents: DocumentMetadata[]` | `DocumentMetadata[]` |

---

### 💡 Basic Usage  

```ts
import {
  createDocumentMetadata,
  addTags,
  publishDocument,
  formatProjectInfo,
  searchByTag,
} from './test-autodoc-upload';

// 1️⃣ Create a new document metadata object
const doc = createDocumentMetadata('Getting Started', 'guide', 'Alice');

// 2️⃣ Add tags and publish
const tagged = addTags(doc, ['intro', 'setup']);
const published = publishDocument(tagged);

// 3️⃣ Format project info
const projInfo = formatProjectInfo({
  name: 'MyLib',
  gitRepo: 'github.com/user/mylib',
  gitBranch: 'main',
  description: 'A sample library',
});
console.log(projInfo); // → MyLib (github.com/user/mylib) [main]

// 4️⃣ Search among many documents
const allDocs = [published];
const introDocs = searchByTag(allDocs, 'intro');
console.log(introDocs.length); // → 1
```

*All functions are pure – they return new objects rather than mutating the inputs.*