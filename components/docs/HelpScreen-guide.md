# `HelpScreen` – Interactive CLI Help Component  

A small, self‑contained **Ink** component that renders a colour‑coded help screen for the Cupple CLI and captures the **Esc** key to return to the previous view.

---

## Purpose  

Display a concise list of available slash‑commands, their syntax and a brief description while allowing the user to dismiss the screen with **Esc**.

> **Why use it?**  
> - Keeps the help UI consistent across the application.  
> - Handles the **Esc** key‑binding for you, so parent components only need to provide a callback.  
> - Works out‑of‑the‑box with Ink’s `<Box>` / `<Text>` layout primitives.  

---

## Key Structure & Components  

| Element | Role |
|---------|------|
| `useInput` | Listens for keyboard events; when **Esc** is pressed it invokes `onBack`. |
| `<Box flexDirection="column">` | Root container – stacks everything vertically. |
| `<Text bold>` | Header “Available Commands:”. |
| Nested `<Box marginTop={…}>` | Adds vertical spacing between command groups. |
| `<Text dimColor>` | Footer hint (“Press ESC to go back”) and auxiliary notes (size options). |
| Colour‑coded `<Text color="#…">` | Visual grouping of command families (green, blue, orange). |

The component is deliberately **stateless** – it only renders static content and forwards the *back* action.

---

## Props  

```ts
interface HelpScreenProps {
  /** Called when the user presses <Esc>. Required at runtime. */
  onBack: () => void;

  /** Optional URL of the server the CLI is connected to.
   *  Currently unused in the UI but kept for forward‑compatibility. */
  serverUrl?: string;
}
```

- `onBack` **must** be supplied; the component will call it whenever **Esc** is pressed.  
- `serverUrl` is optional and not rendered – it exists solely for future extensions.

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

### 2️⃣ Forwarding the **Esc** key from a higher level  

If you already have a global `useInput` handler, you can forward the escape event:

```tsx
import React, { useState } from 'react';
import { useInput } from 'ink';
import { HelpScreen } from './HelpScreen';

const Parent: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  useInput((_input, key) => {
    if (key.escape && showHelp) {
      setShowHelp(false); // same effect as onBack()
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

*The URL is not displayed yet, but keeping the prop avoids breaking changes when the UI is extended.*

---

## Notable Considerations  

| Situation | What to watch for | Remedy |
|-----------|-------------------|--------|
| **Missing `onBack`** | TypeScript will flag the omission (the prop is required). | Always pass a function, even a no‑op: `onBack={() => {}}`. |
| **Running outside an Ink `<Provider>`** | `useInput` and Ink primitives need the Ink runtime. | Render the component via `ink.render()` or as a child of another Ink component. |
| **Custom key handling** | `HelpScreen` only consumes **Esc**; other keys (e.g., `h`) are ignored. | Add additional `useInput` in the parent if you need extra shortcuts. |
| **Server URL unused** | The prop is currently ignored – developers might expect it to appear. | Treat it as a placeholder for future enhancements; no visual side‑effects now. |
| **Color support** | Hex colours (`#22c55e`, `#3b82f6`, `#f59e0b`) may degrade on terminals without true‑color support. | Ink falls back to the nearest ANSI colour; the UI stays readable. |
| **Unnecessary re‑renders** | The component re‑renders whenever its parent updates, even though its output is static. | Wrap it in `React.memo` if you notice performance concerns in a large app. |

---

## TL;DR  

```tsx
import { HelpScreen } from './HelpScreen';

<HelpScreen onBack={() => console.log('Help dismissed')} />
```

- Renders a colour‑coded list of Cupple commands.  
- Press **Esc** → `onBack` fires.  
- `serverUrl` prop is optional and currently unused.  

Happy documenting! 🎉