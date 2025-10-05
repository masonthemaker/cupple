# `HelpScreen` – Interactive CLI Help Component  

A small, self‑contained **Ink** component that renders a colourful help screen for the Cupple CLI and captures the **Esc** key to return to the previous view.

---

## Purpose  

Display a concise list of available slash‑commands, their syntax and a brief description while allowing the user to dismiss the screen with **Esc**.  

> **Why use it?**  
> - Keeps the help UI consistent across the application.  
> - Handles the key‑binding (`Esc`) for you, so parent components only need to provide a callback.  
> - Works out‑of‑the‑box with Ink’s `<Box>` / `<Text>` layout primitives.

---

## Key Structure & Components  

| Element | Role |
|---------|------|
| `useInput` | Listens for keyboard events; when **Esc** is pressed it invokes `onBack`. |
| `<Box flexDirection="column">` | Root container – stacks everything vertically. |
| `<Text bold>` | Header “Available Commands:”. |
| Nested `<Box>` elements | Group command sections (selector, pairing, misc) and add vertical spacing (`marginTop`). |
| `<Text dimColor>` | Footer hint (“Press ESC to go back”) and auxiliary notes (size options). |
| Colour‑coded `<Text color="…">` | Visual grouping of command families (green, blue, orange). |

The component is deliberately **stateless** – it only renders static content and forwards the *back* action.

---

## Props  

```ts
interface HelpScreenProps {
  /** Called when the user presses <Esc>. Typically pops the screen. */
  onBack: () => void;

  /** Optional URL of the server the CLI is connected to.
   *  Currently unused in the UI but kept for forward‑compatibility. */
  serverUrl?: string;
}
```

*Both props are optional for TypeScript consumers, but `onBack` is required at runtime – the component will throw if it’s missing.*

---

## Practical Usage  

### 1️⃣ Basic integration in a parent screen  

```tsx
import React, { useState } from 'react';
import { render, Box, Text } from 'ink';
import { HelpScreen } from './HelpScreen';

const App: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Box flexDirection="column">
      {showHelp ? (
        <HelpScreen onBack={() => setShowHelp(false)} />
      ) : (
        <>
          <Text>Welcome to Cupple! Press “h” for help.</Text>
          {/* Other UI … */}
        </>
      )}
    </Box>
  );
};

render(<App />);
```

### 2️⃣ Wiring the **Esc** key from a higher level  

If you already have a global `useInput` handler, you can forward the escape event:

```tsx
import { useInput } from 'ink';
import { HelpScreen } from './HelpScreen';

const Parent: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  useInput((_input, key) => {
    if (key.escape && showHelp) {
      setShowHelp(false);   // same as onBack()
    }
  });

  return showHelp ? (
    <HelpScreen onBack={() => setShowHelp(false)} />
  ) : (
    <Text onPress={() => setShowHelp(true)}>Press “h” for help</Text>
  );
};
```

### 3️⃣ Passing a server URL (future‑proof)  

```tsx
<HelpScreen
  onBack={() => setHelp(false)}
  serverUrl="http://localhost:4000"
/>
```

*Even though `serverUrl` isn’t displayed now, the prop is kept so future versions can show connection info without breaking the API.*

---

## Notable Gotchas & Edge Cases  

| Situation | What to watch for | Remedy |
|-----------|-------------------|--------|
| **Missing `onBack`** | The component will still render but pressing **Esc** does nothing (or throws a runtime error if you rely on the callback). | Always supply a stable function, even a no‑op: `onBack={() => {}}`. |
| **Running outside an Ink `<Provider>`** | `useInput` and Ink primitives require the Ink runtime. | Render the component via `ink.render()` or as a child of another Ink component. |
| **Custom key handling** | `HelpScreen` only consumes **Esc**; other keys (e.g., `h`) are ignored. | Add additional `useInput` in the parent if you want other shortcuts. |
| **Server URL unused** | The prop is currently ignored – developers might think it will be displayed. | Treat it as a placeholder for future enhancements; no visual side‑effects now. |
| **Color support** | Some terminals (e.g., Windows CMD without VT support) may not render the hex colors. | Ink falls back to the nearest ANSI colour; the UI remains readable. |
| **Re‑render performance** | The component re‑renders on every parent state change even though its output is static. | Wrap it in `React.memo` if you notice unnecessary renders in a large app. |

---

## TL;DR  

```tsx
import { HelpScreen } from './HelpScreen';

<HelpScreen onBack={() => console.log('Help dismissed')} />
```

- Renders a colour‑coded help list.  
- Press **Esc** → `onBack` fires.  
- Optional `serverUrl` prop kept for future use.  

Happy documenting! 🎉