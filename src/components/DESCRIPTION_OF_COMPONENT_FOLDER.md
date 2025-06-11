# Components Folder Structure

This document describes the organization and purpose of components in the `src/components` folder. The structure follows a hierarchical pattern based on functionality and domain.

## Overview

The components are organized into several main categories:

- **Features**: Domain-specific components organized by feature area
- **Layouts**: Application layout components
- **Providers**: Context and state providers
- **Shared**: Reusable utility components
- **UI**: Base UI components (from shadcn/ui)
- **Utils**: Component utilities and helpers

## Features (`/features`)

### Practice Components (`/features/practice`)

The practice system supports multiple types of vocabulary practice exercises:

**Main Components:**

- `PracticeOverviewContent.tsx` - Practice type selection and list chooser
- `TypingPracticeContent.tsx` - Main typing practice orchestrator (134 lines)
- `TypingPracticeHeader.tsx` - Session statistics and progress display (100 lines)
- `TypingWordInput.tsx` - OTP-style character input interface (266 lines)
- `TypingSessionSummary.tsx` - Results display with accuracy metrics (70 lines)
- `TypingGettingStarted.tsx` - Initial welcome screen (30 lines)

**Custom Hooks (`/features/practice/hooks`):**

- `useTypingPracticeState.ts` - Complete state management for typing practice (315 lines)
- `useTypingAudioPlayback.ts` - Audio playback with database-only support (80 lines)
- `index.ts` - Barrel exports for hooks

**Practice Type Support:**

- **Typing Practice** (Available) - Character-by-character input with real-time feedback
- **Flashcards** (Coming Soon) - Spaced repetition study cards
- **Vocabulary Quiz** (Coming Soon) - Multiple choice testing
- **Word Games** (Coming Soon) - Interactive learning games

**List Selection Features:**

- Support for all user vocabulary
- User's custom lists
- User's inherited public lists
- Difficulty level filtering
- Word count display
- Progress tracking

Each component follows the <400 line rule and maintains single responsibility. The typing practice system was successfully refactored from a single 907-line component into 7 focused, modular components.

### Admin Components (`/features/admin`)

#### Dictionary Management (`/features/admin/dictionary`)

**Modular Admin Dictionary System:**

- `AdminDictionaryPageHeader.tsx` (~70 lines) - Header with language selector and toolbar
- `AdminDictionaryFilters.tsx` (~200 lines) - Comprehensive filtering system
- `AdminDictionaryTable.tsx` (~320 lines) - Data table with selection and actions
- `useAdminDictionaryState.ts` (~315 lines) - Complete state management hook
- `useAudioPlayback.ts` (~40 lines) - Reusable audio playback hook
- `AdminDictionaryConstants.ts` (~60 lines) - Shared constants and types

The admin dictionaries page was successfully refactored from 963 lines to 120 lines by breaking it into focused, modular components following Cursor Rules.

**Modular WordDetails System:**

- `WordDetails.tsx` (60 lines) - Main container component orchestrating all sections with optional dictionary actions
- `WordDetailsHeader.tsx` (~40 lines) - Word title, phonetic, and primary audio playback
- `WordDetailsMetadata.tsx` (~35 lines) - Language and frequency information display
- `WordDetailsPartOfSpeech.tsx` (~120 lines) - Individual part of speech sections with metadata, audio, and relations
- `WordDetailsDefinitions.tsx` (~280 lines) - Enhanced definitions with examples, images, translations, complex formatting, and dictionary actions ("Add to Dictionary" and "Add to List" buttons). Features real-time dictionary status checking, disabled states for existing definitions, green badges for words already in dictionary, and immediate state updates after adding words
- `WordDetailsRelatedWords.tsx` (~150 lines) - Related words organized by semantic, inflectional, and derivational categories with clickable navigation
- `utils/text-rendering.tsx` (~130 lines) - Text formatting utilities for special tags ({it}, {phrase}, [=], etc.)
- `utils/translation-utils.ts` (~40 lines) - Translation and relationship formatting utilities

**Word Details Page System:**

