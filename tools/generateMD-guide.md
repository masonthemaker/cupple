# `generateMD.ts` – Automatic Markdown Documentation Generator

## Purpose
`generateMD.ts` provides a **single, high‑level utility function** that:

1. **Reads a source file** (any text‑based code file).  
2. Sends its contents to a Groq LLM (using the `groq-sdk`) with a system prompt that instructs the model to act as an expert documentation generator.  
3. Receives the generated Markdown documentation.  
4. Writes the Markdown file to a sibling `*-docs` directory, naming it `originalname‑guide.md`.

The goal is to automate the creation of well‑structured, Markdown‑only documentation for any source file without manual effort.

---

## Structure Overview

| Section | Description |
|---------|-------------|
| **Imports** | Node built‑ins (`fs/promises`, `path`) and the Groq SDK. |
| **Types** | `GenerateMDResult` – describes the success/failure shape returned by the main function. |
| **Core Function** | `generateMarkdownForFile(filePath, apiKey)` – orchestrates the read → LLM → write pipeline. |
| **Error Handling** | All runtime errors are caught and reported via the result object. |

---

## Key Components

### 1. Types

```ts
export type GenerateMDResult = {
  success: boolean;
  outputPath?: string;   // Path to the generated Markdown file (when success)
  error?: string;        // Human‑readable error message (when failure)
};
```

*Provides a predictable contract for callers.*

---

### 2. `generateMarkdownForFile`

```ts
export const generateMarkdownForFile = async (
  filePath: string,
  apiKey: string,
): Promise<GenerateMDResult> => { … }
```

| Parameter | Type | Meaning |
|-----------|------|---------|
| `filePath` | `string` | Absolute or relative path to the source file you want documented. |
| `apiKey`   | `string` | Groq API key – required for authenticating the LLM request. |

#### Execution Flow

1. **Read source file**  
   ```ts
   const fileContent = await readFile(filePath, 'utf-8');
   const fileName = basename(filePath);
   ```

2. **Instantiate Groq client**  
   ```ts
   const groq = new Groq({ apiKey });
   ```

3. **Compose LLM request**  
   *System prompt*: “You are an expert software documentation generator …”  
   *User prompt*: Includes the filename and the raw file content wrapped in a fenced code block.

4. **Call the model** (`openai/gpt-oss-120b`) with:
   - `temperature: 0.7`
   - `max_completion_tokens: 8192`
   - `stream: false`

5. **Extract Markdown**  
   ```ts
   const markdownContent = chatCompletion.choices[0]?.message?.content || '';
   ```

6. **Determine output location**  
   *Creates a sibling directory named `<original‑folder>-docs`* and writes the file as  
   `<original‑basename>-guide.md`.

7. **Write file**  
   ```ts
   await writeFile(outputPath, markdownContent, 'utf-8');
   ```

8. **Return result** – success with `outputPath` or failure with an error string.

#### Error Handling

All steps are wrapped in a `try / catch`. On failure:

```ts
return {
  success: false,
  error: error instanceof Error ? error.message : 'Unknown error',
};
```

---

## Usage Example

```ts
import { generateMarkdownForFile } from './generateMD';

async function run() {
  const sourcePath = './src/utils/helpers.ts'; // any file you want documented
  const groqApiKey = process.env.GROQ_API_KEY; // keep the key out of source control

  if (!groqApiKey) {
    console.error('❌ Groq API key is missing.');
    return;
  }

  const result = await generateMarkdownForFile(sourcePath, groqApiKey);

  if (result.success) {
    console.log('✅ Documentation generated at:', result.outputPath);
  } else {
    console.error('❌ Failed to generate documentation:', result.error);
  }
}

run();
```

**CLI‑style quick test**

```bash
# Assuming you compiled the TS file (or use ts-node)
export GROQ_API_KEY="your-groq-key"
node -e "require('./dist/generateMD').generateMarkdownForFile('src/index.ts', process.env.GROQ_API_KEY)
  .then(r => console.log(r))"
```

---

## Important Details & Gotchas

| Topic | Details |
|-------|---------|
| **Model selection** | Currently hard‑coded to `openai/gpt-oss-120b`. Swap the `model` field if you prefer another Groq‑available model. |
| **Token limits** | `max_completion_tokens: 8192` – ensure the source file plus prompt stays well under the model’s context window (≈ 16‑32k tokens depending on the model). Very large files may need to be split or trimmed. |
| **Directory naming** | The docs folder is created next to the source file’s parent folder, with a `-docs` suffix (e.g., `src` → `src-docs`). This avoids polluting the source tree. |
| **File overwriting** | If a `*-guide.md` already exists, it will be **overwritten** without warning. Consider adding a guard if you need versioning. |
| **Error propagation** | Only the error message is returned; stack traces are not exposed. For debugging, you can `console.error(error)` inside the `catch` block before returning. |
| **Dependencies** | - `groq-sdk` (must be installed and compatible with your Node version) <br> - Node ≥ 14 for native `fs/promises` and `path` APIs. |
| **Security** | Never hard‑code the API key. Prefer environment variables or secret‑management solutions. |
| **Testing** | Because the function calls an external LLM, unit tests should mock `Groq.prototype.chat.completions.create` and the `fs` methods. |
| **Extensibility** | - The system prompt can be customized for different documentation styles (e.g., include diagrams). <br> - Output format can be changed by adjusting the prompt and file extension. |

---

## Exported API Summary

| Export | Type | Description |
|--------|------|-------------|
| `GenerateMDResult` | `type` | Result shape returned by the generator. |
| `generateMarkdownForFile` | `async (filePath: string, apiKey: string) => Promise<GenerateMDResult>` | Main utility – reads a file, asks Groq for Markdown documentation, writes it to a sibling `*-docs` folder, and returns the outcome. |

--- 

### TL;DR

```ts
await generateMarkdownForFile('path/to/code.ts', 'my-groq-key');
// → creates `path/to/code-docs/code-guide.md` with AI‑generated Markdown.
```

Use this helper whenever you need **fast, consistent, Markdown‑only documentation** for any source file in a Node/TypeScript project.