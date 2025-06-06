# Keystroke App - Root Structure Reference

## Structure

```
keystroke_app/
├── .github/workflows/     # CI/CD automation
├── .husky/               # Git hooks (pre-commit/pre-push)
├── .next/                # Build output (auto-generated)
├── documentation/        # Project docs & API schemas
├── prisma/               # DB schema, migrations, seed
├── public/               # Static assets
├── scripts/              # Build & utility scripts
├── src/                  # Main application code
├── tests/                # Test files & data
├── .env.*               # Environment config
└── config files         # TS, ESLint, Tailwind
```

## Key Commands

```bash
# Development
pnpm dev                 # Start dev server (:3000)
pnpm build              # Production build (with env validation)
pnpm lint               # Code quality check

# Database
pnpm run p-studio       # DB GUI
pnpm run p-migrate      # Apply migrations
pnpm run p-generate     # Generate Prisma client

# Environment
pnpm run validate-env   # Validate environment variables
pnpm run env:check      # Check .env files exist
pnpm run env:template   # Generate environment template

# Build Optimization
# See BUILD_OPTIMIZATION_REPORT.md for performance analysis
```

## Environment Files Priority

1. `.env.local` (development)
2. `.env.development`
3. `.env.test`
4. `.env` (production)

## Import Patterns

```typescript
// Components
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/components/features/auth';
import { ProfileSettingsForm } from '@/components/features/settings';

// Core business logic
import { getWordDetails } from '@/core/domains/dictionary';
import { authenticateUser } from '@/core/domains/auth';
import { updateUserProfile, getUserSettings } from '@/core/domains/user';

// Infrastructure
import { handlePrismaError } from '@/core/shared/database';
import { useAppDispatch } from '@/core/state';
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.8+
- **Database**: PostgreSQL (Neon) + Prisma 6.7+
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Redux Toolkit + Redux Persist
- **Auth**: NextAuth.js v5
- **External APIs**: Google Cloud TTS, Pexels, Merriam-Webster
- **Package Manager**: pnpm

## File Naming

- **Components**: `PascalCase.tsx`
- **Utilities**: `camelCase.ts`
- **Folders**: `kebab-case` or `camelCase`
- **Types**: `PascalCase` interfaces

## Critical Paths

- **Core Logic**: `src/core/DESCRIPTION_OF_CORE_FOLDER.md`
- **Components**: `src/components/DESCRIPTION_OF_COMPONENT_FOLDER.md`
- **Environment**: `documentation/ENVIRONMENT_VARIABLES.md`
- **DB Schema**: `prisma/schema.prisma`

## URLs

- **Production**: https://keystroke-app-v2.vercel.app/
- **Development**: http://localhost:3000

## Build Status & Performance

- **Build Process**: ✅ Optimized with environment validation
- **Bundle Size**: ✅ Well-optimized (102 kB shared bundle)
- **Security**: ✅ Environment variables properly secured
- **Performance**: ⭐⭐⭐⭐ (4/5) - See BUILD_OPTIMIZATION_REPORT.md

## Recent Improvements

- Fixed dynamic server rendering error on settings page
- Secured environment variable exposure in build logs
- Comprehensive build performance analysis completed
- **NEW**: Comprehensive user statistics dashboard with learning analytics, progress tracking, and performance metrics
- **NEW**: User statistics actions with comprehensive analytics including learning progress, session statistics, mistake analysis, achievements, and language proficiency estimation
- **NEW**: Main dashboard overview page with key metrics, quick actions, recent activity, and progress visualization following educational app best practices
- **NEW**: Complete dictionary management system with comprehensive user dictionary functionality including filtering, sorting, search, pagination, and learning progress tracking
- **NEW**: Dictionary overview page with statistics, quick actions, and navigation to dictionary features
- **NEW**: My Dictionary page with advanced word management, learning status tracking, favorites system, and comprehensive filtering options
- **NEW**: Add New Word page with comprehensive word search functionality, allowing users to search the database and add specific definitions to their personal dictionary
- **NEW**: Word Lists page with dual functionality for managing personal lists and discovering public lists, supporting both inherited public lists and custom user-created lists with full customization capabilities
- **NEW**: Add to List functionality allowing users to organize vocabulary by adding words from their dictionary to custom or existing lists directly from the My Dictionary page with modal dialog interface
- **NEW**: Seamless Add New Word to List Workflow - Enhanced the Add New Word page with integrated list management. Users can now search for words, add them to their dictionary, and immediately add them to lists via toast notification with "Add to List" action button, creating a smooth Search → Dictionary → List workflow
- **NEW**: Native Language Translation Support - If a user's native language is English (or any other language), the system now prioritizes showing English translations of definitions instead of the original target language definitions throughout all dashboard/dictionary sections, with fallback to original definitions when translations aren't available
- **NEW**: Typing Practice System - Comprehensive typing practice functionality with character-by-character input using shadcn/ui InputOTP component. Features intelligent word selection, real-time validation with typo tolerance, adaptive difficulty levels, session management, achievement system, and learning progress tracking. Includes comprehensive learning metrics configuration with spaced repetition algorithms and performance analytics.
- **ENHANCED**: Database Schema Fixes - Fixed UserListWord relationship issues in user-list-actions.ts by correcting composite key usage, removing invalid schema references, and improving type safety for word list management operations.
- **REFACTORED**: Sidebar Navigation - Migrated from custom SideNav component to shadcn/ui Sidebar primitives for better consistency, accessibility, and modern design patterns. New AppSidebar component features collapsible design, persistent state, keyboard shortcuts (Cmd/Ctrl+B), responsive mobile support, and proper semantic structure using SidebarProvider, SidebarHeader, SidebarContent, and SidebarFooter components.
- **ENHANCED**: Sidebar Sub-Navigation - Added expandable dictionary section with collapsible sub-menus for internal routes (Overview, My Dictionary, Add New Word, Word Lists). Improved user profile display with modern avatar layout in footer and brand header following shadcn/ui design patterns.
- **REMOVED**: Profile Route - Removed /dashboard/profile route and cleaned up all references including navigation links, sidebar links, and revalidation paths. User profile functionality is now integrated into the settings page.
- **IMPROVED**: Header Layout Coordination - Updated dashboard and admin layouts to match shadcn/ui sidebar documentation patterns with proper spacing, visual separators, responsive transitions, and optimized trigger positioning for consistent design language.
- **ENHANCED**: Admin Navigation Icons - Updated admin navigation with more appropriate and descriptive icons: ShieldCheck for Admin access, List for Lists Management, MagnifyingGlass for Check Word, Plus for Add New Word, ChartBar for Frequency analysis, and PencilSquare for Edit Word functionality.
- **NEW**: Admin List Word Management - Implemented comprehensive word management functionality for admin public lists. Admins can now view, search, sort, and remove words from public vocabulary lists through a dedicated management interface at `/admin/dictionaries/lists/[id]/words`. Features include bulk selection, real-time search, sortable columns (word, order, part of speech), audio playback, pagination, and confirmation dialogs for word removal. This complements the existing user list management and provides full administrative control over public vocabulary collections.
