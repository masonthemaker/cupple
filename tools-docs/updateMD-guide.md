# `updateMD.ts` – Automatic Markdown Documentation Generator

## Table of Contents
1. [Purpose](#purpose)  
2. [Key Types & Interfaces](#key-types--interfaces)  
3. [Core Function](#core-function)  
4. [Supporting Modules & Dependencies](#supporting-modules--dependencies)  
5. [Workflow Overview (Structure)](#workflow-overview-structure)  
6. [Usage Examples](#usage-examples)  
7. [Important Details & Gotchas](#important-details--gotchas)  
8. [Exported API](#exported-api)  
9. [License & Credits](#license--credits)  

---

## Purpose
`updateMD.ts` provides a **single‑purpose utility** that:

* Reads a source code file (any language, but typically TypeScript/JavaScript).  
* Generates **markdown documentation** for that file using the **Groq** LLM API.  
* If a documentation file already exists (`<basename>-guide.md` in a `docs/` sub‑folder), it **updates** the existing markdown instead of overwriting it.  
* Returns a structured result indicating success, the path of the generated file, and whether the file was newly created.

This enables developers to keep documentation in sync with code changes automatically, without manual copy‑pasting.

---

## Key Types & Interfaces

| Name | Description |
|------|-------------|
| `UpdateMDResult` | The shape of the object returned by `updateMarkdownForFile`. It contains: <br>• `success` – `true` if the operation completed without throwing. <br>• `outputPath?` – absolute path to the generated/updated markdown file. <br>• `error?` – error message when `success` is `false`. <br>• `wasCreated?` – `true` if the markdown file was created from scratch; `false` if it was updated. |

```ts
export type UpdateMDResult = {
    success: boolean;
    outputPath?: string;
    error?: string;
    wasCreated?: boolean;
};
```

---

## Core Function

### `updateMarkdownForFile(filePath: string, apiKey: string): Promise<UpdateMDResult>`

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | Absolute or relative path to the source file that needs documentation. |
| `apiKey`   | `string` | Groq API key used to authenticate LLM calls. |

#### What it does
1. **Read source file** – loads the file contents (`utf‑8`).  
2. **Derive output location** – creates a `docs/` folder next to the source file and names the markdown file `<basename>-guide.md`.  
3. **Detect existing docs** – checks if the markdown file already exists.  
4. **Initialize Groq client** – `new Groq({apiKey})`.  
5. **LLM Prompt** –  
   * **If doc exists** → sends a *system* prompt that asks the model to *update* the existing markdown, preserving structure, and a *user* prompt containing both the old markdown and the current source code.  
   * **If doc does NOT exist** → sends a *system* prompt that asks the model to *generate* full documentation from scratch.  
6. **Call Groq** – uses `groq.chat.completions.create` with model `openai/gpt-oss-120b`, temperature `0.7`, and a generous token limit.  
7. **Write output** – ensures the `docs/` directory exists (`mkdir(..., {recursive:true})`) and writes the LLM‑generated markdown.  
8. **Return result** – includes success flag, output path, and creation flag.  
9. **Error handling** – any exception is caught and turned into a failure `UpdateMDResult` with an error message.

#### Return value
A `Promise` that resolves to an `UpdateMDResult` object (see above).

---

## Supporting Modules & Dependencies

| Module | Reason for Import |
|--------|-------------------|
| `groq-sdk` | LLM client for Groq’s hosted models. |
| `fs/promises` (`readFile`, `writeFile`, `mkdir`) | Async file system operations. |
| `path` (`basename`, `dirname`, `extname`, `join`) | Path manipulation (file name, directories, extensions). |
| `fs` (`existsSync`) | Synchronous existence check for the target markdown file. |

> **Note:** All I/O is performed asynchronously except the existence check, which is acceptable because it’s a cheap, atomic operation.

---

## Workflow Overview (Structure)

```mermaid
flowchart TD
    A[Start: Call updateMarkdownForFile] --> B[Read source file]
    B --> C[Derive docs path & output filename]
    C --> D{Does docs file exist?}
    D -- Yes --> E[Read existing markdown]
    E --> F[Compose "update" prompt]
    D -- No --> G[Compose "create" prompt]
    F --> H[Call Groq API]
    G --> H
    H --> I[Receive markdown from LLM]
    I --> J[Ensure docs/ folder exists]
    J --> K[Write markdown to outputPath]
    K --> L[Return UpdateMDResult]
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style L fill:#bbf,stroke:#333,stroke-width:2px
```

---

## Usage Examples

### 1. Direct import & call (Node.js)

```ts
import { updateMarkdownForFile } from './updateMD.js'; // adjust path as needed

const sourceFile = './src/utils/helpers.ts';
const groqApiKey = process.env.GROQ_API_KEY; // keep the key out of source control!

async function generateDocs() {
  const result = await updateMarkdownForFile(sourceFile, groqApiKey);

  if (result.success) {
    console.log(`✅ Documentation ${result.wasCreated ? 'created' : 'updated'} at:`);
    console.log(result.outputPath);
  } else {
    console.error('❌ Failed to generate documentation:', result.error);
  }
}

generateDocs();
```

### 2. From a simple CLI wrapper

```ts
#!/usr/bin/env node
import { updateMarkdownForFile } from './updateMD.js';
import { argv, exit } from 'process';

const [,, filePath, apiKey] = argv;

if (!filePath || !apiKey) {
  console.error('Usage: generate-doc <filePath> <groqApiKey>');
  exit(1);
}

updateMarkdownForFile(filePath, apiKey)
  .then(res => {
    if (res.success) {
      console.log(`✅ ${res.wasCreated ? 'Created' : 'Updated'}: ${res.outputPath}`);
    } else {
      console.error(`❌ Error: ${res.error}`);
    }
  })
  .catch(err => console.error('Unexpected error:', err));
```

> Save the script as `generate-doc.ts`, compile with `tsc`, and run `node generate-doc.js ./myFile.ts YOUR_GROQ_KEY`.

### 3. Integration in a build pipeline

```yaml
# Example: GitHub Actions step
- name: Generate / Update Markdown Docs
  run: node ./scripts/generate-doc.js ./src/service.ts ${{ secrets.GROQ_API_KEY }}
```

---

## Important Details & Gotchas

| Topic | Details |
|-------|---------|
| **API Key Exposure** | Never hard‑code the Groq API key. Use environment variables or secret stores (e.g., GitHub Secrets, Vault). |
| **Model & Token Limits** | The code uses `openai/gpt-oss-120b` with `max_completion_tokens: 8192`. Very large source files may exceed the limit; consider splitting or truncating. |
| **Temperature** | Set to `0.7` – produces a balance between creativity and determinism. Adjust if you need more deterministic output. |
| **File Naming** | Output markdown is always `<basename>-guide.md`. If you need a different naming convention, modify the `outputFileName` line. |
| **Docs Directory** | Always created as a sibling `docs/` folder. If a different location is required, change `docsDir` construction. |
| **Error Propagation** | All thrown errors are caught and returned as `{ success: false, error: <msg> }`. Callers should inspect `success` before accessing other fields. |
| **Concurrent Calls** | The function is safe to call concurrently on different source files. Concurrent calls on the *same* source file may cause race conditions on the markdown file (last write wins). |
| **Node Version** | Uses native `fs/promises` and `import` syntax → Node ≥ 14 (with ES‑module support) or a transpiled environment (TS → CommonJS). |
| **Testing** | Mock `Groq` and file‑system functions (e.g., with `jest.mock`) to unit‑test without real LLM calls or disk I/O. |
| **Extensibility** | To support other LLM providers, replace the `Groq` import and adapt the request payload accordingly. |

---

## Exported API

```ts
export type UpdateMDResult = {
  success: boolean;
  outputPath?: string;
  error?: string;
  wasCreated?: boolean;
};

export const updateMarkdownForFile: (
  filePath: string,
  apiKey: string,
) => Promise<UpdateMDResult>;
```

Both the type and the function are named exports, allowing selective imports:

```ts
import { updateMarkdownForFile } from './updateMD';
```

---

## License & Credits

* **Author** – Original author (unspecified).  
* **License** – Not defined in the source; consider adding an appropriate open‑source license (e.g., MIT) if you plan to distribute.  
* **Dependencies** – `groq-sdk` (Apache‑2.0) and Node.js built‑in modules.  

--- 

*Generated by an automated documentation assistant.*