- `WordDetailsPageContent.tsx` (~120 lines) - Client component for dedicated word details page with navigation and state management
- `/dashboard/dictionary/word-details/[word]/page.tsx` - Server component route for word details with authentication and URL parameters
- Features: Dedicated page view (replacing dialog), clickable related word navigation, "Add to Dictionary" and "Add to List" actions on definitions, back navigation, language parameter support, loading and error states

The WordDetails component was successfully refactored from 1043 lines to 60 lines by breaking it into 8 focused, modular components following Cursor Rules. Enhanced with dedicated page experience and dictionary actions similar to the Add New Word functionality.

**Other Admin Components:**

- `WordDetailEditForm.tsx` - Enhanced form for editing word details with comprehensive definition and example management
- `RelationshipManager.tsx` - Two-level relationship management for linguistic connections

#### User Management (`/features/admin/users`)

- Components for user administration

### Dictionary Components (`/features/dictionary`)

**Modular Dictionary System:**

- `MyDictionaryContent.tsx` (161 lines) - Main container component
- `DictionaryFilters.tsx` - Search, filtering, and sorting controls
- `WordTable.tsx` - Dictionary word display with actions
- `DictionaryPagination.tsx` - Pagination controls
- `DictionaryEmptyState.tsx` - Appropriate empty state messages
- `useAudioPlayback.tsx` - Audio playback functionality hook

**State Management:**

- `useDictionaryState.ts` (~170 lines) - Data fetching and state management
- `useDictionaryActions.ts` (~100 lines) - Word actions and dialog management
- `DictionaryLoadingSkeleton.tsx` (~60 lines) - Loading state components

The My Dictionary system was successfully refactored from 908 lines to 161 lines by breaking it into focused, modular components.

**Additional Dictionary Components:**

- `AddNewWordContent.tsx` - Enhanced with seamless list management workflow
- `AddToListDialog.tsx` - Word-to-list assignment interface (reused in WordDetails)
- `WordListsContent.tsx` - User list management interface
- `ListDetailContent.tsx` - Individual list view and management
- `WordDetailsPageContent.tsx` - Dedicated page component for comprehensive word viewing with navigation

**Translation Support:**

- Native language translation prioritization throughout dashboard
- `getBestDefinitionForUser()` utility for translation logic
- User-specific dictionary display utilities

### Other Feature Areas

#### Authentication (`/features/auth`)

- Login and signup components
- Authentication state management

#### Dashboard (`/features/dashboard`)

- **AppSidebar** (`app-sidebar.tsx`) - Modern collapsible sidebar using shadcn/ui Sidebar primitives with:
  - Collapsible design with persistent state
  - Keyboard shortcuts (Cmd/Ctrl+B)
  - Responsive mobile support
  - Dictionary sub-navigation with expandable sections
  - User profile display in footer
  - Brand header with application info
- **Charts** (`/charts`) - Data visualization components
- Dashboard overview and navigation

**Sidebar Features:**

- Uses shadcn/ui Sidebar components (SidebarProvider, SidebarHeader, SidebarContent, SidebarFooter)
- Expandable dictionary section with collapsible sub-menus for internal routes (Overview, My Dictionary, Add New Word, Word Lists)
- Profile picture caching and fallback avatars
- Active state management for navigation items
- Semantic structure for accessibility

#### Settings (`/features/settings`)

- User preference management
- Configuration interfaces

#### Translation (`/features/translation`)

- Translation utility components
- Language switching interfaces

## Layouts (`/layouts`)

Application-wide layout components:

- Page layouts
- Navigation structures
- Content wrappers

## Providers (`/providers`)

React context providers:

- Authentication providers
- Theme providers
- State management providers

## Shared (`/shared`)

### Data Display (`/shared/data-display`)

- Tables, lists, cards
- Data presentation components

### Dialogs (`/shared/dialogs`)

- Modal dialogs
- Confirmation prompts
- Form dialogs

### Forms (`/shared/forms`)

- Form components
- Input wrappers
- Validation helpers

### Navigation (`/shared/navigation`)

