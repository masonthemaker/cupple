## `index.ts` – Command Dispatcher

**Purpose**  
Exports the public command‑handler API and provides `executeCommand`, a thin router that parses a raw command string and invokes the appropriate handler.

---

### Key Types / Interfaces (re‑exported)

| Type | Description |
|------|-------------|
| `CommandResult` | Result object returned by a command handler (e.g., message, UI updates). |
| `CommandContext` | Runtime context passed to every handler (e.g., client, logger, state). |
| `CommandHandler` | Signature of a command handler: `(args: string[], ctx: CommandContext) => Promise<CommandResult>` (or sync). |
| `InitScreen` | UI component used by the **/init** command. |

*(All defined in `./types.js`.)*

---

### Main Exported Function

```ts
export const executeCommand = async (
  command: string,
  context: CommandContext,
): Promise<CommandResult | null>
```

| Parameter | Required? | Description |
|-----------|-----------|-------------|
| `command` | ✅ | Raw user input (e.g., `"/status"`). |
| `context` | ✅ | Current `CommandContext` for the session. |

*Returns* a `CommandResult` from the matched handler, or `null` if the input is not a recognized command.

---

### Supported Commands (via `executeCommand`)

| Command | Handler | Argument handling |
|---------|---------|-------------------|
| `/mode`   | `handleModeCommand`   | none |
| `/clear`  | `handleClearCommand`  | none |
| `/status` | `handleStatusCommand` | none |
| `/exit`   | `handleExitCommand`   | none |
| `/pair`   | `handlePairCommand`   | `args` passed |
| `/unpair` | `handleUnpairCommand` | `args` passed |
| `/browse` | `handleBrowseCommand` | `args` passed |
| `/auto`   | `handleAutoCommand`   | `args` passed |
| `/init`   | `handleInitCommand`   | none |

All handlers are also re‑exported for direct use.

---

### Basic Usage Example

```ts
import { executeCommand, type CommandContext } from './index.js';

// Example context (implementation‑specific)
const ctx: CommandContext = {
  client: myClient,
  logger: console,
  // …other required fields
};

async function run() {
  const result = await executeCommand('/status', ctx);
  if (result) {
    console.log('Command succeeded:', result);
  } else {
    console.log('Not a command or unknown command.');
  }
}

run();
```

*The call parses `"/status"`, routes to `handleStatusCommand`, and logs the returned `CommandResult`.*