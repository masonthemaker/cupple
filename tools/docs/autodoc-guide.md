## 📄 `autodoc.ts` – Auto‑generate Markdown docs on file changes

**What it does**  
Watches source files, counts changed lines, and automatically (or on‑demand) creates or updates Markdown documentation.  
It respects per‑extension detail levels, a change‑threshold, debounce, and cooldown logic, and skips configured directories and markdown files.

---

### 🔧 Exported Types & Interfaces  

| Type | Description |
|------|-------------|
| **`AutodocConfig`** | Configuration for the controller. |
| `changeThreshold: number` | Minimum number of changed lines before a doc run is triggered (required). |
| `generateOnCreate: boolean` | If `true`, docs are generated immediately when a new file appears. |
| `fileExtensions?: string[]` *(deprecated)* | Legacy list of extensions – used only when `extensionConfigs` is missing. |
| `extensionConfigs?: ExtensionConfig[]` | `{ extension: string, detailLevel: DocDetailLevel }` – preferred per‑extension config. |
| `excludeDirs?: string[]` | Directories to ignore (default: `node_modules`, `dist`, `.cupple`, `.git`, `docs`). |
| `cooldownMs?: number` | Minimum ms between docs for the same file (default **30 000 ms**). |
| `debounceMs?: number` | Wait time after the last change before generating (default **20 000 ms**). |
| `docDetailLevel?: DocDetailLevel` *(deprecated)* | Global fallback when `extensionConfigs` is absent. |
| **`AutodocResult`** | Result passed to the callback. |
| `filePath: string` | Path of the processed file. |
| `success: boolean` | `true` if documentation succeeded. |
| `outputPath?: string` | Path of the generated Markdown file (on success). |
| `error?: string` | Error message (on failure). |
| **`AutodocCallback`** | `(result: AutodocResult) => void` – invoked after each generation attempt. |

*Re‑exported for consumers*: `ExtensionConfig`, `DocDetailLevel`.

---

### 🏗️ `AutodocController`

#### Constructor
```ts
new AutodocController(
  apiKey: string,          // doc‑generation service key
  config: AutodocConfig,   // see table above
  callback: AutodocCallback
)
```

#### Public API (core methods)

| Method | Behaviour |
|--------|-----------|
| `createWatcherCallback(): FileWatcherCallback` | Returns a function you can feed `FileSystemEvent`s (creation/modification). Handles exclusion, threshold, debounce, and cooldown automatically. |
| `documentFile(filePath: string): Promise<void>` | Force‑run documentation for a single file (exclusion still applies). |
| `resetFileTracking(filePath: string): void` | Clears change count, cooldown, and any pending debounce timer for the given file. |
| `getFileChanges(filePath: string): number` | Current accumulated line‑change count for the file. |
| `isFileDocumented(filePath: string): boolean` | Whether the file has ever been successfully documented. |
| `reset(): void` | Clears **all** internal state and cancels every pending timer. |

*Private helpers* (not part of the public API): `getDetailLevelForFile`, `isInCooldown`, `shouldExclude`, `generateDocumentation`.

#### Implementation Highlights

* **Extension → detail level mapping**  
  *If `extensionConfigs` is provided*, a `Map<string, DocDetailLevel>` is built directly from it.  
  *Otherwise*, the controller falls back to the deprecated `fileExtensions` + `docDetailLevel` (or defaults to `'standard'` for extensions `['.ts', '.tsx', '.js', '.jsx']`).

* **Debounce & Cooldown flow**  
  1. **Change accumulation** – Every `file_modified` event adds `event.linesChanged` to an internal counter (`fileChanges`).  
  2. **Threshold check** – When the accumulated count reaches `changeThreshold`, a debounce timer (`debounceMs`) is (re)started.  
  3. **Cooldown guard** – A timer is only created if the file is **not** currently in a cooldown period (`cooldownMs`).  
  4. **Timer fires** –  
     * The timer is removed from tracking.  
     * Cooldown is **set before** generation to avoid race conditions.  
     * Documentation is generated with the *final* accumulated change count.  
     * After generation the change counter is reset to `0`.  

* **`generateOnCreate`** – When a `file_created` event arrives and `generateOnCreate` is `true`, documentation runs immediately (no debounce). If `false`, the initial line count is stored for later threshold evaluation.

* **Exclusion logic** (`shouldExclude`)  
  * Skips any path that contains one of the `excludeDirs`.  
  * Skips markdown files (`*.md`).  
  * Skips files whose extension is not present in the built extension‑detail map.  

* **Documentation generation** (`generateDocumentation`)  
  Uses `updateMarkdownForFile`, which intelligently updates an existing doc or creates a new one, then invokes the supplied callback with an `AutodocResult`.  
  On success the file path is added to `documentedFiles`. Cooldown timing is already handled by the caller.

* **State tracking**  
  * `fileChanges` – cumulative line changes per file.  
  * `documentedFiles` – set of files that have successfully been documented.  
  * `lastDocumentedTime` – timestamp of the last successful doc run per file (used for cooldown).  
  * `pendingTimers` – active debounce timers per file.

---

### 🚀 Quick Usage Example  

```ts
import { AutodocController } from './autodoc.js';
import { startFileWatcher } from '../utils/fileWatcher.js'; // your watcher implementation

// 1️⃣ Configuration
const cfg = {
  changeThreshold: 15,          // generate after 15 lines changed
  generateOnCreate: true,
  extensionConfigs: [
    { extension: '.ts',  detailLevel: 'detailed' },
    { extension: '.js',  detailLevel: 'standard' },
  ],
  excludeDirs: ['node_modules', 'dist'],
  // optional overrides (defaults shown)
  // debounceMs: 25000,
  // cooldownMs: 40000,
};

// 2️⃣ Result callback
function onResult(res) {
  if (res.success) {
    console.log(`✅ Docs written to ${res.outputPath}`);
  } else {
    console.warn(`❌ Doc error for ${res.filePath}: ${res.error}`);
  }
}

// 3️⃣ Create controller
const controller = new AutodocController('YOUR_API_KEY', cfg, onResult);

// 4️⃣ Wire into your file‑watcher
const watcher = startFileWatcher();               // returns an EventEmitter‑like object
watcher.on('change', controller.createWatcherCallback());

// 5️⃣ (optional) Manual trigger for a specific file
// await controller.documentFile('src/utils/helpers.ts');

// 6️⃣ (optional) Reset tracking for a file or the whole controller
// controller.resetFileTracking('src/utils/helpers.ts');
// controller.reset();
```

That’s it – the controller now watches, debounces, respects cooldowns, handles creation events, and keeps your Markdown documentation up‑to‑date.