- Navigation menus
- Breadcrumbs
- Link components

## UI (`/ui`)

Base UI components from shadcn/ui:

- Buttons, inputs, cards
- Layout primitives
- Typography components

## Utils (`/utils`)

### Debug (`/utils/debug`)

- Development and debugging utilities

### Skeletons (`/utils/skeletons`)

- Loading skeleton components

### Wrappers (`/utils/wrappers`)

- Component wrappers and HOCs

## Component Development Guidelines

### Size and Responsibility

- **File Size Limit**: Components should rarely exceed 300-400 lines
- **Single Responsibility**: Each component should have one clear purpose
- **Composition Over Inheritance**: Break large components into smaller, composable parts

### Naming Conventions

- Use PascalCase for component files
- Use descriptive names that indicate purpose
- Group related components in feature folders

### State Management

- Use custom hooks for complex state logic
- Keep state close to where it's used
- Leverage Redux for global state when needed

### Performance

- Use React.memo for expensive renders
- Implement useCallback and useMemo appropriately
- Lazy load components when beneficial

### Accessibility

- Use semantic HTML elements
- Include ARIA attributes where needed
- Ensure keyboard navigation support

### Mobile-First Design

- All components must be responsive
- Use Tailwind's responsive prefixes
- Test on multiple device sizes

## Recent Refactoring Achievements

1. **Practice System** - Broke down 907-line TypingPracticeContent into 7 focused components with multi-practice type support
2. **Admin Dictionary** - Reduced 963-line page to 120 lines with 6 modular components
3. **My Dictionary** - Refactored 908-line component to 161 lines with enhanced search and modular design
4. **WordDetails Display** - Broke down 1043-line component into 8 focused components with comprehensive word display functionality, dedicated page experience, and integrated dictionary actions
5. **Audio System** - Simplified and fixed audio playback across components
6. **Translation System** - Implemented native language prioritization throughout

Each refactoring maintains all original functionality while improving maintainability, reusability, and following established patterns for type safety and error handling.

## Testing Structure

Following CURSOR RULES, tests are **co-located** with the components they test:

### Test File Locations

- Component tests: `Component.test.tsx` (next to `Component.tsx`)
- Hook tests: `useHook.test.ts` (next to `useHook.ts`)
- Utility tests: `utils.test.ts` (next to `utils.ts`)

### Testing Infrastructure

- **Framework**: Vitest + React Testing Library
- **Setup**: `src/test-setup.ts` (global mocks and configuration)
- **Config**: `vitest.config.ts` (test environment configuration)
- **Utilities**: `test-utils.ts` files for shared testing helpers

### Current Test Coverage

#### Practice Components (`/features/practice`) - ✅ COMPLETE

- `useTypingPracticeState.test.ts` - State management and core functionality
- `TypingWordInput.test.tsx` - Enter key behavior and user interactions
- `TypingPracticeContent.test.tsx` - Full workflow integration tests
- `test-utils.ts` - Shared testing utilities and mock data

**Critical fixes tested:**

- ✅ Skip functionality shows correct word (was broken)
- ✅ Word progression prevents getting stuck on same word (was broken)
- ✅ Enter key behavior: skip → submit → next (recently implemented)
- ✅ Auto-submit settings integration
- ✅ Audio playback after skip/submit
- ✅ Settings persistence and application

#### Planned Test Coverage

- **Dictionary Components** (`/features/dictionary`) - 📋 Planned
- **Admin Components** (`/features/admin`) - 📋 Planned
- **Shared Components** (`/shared`) - 📋 Planned
- **UI Components** (`/ui`) - 📋 As needed

### Running Tests

```bash
pnpm test              # Watch mode
pnpm test:run         # Single run
pnpm test:ui          # Visual interface
pnpm test:coverage    # With coverage report
```

### Testing Patterns

- **Component Testing**: User behavior and interactions
- **Hook Testing**: State management and side effects
- **Integration Testing**: Complete workflows and component interactions
- **Mobile-First**: Responsive design and touch interactions

See `src/components/TESTING.md` for detailed testing guidelines and patterns.
