## 📄 `autodoc.ts` – Auto‑generate Markdown docs on file changes

**Purpose**  
Watches source files, accumulates line‑change counts, and automatically (or on demand) creates/updates Markdown documentation using the supplied API key. Handles debounce, cooldown, and per‑extension detail levels.

---

### 🔧 Exported Types & Interfaces  

| Type | Description |
|------|-------------|
| **`AutodocConfig`** | Settings for the controller. **Required**: <br>`changeThreshold: number` – lines changed before a doc run.<br>`generateOnCreate: boolean` – generate docs immediately for new files. |
| `fileExtensions?: string[]` *(deprecated)* | Fallback list of extensions. |
| `extensionConfigs?: ExtensionConfig[]` | Per‑extension `{ extension, detailLevel }` config. |
| `excludeDirs?: string[]` | Directories to ignore (default: `node_modules`, `dist`, `.cupple`, `.git`, `docs`). |
| `cooldownMs?: number` | Minimum ms between docs for the same file (default 30 s). |
| `debounceMs?: number` | Wait time after the last change before generating (default 10 s). |
| `docDetailLevel?: DocDetailLevel` *(deprecated)* | Global detail level fallback. |
| **`AutodocResult`** | Result passed to the callback. <br>`filePath`, `success`, optional `outputPath`, optional `error`. |
| **`AutodocCallback`** | `(result: AutodocResult) => void` – invoked after each generation attempt. |

*Re‑exported for consumers*: `ExtensionConfig`, `DocDetailLevel`.

---

### 🏗️ `AutodocController`  

| Constructor | Parameters |
|-------------|------------|
| `new AutodocController(apiKey, config, callback)` | `apiKey: string` – key for the doc‑generation service.<br>`config: AutodocConfig` – see above.<br>`callback: AutodocCallback` – receives the result. |

#### Core Methods (public)

| Method | What it does |
|--------|--------------|
| `createWatcherCallback(): FileWatcherCallback` | Returns a function to feed `FileSystemEvent`s (creation/modification). Handles thresholds, debounce, cooldown, and exclusion logic. |
| `documentFile(filePath: string): Promise<void>` | Force‑run documentation for a single file (skips exclusion check). |
| `resetFileTracking(filePath: string): void` | Clears change counters, cooldown, and any pending debounce timer for the given file. |
| `getFileChanges(filePath: string): number` | Current accumulated line‑change count. |
| `isFileDocumented(filePath: string): boolean` | Whether the file has ever been successfully documented. |
| `reset(): void` | Clears *all* internal state and pending timers. |

*Private helpers* (not part of the public API): `getDetailLevelForFile`, `isInCooldown`, `shouldExclude`, `generateDocumentation`.

---

### 🚀 Quick Usage Example  

```ts
import { AutodocController } from './autodoc.js';
import { startFileWatcher } from '../utils/fileWatcher.js'; // hypothetical

// 1️⃣ Configure
const cfg = {
  changeThreshold: 20,          // generate after 20 lines changed
  generateOnCreate: true,
  extensionConfigs: [
    { extension: '.ts', detailLevel: 'detailed' },
    { extension: '.js', detailLevel: 'standard' },
  ],
  excludeDirs: ['node_modules', 'dist'],
};

// 2️⃣ Callback to receive results
function onDocResult(res) {
  if (res.success) {
    console.log(`✅ Docs updated: ${res.outputPath}`);
  } else {
    console.warn(`❌ Doc error (${res.filePath}): ${res.error}`);
  }
}

// 3️⃣ Create controller
const controller = new AutodocController('YOUR_API_KEY', cfg, onDocResult);

// 4️⃣ Hook into your file‑watcher
const watcher = startFileWatcher();               // returns an object with `on(event, cb)`
watcher.on('change', controller.createWatcherCallback());

// 5️⃣ (optional) Manually trigger for a file
// await controller.documentFile('src/utils/helpers.ts');
```

*That’s it – the controller now watches for changes, debounces them, respects cooldowns, and keeps you up‑to‑date with fresh Markdown documentation.*