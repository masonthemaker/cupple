# 📦 `App.tsx` – Core UI Component for **Cupple**

`App.tsx` is the entry‑point React component that powers the **Cupple** command‑line interface (CLI) built with **Ink**.  
It orchestrates:

* Initialization of the local `.cupple` workspace (folders, settings, history)  
* Startup of the internal **CuppleServer** (exposes pairing & file‑transfer APIs)  
* Real‑time file‑system watching (project changes, external history/settings updates)  
* Rendering of the various UI screens (setup, help, file selector, remote/local browsers, pairing prompts)  
* Command parsing & execution (`/help`, `/select`, `/clear`, `/browse`, …)  
* Persistent history & settings handling

---

## Table of Contents

1. [Purpose](#purpose)  
2. [File Structure & Imports](#file-structure--imports)  
3. [Component State](#component-state)  
4. [Side‑Effects (`useEffect`) Overview](#side‑effects-useeffect-overview)  
5. [Key Handlers & Helper Functions](#key-handlers--helper-functions)  
6. [Rendering Logic (UI Flow)](#rendering-logic-ui-flow)  
7. [Usage Example](#usage-example)  
8. [Important Details & Gotchas](#important-details--gotchas)  
9. [Related Files & Types](#related-files--types)  

---

## Purpose

`App` provides a **single‑page, state‑driven CLI** that lets developers:

* **Bridge** frontend & backend codebases by sharing context with AI agents via Markdown.  
* **Track** file creation/modification events automatically in a persistent `history.json`.  
* **Pair** multiple Cupple instances (remote collaboration) and **push/pull** files between them.  
* **Generate** Markdown guides for selected files using the configured LLM API key.  
* **Interact** through a set of slash commands (`/help`, `/select`, `/clear`, `/browse`, …).  

All UI elements are rendered with Ink components (`Box`, `Text`) and custom sub‑components (e.g., `AnimatedTitle`, `HistoryDisplay`).

---

## File Structure & Imports

| Import | Origin | What it Provides |
|--------|--------|------------------|
| `React, useState, useEffect` | `react` | Core React primitives |
| `Box, Text` | `ink` | Ink UI primitives |
| `mkdir` | `fs/promises` | Async folder creation |
| `join, basename` | `path` | Path utilities |
| `watch` | `fs` | File‑system watchers |
| `AnimatedTitle` | `./AnimatedTitle.js` | Animated title banner |
| `HistoryDisplay` | `./HistoryDisplay.js` | Renders the command/history log |
| `InputPrompt` | `./InputPrompt.js` | Text input field |
| `SetupScreen` | `./SetupScreen.js` | First‑run configuration UI |
| `HelpScreen` | `./HelpScreen.js` | Help/usage UI |
| `FileSelector` | `./FileSelector.js` | UI for picking local files (selector mode) |
| `FileBrowser` | `./FileBrowser.js` | Remote file browser (download) |
| `LocalFileBrowser` | `./LocalFileBrowser.js` | Local file browser (push) |
| `PairingRequest` | `./PairingRequest.js` | UI for incoming pairing requests |
| `FileWatcher, loadSettings, saveSettings, loadHistory, saveHistory` | `../utils/index.js` | Helper classes & persistence utilities |
| `CuppleSettings, HistoryItem` | `../utils/index.js` (type) | Type definitions |
| `executeCommand` | `../commands/index.js` | Command dispatcher |
| `CommandContext` | `../commands/index.js` (type) | Context passed to commands |
| `CuppleServer` | `../api/index.js` | Embedded HTTP server for pairing & file transfer |
| `ServerInfo` | `../api/index.js` (type) | Server meta‑data |
| `generateMarkdownForFile` | `../tools/index.js` | LLM‑driven Markdown generation |

---

## Component State

| State | Type | Description |
|-------|------|-------------|
| `query` | `string` | Current user input (the command line). |
| `history` | `HistoryItem[]` | Full UI history (commands, file events, system messages). |
| `settings` | `CuppleSettings \| null` | Loaded user settings (mode, API key, pairing data). |
| `isLoading` | `boolean` | Shows the splash screen while init runs. |
| `serverInfo` | `ServerInfo \| null` | Info about the running Cupple server (URL, port). |
| `showHelp` | `boolean` | Toggles the help screen. |
| `showFileSelector` | `boolean` | Toggles the selector UI (only in *selector* mode). |
| `browsePairedPort` | `number \| null` | Port of a remote instance we are browsing. |
| `pushToPairedPort` | `number \| null` | Port of a remote instance we are pushing files to. |

---

## Side‑Effects (`useEffect`) Overview

| Effect | Trigger | Core Logic |
|--------|---------|------------|
| **Initialize workspace** | `[]` (mount) | • Ensure `.cupple` folder exists.<br>• Start `CuppleServer` and store its info.<br>• Load persisted settings & history.<br>• Set `isLoading` to `false`. |
| **Watch `history.json`** | `[]` | Uses `fs.watch` to reload `history` whenever the file changes (e.g., external pairing notifications). |
| **Watch `cupplesettings.json`** | `[]` | Same as above but for settings (e.g., API key changes, pairing updates). |
| **Watch project files** | `[]` | Instantiates `FileWatcher` (custom utility) that emits events (`file_created`, `file_modified`, `directory_created`). Updates `history` and persists changes. |
| **Cleanup** | return from each effect | Closes the respective watchers when the component unmounts. |

---

## Key Handlers & Helper Functions

### `handleSetupComplete`
* Called by `SetupScreen` once the user selects a mode and provides an API key.  
* Persists the new settings via `saveSettings` and updates local state.

### `handleSubmit`
* Main entry point for every line the user types.  
* Trims the input, then:
  1. Handles **built‑in slash commands** (`/help`, `/select`, any command starting with `/`).  
  2. Creates a `CommandContext` (settings, serverInfo, callbacks) and forwards the command to `executeCommand`.  
  3. Handles special command results (`/clear`, `/browse`).  
  4. Persists command results to history.  
  5. For non‑command input, simply adds the raw text as a history entry.

### Pairing Request Handlers
* `handleAcceptPairing` – Accepts an incoming pairing request, updates settings, creates a `docs` folder, notifies the remote instance, and records the event.  
* `handleDeclinePairing` – Declines the request, notifies the remote instance, and records the event.

### File Selector `onFilesSelected`
* Generates Markdown for each selected file using `generateMarkdownForFile`.  
* Updates history with success/failure items and clears the previous file‑change entries.

### Remote Browser Callbacks
* **Download** – Adds a “downloaded” entry to history and closes the browser.  
* **Push** – Switches UI to `LocalFileBrowser` for pushing files.

---

## Rendering Logic (UI Flow)

The component renders **one** of the following screens based on state:

1. **Loading Screen** – Shown while `isLoading` is `true`.  
2. **Setup Screen** – When `settings` is `null`.  
3. **Help Screen** – When `showHelp` is `true`.  
4. **Remote File Browser** – When `browsePairedPort` is set.  
5. **Local File Browser (Push)** – When `pushToPairedPort` is set.  
6. **File Selector** – When `showFileSelector` is `true` (selector mode).  
7. **Main Dashboard** – Default view showing:
   * Title banner (`AnimatedTitle`) + server URL + API key status.  
   * Optional `PairingRequest` UI (if `settings.pendingPairingRequest`).  
   * `HistoryDisplay` (the scrollable log).  
   * `InputPrompt` (the command line).

All screens share a common header with the animated title and a short tagline:

```
Bridge your frontend & backend—seamlessly share context between AI agents via markdown
```

---

## Usage Example

Assuming the repository is already built and the CLI entry point runs `node ./dist/cli.js` (or via `npm start`), the typical workflow looks like this:

```bash
$ npx cupple          # or `npm run cupple`
```

1. **First Run – Setup**  
   * Choose **auto** or **selector** mode.  
   * Paste your LLM API key (e.g., OpenAI).  

2. **Main Dashboard**  
   * The prompt appears at the bottom: `>`  
   * Type `/help` → Help screen appears.  
   * Type `/select` (selector mode) → File selector UI opens.  

3. **Generating Markdown (selector mode)**  
   ```bash
   > /select
   # pick files in the UI
   # after selection Cupple will display:
   ✓ Generating markdown for 3 files...
   ✓ Generated guide for <file1>
   ✗ Failed to generate guide for <file2>: <error>
   ```

4. **Pairing with another instance** (on the remote side run the same command)  
   * The remote instance will receive a `PairingRequest` UI.  
   * Accept → both instances can now browse/push files via `/browse` or the UI buttons.

5. **Browsing Remote Files**  
   ```bash
   > /browse 3001   # (result from a pairing command)
   # FileBrowser opens, you can download files.
   ```

6. **Pushing Local Files**  
   * In the remote browser UI, click **Push** → switches to `LocalFileBrowser`.  

7. **Clearing History**  
   ```bash
   > /clear
   # History cleared, UI updates instantly.
   ```

8. **Exiting**  
   ```bash
   > /exit
   # Or press Ctrl‑C
   ```

---

## Important Details & Gotchas

| Topic | Details |
|-------|----------|
| **Persistent Storage** | All settings are stored in `.cupple/cupplesettings.json`. History lives in `.cupple/history.json`. Deleting these files resets the app. |
| **FileWatcher** | Only watches the **current working directory** (`process.cwd()`). It aggregates line changes for consecutive `file_modified` events to avoid spamming the history. |
| **Command Extensibility** | New slash commands can be added in `../commands/index.ts` – they receive a `CommandContext` that lets them update settings, clear history, or exit the process. |
| **API Key Validation** | The UI only checks that `settings.apiKey` is a non‑empty string. Validation (e.g., format) should be performed inside the command that uses the key. |
| **Pairing Security** | Pairing is done over `http://localhost:<port>` only. No authentication is performed; it is assumed that both instances run on the same developer machine or a trusted network. |
| **Port Collisions** | `CuppleServer.start()` picks an available port and returns it in `ServerInfo`. If the port is already bound, the server will throw – the UI currently does not handle that case gracefully. |
| **Error Handling** | Most `try/catch` blocks silently ignore errors (e.g., folder already exists). Critical failures (e.g., inability to start the server) will cause the component to stay in a loading state. |
| **React‑Ink Limitations** | Ink does not support native scrollbars; `HistoryDisplay` must implement its own pagination/scroll logic (outside the scope of this file). |
| **Testing** | Because the component heavily relies on side‑effects (FS, network), unit testing should mock `fs`, `watch`, `CuppleServer`, and all imported UI sub‑components. |
| **TypeScript** | The file is written in TSX. Types are imported from `../utils` and `../api`; ensure those modules export the exact shapes (`CuppleSettings`, `HistoryItem`, `ServerInfo`). |

---

## Related Files & Types

| File | Role |
|------|------|
| `../utils/index.js` | `FileWatcher` class, persistence helpers (`loadSettings`, `saveSettings`, `loadHistory`, `saveHistory`), TypeScript types. |
| `../commands/index.js` | Command dispatcher (`executeCommand`) and `CommandContext` interface. |
| `../api/index.js` | `CuppleServer` implementation (HTTP server handling `/cupple/pair/*` routes). |
| `../tools/index.js` | `generateMarkdownForFile` – calls the LLM API to produce Markdown guides. |
| `./AnimatedTitle.js` | Animated banner component. |
| `./HistoryDisplay.js` | Renders the scrollable log of `HistoryItem`s. |
| `./InputPrompt.js` | Ink input field that captures user typing. |
| `./SetupScreen.js` | First‑run UI for choosing mode & entering API key. |
| `./HelpScreen.js` | Static help documentation UI. |
| `./FileSelector.js` | UI for picking multiple local files (selector mode). |
| `./FileBrowser.js` | UI for browsing remote files (download). |
| `./LocalFileBrowser.js` | UI for browsing local files to push to a remote instance. |
| `./PairingRequest.js` | UI that shows an incoming pairing request with Accept / Decline buttons. |

---

### Quick Reference Cheat‑Sheet (Commands)

| Command | Description | Example |
|---------|-------------|---------|
| `/help` | Show help screen | `> /help` |
| `/select` | Open file selector (only in **selector** mode) | `> /select` |
| `/clear` | Clear history (persisted) | `> /clear` |
| `/browse <port>` | Open remote file browser for paired instance on `<port>` | `> /browse 3002` |
| `/push <port>` | Switch to push UI for remote instance on `<port>` (triggered via UI button) | – |
| `/exit` | Exit the CLI (calls `process.exit(0)`) | `> /exit` |
| Any other `/…` | Custom commands defined in `../commands` | `> /pair <url>` |

---

## 🎉 Summary

`App.tsx` is the **brain** of the Cupple CLI, wiring together:

* **Persistence** (settings & history)  
* **Real‑time file watching**  
* **Server lifecycle** (pairing & file transfer)  
* **Dynamic UI** (setup, help, browsers, selector)  
* **Command processing** (slash commands, LLM‑driven markdown generation)

Understanding this component is the key to extending Cupple—whether you want to add new commands, enrich the UI, or change the pairing protocol. Happy hacking! 🚀