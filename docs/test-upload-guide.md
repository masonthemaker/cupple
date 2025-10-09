```markdown
## test‑upload.ts – Overview  

Utility module for validating user profiles and handling upload‑configuration checks (file size & MIME type) used by the automatic document‑upload feature.

---

### Types / Interfaces  

- **`UserProfile`** – Represents a user.  
  ```ts
  {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
    createdAt: Date;
  }
  ```

- **`UploadConfig`** – Configuration for file uploads.  
  ```ts
  {
    maxFileSize: number;   // bytes
    allowedTypes: string[]; // MIME strings
    autoUpload: boolean;   // toggles automatic uploading
  }
  ```

---

### Exported Functions  

- **`validateUserProfile(profile: UserProfile): boolean`**  
  Checks that `id`, `name`, and `email` are truthy and that `role` is one of the allowed values.

- **`createDefaultUploadConfig(): UploadConfig`**  
  Returns a config with  
  - `maxFileSize: 10 MB` (`10 * 1024 * 1024` bytes)  
  - `allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']`  
  - `autoUpload: true`

- **`formatDisplayName(profile: UserProfile): string`**  
  Returns `"<name> (<role>)"`.

- **`isFileSizeValid(fileSize: number, config: UploadConfig): boolean`**  
  Returns `true` when `fileSize` ≤ `config.maxFileSize`.

- **`isFileTypeAllowed(fileType: string, config: UploadConfig): boolean`**  
  Returns `true` when `config.allowedTypes` includes `fileType`.

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

const fileSize = 4_500_000; // 4.5 MB
const fileType = 'image/png';

if (isFileSizeValid(fileSize, config) && isFileTypeAllowed(fileType, config)) {
  console.log('Ready to upload:', formatDisplayName(user));
}
```

The snippet validates a user profile, obtains the default upload configuration, checks a file against that configuration, and logs a formatted display name.
```
