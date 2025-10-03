# `generateMD.ts` – Automatic Markdown Documentation Generator

## Purpose
`generateMD.ts` provides a utility function that reads a source code file, sends its contents to the **Groq** LLM (using the `openai/gpt-oss-120b` model), and writes back a **Markdown‑formatted documentation guide**.  
The generated guide contains:

- The file’s purpose  
- Its overall structure  
- Key functions / components  
- Usage examples  
- Any other noteworthy details  

All output is placed in a `docs/` sub‑folder next to the original file.

---

## Structure Overview

| Section | Description |
|---------|-------------|
| **Imports** | Pulls in `Groq` SDK, Node’s `fs/promises` for async file I/O, and path helpers from `path`. |
| **Types** | `GenerateMDResult` – describes the success/failure shape returned by the main function. |
| **Main Export** | `generateMarkdownForFile(filePath, apiKey)` – async function that orchestrates reading, LLM prompting, and writing. |
| **Error Handling** | Wrapped in a `try / catch` block; returns a structured error message on failure. |

---

## Key Functions / Components

### 1. `GenerateMDResult` (type)

```ts
export type GenerateMDResult = {
  success: boolean;
  outputPath?: string; // path to the generated markdown file (on success)
  error?: string;      // error message (on failure)
};
```

- **Purpose** – Gives callers a predictable response format.

### 2. `generateMarkdownForFile`

```ts
export const generateMarkdownForFile = async (
  filePath: string,
  apiKey: string,
): Promise<GenerateMDResult> => { ... }
```

#### Core Steps

1. **Read source file** (`readFile`) → `fileContent`.
2. **Instantiate Groq client** with the supplied `apiKey`.
3. **Compose system & user prompts** that ask the model to generate Markdown documentation for the supplied file.
4. **Call the LLM** (`groq.chat.completions.create`) with:
   - Model: `openai/gpt-oss-120b`
   - Temperature: `0.7`
   - Token limit: `8192`
5. **Extract generated markdown** from `chatCompletion`.
6. **Create output path**:
   - Strips original extension.
   - Appends `-guide.md`.
   - Stores under a `docs/` folder next to the source file.
7. **Write markdown** (`writeFile`) to the computed location.
8. **Return** a `GenerateMDResult` indicating success and the output file path.

#### Error Handling

Any exception (file‑system, network, or SDK) is caught and returned as:

```ts
{
  success: false,
  error: <error message>
}
```

---

## Usage Example

### 1. Install Dependencies

```bash
npm install groq-sdk
# Node 14+ is required for fs/promises
```

### 2. Call the Function

```ts
import { generateMarkdownForFile } from './generateMD';

const sourceFile = './src/utils/parseCSV.ts';
const groqApiKey = process.env.GROQ_API_KEY!; // ensure you have a valid key

async function run() {
  const result = await generateMarkdownForFile(sourceFile, groqApiKey);

  if (result.success) {
    console.log('✅ Documentation generated at:', result.outputPath);
  } else {
    console.error('❌ Failed to generate documentation:', result.error);
  }
}

run();
```

### 3. Result

- A folder `./src/utils/docs/` will be created (if it does not exist).
- Inside, you’ll find `parseCSV-guide.md` containing the AI‑generated documentation.

---

## Important Details & Considerations

| Topic | Details |
|-------|---------|
| **API Key** | The function expects a **valid Groq API key**. Store it securely (e.g., env var). |
| **Model Choice** | Currently hard‑coded to `openai/gpt-oss-120b`. Change the `model` field if you want a different Groq model. |
| **Prompt Consistency** | The system prompt is fixed to instruct the model to output *only* Markdown and include specific sections. Adjust it if you need a different format. |
| **Token Limits** | `max_completion_tokens: 8192` is generous, but very large source files may exceed the model’s context window. Consider splitting large files or trimming content before sending. |
| **File Naming** | Output file is `<original‑name>-guide.md`. If a file with that name already exists, it will be overwritten. |
| **Directory Creation** | `mkdir(docsDir, {recursive: true})` ensures the `docs/` folder exists without throwing if it already does. |
| **Error Propagation** | The function never throws; all errors are captured and returned in the result object, making it safe to use in batch scripts. |
| **Streaming Disabled** | `stream: false` means the whole completion is awaited before proceeding. For very large responses, you could enable streaming and pipe chunks to the file system. |
| **TypeScript Compatibility** | The file is written in TypeScript; ensure your project compiles with `esModuleInterop` enabled or adjust the import style accordingly. |
| **Testing** | When unit‑testing, you’ll likely want to mock `Groq` and the `fs` functions to avoid network calls and disk writes. |

---

## Export Summary

| Export | Type | Description |
|--------|------|-------------|
| `GenerateMDResult` | `type` | Result shape for success/failure. |
| `generateMarkdownForFile` | `async (filePath: string, apiKey: string) => Promise<GenerateMDResult>` | Main utility that generates Markdown documentation for a given file. |

---

### Quick Reference (one‑liner)

```ts
await generateMarkdownForFile('path/to/file.ts', 'your-groq-api-key');
```

The call will produce `path/to/docs/file-guide.md` and return an object indicating success and the location of the generated guide.