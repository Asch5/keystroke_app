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

**Navigation Components:**

- `AppSidebar` - Modern sidebar component using shadcn/ui Sidebar primitives with collapsible functionality, user profile display, and navigation menu
- `SideNav` - Legacy sidebar component (deprecated, use AppSidebar instead)
- `NavLinks` - Navigation links renderer (still used by legacy SideNav)

**AppSidebar Features:**

- **shadcn/ui Integration**: Built using official shadcn/ui Sidebar primitives for consistency and theming
- **Collapsible Design**: Supports icon-only collapsed state with tooltips for space efficiency
- **User Profile Display**: Modern avatar layout in footer with name, email, and clickable settings link
- **Active State Management**: Highlights current page with proper visual feedback
- **Sub-Navigation Support**: Expandable dictionary section with collapsible sub-menus for internal routes
- **Dictionary Sub-Routes**: Overview, My Dictionary, Add New Word, and Word Lists with proper active state detection
- **Brand Header**: Application logo and name in the header section following shadcn/ui patterns
- **Responsive Mobile Support**: Automatic mobile sheet overlay using shadcn/ui Sheet component
- **Keyboard Shortcuts**: Built-in Cmd/Ctrl+B keyboard shortcut for toggle functionality
- **Persistent State**: Remembers sidebar state using cookies across sessions
- **Collapsible Groups**: Uses shadcn/ui Collapsible component for expandable menu sections
- **Sign Out Integration**: Dedicated sign out button in footer with NextAuth.js integration
- **Rail Toggle**: Clickable rail for easy sidebar toggle interaction
- **Proper Semantic Structure**: Uses SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, and SidebarMenuSub for organized layout

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
- `AddNewWordForm` - Add words (admin)
- `WordEditForm` - Edit words (admin)
- `DictionaryOverview` - Main dictionary overview with statistics and quick actions
- `MyDictionaryContent` - Comprehensive user dictionary management with filtering, sorting, search, pagination, and word-to-list management
- `AddNewWordContent` - User word search and dictionary addition interface with integrated list management workflow
- `WordListsContent` - User list management and public list discovery interface
- `AddToListDialog` - Modal dialog for adding words from user dictionary to lists (existing or new custom lists)
- `ListDetailContent` - Individual list management page for viewing and managing words within a specific list

**MyDictionaryContent Features:**

- **Modular Architecture**: Completely refactored from 908 lines to 161 lines using custom hooks and smaller components
- **State Management**: useDictionaryState hook (~170 lines) handles all state management and data fetching
- **Action Management**: useDictionaryActions hook (~100 lines) manages word actions and dialog states
- **Component Separation**: DictionaryFilters (~240 lines), WordTable (~360 lines), DictionaryPagination (~60 lines), DictionaryEmptyState (~45 lines), DictionaryLoadingSkeleton (~60 lines)
- **Enhanced Search**: Fixed critical search bug - now searches word text, definitions, custom fields, and translations
- **Audio Integration**: useAudioPlayback hook (~95 lines) for audio functionality with error handling
- **Comprehensive Filtering**: Filter by learning status, part of speech, favorites, modified words, and review status
- **Advanced Search**: Real-time search across word text with debounced input for performance
- **Flexible Sorting**: Sort by word, progress, last reviewed date, mastery score, or creation date with ascending/descending options
- **Pagination Support**: Navigate through large vocabularies with configurable page sizes
- **Actions Dropdown**: Multi-action dropdown for each word including favorites, learning status, review scheduling, and list management
- **Add to List Feature**: Direct integration with AddToListDialog for organizing words into custom or existing lists
- **Learning Status Management**: Mark words as learned, needing review, with visual status indicators and color-coded badges
- **Progress Tracking**: Visual progress bars showing learning completion and mastery scores with review counts
- **Audio Integration**: Play audio pronunciations directly from the word list with database-only playback
- **Image Support**: View associated images for visual learning enhancement
- **Translation-Aware Display**: Shows definitions in user's native language when translations are available
- **Responsive Design**: Mobile-optimized layout with proper touch targets and scrolling

**AddNewWordContent Features:**

- **Multi-Language Search**: Search words across different language dictionaries with language selector
- **Real-Time Search**: Debounced search with loading states and error handling
- **Definition-Level Management**: Add/remove individual word definitions rather than entire words
- **User Context Awareness**: Shows which definitions are already in user's dictionary with appropriate action buttons
- **Rich Word Display**: Shows phonetic transcription, part of speech, variants, and metadata (audio, images, examples)
- **Pagination Support**: Navigate through large search result sets with previous/next controls
- **Interactive Actions**: Add/remove definitions with optimistic UI updates and toast notifications
- **Seamless List Integration**: After adding a word to dictionary, users get a toast notification with "Add to List" action button for immediate list organization
- **Workflow Optimization**: Creates a smooth Search → Dictionary → List workflow using the reused AddToListDialog component
- **Translation-Aware Display**: Shows definitions in user's native language when translations are available with original definition reference
- **Empty States**: Helpful guidance for initial state and no results scenarios
- **Responsive Design**: Mobile-friendly layout with proper spacing and typography

