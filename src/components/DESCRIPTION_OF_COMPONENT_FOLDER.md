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

### Dashboard (`/features/dashboard/`)

**Main Dashboard Components:**

- `DashboardContent` - Main dashboard overview with key metrics, quick actions, and progress visualization
- `StatisticsContent` - Comprehensive user analytics dashboard with tabbed interface
- `LearningProgressChart` - Daily learning progress visualization with words studied and accuracy metrics
- `VocabularyGrowthChart` - Vocabulary growth over time visualization
- `WeeklyDistributionChart` - Weekly activity distribution bar chart
- `MistakeAnalysisChart` - Mistake types distribution analysis
- `SessionAnalyticsChart` - Session performance analytics (placeholder)

**Main Dashboard Features (DashboardContent):**

- **Key Metrics Overview**: 4-card layout showing total vocabulary, learning streak, today's progress, and study time
- **Quick Actions**: Direct links to start learning, view dictionary, statistics, and settings
- **Progress Visualization**: Learning progress breakdown with progress bars and badges
- **Recent Activity**: Last 3 learning sessions with scores and duration
- **Achievement Highlights**: Recent achievements with points system
- **Language Journey**: Learning path, proficiency level, vocabulary size, goal achievement rates

**Statistics Dashboard Features (StatisticsContent):**

- **Overview Cards**: Total vocabulary, current streak, average accuracy, study time
- **Progress Tab**: Learning status breakdown, mastery metrics, vocabulary growth charts
- **Sessions Tab**: Session overview, time analytics, performance metrics, activity patterns
- **Analysis Tab**: Mistake analysis, difficult words identification, improvement tracking
- **Achievements Tab**: Achievement overview, recent unlocks, points system
- **Goals Tab**: Daily goal tracking, weekly/monthly progress, achievement rates
- **Language Tab**: Language learning path, proficiency level, vocabulary size

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

### Settings (`/features/settings/`)

- `ProfileSettingsForm` - User profile management (name, email, languages, profile picture)
- `LearningSettingsForm` - Learning preferences and goals configuration
- `AppSettingsForm` - Application settings (theme, notifications, general preferences)
- `DangerZoneForm` - Account deletion and sensitive operations

**Settings Features:**

- **Profile Picture Upload**: Drag & drop with preview, 2MB limit, supports JPG/PNG/WebP
- **Language Selection**: 12 supported languages with flags and native names
- **Learning Goals**: Daily word targets (1-100), difficulty preferences (1-5 scale)
- **Session Configuration**: Duration settings (5-120 minutes), review intervals (1-30 days)
- **Audio Preferences**: Sound effects, auto-play audio, volume controls
- **Theme Management**: Light/dark/system theme with live preview
- **Notification Settings**: Learning reminders, progress notifications, browser notifications
- **Account Security**: Account deletion with confirmation dialog and data export options

### Shared (`/shared/`)

- **Navigation**: `PageBreadcrumb`, `ModeToggle`, `MainPageButton`
- **Forms**: `FormInput`, `ProfileForm`
- **Dialogs**: `DatabaseCleanupDialog`, `BulkDeleteConfirmDialog`

### Utils (`/utils/`)

**Loading Skeletons (`/utils/skeletons/`):**

- `DashboardLoadingSkeleton` - Main dashboard loading skeleton with structured placeholders for key metrics, quick actions, progress cards, and achievements
- `StatisticsLoadingSkeleton` - Statistics page loading skeleton matching the detailed analytics layout

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
