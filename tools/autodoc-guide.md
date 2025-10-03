# Autodoc Controller Guide

The `AutodocController` automatically generates markdown documentation for files when they're created or modified beyond a threshold.

## Features

- **Threshold-based documentation**: Generate docs after a file changes by X lines
- **Create-on-save**: Optionally generate docs immediately when new files are created
- **File filtering**: Filter by file extensions and exclude specific directories
- **Change tracking**: Accumulates changes across multiple saves until threshold is met
- **Integration with FileWatcher**: Works seamlessly with the existing file watching system

## Configuration

```typescript
type AutodocConfig = {
  // Trigger doc generation after this many lines changed
  changeThreshold: number;
  
  // Generate docs immediately when a file is created
  generateOnCreate: boolean;
  
  // Only watch these file types (optional)
  fileExtensions?: string[]; // e.g., ['.ts', '.tsx', '.js']
  
  // Exclude these directories (optional)
  excludeDirs?: string[]; // e.g., ['node_modules', 'dist']
};
```

## Basic Usage

```typescript
import {AutodocController} from './tools/index.js';
import {FileWatcher} from './utils/index.js';

// Create the autodoc controller
const autodoc = new AutodocController(
  apiKey, // Your Groq API key
  {
    changeThreshold: 20, // Generate docs after 20 lines changed
    generateOnCreate: true, // Generate docs for new files immediately
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx'], // Only watch these
  },
  (result) => {
    // Callback when documentation is generated
    if (result.success) {
      console.log(`✓ Generated docs: ${result.outputPath}`);
    } else {
      console.error(`✗ Failed: ${result.error}`);
    }
  }
);

// Create file watcher with autodoc callback
const watcher = new FileWatcher(
  process.cwd(),
  autodoc.createWatcherCallback()
);

watcher.start();
```

## Integration with App.tsx (Auto Mode)

To integrate autodoc into your app for auto mode:

```typescript
// In App.tsx, when settings.mode === 'auto'
useEffect(() => {
  if (settings?.mode !== 'auto' || !settings.apiKey) {
    return;
  }

  // Create autodoc controller
  const autodoc = new AutodocController(
    settings.apiKey,
    {
      changeThreshold: 20, // Configurable threshold
      generateOnCreate: true,
      fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    async (result) => {
      // Add to history
      const currentHistory = await loadHistory();
      const item: HistoryItem = result.success
        ? {
            message: `✓ Auto-generated docs for `,
            color: '#22c55e',
            filename: basename(result.filePath),
            timestamp: Date.now(),
          }
        : {
            message: `✗ Failed to generate docs for ${basename(result.filePath)}: ${result.error}`,
            color: '#ef4444',
            timestamp: Date.now(),
          };
      
      await saveHistory([...currentHistory, item]);
      setHistory(await loadHistory());
    }
  );

  // Create file watcher with autodoc
  const watcher = new FileWatcher(
    process.cwd(),
    autodoc.createWatcherCallback()
  );

  watcher.start();

  return () => {
    watcher.stop();
  };
}, [settings]);
```

## Advanced Features

### Manual Documentation

Manually trigger documentation for a specific file:

```typescript
await autodoc.documentFile('/path/to/file.ts');
```





















































### Check File Status

```typescript
// Get current accumulated changes
const changes = autodoc.getFileChanges('/path/to/file.ts');

// Check if file has been documented
const isDocumented = autodoc.isFileDocumented('/path/to/file.ts');

// Reset tracking for a file
autodoc.resetFileTracking('/path/to/file.ts');

// Clear all tracking
autodoc.reset();
```

## How It Works

1. **File Creation**: When a new file is created:
   - If `generateOnCreate` is true, docs are generated immediately
   - Otherwise, tracks initial line count for threshold checking

2. **File Modification**: When a file is modified:
   - Accumulates line changes across multiple saves
   - When cumulative changes reach `changeThreshold`, generates docs
   - Resets change counter after documentation

3. **Filtering**: Automatically excludes:
   - Directories: `node_modules`, `dist`, `.cupple`, `.git`
   - Markdown files (`.md`)
   - Files not matching `fileExtensions` (if specified)

## Example Scenarios

### Conservative Mode
Generate docs only for significant changes:
```typescript
{
  changeThreshold: 50,
  generateOnCreate: false,
}
```

### Aggressive Mode
Document everything immediately:
```typescript
{
  changeThreshold: 1,
  generateOnCreate: true,
}
```

### TypeScript/React Only
Only document specific file types:
```typescript
{
  changeThreshold: 20,
  generateOnCreate: true,
  fileExtensions: ['.ts', '.tsx'],
  excludeDirs: ['node_modules', 'dist', '.cupple', 'tests'],
}
```

