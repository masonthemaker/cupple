# `updateMD.ts` – Automated Markdown Documentation Generator

## Table of Contents
1. [Purpose](#purpose)  
2. [Key Concepts & Types](#key-concepts--types)  
3. [Main Function: `updateMarkdownForFile`](#main-function-updatemarkdownforfile)  
   - [Signature](#signature)  
   - [Workflow Overview](#workflow-overview)  
   - [Detailed Steps](#detailed-steps)  
   - [Error Handling](#error-handling)  
4. [Dependencies](#dependencies)  
5. [File & Directory Layout](#file--directory-layout)  
6. [Usage Examples](#usage-examples)  
   - [Basic Invocation](#basic-invocation)  
   - [Integrating into a Build Script](#integrating-into-a-build-script)  
7. [Important Details & Gotchas](#important-details--gotchas)  
8. [Exported API](#exported-api)  

---

## Purpose
`updateMD.ts` provides a **single‑purpose utility** that automatically generates or updates Markdown documentation for a given source file using the **Groq AI model**.  

- If a documentation file already exists (`<source‑name>-guide.md` in a sibling `docs/` folder), it **updates** the content to reflect the latest code.  
- If no documentation exists, it **creates** a fresh Markdown guide from scratch.  

The goal is to keep documentation in sync with source code without manual editing.

---

## Key Concepts & Types

| Export | Description |
|--------|-------------|
| `UpdateMDResult` | Result object returned from `updateMarkdownForFile`. Contains success flag, path to the generated file, optional error message, and a `wasCreated` boolean indicating whether the doc was newly created. |
| `updateMarkdownForFile` | Asynchronous function that drives the whole generation / update process. |

```ts
export type UpdateMDResult = {
  success: boolean;
  outputPath?: string;   // absolute path to the generated markdown file
  error?: string;        // populated only when success === false
  wasCreated?: boolean;  // true = file was created, false = file was updated
};
```

---

## Main Function: `updateMarkdownForFile`

### Signature
```ts
export const updateMarkdownForFile = async (
  filePath: string,
  apiKey: string,
): Promise<UpdateMDResult>
```

- **`filePath`** – Absolute or relative path to the source file you want documented.  
- **`apiKey`** – Groq API key (passed directly; no environment variable lookup inside the module).  

### Workflow Overview
1. **Read source file** – Load the file’s raw content.  
2. **Derive documentation path** – Create a `docs/` sub‑folder next to the source file and name the doc `<basename>-guide.md`.  
3. **Detect existing doc** – Use `fs.existsSync` to decide between *update* vs *create*.  
4. **Initialize Groq client** – `new Groq({ apiKey })`.  
5. **Call appropriate Groq prompt** –  
   - *Update* prompt includes the existing markdown and the new code.  
   - *Create* prompt asks the model to produce a full documentation from scratch.  
6. **Write the resulting markdown** – Ensure the `docs/` folder exists (`mkdir(..., { recursive: true })`) and write the file.  
7. **Return a structured result** – Success flag, path, and whether the file was newly created.

### Detailed Steps

| Step | Action | Code Snippet |
|------|--------|--------------|
| **1** | Load source file content | `const fileContent = await readFile(filePath, 'utf-8');` |
| **2** | Extract file name & base name (without extension) | `const fileName = basename(filePath);`<br>`const fileNameWithoutExt = basename(filePath, extname(filePath));` |
| **3** | Build output paths | `const docsDir = join(dirname(filePath), 'docs');`<br>`const outputPath = join(docsDir, `${fileNameWithoutExt}-guide.md`);` |
| **4** | Check for existing documentation | `const docExists = existsSync(outputPath);` |
| **5** | Create Groq client | `const groq = new Groq({ apiKey });` |
| **6‑a** | **If doc exists** – read it and ask Groq to *update* it | `const existingDoc = await readFile(outputPath, 'utf-8');`<br>System + user messages with explicit update instructions (see source). |
| **6‑b** | **If doc does not exist** – ask Groq to *create* a fresh guide | System message that defines the required sections (purpose, structure, …). |
| **7** | Send request to Groq (`groq.chat.completions.create`) with model `openai/gpt-oss-120b`, temperature `0.7`, and a generous token limit. |
| **8** | Extract the markdown from the response | `const markdownContent = chatCompletion.choices[0]?.message?.content || '';` |
| **9** | Ensure `docs/` folder exists and write the file | `await mkdir(docsDir, { recursive: true });`<br>`await writeFile(outputPath, markdownContent, 'utf-8');` |
| **10** | Return success result | `{ success: true, outputPath, wasCreated: docExists ? false : true }` |
| **Error** | Catch any exception and return `{ success: false, error: … }`. |

### Error Handling
All file‑system and network operations are wrapped in a `try / catch`. If anything throws (e.g., missing file, invalid API key, network failure), the function returns:

```ts
{
  success: false,
  error: string   // Human‑readable error message
}
```

---

## Dependencies

| Package | Reason |
|---------|--------|
| `groq-sdk` | Communicates with the Groq LLM API. |
| `fs/promises` | Async file system operations (`readFile`, `writeFile`, `mkdir`). |
| `path` | Path manipulation (`basename`, `dirname`, `extname`, `join`). |
| `fs` (sync) | `existsSync` for quick existence check. |

> **Note:** No external configuration (e.g., `.env`) is performed inside this module; the caller must supply a valid `apiKey`.

---

## File & Directory Layout

Given a source file:

```
/project/src/utils/helpers.ts
```

Running `updateMarkdownForFile` will produce:

```
/project/src/utils/docs/helpers-guide.md
```

- The `docs/` folder is created **next to** the source file, not at the project root.  
- The generated markdown filename follows the pattern `<source‑basename>-guide.md`.

---

## Usage Examples

### Basic Invocation

```ts
import { updateMarkdownForFile } from './updateMD';

(async () => {
  const sourcePath = './src/lib/myComponent.tsx';
  const groqApiKey = process.env.GROQ_API_KEY!; // assume it's set

  const result = await updateMarkdownForFile(sourcePath, groqApiKey);

  if (result.success) {
    console.log(`✅ Documentation ${result.wasCreated ? 'created' : 'updated'} at:`);
    console.log(result.outputPath);
  } else {
    console.error('❌ Failed to generate documentation:', result.error);
  }
})();
```

### Integrating into a Build / CI Script

```ts
// scripts/generate-docs.ts
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { updateMarkdownForFile } from '../tools/updateMD';

const ROOT = join(__dirname, '..', 'src');
const GROQ_KEY = process.env.GROQ_API_KEY!;

async function walk(dir: string) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) await walk(full);
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      const res = await updateMarkdownForFile(full, GROQ_KEY);
      console.log(res.success ? `✔ ${full}` : `✘ ${full}: ${res.error}`);
    }
  }
}

walk(ROOT).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

Run with:

```bash
$ node scripts/generate-docs.ts
```

This will walk through the `src/` tree, generating or updating documentation for every TypeScript file.

---

## Important Details & Gotchas

| Area | Detail |
|------|--------|
| **API Model** | The code uses the large `openai/gpt-oss-120b` model. Adjust `model` and token limits if you hit rate limits or cost concerns. |
| **Prompt Stability** | The system prompts contain **critical rules** for updates (e.g., “READ THE NEW CODE CAREFULLY”). Changing them may affect output quality. |
| **File Naming** | The output file always ends with `-guide.md`. If you need a different naming convention, modify the `outputFileName` construction. |
| **Directory Creation** | `mkdir(..., { recursive: true })` guarantees that nested `docs/` folders are created even if intermediate directories are missing. |
| **Concurrency** | The function is **async** but not internally throttled. Running it in parallel on many files may hit API rate limits. Consider serial execution or a concurrency limiter. |
| **Error Propagation** | Only the error message string is returned; the original stack trace is lost. For debugging, you may want to log `error` itself before returning. |
| **Security** | The API key is passed directly to the Groq client. Ensure it is stored securely (e.g., environment variable, secret manager). |
| **Markdown Validation** | The function trusts the model’s output. If you need to guarantee valid Markdown (e.g., for downstream pipelines), add a post‑processing validation step. |

---

## Exported API

```ts
// Types
export type UpdateMDResult = {
  success: boolean;
  outputPath?: string;
  error?: string;
  wasCreated?: boolean;
};

// Functions
export const updateMarkdownForFile: (
  filePath: string,
  apiKey: string,
) => Promise<UpdateMDResult>;
```

- **`updateMarkdownForFile`** is the only public entry point. Import it from the module and pass the path of the file you wish to document along with a valid Groq API key.

--- 

*Generated by the documentation utility itself.*