**WordListsContent Features:**

- **Dual Tab Interface**: Separate views for "My Lists" and "Discover" with independent filtering
- **List Type Management**: Handles both inherited public lists and custom user-created lists
- **Collection Operations**: Add/remove public lists to/from user's personal collection
- **Custom List Creation**: Users can create and manage their own word lists
- **List Customization**: Users can customize names, descriptions, and difficulty levels for inherited lists
- **Progress Tracking**: Visual progress indicators showing learning completion for each list
- **Rich Metadata Display**: Shows word counts, learned counts, difficulty levels, and sample words
- **Search and Filtering**: Real-time search across list names, descriptions, and tags
- **Responsive Card Layout**: Grid-based responsive design with hover effects and smooth transitions
- **Language Compatibility**: Filters public lists based on user's language preferences

**AddToListDialog Features:**

- **Two-Tab Interface**: Switch between "Add to Existing List" and "Create New List" options
- **Visual List Selection**: Interactive cards showing existing lists with difficulty badges, word counts, and custom/inherited indicators
- **New List Creation**: Complete form with name, description, difficulty selection, and cover image upload
- **Advanced Image Selection**: Integrated ImageSelector component with Pexels API search for cover images
- **Duplicate Prevention**: Validates against adding same word to a list multiple times
- **Order Management**: Automatically maintains proper word ordering within lists
- **Real-Time Validation**: Form validation with helpful error messages and loading states
- **User Language Context**: Automatically uses user's language preferences for new list creation
- **Success Feedback**: Toast notifications and dialog state management for smooth UX
- **Responsive Design**: Mobile-friendly layout with proper scrolling and spacing

**ListDetailContent Features:**

- **Individual List Management**: Dedicated page for managing words within a specific vocabulary list
- **Comprehensive Statistics**: Overview cards showing total words, learned count, progress percentage, and remaining words
- **Progress Visualization**: Progress bar and percentage indicators for learning completion tracking
- **Word Management Table**: Sortable table displaying word, definition, learning status, and progress for each word in the list
- **Search and Filter**: Real-time search functionality to find specific words within the list
- **Word Removal**: Remove individual words from the list with confirmation dialog (does not delete from user dictionary)
- **Learning Status Display**: Color-coded badges showing learning progress (learned, in progress, needs review, difficult)
- **Navigation Integration**: Seamless navigation back to main lists page and clickable list cards for easy access
- **Translation-Aware Display**: Shows definitions in user's native language when translations are available
- **Responsive Design**: Mobile-optimized layout with proper table scrolling and touch-friendly interactions
- **Loading States**: Skeleton loading animations for smooth user experience during data fetching
- **Error Handling**: Graceful error handling with user-friendly messages and fallback states

### Practice (`/features/practice/`)

- `TypingPracticeContent` - Comprehensive typing practice interface with real-time feedback and session management

**Barrel Export (`/features/practice/index.ts`):**

```typescript
export { TypingPracticeContent } from './TypingPracticeContent';
```

**Typing Practice Features:**

- **Character-by-Character Input**: Uses shadcn/ui InputOTP component for precise character input with visual feedback
- **Real-Time Validation**: Instant feedback on typing accuracy with color-coded character slots (green/red/gray)
- **Session Management**: Complete session lifecycle from creation to completion with progress tracking
- **Intelligent Word Selection**: Prioritizes words needing review based on learning status and time since last practice
- **Adaptive Difficulty**: Configurable difficulty levels affecting session parameters (word count, time limits, hints)
- **Progress Tracking**: Live session statistics including correct/incorrect answers, score, and completion percentage
- **Timer Integration**: Countdown timer with visual warnings when time is running low
- **Achievement System**: Automatic achievement detection and celebration (Perfect Score, Excellence, Quick Learner, Speed Demon)
- **Learning Metrics Integration**: Updates user dictionary with new learning progress after each word
- **Audio Support**: Audio pronunciation playback for words (placeholder for future implementation)
- **Skip Functionality**: Allow users to skip difficult words with penalty scoring
- **Session Summary**: Detailed completion summary with accuracy, score, achievements, and option to practice again
- **Responsive Design**: Mobile-optimized layout with proper touch targets and visual feedback
- **Error Handling**: Graceful error handling with user-friendly messages and retry options
- **Auto-Submission**: Automatically submits word when user completes typing the full word length
- **Typo Tolerance**: Configurable character-level tolerance for minor spelling mistakes
- **Partial Credit System**: Awards partial points for close attempts based on character accuracy

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
- `MyDictionaryLoadingSkeleton` - My Dictionary page loading skeleton with search filters, table structure, and pagination placeholders

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
