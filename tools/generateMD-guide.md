# `generateMD.ts` – Automated Markdown Documentation Generator

## Table of Contents
1. [Purpose](#purpose)  
2. [File Structure & Exported API](#file-structure--exported-api)  
3. [Key Types & Components](#key-types--components)  
4. [Core Function: `generateMarkdownForFile`](#core-function-generatemarkdownforfile)  
5. [Error Handling](#error-handling)  
6. [Usage Example](#usage-example)  
7. [Installation & Prerequisites](#installation--prerequisites)  
8. [Important Details & Gotchas](#important-details--gotchas)  

---

## Purpose
`generateMD.ts` provides a **single, high‑level utility** that reads a source code file, sends its contents to the **Groq** LLM (large language model) with a prompt that asks the model to produce Markdown‑formatted documentation, and writes the generated documentation to a sibling file (`<original‑name>-guide.md`).  

The goal is to automate the creation of developer‑friendly documentation for any file, without manual effort.

---

## File Structure & Exported API
```text
generateMD.ts
│
├─ Imports
│   ├─ Groq (groq-sdk) – LLM client
│   ├─ readFile, writeFile (fs/promises) – async file I/O
│   └─ basename, dirname, extname, join (path) – path utilities
│
├─ Exported Types
│   └─ GenerateMDResult
│
└─ Exported Functions
    └─ generateMarkdownForFile(filePath, apiKey)
```

Only **one public function** (`generateMarkdownForFile`) and **one public type** (`GenerateMDResult`) are exported.

---

## Key Types & Components

### `GenerateMDResult`
```ts
export type GenerateMDResult = {
  success: boolean;          // true if the doc was generated & written
  outputPath?: string;       // absolute path to the generated .md file (when success)
  error?: string;            // error message (when !success)
};
```

- **When `success` is `true`** – `outputPath` is guaranteed to be defined.  
- **When `success` is `false`** – `error` contains a human‑readable description.

### External Dependencies
| Module | Reason |
|--------|--------|
| `groq-sdk` | Provides the `Groq` client to call the LLM (`openai/gpt-oss-120b`). |
| `fs/promises` | Async file read/write (Node.js ≥ v10). |
| `path` | Platform‑independent path manipulation. |

---

## Core Function: `generateMarkdownForFile`

```ts
export const generateMarkdownForFile = async (
  filePath: string,
  apiKey: string,
): Promise<GenerateMDResult> => { … }
```

### What it does (step‑by‑step)

1. **Read source file** (`filePath`) as UTF‑8 text.  
2. **Extract file name** (e.g., `utils.ts`).  
3. **Instantiate Groq client** with the supplied `apiKey`.  
4. **Compose the system + user prompt**  
   * System: “You are an expert software documentation generator …”  
   * User: “Generate markdown documentation for this file … `<fileContent>`”.  
5. **Call the LLM** (`groq.chat.completions.create`) with:
   * Model: `openai/gpt-oss-120b`
   * Temperature: `0.7`
   * Max tokens: `8192`
   * No streaming (`stream: false`)
6. **Extract the generated Markdown** from `chatCompletion.choices[0].message.content`.  
7. **Derive output filename** – `<original‑basename>-guide.md` (same directory).  
8. **Write the Markdown** to the output path.  
9. **Return** a `GenerateMDResult` indicating success and the location of the file.

### Signature
| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | Absolute or relative path to the source file you want documented. |
| `apiKey`   | `string` | Groq API key (or any compatible OpenAI‑style key). |

### Return Value
A `Promise` that resolves to a `GenerateMDResult` (see above).

---

## Error Handling
All operational steps are wrapped in a `try / catch`.  

- **On any exception** (file read/write failure, network error, malformed response, etc.) the function returns:
  ```ts
  {
    success: false,
    error: <error.message | 'Unknown error'>
  }
  ```

The caller should inspect `result.success` before using `result.outputPath`.

---

## Usage Example

```ts
// demo.ts – quick demo of generateMD.ts
import { generateMarkdownForFile, GenerateMDResult } from './generateMD';
import path from 'path';
import dotenv from 'dotenv';

// Load .env (optional) where GROQ_API_KEY is stored
dotenv.config();

const sourceFile = path.resolve('src', 'utils.ts'); // <-- file you want documented
const apiKey = process.env.GROQ_API_KEY ?? '';      // <-- ensure a key is present

async function runDemo() {
  if (!apiKey) {
    console.error('❌ Missing GROQ_API_KEY environment variable.');
    process.exit(1);
  }

  console.log(`Generating Markdown for ${sourceFile} …`);
  const result: GenerateMDResult = await generateMarkdownForFile(sourceFile, apiKey);

  if (result.success) {
    console.log('✅ Documentation generated at:', result.outputPath);
  } else {
    console.error('❌ Failed to generate documentation:', result.error);
  }
}

runDemo().catch(err => console.error('Unexpected error:', err));
```

**CLI‑style one‑liner** (if you prefer a tiny script):

```bash
node -e "require('./generateMD').generateMarkdownForFile('src/index.ts', process.env.GROQ_API_KEY).then(r=>console.log(r))"
```

---

## Installation & Prerequisites

1. **Node.js** ≥ 14 (supports `fs/promises` and ES modules).  
2. **Install dependencies**:

   ```bash
   npm install groq-sdk
   # (fs and path are built‑in)
   ```

3. **Obtain a Groq API key** (or any compatible OpenAI‑style key) and expose it to your process, e.g.:

   ```bash
   export GROQ_API_KEY="sk-..."
   ```

4. **TypeScript** (optional but recommended for type safety). If you are using plain JavaScript, the same file works after a simple transpile or by renaming to `.js`.

---

## Important Details & Gotchas

| Topic | Details |
|-------|----------|
| **Model choice** | The code hard‑codes `openai/gpt-oss-120b`. If you need a cheaper or different model, change the `model` field in the `groq.chat.completions.create` call. |
| **Token limit** | `max_completion_tokens: 8192` is the upper bound for the response. Very large source files may hit the limit, causing truncated documentation. Consider splitting large files or increasing the limit if the service permits. |
| **Temperature** | Set to `0.7` for a balance of creativity vs. determinism. Lower it (`0.0`) for more consistent output. |
| **File encoding** | The script assumes UTF‑8 source files. Non‑UTF‑8 files will throw an error. |
| **Output naming** | The generated file is placed **next to** the source file with suffix `-guide.md`. Existing files with the same name will be overwritten. |
| **Rate limiting** | The Groq API may enforce per‑minute or per‑day quotas. Handle `429` responses in production by adding retry/back‑off logic. |
| **Security** | The entire source content is sent to an external LLM service. Do **not** run this on proprietary or confidential code unless you trust the provider and have appropriate agreements. |
| **Testing** | For unit tests, mock `Groq` and the `fs/promises` methods. The function is pure apart from the external calls, making it straightforward to stub. |
| **Logging** | The file contains a stray `console.log('generateMD');` at the top. It is harmless but noisy; you may want to remove it or replace it with a proper logger. |

---

### TL;DR

`generateMarkdownForFile(sourcePath, apiKey)` reads a source file, asks Groq’s LLM to produce a Markdown guide (purpose, structure, key functions, usage, etc.), writes the guide to `<source‑basename>-guide.md`, and returns a success flag plus the output location. It’s a quick way to bootstrap documentation for any code file, provided you have a valid Groq API key and accept that the code is sent off‑site for processing.