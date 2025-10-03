# `settings.ts` – Cupple Configuration Helpers  

**Purpose**  
Provides type definitions and utility functions for loading, persisting, and validating the Cupple extension’s settings file (`.cupple/cupplesettings.json`).  

---

## Types / Interfaces  

| Type | Description | Required fields |
|------|-------------|-----------------|
| **PairedInstance** | Information about a successfully paired IDE instance. | `port`, `url`, `projectPath`, `pairedAt` |
| **PendingPairingRequest** | Details of a pairing request awaiting acceptance. | `port`, `url`, `projectPath`, `requestedAt` |
| **DocDetailLevel** | Documentation granularity. | – (`'brief'` \| `'standard'` \| `'comprehensive'`) |
| **ExtensionConfig** | Per‑extension doc generation settings. | `extension`, `detailLevel` |
| **CuppleSettings** | Root configuration object. | `mode` (`'auto'` \| `'selector'`) – all other props are optional. |
| &nbsp; | `apiKey?` – optional API key. | |
| &nbsp; | `autodocThreshold?` – line‑change limit for auto‑doc (default 40). | |
| &nbsp; | `autodocExtensions?` – **DEPRECATED**; use `extensionConfigs`. | |
| &nbsp; | `docDetailLevel?` – **DEPRECATED**; use `extensionConfigs`. | |
| &nbsp; | `extensionConfigs?` – array of `ExtensionConfig`. | |
| &nbsp; | `pairedInstances?` – array of `PairedInstance`. | |
| &nbsp; | `pendingPairingRequest?` – `PendingPairingRequest` or `null`. | |

---

## Core Functions  

| Function | Signature | What it does |
|----------|-----------|--------------|
| **loadSettings** | `(): Promise<CuppleSettings \| null>` | Reads and parses the JSON settings file; returns `null` on error. |
| **saveSettings** | `(settings: CuppleSettings): Promise<void>` | Serialises `settings` to the JSON file and sets restrictive `600` permissions (ignored on Windows). |
| **validateApiKey** | `(key: string): boolean` | Simple validation – ensures the key is at least 10 characters long. |

---

## Quick Usage  

```ts
import { loadSettings, saveSettings, validateApiKey, CuppleSettings } from './settings';

async function init() {
  // Load existing config (or get null if missing)
  const cfg = await loadSettings();

  // Ensure we have a config object
  const settings: CuppleSettings = cfg ?? { mode: 'auto' };

  // Example: validate and store an API key
  const key = process.env.CUPPLE_API_KEY ?? '';
  if (key && validateApiKey(key)) {
    settings.apiKey = key;
  }

  // Persist changes
  await saveSettings(settings);
}

init().catch(console.error);
```

*Only the required `mode` field is mandatory; all other fields are optional and can be added as needed.*