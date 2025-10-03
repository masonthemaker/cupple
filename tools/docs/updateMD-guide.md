# `updateMD.ts` – Automated Markdown Documentation Generator

## Table of Contents
1. [Purpose](#purpose)  
2. [Key Types](#key-types)  
3. [Main API: `updateMarkdownForFile`](#main-api-updatemarkdownforfile)  
   - [Signature](#signature)  
   - [Parameters](#parameters)  
   - [Return Value](#return-value)  
   - [Workflow Overview](#workflow-overview)  
4. [Dependencies](#dependencies)  
5. [File & Directory Layout](#file--directory-layout)  
6. [Usage Examples](#usage-examples)  
   - [Basic Call (standard detail)](#basic-call-standard-detail)  
   - [Brief or Comprehensive Docs](#brief-or-comprehensive-docs)  
7. [Exported API](#exported-api)  

---

## Purpose
`updateMD.ts` automatically **creates** or **updates** Markdown documentation for a given source file using the Groq LLM. The generated file is placed in a `docs/` sub‑folder next to the source file, keeping documentation in sync with code changes.

---

## Key Types

| Type | Description |
|------|-------------|
| `UpdateMDResult` | Result of the generation process. Contains a success flag, the absolute `outputPath`, an optional `error` message, and `wasCreated` indicating whether a new file was created (`true`) or an existing file was updated (`false`). |
| `DocDetailLevel` | Desired documentation depth – `'brief'`, `'standard'` (default), or `'comprehensive'`. |

```ts
export type UpdateMDResult = {
  success: boolean;
  outputPath?: string;
  error?: string;
  wasCreated?: boolean; // True if doc didn't exist and was created instead
};

type DocDetailLevel = 'brief' | 'standard' | 'comprehensive';
```

---

## Main API: `updateMarkdownForFile`

### Signature
```ts
export const updateMarkdownForFile: (
  filePath: string,
  apiKey: string,
  detailLevel?: DocDetailLevel,
  userNotes?: string,
) => Promise<UpdateMDResult>;
```

### Parameters
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `filePath` | `string` | – | Path (absolute or relative) to the source file to document. |
| `apiKey` | `string` | – | Groq API key (passed directly; no internal env lookup). |
| `detailLevel` | `DocDetailLevel` | `'standard'` | Depth of documentation. `'brief'` → concise, `'standard'` → balanced, `'comprehensive'` → detailed. |
| `userNotes` | `string` | `undefined` | Optional free‑form guidance that is **included** in the prompt sent to the LLM, allowing you to steer the generated documentation. |

### Return Value
`Promise<UpdateMDResult>` – resolves with:

- **`success: true`** – documentation written successfully.  
  - `outputPath` – absolute path to the generated markdown file.  
  - `wasCreated` – `true` if the file was newly created, `false` if it was updated.  

- **`success: false`** – an error occurred.  
  - `error` – human‑readable error message.

### Workflow Overview
1. **Read source file** (`readFile`).  
2. **Derive output path** – `<source‑basename>-guide.md` inside a sibling `docs/` folder.  
3. **Detect existing doc** (`existsSync`).  
4. **Initialize Groq client** (`new Groq({ apiKey })`).  
5. **Select system prompt**:  
   - `getUpdateSystemPrompt(detailLevel)` for updates.  
   - `getCreateSystemPrompt(detailLevel)` for new docs.  
   Both prompts embed a set of *critical rules* and vary wording based on the chosen `detailLevel`.  
6. **Compose user message** that includes:  
   - Existing documentation (when updating).  
   - Current source code.  
   - Optional `userNotes` section (if supplied).  
7. **Call** `groq.chat.completions.create` with model `openai/gpt-oss-120b`, `temperature: 0.7`, and `max_completion_tokens: 8192`.  
8. **Write markdown** – ensure `docs/` exists (`mkdir(..., { recursive: true })`) and write the LLM response.  
9. **Return** a populated `UpdateMDResult`.  
10. **Error handling** – any thrown error is caught and returned as `{ success: false, error: <message> }`.

---

## Dependencies

| Package | Reason |
|---------|--------|
| `groq-sdk` | Calls the Groq LLM API. |
| `fs/promises` | Async file operations (`readFile`, `writeFile`, `mkdir`). |
| `path` | Path utilities (`basename`, `dirname`, `extname`, `join`). |
| `fs` (sync) | Quick existence check (`existsSync`). |

---

## File & Directory Layout

Given a source file:

```
/project/src/components/Button.tsx
```

Running `updateMarkdownForFile` creates (or updates):

```
/project/src/components/docs/Button-guide.md
```

- The `docs/` folder is **local to the source file’s directory**.  
- Filename pattern: `<source‑basename>-guide.md`.

---

## Usage Examples

### Basic Call (standard detail)

```ts
import { updateMarkdownForFile } from './updateMD';

(async () => {
  const result = await updateMarkdownForFile(
    './src/components/Button.tsx',
    process.env.GROQ_API_KEY!,
  );

  if (result.success) {
    console.log(`✅ ${result.wasCreated ? 'Created' : 'Updated'}: ${result.outputPath}`);
  } else {
    console.error('❌ Documentation generation failed:', result.error);
  }
})();
```

### Brief or Comprehensive Docs

```ts
// Brief docs – concise overview
await updateMarkdownForFile('utils/helpers.ts', GROQ_KEY, 'brief');

// Comprehensive docs – full breakdown with examples
await updateMarkdownForFile('utils/helpers.ts', GROQ_KEY, 'comprehensive');
```

### Adding Custom Guidance

```ts
await updateMarkdownForFile(
  'src/lib/apiClient.ts',
  GROQ_KEY,
  'standard',
  'Emphasize the retry‑logic and the exported `request` helper.',
);
```

The `userNotes` string is inserted into the prompt, so the LLM can incorporate the guidance into the generated documentation.

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

type DocDetailLevel = 'brief' | 'standard' | 'comprehensive';

// Function
export const updateMarkdownForFile: (
  filePath: string,
  apiKey: string,
  detailLevel?: DocDetailLevel,
  userNotes?: string,
) => Promise<UpdateMDResult>;
```

- **`updateMarkdownForFile`** is the sole public entry point. Provide the source file path, a valid Groq API key, optionally a `detailLevel` (default `'standard'`), and optionally `userNotes`. The function returns a structured result indicating success, the location of the generated file, and whether the file was newly created.