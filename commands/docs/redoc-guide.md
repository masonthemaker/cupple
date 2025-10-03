# `handleRedocCommand`

**Purpose**  
Processes the `/redoc` slash‑command to (re)generate Markdown documentation for a source file, optionally guided by user‑provided notes.

---

## Key Types / Interfaces  

| Type | Minimal Description |
|------|----------------------|
| `CommandContext` | Contains runtime settings (`apiKey`, optional `extensionConfigs`, optional `docDetailLevel`). |
| `CommandResult` | Result object returned to the caller: `{ success: boolean, message: string, color: string }`. |
| `ExtensionConfig` *(used inside `CommandContext`)* | `{ extension: string, detailLevel: 'brief' \| 'standard' \| 'comprehensive' }`. |

---

## Main Function  

```ts
export const handleRedocCommand = async (
  context: CommandContext,
  args: string[]
) : Promise<CommandResult>
```

### Required Parameters  

| Parameter | Type | Description |
|-----------|------|-------------|
| `context` | `CommandContext` | Execution context; must include a valid `apiKey`. |
| `args`    | `string[]`    | Command arguments. `args[0]` **must** be the target file path. Anything after the first token is treated as free‑form notes. |

### Behaviour (high‑level)

1. **Validate arguments** – returns usage help if none supplied.  
2. **Check API key** – aborts if `context.settings.apiKey` is missing.  
3. **Resolve file path** – supports absolute or relative paths.  
4. **Verify existence & extension** – only a whitelist of source extensions is allowed.  
5. **Determine documentation detail level** – from `extensionConfigs` or global `docDetailLevel`.  
6. **Call** `updateMarkdownForFile(fullPath, apiKey, detailLevel, notes?)`.  
7. **Return** a `CommandResult` indicating success/failure, a human‑readable message, and a colour code (`#22c55e` for success, `#ef4444` for error).  

---

## Basic Usage Example  

```ts
import { handleRedocCommand } from './redoc';
import type { CommandContext } from './types';

const ctx: CommandContext = {
  settings: {
    apiKey: process.env.OPENAI_API_KEY!,
    docDetailLevel: 'standard',
    // optional per‑extension overrides
    extensionConfigs: [{ extension: '.tsx', detailLevel: 'comprehensive' }],
  },
};

async function run() {
  const result = await handleRedocCommand(ctx, [
    'src/components/App.tsx',          // file to document
    'Focus on the new autodoc flow',   // optional notes
  ]);

  console.log(result.message); // e.g. "✓ Updated documentation for App.tsx (with guidance)"
}

run();
```

*The function returns a `Promise<CommandResult>`; handle the `success` flag and `message` as needed.*