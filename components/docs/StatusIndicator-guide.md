# `StatusIndicator.tsx` – Documentation  

A reusable **Ink** component (and related helpers) for displaying status messages in terminal‑based React applications. It supports multiple status types, size variants, optional icons, borders, and a hook for managing status state.

---  

## Table of Contents  

1. [Purpose](#purpose)  
2. [File Structure Overview](#file-structure-overview)  
3. [Type Definitions](#type-definitions)  
4. [Configuration Objects](#configuration-objects)  
5. [Core Component](#core-component)  
6. [Convenience Components](#convenience-components)  
7. [Hook: `useStatusMessage`](#hook-useStatusMessage)  
8. [Usage Examples](#usage-examples)  
9. [Important Details & Gotchas](#important-details--gotchas)  
10. [Export Summary](#export-summary)  

---  

## Purpose  

`StatusIndicator` provides a **consistent, styled way** to render status feedback (success, error, warning, info, loading) in an Ink‑based CLI UI.  

* **Icon + colour** per status type.  
* **Size variants** (`small`, `medium`, `large`) that affect padding and text weight.  
* Optional **border** with the status colour.  
* Helper components (`SuccessStatus`, `ErrorStatus`, …) for brevity.  
* A **React hook** (`useStatusMessage`) that centralises status handling (show/clear) for any component.  

---  

## File Structure Overview  

| Section | What it contains |
|--------|-------------------|
| **Imports** | React, Ink’s `Box` & `Text`. |
| **Type definitions** | `StatusType`, `StatusSize`, `StatusIndicatorProps`. |
| **Constant configs** | `STATUS_CONFIG` (icon, colour, label) and `SIZE_CONFIG` (padding, margin). |
| **`StatusIndicator` component** | Main UI rendering logic. |
| **Convenience wrappers** | `SuccessStatus`, `ErrorStatus`, `WarningStatus`, `InfoStatus`, `LoadingStatus`. |
| **`useStatusMessage` hook** | Stateful helper for showing/hiding status messages. |
| **Exports** | All components, types, and the hook. |

---  

## Type Definitions  

```ts
/** All supported status categories */
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

/** Visual size variants */
export type StatusSize = 'small' | 'medium' | 'large';

/** Props accepted by the core component */
export interface StatusIndicatorProps {
  /** The type of status to display */
  status: StatusType;
  /** Main status message (bold by default) */
  message: string;
  /** Optional detailed information shown underneath */
  details?: string;
  /** Show the status icon (defaults to true) */
  showIcon?: boolean;
  /** Size variant (defaults to 'medium') */
  size?: StatusSize;
  /** Render a coloured border around the whole indicator (defaults to false) */
  bordered?: boolean;
}
```

---  

## Configuration Objects  

### `STATUS_CONFIG`

Maps each `StatusType` to:

| Property | Meaning |
|----------|---------|
| `icon`   | Unicode glyph shown before the message. |
| `color`  | Hex colour used for the icon, message text, and optional border. |
| `label`  | Human‑readable label (currently unused but handy for extensions). |

```ts
const STATUS_CONFIG: Record<StatusType, {icon: string; color: string; label: string}> = {
  success: {icon: '✓', color: '#22c55e', label: 'Success'},
  error:   {icon: '✗', color: '#ef4444', label: 'Error'},
  warning: {icon: '⚠', color: '#f59e0b', label: 'Warning'},
  info:    {icon: 'ℹ', color: '#3b82f6', label: 'Info'},
  loading: {icon: '⏳', color: '#a855f7', label: 'Loading'},
};
```

### `SIZE_CONFIG`

Controls vertical spacing for each size variant.

```ts
const SIZE_CONFIG: Record<StatusSize, {padding: number; marginY: number}> = {
  small:  {padding: 0, marginY: 0},
  medium: {padding: 1, marginY: 1},
  large:  {padding: 2, marginY: 1},
};
```

---  

## Core Component – `StatusIndicator`

```tsx
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  details,
  showIcon = true,
  size = 'medium',
  bordered = false,
}) => { … }
```

### Rendering Logic  

1. **Select config** – `STATUS_CONFIG[status]` provides colour & icon.  
2. **Select size config** – `SIZE_CONFIG[size]` provides padding & margin.  
3. **Outer `<Box>`**  
   * `flexDirection="column"` – stacks the main line and optional details.  
   * `marginY` & `padding` derived from size & `bordered`.  
   * If `bordered`, `borderStyle="round"` and `borderColor` use the status colour.  
4. **First line** – icon (if `showIcon`) + primary message.  
   * Message is bold when `size === 'large'`.  
5. **Details line** – rendered only when `details` is provided.  
   * Indented (`marginLeft`) if the icon is present.  
   * Uses `dimColor` to de‑emphasise the extra text.

---  

## Convenience Components  

These are thin wrappers that preset the `status` prop, letting you write less code.

| Component | Usage | Underlying component |
|-----------|-------|----------------------|
| `SuccessStatus` | `<SuccessStatus message="All good!" />` | `<StatusIndicator status="success" … />` |
| `ErrorStatus`   | `<ErrorStatus message="Oops!" />`   | `<StatusIndicator status="error" … />` |
| `WarningStatus` | `<WarningStatus … />`               | `<StatusIndicator status="warning" … />` |
| `InfoStatus`    | `<InfoStatus … />`                  | `<StatusIndicator status="info" … />` |
| `LoadingStatus` | `<LoadingStatus … />`               | `<StatusIndicator status="loading" … />` |

All accept the same props as `StatusIndicator` **except** `status` (which is omitted via `Omit<…, 'status'>`).

---  

## Hook – `useStatusMessage`

A small utility for components that need to **show a status** at runtime and optionally clear it later.

```tsx
export const useStatusMessage = () => {
  const [currentStatus, setCurrentStatus] = React.useState<{
    type: StatusType;
    message: string;
    details?: string;
  } | null>(null);

  // Helper setters
  const showSuccess = (msg: string, det?: string) => setCurrentStatus({type: 'success', message: msg, details: det});
  const showError   = (msg: string, det?: string) => setCurrentStatus({type: 'error',   message: msg, details: det});
  const showWarning = (msg: string, det?: string) => setCurrentStatus({type: 'warning', message: msg, details: det});
  const showInfo    = (msg: string, det?: string) => setCurrentStatus({type: 'info',    message: msg, details: det});
  const showLoading = (msg: string, det?: string) => setCurrentStatus({type: 'loading', message: msg, details: det});

  const clearStatus = () => setCurrentStatus(null);

  return {
    currentStatus,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    clearStatus,
  };
};
```

**Typical usage pattern**

```tsx
const MyComponent = () => {
  const {
    currentStatus,
    showSuccess,
    showError,
    clearStatus,
  } = useStatusMessage();

  // Example: trigger a success after async work
  React.useEffect(() => {
    asyncTask()
      .then(() => showSuccess('Task finished'))
      .catch(err => showError('Task failed', err.message));
  }, []);

  return (
    <>
      {/* Render the status if one exists */}
      {currentStatus && (
        <StatusIndicator
          status={currentStatus.type}
          message={currentStatus.message}
          details={currentStatus.details}
          bordered
        />
      )}
      {/* Rest of UI … */}
    </>
  );
};
```

---  

## Usage Examples  

### 1. Basic inline usage  

```tsx
import React from 'react';
import { render } from 'ink';
import { StatusIndicator } from './StatusIndicator';

render(
  <StatusIndicator
    status="success"
    message="Operation completed"
    details="All files were uploaded successfully."
    size="large"
    bordered
  />
);
```

### 2. Using a convenience component  

```tsx
import { ErrorStatus } from './StatusIndicator';

render(
  <ErrorStatus
    message="Failed to connect"
    details="Check your network settings."
    size="medium"
    showIcon={false}
  />
);
```

### 3. Switching size & border options  

```tsx
<StatusIndicator
  status="warning"
  message="Low disk space"
  size="small"
  bordered={false}
/>
```

### 4. Managing status with the hook  

```tsx
import React from 'react';
import { render, Box } from 'ink';
import { useStatusMessage, StatusIndicator } from './StatusIndicator';

const Demo = () => {
  const {
    currentStatus,
    showLoading,
    showSuccess,
    clearStatus,
  } = useStatusMessage();

  React.useEffect(() => {
    showLoading('Fetching data...');
    setTimeout(() => {
      showSuccess('Data loaded', 'Fetched 42 records');
      setTimeout(clearStatus, 3000);
    }, 2000);
  }, []);

  return (
    <Box flexDirection="column">
      {currentStatus && (
        <StatusIndicator
          status={currentStatus.type}
          message={currentStatus.message}
          details={currentStatus.details}
          bordered
        />
      )}
    </Box>
  );
};

render(<Demo />);
```

---  

## Important Details & Gotchas  

| Topic | Details |
|-------|---------|
| **Ink version** | The component relies on Ink’s `Box` and `Text`. Ensure you have a compatible Ink version (≥3.0). |
| **Colour support** | The colour strings are hex values; terminals that don’t support true‑color will fall back to the nearest ANSI colour. |
| **Icon width** | Unicode icons have varying column widths on some terminals; the layout assumes a single‑character width. |
| **Border rendering** | `borderStyle="round"` only works when `bordered={true}`. The border colour matches the status colour, providing a visual cue. |
| **`size` impact** | `size="large"` makes the primary message bold; `size="small"` removes extra padding. Adjust as needed for dense logs. |
| **Extensibility** | Adding a new status type requires extending `StatusType`, updating `STATUS_CONFIG`, and (optionally) creating a convenience wrapper. |
| **Hook concurrency** | The hook stores a single status at a time. If you need multiple concurrent messages, manage an array of statuses yourself. |
| **SSR / non‑Ink environments** | This file is intended for Ink (Node CLI) only; it will not render in a browser environment. |

---  

## Export Summary  

| Export | Type |
|--------|------|
| `StatusType` | Type alias (`'success' | 'error' | ...`) |
| `StatusSize` | Type alias (`'small' | 'medium' | 'large'`) |
| `StatusIndicatorProps` | Interface |
| `StatusIndicator` | `React.FC<StatusIndicatorProps>` – core component |
| `SuccessStatus` | `React.FC<Omit<StatusIndicatorProps, 'status'>>` |
| `ErrorStatus` | same as above |
| `WarningStatus` | same as above |
| `InfoStatus` | same as above |
| `LoadingStatus` | same as above |
| `useStatusMessage` | Custom hook returning `{ currentStatus, showSuccess, …, clearStatus }` |

---  

*End of documentation.*