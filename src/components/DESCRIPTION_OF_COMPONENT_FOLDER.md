# Component Structure Reference

## Structure

```
src/components/
├── ui/                    # shadcn/ui primitives
├── providers/             # React providers & context
├── layouts/               # Layout wrappers
├── features/              # Feature-specific components
│   ├── auth/              # Authentication
│   ├── admin/             # Admin panel
│   ├── dashboard/         # Dashboard
│   ├── dictionary/        # Dictionary functionality
│   └── translation/       # Translation (commented out)
├── shared/                # Cross-feature reusable
│   ├── forms/             # Shared forms
│   ├── navigation/        # Navigation & breadcrumbs
│   ├── dialogs/           # Modals & dialogs
│   └── data-display/      # Data visualization
└── utils/                 # Utility components
    ├── skeletons/         # Loading skeletons
    ├── wrappers/          # HOCs & wrappers
    └── debug/             # Development components
```

## Import Patterns

```typescript
// Feature components (via barrel exports)
import { LoginForm, SignupForm } from '@/components/features/auth';
import { WordDetails, UsersTable } from '@/components/features/admin';

// Shared components
import { PageBreadcrumb } from '@/components/shared/navigation';
import { FormInput } from '@/components/shared/forms';

// UI components (direct import)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Providers
import { AuthProvider, ReduxProvider } from '@/components/providers';
```

## Key Components by Feature

### Auth (`/features/auth/`)

- `LoginForm` - User login
- `SignupForm` - Registration
- `RoleGate` - Access control
- `AuthStatus` - Auth status display

### Admin (`/features/admin/`)

- `WordDetails` - Word management
- `UsersTable` - User management
- `Pagination` - Table pagination
- `SearchBar` - Search functionality
- `TTSControls` - Text-to-speech controls for audio generation
- `ImageControls` - Batch image generation controls for word definitions using Pexels API
- `ActionButtonsToolbar` - Organized action buttons toolbar for dictionary management

### Dictionary (`/features/dictionary/`)

- `TranslateComponent` - Translation interface
- `WordImage` - Image management
- `ImageSelector` - Pexels API integration
- `AddNewWordForm` - Add words
- `WordEditForm` - Edit words

### Shared (`/shared/`)

- **Navigation**: `PageBreadcrumb`, `ModeToggle`, `MainPageButton`
- **Forms**: `FormInput`, `ProfileForm`
- **Dialogs**: `DatabaseCleanupDialog`, `BulkDeleteConfirmDialog`

## File Naming

- **Components**: `ComponentName.tsx`
- **Types**: `types.ts` or inline interfaces
- **Index files**: `index.ts` (barrel exports)

## Rules

1. Use barrel exports from feature folders
2. Import UI components directly
3. Place components in appropriate feature folder
4. TypeScript interfaces required for all props
5. Export from feature's `index.ts`
