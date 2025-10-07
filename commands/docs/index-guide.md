## `index.ts` – Command Dispatcher  

**Purpose**  
Exports the public command‑handler API and provides `executeCommand`, a thin router that parses a raw command string, normalises it, and invokes the appropriate handler.

---  

### Key Types / Interfaces (re‑exported)

| Type | Description |
|------|-------------|
| `CommandResult` | Result object returned by a command handler (e.g., a message, UI updates, navigation actions). |
| `CommandContext` | Runtime context passed to every handler (e.g., client, logger, auth state, UI helpers). |
| `CommandHandler` | Signature of a command handler: `(args: string[], ctx: CommandContext) => Promise<CommandResult>` **or** a synchronous function returning `CommandResult`. |
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
| `command` | ✅ | Raw user input (e.g., `"/status"`). The string is **trimmed** and **lower‑cased** before routing. |
| `context` | ✅ | Current `CommandContext` for the session. |

*Returns* a `CommandResult` from the matched handler, or `null` when the input is not a recognised command.

---  

### Exported Handlers  

All command handlers are re‑exported for direct use:

| Export | Source File |
|--------|-------------|
| `handleModeCommand` | `./mode.js` |
| `handleClearCommand` | `./clear.js` |
| `handleStatusCommand` | `./status.js` |
| `handleExitCommand` | `./exit.js` |
| `handlePairCommand` | `./pair.js` |
| `handleUnpairCommand` | `./unpair.js` |
| `handleBrowseCommand` | `./browse.js` |
| `handleAutoCommand` | `./auto.js` |
| `handleInitCommand` | `./init.js` |
| `handleRedocCommand` | `./redoc.js` |
| `handleDiscordCommand` | `./discord.js` |
| `handleLoginCommand` | `./login.js` |
| `handleLogoutCommand` | `./logout.js` |
| `InitScreen` | `./init.js` |

---  

### Supported Commands (via `executeCommand`)

| Command | Handler | Argument handling |
|---------|---------|-------------------|
| `/mode`   | `handleModeCommand`   | none |
| `/clear`  | `handleClearCommand`  | none |
| `/status` | `handleStatusCommand` | none |
| `/exit`   | `handleExitCommand`   | none |
| `/pair`   | `handlePairCommand`   | `args` (array of strings) passed |
| `/unpair` | `handleUnpairCommand` | `args` passed |
| `/browse` | `handleBrowseCommand` | `args` passed |
| `/auto`   | `handleAutoCommand`   | `args` passed |
| `/init`   | `handleInitCommand`   | none |
| `/redoc`  | `handleRedocCommand`  | `args` passed (signature `handleRedocCommand(context, args)`) |
| `/discord`| `handleDiscordCommand`| none (async) |
| `/login`  | `handleLoginCommand`  | none (async) |
| `/logout` | `handleLogoutCommand` | none (async) |

All handlers are also available as named exports for direct invocation.

---  

### Basic Usage Example  

```ts
import { executeCommand, type CommandContext } from './index.js';

// Example context – shape is defined by `CommandContext`
const ctx: CommandContext = {
  client: myClient,
  logger: console,
  // …any other required fields
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

*The call trims and lower‑cases `"/status"`, routes it to `handleStatusCommand`, and logs the returned `CommandResult`.*  

---  

### Notable Implementation Details  

* **Normalization** – `executeCommand` automatically trims whitespace and lower‑cases the incoming command, so callers do not need to worry about case or surrounding spaces.  
* **Async handling** – Handlers may be synchronous or return a `Promise`. `executeCommand` `await`s the result where necessary (e.g., `/mode`, `/discord`, `/login`, `/logout`).  
* **Argument passing** – For commands that accept additional parameters (`/pair`, `/unpair`, `/browse`, `/auto`, `/redoc`), the remaining tokens after the command name are supplied as an `args: string[]` array to the handler.  
* **Extensibility** – Adding a new command only requires exporting the handler and adding a `case` clause in the switch; the public API automatically exposes the new handler.  

---  

### Future‑proofing  

The module is deliberately simple: a single `switch` statement routes commands, making it easy to audit and extend. All exported symbols are typed, ensuring TypeScript consumers receive accurate autocomplete and compile‑time safety.