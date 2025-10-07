## test‑upload.ts – Overview  

Utility module for validating user profiles and handling upload‑configuration checks (file size & MIME type) used by the automatic document‑upload feature.

---  

### Types / Interfaces  

| Type | Definition |
|------|------------|
| **UserProfile** | ```ts\n{ id: string; name: string; email: string; role: 'admin' | 'user' | 'guest'; createdAt: Date; }\n``` |
| **UploadConfig** | ```ts\n{ maxFileSize: number; allowedTypes: string[]; autoUpload: boolean; }\n```<br>*`maxFileSize`* – bytes (default `10 * 1024 * 1024` ≈ 10 MB), *`allowedTypes`* – MIME strings, *`autoUpload`* – toggles automatic uploading. |

---  

### Exported Functions  

| Function | Parameters | Returns | Brief Description |
|----------|------------|---------|-------------------|
| `validateUserProfile(profile: UserProfile)` | `profile` | `boolean` | Returns **true** when `id`, `name`, and `email` are present **and** `role` is one of `'admin'`, `'user'`, `'guest'`. |
| `createDefaultUploadConfig()` | — | `UploadConfig` | Returns a config with **`maxFileSize: 10 * 1024 * 1024`** (≈ 10 MB), **`allowedTypes: ['image/jpeg','image/png','application/pdf']`**, and **`autoUpload: true`**. |
| `formatDisplayName(profile: UserProfile)` | `profile` | `string` | Returns `"<name> (<role>)"`. |
| `isFileSizeValid(fileSize: number, config: UploadConfig)` | `fileSize`, `config` | `boolean` | Returns **true** when `fileSize` ≤ `config.maxFileSize`. |
| `isFileTypeAllowed(fileType: string, config: UploadConfig)` | `fileType`, `config` | `boolean` | Returns **true** when `config.allowedTypes` includes `fileType`. |

---  

### Quick Usage Example  

```ts
import {
  UserProfile,
  createDefaultUploadConfig,
  validateUserProfile,
  isFileSizeValid,
  isFileTypeAllowed,
  formatDisplayName,
} from './test-upload';

const user: UserProfile = {
  id: 'u123',
  name: 'Alice Smith',
  email: 'alice@example.com',
  role: 'user',
  createdAt: new Date(),
};

if (!validateUserProfile(user)) {
  throw new Error('Invalid user');
}

const config = createDefaultUploadConfig();

const fileSize = 4_500_000;               // 4.5 MB
const fileType = 'image/png';

if (isFileSizeValid(fileSize, config) && isFileTypeAllowed(fileType, config)) {
  console.log('Ready to upload:', formatDisplayName(user));
}
```

*The snippet validates a profile, obtains the default upload configuration, checks a file against that configuration, and logs a formatted display name.*