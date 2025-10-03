# `updateMD.ts` – Markdown Documentation Generator

## Table of Contents
1. [Purpose](#purpose)  
2. [File Structure & Exported API](#file-structure--exported-api)  
3. [Key Types](#key-types)  
4. [Main Function – `updateMarkdownForFile`](#main-function--updatemarkdownforfile)  
5. [Workflow Overview](#workflow-overview)  
6. [Dependencies & Runtime Requirements](#dependencies--runtime-requirements)  
7. [Usage Examples](#usage-examples)  
8. [Error Handling & Return Values](#error-handling--return-values)  
9. [Important Implementation Details & Gotchas](#important-implementation-details--gotchas)  
10. [License & Contributing](#license--contributing)  

---

## Purpose
`updateMD.ts` provides a **single, high‑level utility** that automatically generates or updates Markdown documentation for a given source file using the **Groq** LLM API (GPT‑OSS‑120B).  

- If a documentation file already exists, the utility **updates** it, preserving structure and tone while reflecting code changes.  
- If no documentation exists, it **creates** a fresh guide from scratch.  

The generated Markdown files are stored in a sibling `*-docs` directory next to the source file.

---

## File Structure & Exported API
```text
updateMD.ts
├─ Imports (Groq SDK, Node fs/path utilities)
├─ Exported type: UpdateMDResult
└─ Exported async function: updateMarkdownForFile(filePath, apiKey)
```

Only two symbols are exported:

| Export | Kind | Description |
|--------|------|-------------|
| `UpdateMDResult` | Type | Result object describing success/failure, output location, and creation flag. |
| `updateMarkdownForFile` | Function | Core routine that reads a source file, talks to the Groq API, and writes/updates the Markdown guide. |

---

## Key Types

### `UpdateMDResult`
```ts
export type UpdateMDResult = {
  success: boolean;          // true if the operation completed without throwing
  outputPath?: string;       // absolute path to the generated/updated markdown file
  error?: string;            // populated only when success === false
  wasCreated?: boolean;      // true if a new doc was created, false if an existing one was updated
};
```

The type gives callers everything they need to decide next steps (e.g., log the path, report errors, or commit the new file).

---

## Main Function – `updateMarkdownForFile`

### Signature
```ts
export const updateMarkdownForFile = async (
  filePath: string,
  apiKey: string,
): Promise<UpdateMDResult>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | Absolute or relative path to the source file you want documented. |
| `apiKey`   | `string` | Groq API key (required for authentication). |

### What It Does
1. **Read the source file** (`utf‑8`).  
2. **Derive the documentation file name**: `<source‑basename>-guide.md`.  
3. **Place the doc** inside a sibling folder named `<source‑folder>-docs`.  
4. **Detect** whether the documentation already exists.  
5. **Instantiate** a `Groq` client with the supplied API key.  
6. **If the doc exists** – send a *“update”* prompt to the LLM, passing the current doc and the latest source code.  
7. **If the doc does not exist** – send a *“create”* prompt that asks the LLM to generate a full guide from scratch.  
8. **Write** the LLM‑generated Markdown to the target path.  
9. **Return** an `UpdateMDResult` indicating success, the path written, and whether a new file was created.

---

## Workflow Overview (Pseudo‑flow)

```mermaid
flowchart TD
    A[Start] --> B[Read source file]
    B --> C[Compute docs folder & file name]
    C --> D{Doc exists?}
    D -- Yes --> E[Read existing doc]
    E --> F[Build “update” prompt]
    D -- No --> G[Build “create” prompt]
    F --> H[Call Groq.chat.completions.create]
    G --> H
    H --> I[Extract markdown from response]
    I --> J[Write markdown to <outputPath>]
    J --> K{Success?}
    K -- Yes --> L[Return {success:true, wasCreated:false/true}]
    K -- No --> M[Catch error → Return {success:false, error}]
```

---

## Dependencies & Runtime Requirements

| Dependency | Reason |
|------------|--------|
| `groq-sdk` | Provides the `Groq` client for LLM calls. |
| `fs/promises` (`readFile`, `writeFile`, `mkdir`) | Async file system operations. (`mkdir` is imported but **not used** – see Gotchas). |
| `path` (`basename`, `dirname`, `extname`, `join`) | Path manipulation for cross‑platform compatibility. |
| `fs` (`existsSync`) | Synchronous existence check for the target Markdown file. |
| **Node.js** ≥ 14 (for native `fs/promises` & ES‑module syntax). |
| **Environment** – an active internet connection and a valid **Groq API key**. |

---

## Usage Examples

### 1️⃣ Basic Invocation (CommonJS / ES Module)

```ts
import { updateMarkdownForFile } from './updateMD';

// Replace with your actual file and API key
const sourceFile = './src/utils/math.ts';
const groqApiKey = process.env.GROQ_API_KEY!; // assume env var is set

(async () => {
  const result = await updateMarkdownForFile(sourceFile, groqApiKey);

  if (result.success) {
    console.log(
      `✅ Documentation ${result.wasCreated ? 'created' : 'updated'} at:`,
      result.outputPath,
    );
  } else {
    console.error('❌ Documentation generation failed:', result.error);
  }
})();
```

### 2️⃣ Bulk Generation (e.g., for a whole project)

```ts
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { updateMarkdownForFile } from './updateMD';

const walk = async (dir: string, files: string[] = []): Promise<string[]> => {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) await walk(full, files);
    else if (full.endsWith('.ts')) files.push(full);
  }
  return files;
};

(async () => {
  const allTsFiles = await walk('./src');
  const apiKey = process.env.GROQ_API_KEY!;

  for (const file of allTsFiles) {
    const res = await updateMarkdownForFile(file, apiKey);
    console.log(res.success ? `✔️ ${file}` : `❌ ${file}: ${res.error}`);
  }
})();
```

---

## Error Handling & Return Values

- **Success Path**  
  ```ts
  {
    success: true,
    outputPath: '/abs/path/to/xyz-guide.md',
    wasCreated: true | false
  }
  ```
- **Failure Path**  
  ```ts
  {
    success: false,
    error: 'Error message from caught exception'
  }
  ```

All thrown errors (file‑system errors, network failures, Groq SDK errors, etc.) are **caught** and transformed into a uniform `UpdateMDResult` with `success: false`. This makes the function safe to use in batch scripts without crashing the whole process.

---

## Important Implementation Details & Gotchas

| Topic | Details |
|-------|---------|
| **Documentation Naming** | `<source‑basename>-guide.md` (e.g., `utils.ts` → `utils-guide.md`). |
| **Docs Folder Naming** | `<source‑folder>-docs` sibling to the source folder (e.g., `src/utils` → `src/utils-docs`). |
| **Directory Creation** | The code **does not** call `mkdir` before writing. If the `*-docs` folder does not exist, `writeFile` will **throw** an ENOENT error. Users should ensure the folder exists or extend the function to call `await mkdir(docsDir, { recursive: true })`. |
| **Model & Token Limits** | Uses `openai/gpt-oss-120b` with `max_completion_tokens: 8192`. Very large source files may exceed the model’s context window → consider splitting or summarising. |
| **Prompt Engineering** | Two distinct system prompts: one for *updating* (preserves tone/structure) and one for *creating* (full guide). The user prompt embeds both the existing doc (if any) and the raw source code inside fenced code blocks. |
| **Streaming Disabled** | `stream: false` – the whole response is returned at once. If you need streaming for very large outputs, modify the request options. |
| **Temperature** | Set to `0.7` – a balance between creativity and determinism. Adjust if you need more deterministic output (e.g., `0.2`). |
| **Synchronous Existence Check** | `existsSync` is used deliberately to keep the logic simple. For truly async codebases you could replace it with `fs.promises.access`. |
| **Error Message Extraction** | If the caught error is not an `Error` instance, the function returns `'Unknown error'`. |
| **Testing** | Because the function contacts an external API, unit tests should mock the `Groq` client and file‑system calls (`readFile`, `writeFile`, `existsSync`). |
| **Security** | The API key is passed directly to the `Groq` constructor. Do **not** hard‑code the key; load it from environment variables or a secret manager. |

---

## License & Contributing
- **License:** Typically MIT or Apache‑2.0 (check the repository’s root `LICENSE` file).  
- **Contributing:** Feel free to open PRs to:
  - Add missing `mkdir` logic.
  - Expose configuration (model name, temperature, token limit) via function options.
  - Provide TypeScript overloads for batch processing.
  - Write unit tests with mocked LLM responses.

--- 

*Generated by an AI‑assisted documentation tool.*