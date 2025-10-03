# `init.tsx` – Interactive Autodoc Initialization Screen  

> **File:** `src/commands/init.tsx`  
> **Language:** TypeScript (React + Ink)  

## Table of Contents
1. [Purpose](#purpose)  
2. [High‑Level Structure](#high‑level-structure)  
3. [Key Types & Constants](#key-types--constants)  
4. [Main Component – `InitScreen`](#main-component--initscreen)  
   - [Props](#props)  
   - [State & UI Flow](#state--ui-flow)  
   - [Keyboard handling (`useInput`)](#keyboard-handling-useinput)  
   - [`handleComplete`](#handlecomplete)  
   - [Rendering logic](#rendering-logic)  
5. [Helper Export – `handleInitCommand`](#helper-export--handleinitcommand)  
6. [Integration & Usage Example](#integration--usage-example)  
7. [Important Details & Gotchas](#important-details--gotchas)  
8. [Dependencies](#dependencies)  

---

## Purpose
`init.tsx` implements a **real, functional Ink wizard** that guides the user through the initial configuration of Cupple’s autodocumentation:

1. **Select one or more file‑type presets** (multi‑select with check‑boxes).  
2. **Optionally add custom extensions** via a visible text prompt.  
3. **Choose a documentation‑detail level** (brief / standard / comprehensive).  
4. **Choose a line‑change threshold** (tiny → big).  

When the wizard finishes it persists the settings with `saveSettings`, updates the surrounding `CommandContext`, and reports success via `onComplete`.

---

## High‑Level Structure
```
init.tsx
│
├─ Imports (React, Ink, utils, types)
│
├─ Type definitions
│   ├─ ThresholdOption
│   ├─ ExtensionOption
│   └─ DetailOption
│
├─ Constant data
│   ├─ THRESHOLD_OPTIONS   (4 preset thresholds)
│   ├─ EXTENSION_PRESETS   (7 preset extension groups)
│   └─ DETAIL_OPTIONS      (3 documentation‑detail presets)
│
├─ Interface: InitScreenProps
│
├─ React component: InitScreen
│   ├─ useState hooks (step, indices, selections, custom input)
│   ├─ useInput handler (keyboard navigation & data entry)
│   ├─ handleComplete (persist & report)
│   └─ Conditional render for the four steps
│
└─ Exported async function: handleInitCommand
```

---

## Key Types & Constants  

### `ThresholdOption`
```ts
type ThresholdOption = {
  name: string;
  value: number;
  description: string;
};
```

### `ExtensionOption`
```ts
type ExtensionOption = {
  name: string;
  extensions: string[];
};
```

### `DetailOption`
```ts
type DetailOption = {
  name: string;                     // UI label
  value: 'brief' | 'standard' | 'comprehensive';
  description: string;             // Short explanation
};
```

### `THRESHOLD_OPTIONS`
| name   | value | description |
|--------|-------|-------------|
| **tiny**   | 10  | Very aggressive – docs every ~10 line change |
| **small**  | 20  | Aggressive – docs every ~20 line change |
| **medium** | 40  | Balanced – docs every ~40 line change (recommended) |
| **big**    | 200 | Conservative – docs only on major changes (200+ lines) |

### `EXTENSION_PRESETS`
| name                     | extensions |
|--------------------------|------------|
| JavaScript/TypeScript    | `.js`, `.jsx`, `.ts`, `.tsx` |
| Python                   | `.py` |
| Java                     | `.java` |
| Go                       | `.go` |
| Rust                     | `.rs` |
| C/C++                    | `.c`, `.cpp`, `.h`, `.hpp` |
| **All code files**       | `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.java`, `.go`, `.rs`, `.c`, `.cpp` |

### `DETAIL_OPTIONS`
| name          | value        | description |
|---------------|--------------|-------------|
| **Brief**     | `brief`      | Concise docs – key types, props, basic usage (~30 % tokens) |
| **Standard**  | `standard`   | Balanced docs – includes examples & details (recommended) |
| **Comprehensive** | `comprehensive` | Full‑blown docs – extensive examples, gotchas, all features (~70 % more tokens) |

---

## Main Component – `InitScreen`

### Signature
```tsx
export const InitScreen: React.FC<InitScreenProps>
```

### Props (`InitScreenProps`)
| Prop | Type | Description |
|------|------|-------------|
| `context` | `CommandContext` | Provides current `CuppleSettings` and an `onSettingsUpdate` callback. |
| `onComplete` | `(result: CommandResult) => void` | Called when the wizard finishes (success or cancellation). |

### State & UI Flow
| State variable | Type | Default / Purpose |
|----------------|------|-------------------|
| `step` | `'main' \| 'custom' \| 'detail' \| 'threshold'` | Starts at `'main'` (extensions selection). |
| `selectedIndex` | `number` | Generic cursor index (used internally for navigation). |
| `selectedDetailIndex` | `number` | `1` – points at **Standard** detail level (default). |
| `selectedThresholdIndex` | `number` | `2` – points at **medium** threshold (default). |
| `configurations` | `ExtensionConfig[]` | Holds per‑extension detail‑level overrides (currently unused by UI). |
| `currentPresetIndex` | `number \| null` | Tracks which preset is currently highlighted. |
| `customInput` | `string` | Raw text typed in the **custom extensions** step. |
| *(internal)* `selectedPresets` – `Set<number>` | Stores indices of presets toggled with **Space**. |
| *(internal)* `selectedExtensions` – `string[]` | Holds custom extensions entered by the user. |

### Keyboard handling (`useInput`)

| Step | Key | Effect |
|------|-----|--------|
| **extensions** (`step === 'extensions'`) | `↑ / ↓` | Move the highlight up or down through the preset list (including the “Custom extensions…” row). |
|  | `Space` | Toggle the highlighted preset on/off (adds/removes its index from `selectedPresets`). If the highlight is on the **Custom** row, the wizard jumps to the **custom** step. |
|  | `Enter` | Advance to the **detail** step. |
|  | `Esc` | Abort the whole init process – `onComplete({ success:false, … })`. |
| **custom** (`step === 'custom'`) | Printable characters | Append to `customInput`. |
|  | `Backspace / Delete` | Remove the last character from `customInput`. |
|  | `Enter` | Parse `customInput` as a comma‑separated list, normalise each entry to start with a leading dot, merge into `selectedExtensions`, then return to the **extensions** screen. |
|  | `Esc` | Discard the typed text and return to **extensions**. |
| **detail** (`step === 'detail'`) | `↑ / ↓` | Cycle through the three `DETAIL_OPTIONS`. |
|  | `Enter` | Advance to the **threshold** step. |
|  | `Esc` | Return to **extensions**. |
| **threshold** (`step === 'threshold'`) | `↑ / ↓` | Cycle through the four `THRESHOLD_OPTIONS`. |
|  | `Enter` | Call `handleComplete()` (persist settings & report success). |
|  | `Esc` | Go back to the **detail** step. |

### `handleComplete`
```ts
const handleComplete = async () => {
  const threshold = THRESHOLD_OPTIONS[selectedThresholdIndex];
  const detailLevel = DETAIL_OPTIONS[selectedDetailIndex];

  // Gather extensions from selected presets
  const allExtensions = new Set<string>();
  selectedPresets.forEach(idx => {
    EXTENSION_PRESETS[idx].extensions.forEach(ext => allExtensions.add(ext));
  });

  // Add any custom extensions
  selectedExtensions.forEach(ext => allExtensions.add(ext));

  const finalExtensions = Array.from(allExtensions);

  const updatedSettings: CuppleSettings = {
    ...context.settings,
    autodocThreshold: threshold.value,
    autodocExtensions: finalExtensions,
    docDetailLevel: detailLevel.value,
  };

  await saveSettings(updatedSettings);
  context.onSettingsUpdate(updatedSettings);

  const extString = finalExtensions.slice(0, 5).join(', ') +
    (finalExtensions.length > 5 ? '...' : '');

  onComplete({
    success: true,
    message: `✓ Autodoc configured: ${detailLevel.name} docs, ${threshold.name} threshold (${threshold.value} lines), ${finalExtensions.length} extensions (${extString})`,
    color: '#22c55e',
  });
};
```
* Merges the chosen **threshold**, **detail level**, and **extensions** into the existing settings.  
* Persists the result with `saveSettings`.  
* Notifies the surrounding app via `context.onSettingsUpdate`.  
* Calls `onComplete` with a success `CommandResult`.

### Rendering logic
The component renders one of four screens based on `step`.

#### 1. Extensions selection (`step === 'extensions'`)
```tsx
<Box flexDirection="column" paddingY={1}>
  <Box marginBottom={1}>
    <Text bold color="#a855f7">
      Select file types to watch for auto-documentation:
    </Text>
    <Text dimColor> (Space to toggle, Enter to continue)</Text>
  </Box>

  {EXTENSION_PRESETS.map((preset, index) => {
    const isSelected = selectedPresets.has(index);
    const isCurrent = index === selectedExtensionIndex;
    return (
      <Box key={preset.name} marginLeft={2}>
        <Text color={isCurrent ? '#22c55e' : undefined}>
          {isCurrent ? '▸ ' : '  '}
          {isSelected ? '[✓] ' : '[ ] '}
          {preset.name}
        </Text>
        <Text dimColor> ({preset.extensions.join(', ')})</Text>
      </Box>
    );
  })}

  <Box marginLeft={2} marginTop={1}>
    <Text color={selectedExtensionIndex === EXTENSION_PRESETS.length ? '#22c55e' : undefined}>
      {selectedExtensionIndex === EXTENSION_PRESETS.length ? '▸ ' : '  '}
      [+] Custom extensions...
    </Text>
    {selectedExtensions.length > 0 && (
      <Text dimColor> ({selectedExtensions.join(', ')})</Text>
    )}
  </Box>

  <Box marginTop={1}>
    <Text dimColor>
      ↑/↓ Navigate • Space Toggle • Enter Continue • Esc Cancel
    </Text>
  </Box>
</Box>
```
* Check‑boxes (`[✓]` / `[ ]`) show which presets are selected.  
* The **Custom extensions…** row lets the user jump to the custom‑input step.  

#### 2. Custom extensions entry (`step === 'custom'`)
```tsx
<Box flexDirection="column" paddingY={1}>
  <Box marginBottom={1}>
    <Text bold color="#a855f7">Enter custom file extensions:</Text>
  </Box>

  <Box marginLeft={2} marginBottom={1}>
    <Text dimColor>
      Enter extensions separated by commas (e.g., .vue, .svelte, .rb)
    </Text>
  </Box>

  <Box marginLeft={2} marginBottom={1}>
    <Text color="#22c55e">
      {customInput || <Text dimColor>(type extensions…)</Text>}
    </Text>
  </Box>

  <Box marginTop={1}>
    <Text dimColor>Enter Confirm • Esc Back</Text>
  </Box>
</Box>
```
* Visible text field shows what the user types.  

#### 3. Documentation detail level (`step === 'detail'`)
```tsx
<Box flexDirection="column" paddingY={1}>
  <Box marginBottom={1}>
    <Text bold color="#a855f7">Select documentation detail level:</Text>
  </Box>

  {DETAIL_OPTIONS.map((option, index) => (
    <Box key={option.value} flexDirection="column" marginLeft={2} marginBottom={1}>
      <Box>
        <Text color={index === selectedDetailIndex ? '#22c55e' : undefined} bold>
          {index === selectedDetailIndex ? '▸ ' : '  '}
          {option.name}
        </Text>
      </Box>
      <Box marginLeft={4}>
        <Text dimColor>{option.description}</Text>
      </Box>
    </Box>
  ))}

  <Box marginTop={1}>
    <Text dimColor>↑/↓ Navigate • Enter Continue • Esc Back</Text>
  </Box>
</Box>
```

#### 4. Threshold selection (`step === 'threshold'`)
```tsx
<Box flexDirection="column" paddingY={1}>
  <Box marginBottom={1}>
    <Text bold color="#a855f7">Select documentation trigger threshold:</Text>
  </Box>

  {THRESHOLD_OPTIONS.map((option, index) => (
    <Box key={option.name} flexDirection="column" marginLeft={2} marginBottom={1}>
      <Box>
        <Text color={index === selectedThresholdIndex ? '#22c55e' : undefined} bold>
          {index === selectedThresholdIndex ? '▸ ' : '  '}
          {option.name} ({option.value} lines)
        </Text>
      </Box>
      <Box marginLeft={4}>
        <Text dimColor>{option.description}</Text>
      </Box>
    </Box>
  ))}

  <Box marginTop={1}>
    <Text dimColor>↑/↓ Navigate • Enter Confirm • Esc Back</Text>
  </Box>
</Box>
```

---

## Helper Export – `handleInitCommand`

```ts
export const handleInitCommand = async (
  context: CommandContext,
): Promise<CommandResult> => ({
  success: true,
  message: 'init:show',
  color: '#a855f7',
});
```

* The CLI dispatcher calls this function for `cupple init`.  
* It returns a sentinel `CommandResult` (`message: 'init:show'`).  
* The host app interprets the sentinel as “mount `<InitScreen …/>`”, letting the interactive wizard run.

---

## Integration & Usage Example

```tsx
// src/app.tsx
import React, {useState, useEffect} from 'react';
import {render, Box, Text} from 'ink';
import {InitScreen, handleInitCommand} from './commands/init';
import type {CommandContext, CommandResult} from './commands/types';
import {loadSettings} from './utils';

const App: React.FC = () => {
  const [settings, setSettings] = useState<CuppleSettings>({} as CuppleSettings);
  const [activeScreen, setActiveScreen] = useState<null | 'init'>(null);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);

  useEffect(() => {
    (async () => setSettings(await loadSettings()))();
  }, []);

  const context: CommandContext = {settings, onSettingsUpdate: setSettings};

  const runInit = async () => {
    const result = await handleInitCommand(context);
    if (result.message === 'init:show') setActiveScreen('init');
    else setLastResult(result);
  };

  useEffect(() => {
    runInit();
  }, []);

  if (activeScreen === 'init') {
    return (
      <InitScreen
        context={context}
        onComplete={res => {
          setLastResult(res);
          setActiveScreen(null);
        }}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Text>{lastResult?.message ?? 'Ready.'}</Text>
    </Box>
  );
};

render(<App />);
```

**Adoption steps**

1. Export `handleInitCommand` in your command registry.  
2. When the user runs `cupple init`, call `handleInitCommand(context)`.  
3. If the returned `CommandResult.message` equals `'init:show'`, render `<InitScreen …/>`.  
4. The wizard persists the configuration via `saveSettings` and invokes `onComplete`.  

---

## Important Details & Gotchas

| Topic | Current Behaviour |
|-------|-------------------|
| **Default detail level** | “Standard” (`selectedDetailIndex = 1`). |
| **Default threshold** | “medium” (`selectedThresholdIndex = 2`). |
| **Extension selection** | Multi‑select works; check‑boxes reflect the current selection. |
| **Custom extensions** | Visible input screen; comma‑separated list is normalised to start with a dot. |
| **Cancellation** | Press **Esc** on the extensions screen aborts the whole wizard (`success: false`). |
| **Navigation shortcuts** | All steps expose `↑/↓` for navigation, `Enter` to confirm/continue, `Esc` to go back (or cancel on the first step). |
| **Persisted fields** | `autodocThreshold`, `autodocExtensions`, and `docDetailLevel` are saved to the user config. |
| **Color scheme** | Purple (`#a855f7`) for headings, green (`#22c55e`) for the active row, red (`#ef4444`) for cancellation messages. |
| **Testing** | Ink’s `useInput` can be exercised with `ink-testing-library` by simulating the keys listed above. |
| **Error handling** | `handleComplete` assumes `saveSettings` resolves; wrap in `try/catch` if you need more robustness. |

---

## Dependencies

| Package | Reason |
|---------|--------|
| `react` | Core UI library used by Ink. |
| `ink` | Renders React components in the terminal (`<Box>`, `<Text>`, `useInput`). |
| `../utils/index.js` | Provides `saveSettings` and the `CuppleSettings` type. |
| `./types.js` | Defines `CommandResult` and `CommandContext`. |

Install the external packages in the consuming project:

```bash
npm i react ink
# plus your internal utils/types modules
```

---  

**TL;DR**  
`init.tsx` now offers a **four‑step, fully interactive wizard** that lets users pick file‑type presets, add custom extensions, choose a documentation detail level, and set a line‑change threshold. The wizard writes the configuration with `saveSettings`, updates the surrounding context, and reports success via `onComplete`. The command dispatcher only needs to call `handleInitCommand`; a sentinel result triggers the UI.