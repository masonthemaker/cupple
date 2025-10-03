# `StatusIndicator.tsx` – Documentation  

A reusable **Ink** component (and related helpers) for displaying status messages in terminal‑based React applications. It now supports full visual rendering for all declared status types, optional timestamps, animated icons, badges, and action text.

---  

## Table of Contents  

1. [Purpose](#purpose)  
2. [File Structure Overview](#file-structure-overview)  
3. [Type Definitions](#type-definitions)  
4. [Configuration Objects](#configuration-objects)  
5. [Core Component – `StatusIndicator`](#core-component---statusindicator)  
6. [Convenience Components](#convenience-components)  
7. [Hook – `useStatusMessage`](#hook--usestatusmessage)  
8. [Usage Examples](#usage-examples)  
9. [Export Summary](#export-summary)  

---  

## Purpose  

`StatusIndicator` provides a **consistent, styled way** to render status feedback in an Ink‑based CLI UI.

* Icon + colour per status type.  
* Size variants (`small`, `medium`, `large`) that affect padding and text weight.  
* Optional coloured border.  
* **Live timestamp**, **badge**, **action text**, and **animated icons** are now functional.  
* Convenience wrappers (`SuccessStatus`, `ErrorStatus`, …) for brevity.  
* A small hook (`useStatusMessage`) for managing status state.  

---  

## File Structure Overview  

| Section | What it contains |
|--------|-------------------|
| **Imports** | React, Ink’s `Box` & `Text`. |
| **Type definitions** | `StatusType`, `StatusSize`, `StatusIndicatorProps`. |
| **Constant configs** | `STATUS_CONFIG` (icon, colour, label, animatable) and `SIZE_CONFIG` (padding, margin). |
| **Animation frames** | `ANIMATION_FRAMES` – used for animatable statuses. |
| **`StatusIndicator` component** | UI rendering logic with optional timestamp, badge, action text, and animation. |
| **Convenience wrappers** | `SuccessStatus`, `ErrorStatus`, `WarningStatus`, `InfoStatus`, `LoadingStatus`, `ProcessingStatus`, `PendingStatus`. |
| **`useStatusMessage` hook** | Helper for showing/clearing status messages. |
| **Exports** | All components, types, and the hook. |

---  

## Type Definitions  

```ts
/** All supported status categories */
export type StatusType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'
  | 'processing'
  | 'pending';

/** Visual size variants */
export type StatusSize = 'small' | 'medium' | 'large';

/** Props accepted by the core component */
export interface StatusIndicatorProps {
  /** The type of status to display */
  status: StatusType;

  /** Main status message */
  message: string;

  /** Optional detailed information shown underneath */
  details?: string;

  /** Whether to show the status icon (default `true`) */
  showIcon?: boolean;

  /** Size variant (default `'medium'`) */
  size?: StatusSize;

  /** Render a coloured border around the whole indicator (default `false`) */
  bordered?: boolean;

  /** Show a timestamp when the status was created (default `false`) */
  showTimestamp?: boolean;

  /** Enable animation for animatable statuses (default `false`) */
  animated?: boolean;

  /** Optional action text (e.g., “Press Enter to retry”) */
  actionText?: string;

  /** Optional badge text displayed next to the message */
  badge?: string;
}
```

> **All props are fully functional** – `showTimestamp`, `animated`, `actionText`, and `badge` now affect the rendered output.

---  

## Configuration Objects  

### `STATUS_CONFIG`

Maps every **implemented** `StatusType` to an icon, colour, label, and a flag indicating whether the status can be animated.

| Status      | Icon | Colour | Animatable |
|------------|------|--------|------------|
| `success`   | ✓    | `#22c55e` | false |
| `error`     | ✗    | `#ef4444` | false |
| `warning`   | ⚠    | `#f59e0b` | false |
| `info`      | ℹ    | `#3b82f6` | false |
| `loading`   | ⏳   | `#a855f7` | true |
| `processing`| ⚙   | `#8b5cf6` | true |
| `pending`   | ⋯   | `#64748b` | true |

```ts
const STATUS_CONFIG: Record<
  StatusType,
  { icon: string; color: string; label: string; animatable: boolean }
> = {
  success: { icon: '✓', color: '#22c55e', label: 'Success', animatable: false },
  error: { icon: '✗', color: '#ef4444', label: 'Error', animatable: false },
  warning: { icon: '⚠', color: '#f59e0b', label: 'Warning', animatable: false },
  info: { icon: 'ℹ', color: '#3b82f6', label: 'Info', animatable: false },
  loading: { icon: '⏳', color: '#a855f7', label: 'Loading', animatable: true },
  processing: { icon: '⚙', color: '#8b5cf6', label: 'Processing', animatable: true },
  pending: { icon: '⋯', color: '#64748b', label: 'Pending', animatable: true },
};
```

### `ANIMATION_FRAMES`

Frames used when a status is both **animated** (`animated=true`) **and** `animatable`.

```ts
const ANIMATION_FRAMES = [
  '⠋', '⠙', '⠹', '⠸', '⠼',
  '⠴', '⠦', '⠧', '⠇', '⠏',
];
```

### `SIZE_CONFIG`

Controls vertical spacing for each size variant.

```ts
const SIZE_CONFIG: Record<StatusSize, { padding: number; marginY: number }> = {
  small: { padding: 0, marginY: 0 },
  medium: { padding: 1, marginY: 1 },
  large: { padding: 2, marginY: 1 },
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
  showTimestamp = false,
  animated = false,
  actionText,
  badge,
}) => { … }
```

### Rendering Logic  

1. **Configuration lookup** – `STATUS_CONFIG[status]` supplies colour, icon, label, and `animatable`.  
2. **Size lookup** – `SIZE_CONFIG[size]` supplies `padding` & `marginY`.  
3. **Animation** – If `animated && config.animatable`, the icon cycles through `ANIMATION_FRAMES`.  
4. **Outer `<Box>`**  
   * `flexDirection="column"` stacks the main line and any optional lines.  
   * `marginY` and optional `padding` (when `bordered`) come from the size config.  
   * When `bordered` is true, `borderStyle="round"` and `borderColor` use the status colour.  
5. **First line** –  
   * Optional icon (animated or static) rendered in the status colour and bold.  
   * Message rendered in the status colour; bold when `size === 'large'`.  
   * Optional **badge** displayed dim‑colored inside brackets.  
   * Optional **timestamp** displayed dim‑colored after a bullet.  
6. **Details line** – rendered only when `details` is provided; indented when the icon is shown and padded according to the size config.  
7. **Action text line** – rendered only when `actionText` is provided; italic and dim‑colored, indented like the details line.  

> **Default prop values** – `showIcon: true`, `size: 'medium'`, `bordered: false`, `showTimestamp: false`, `animated: false`.

---  

## Convenience Components  

Thin wrappers that preset the `status` prop, reducing boilerplate.

| Component | Underlying component |
|-----------|----------------------|
| `SuccessStatus` | `<StatusIndicator status="success" … />` |
| `ErrorStatus`   | `<StatusIndicator status="error" … />` |
| `WarningStatus` | `<StatusIndicator status="warning" … />` |
| `InfoStatus`    | `<StatusIndicator status="info" … />` |
| `LoadingStatus` | `<StatusIndicator status="loading" … />` |
| `ProcessingStatus` | `<StatusIndicator status="processing" … />` |
| `PendingStatus` | `<StatusIndicator status="pending" … />` |

All accept the same props as `StatusIndicator` **except** `status` (omitted via `Omit<…, 'status'>`).

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

> The hook currently provides helpers for the five core statuses; `processing` and `pending` can still be set manually via `setCurrentStatus` if needed.

---  

## Usage Examples  

### 1. Basic inline usage (large, bordered)

```tsx
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

### 2. Convenience component with badge and hidden icon

```tsx
import { ErrorStatus } from './StatusIndicator';

render(
  <ErrorStatus
    message="Failed to connect"
    details="Check your network settings."
    badge="RETRY"
    showIcon={false}
  />
);
```

### 3. Animated loading with timestamp

```tsx
import { LoadingStatus } from './StatusIndicator';

render(
  <LoadingStatus
    message="Fetching data..."
    animated
    showTimestamp
    size="medium"
  />
);
```

### 4. Processing status with action text

```tsx
import { ProcessingStatus } from './StatusIndicator';

render(
  <ProcessingStatus
    message="Building project"
    actionText="Press <Ctrl‑C> to cancel"
    bordered
  />
);
```

### 5. Managing status with the hook

```tsx
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
    const timer = setTimeout(() => {
      showSuccess('Data loaded', 'Fetched 42 records');
      setTimeout(clearStatus, 3000);
    }, 2000);
    return () => clearTimeout(timer);
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

## Export Summary  

| Export | Type |
|--------|------|
| `StatusType` | `'success' | 'error' | 'warning' | 'info' | 'loading' | 'processing' | 'pending'` |
| `StatusSize` | `'small' | 'medium' | 'large'` |
| `StatusIndicatorProps` | Interface (includes functional `showTimestamp`, `animated`, `actionText`, `badge`) |
| `StatusIndicator` | `React.FC<StatusIndicatorProps>` – core component |
| `SuccessStatus` | `React.FC<Omit<StatusIndicatorProps, 'status'>>` |
| `ErrorStatus` | same as above |
| `WarningStatus` | same as above |
| `InfoStatus` | same as above |
| `LoadingStatus` | same as above |
| `ProcessingStatus` | same as above |
| `PendingStatus` | same as above |
| `useStatusMessage` | Hook returning `{ currentStatus, showSuccess, showError, showWarning, showInfo, showLoading, clearStatus }` |

---  

*End of documentation.*