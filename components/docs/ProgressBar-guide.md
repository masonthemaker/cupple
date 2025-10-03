# `ProgressBar.tsx` – Terminal Progress Bar Component

## Table of Contents
1. [Purpose](#purpose)  
2. [File Structure & Overview](#file-structure--overview)  
3. [Key Types & Props](#key-types--props)  
4. [Component Implementation](#component-implementation)  
5. [Usage Examples](#usage-examples)  
6. [Important Details & Gotchas](#important-details--gotchas)  
7. [Exported API](#exported-api)  
8. [Potential Improvements / TODOs](#potential-improvements--todos)  

---

## Purpose
`ProgressBar.tsx` provides a **customizable, reusable progress bar** for terminal‑based React applications built with **Ink**.  
It visualises the ratio of `current / total` using block characters, optionally shows a percentage, a label, a count line, and lets you tweak width, colour, variant, and simple animation. When the progress reaches 100 % a configurable **completion message** is rendered.

---

## File Structure & Overview
```
ProgressBar.tsx
│
├─ Imports
│   └─ React, Ink components (Box, Text)
│
├─ Types & Constants
│   ├─ `ProgressBarVariant` – predefined colour schemes
│   └─ `VARIANT_COLORS` – map variant → hex colour
│
├─ Interface: ProgressBarProps
│   └─ Public API (all props are functional)
│
├─ Functional Component: ProgressBar
│   ├─ Handles animation (when `animated` is true)
│   ├─ Guards against division‑by‑zero
│   ├─ Determines colour from `color` prop or `variant`
│   ├─ Generates filled / empty bar strings (animated or static)
│   ├─ Detects completion and renders `completionMessage` when appropriate
│   └─ Renders Ink layout (optional label → bar → optional percentage → optional count → optional completion line)
│
└─ Export
    └─ `export const ProgressBar`
```

---

## Key Types & Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| **`current`** | `number` | – | Current progress value (e.g., bytes processed). |
| **`total`** | `number` | – | Maximum value representing 100 % progress. |
| **`width`** | `number` | `40` | Desired character width of the visual bar. |
| **`showPercentage`** | `boolean` | `true` | When `true`, displays the numeric percentage next to the bar. |
| **`color`** | `string` | *derived from `variant` (`#22c55e` for default)* | Custom colour for the **filled** part of the bar (hex or named colour). |
| **`label`** | `string` | – | Optional text rendered **above** the bar (e.g., “Downloading…”). |
| **`variant`** | `'default' \| 'success' \| 'warning' \| 'error'` | `'default'` | Pre‑defined colour scheme. If `color` is supplied it overrides the variant colour. |
| **`showCount`** | `boolean` | `true` | When `true`, displays the `current / total` count **below** the bar. |
| **`animated`** | `boolean` | `false` | Enables a simple animation that cycles four Unicode characters (`⣾ ⣽ ⣻ ⢿`) to give a “pulsing” effect. |
| **`completionMessage`** | `string` | – | Text shown **once** the progress reaches 100 % (or `percentage >= 100`). Rendered with a leading check‑mark and bold styling. |

> **Note** – The component safely handles `total === 0` by treating the progress as 0 % (no `NaN` or `Infinity` values).

---

## Component Implementation

### 1. Imports
```tsx
import React from 'react';
import { Box, Text } from 'ink';
```

### 2. Types & Constants
```tsx
export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error';

const VARIANT_COLORS: Record<ProgressBarVariant, string> = {
  default: '#22c55e',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};
```
`VARIANT_COLORS` supplies a sensible default colour for each variant.

### 3. Props Interface
```tsx
export interface ProgressBarProps {
  /** Current progress value */
  current: number;
  /** Total/maximum value representing 100% */
  total: number;
  /** Width of the progress bar in characters */
  width?: number;
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Custom color override (hex or named color) */
  color?: string;
  /** Optional label text displayed above the bar */
  label?: string;
  /** Predefined color variant */
  variant?: ProgressBarVariant;
  /** Whether to show the count (current/total) below the bar */
  showCount?: boolean;
  /** Enable animated fill characters */
  animated?: boolean;
  /** Optional completion message shown when progress reaches 100% */
  completionMessage?: string;
}
```

### 4. Core Logic
```tsx
export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  width = 40,
  showPercentage = true,
  color,
  label,
  variant = 'default',
  showCount = true,
  animated = false,
  completionMessage,
}) => {
  const [animationOffset, setAnimationOffset] = React.useState(0);

  // ---------- Animation ----------
  React.useEffect(() => {
    if (!animated) return;

    const interval = setInterval(() => {
      setAnimationOffset(prev => (prev + 1) % 4);
    }, 200);

    return () => clearInterval(interval);
  }, [animated]);

  // ---------- Guard against division by zero ----------
  const percentage = total === 0 ? 0 : Math.min(100, Math.max(0, (current / total) * 100));
  const filledWidth = Math.round((percentage / 100) * width);
  const emptyWidth = width - filledWidth;

  // ---------- Colour ----------
  const barColor = color || VARIANT_COLORS[variant];

  // ---------- Fill characters ----------
  const fillChar = animated ? ['⣾', '⣽', '⣻', '⢿'][animationOffset] : '█';
  const filledBar = fillChar.repeat(filledWidth);
  const emptyBar = '░'.repeat(emptyWidth);

  // ---------- Completion detection ----------
  const isComplete = percentage >= 100;
```

* **`percentage`** – Clamped to the 0‑100 range; safely returns 0 when `total` is 0.  
* **`filledWidth` / `emptyWidth`** – Character counts for the filled and empty sections.  
* **`barColor`** – Uses the explicit `color` prop if provided, otherwise falls back to the colour mapped from `variant`.  
* **`fillChar`** – Rotates through four Unicode “spinner” characters when `animated` is `true`; otherwise a solid block (`█`).  
* **`isComplete`** – `true` when `percentage` is 100 % or more; triggers rendering of `completionMessage`.

### 5. Rendering
```tsx
  return (
    <Box flexDirection="column">
      {label && (
        <Box marginBottom={1}>
          <Text>{label}</Text>
        </Box>
      )}

      <Box>
        <Text color={barColor}>{filledBar}</Text>
        <Text dimColor>{emptyBar}</Text>
        {showPercentage && (
          <Text dimColor> {percentage.toFixed(0)}%</Text>
        )}
      </Box>

      {showCount && (
        <Box>
          <Text dimColor>
            {current} / {total}
          </Text>
        </Box>
      )}

      {isComplete && completionMessage && (
        <Box marginTop={1}>
          <Text color={barColor} bold>
            ✓ {completionMessage}
          </Text>
        </Box>
      )}
    </Box>
  );
};
```

* **Label** – Rendered only when the `label` prop is supplied.  
* **Bar** – Filled part uses `barColor`; empty part is dimmed.  
* **Percentage** – Conditionally rendered based on `showPercentage`.  
* **Count line** – Rendered when `showCount` is `true`.  
* **Animation** – When `animated` is `true`, the fill characters cycle every 200 ms, creating a pulsing effect.  
* **Completion Message** – When progress is complete (`percentage >= 100`) and a `completionMessage` string is provided, a line with a leading check‑mark (`✓`) is displayed in the same colour as the bar and rendered **bold**.

### 6. Export
```tsx
export const ProgressBar: React.FC<ProgressBarProps> = (/* … */) => { … };
```
The component is exported as a **named export** for straightforward consumption.

---

## Usage Examples

### 1. Basic Inline Progress Bar (with label)
```tsx
import React from 'react';
import { render, Box } from 'ink';
import { ProgressBar } from './ProgressBar';

const Demo = () => {
  const [completed, setCompleted] = React.useState(0);
  const total = 200;

  // Simulate progress
  React.useEffect(() => {
    const id = setInterval(() => {
      setCompleted(c => Math.min(c + 5, total));
    }, 200);
    return () => clearInterval(id);
  }, []);

  return (
    <Box>
      <ProgressBar
        current={completed}
        total={total}
        label="Processing…"
      />
    </Box>
  );
};

render(<Demo />);
```

### 2. Custom Width, Colour, No Percentage, and Hidden Count
```tsx
<ProgressBar
  current={73}
  total={100}
  width={60}
  color="#ff5733"
  showPercentage={false}
  showCount={false}
  label="Uploading files"
/>
```

### 3. Using a Variant (colour applied automatically)
```tsx
<ProgressBar
  current={45}
  total={100}
  variant="warning"
  label="Low disk space"
/>
```

### 4. Animated Bar
```tsx
<ProgressBar
  current={30}
  total={100}
  animated={true}
  label="Compressing…"
/>
```

### 5. Completion Message (now rendered)
```tsx
<ProgressBar
  current={100}
  total={100}
  completionMessage="✅ Done!"
/>
```
*When `current / total` reaches 100 %, the component displays a bold line with a check‑mark and the supplied message.*

---

## Important Details & Gotchas

| Detail | Explanation |
|--------|--------------|
| **Division by zero** | The component guards against `total === 0` and treats the progress as 0 % (no `NaN` or `Infinity`). |
| **Variant colour** | `variant` is fully functional; it selects a default colour from `VARIANT_COLORS` unless a custom `color` overrides it. |
| **Show count** | `showCount` defaults to `true` and correctly toggles the `current / total` line. |
| **Animation** | When `animated` is `true`, the fill character cycles through four Unicode glyphs every 200 ms. |
| **Completion message** | If `percentage >= 100` **and** a `completionMessage` string is provided, a line prefixed with `✓` is rendered in the bar’s colour and bolded. |
| **Unicode width** | The block characters (`█`, `░`, and the spinner glyphs) are full‑width; they render correctly on most modern terminals. |
| **Colour support** | Ink forwards colour strings to the terminal. Hex colours work in terminals that support true‑color; otherwise the nearest ANSI colour is used. |

---

## Exported API

```ts
export const ProgressBar: React.FC<ProgressBarProps>;
```

**Props** – See the *Key Types & Props* table for full details and defaults.  
**Returns** – Ink elements that render a vertical stack: optional label → progress bar → optional percentage → optional count line → optional completion message.

---

## Potential Improvements / TODOs

1. **Expose custom fill / empty characters** (e.g., `filledChar`, `emptyChar`) for even more flexibility.  
2. **Add accessibility support** (e.g., an `ariaLabel` prop) for environments that can convey it.  
3. **Provide PropTypes / JSDoc** for enhanced editor autocomplete and runtime validation.  
4. **Unit tests** using `ink-testing-library` to verify rendering under various prop combinations (including animation frames).  
5. **Performance optimisation** – debounce rapid state updates if the parent component updates very frequently.  
6. **Add a “compact” mode** that hides the count line and/or percentage for very narrow terminals.  

---

### TL;DR
`ProgressBar.tsx` is a small, fully‑functional Ink component that visualises progress in terminal UIs. It now supports colour variants, optional count display, a simple animation, and **renders a completion message** (with a check‑mark) when progress reaches 100 %. The API is stable and ready for production use, while still leaving room for future enhancements such as custom characters and accessibility features.