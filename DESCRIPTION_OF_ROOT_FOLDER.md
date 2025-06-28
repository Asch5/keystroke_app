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
├── logs/                 # Application logs (server.log, client.log)
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

# Testing (Dual Architecture)
pnpm test               # Component/unit tests (co-located)
pnpm test:run          # Single run component tests
pnpm test:coverage     # Coverage report
cd tests && pnpm backup:db  # Server-side database backup
cd tests && pnpm test:tts   # TTS service testing

# Environment
pnpm run validate-env   # Validate environment variables
pnpm run env:check      # Check .env files exist
pnpm run env:template   # Generate environment template

# Build Optimization
# See BUILD_OPTIMIZATION_REPORT.md for performance analysis
```

## 🏗️ **CRITICAL: Dual Testing Architecture**

The project uses a **dual testing system** that separates concerns:

### **Component Tests (Co-located)**

- **Location**: Next to the components they test (`Button.test.tsx` next to `Button.tsx`)
- **Framework**: Vitest + React Testing Library
- **Config**: `vitest.config.ts` with jsdom environment
- **Setup**: `src/test-setup.ts` with comprehensive mocks
- **Purpose**: Component behavior, user interactions, UI logic
- **Command**: `pnpm test` (from root)

### **Server-Side Tests (Separate)**

- **Location**: `/tests/` folder with its own `package.json`
- **Framework**: Custom test harnesses + tsx
- **Purpose**: Database operations, API integrations, server actions, backups
- **Commands**: `cd tests && pnpm [command]`
- **Examples**: `pnpm backup:db`, `pnpm test:tts`, `pnpm test:translations`

**⚠️ IMPORTANT**: Never mix these architectures. Component tests stay co-located, server tests stay in `/tests/`.

## 🔄 **Database Backup System** (Production Critical)

### **Advanced Backup Architecture**

- **Location**: `tests/danishDicitonary/backupProcess/`
- **Daily Backups**: `backups/YYYY-MM-DD/` with `backup.json` and `metadata.json`
- **Features**: Encryption, compression, incremental backups, data validation

### **Backup Commands**

```bash
cd tests
pnpm backup:db              # Create timestamped backup
pnpm backup:db:encrypted    # Create encrypted backup
pnpm restore:db            # Restore from backup
pnpm backup:and:transform  # Backup + transform for analysis
```

### **Getting Latest Backup** (As per Rules)

```bash
cd tests
pnpm backup:db  # Always run this to get the latest backup.json
```

## 📊 **Comprehensive Logging & Autonomous Debugging System**

### **Logging Architecture**

- **Server Logs**: `logs/server.log` (via `serverLogger.ts`)
- **Client Logs**: `logs/client.log` + localStorage (via `clientLogger.ts`)
- **Environment-Aware**: Auto-detects browser vs server, dev vs production

### **Autonomous Debugging** (AI-Powered)

- **DebugReader Class**: `src/core/infrastructure/monitoring/debugReader.ts`
- **Capabilities**: Log analysis, pattern recognition, health monitoring, issue detection
- **Browser Access**: `window.KeystrokeDebug` in development
- **AI Analysis**: Automatic detection of auth, database, API, performance, and UX issues

### **Logging Best Practices**

```typescript
// Server-side
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
serverLog.info('User action', { userId, action });

// Client-side
import { infoLog } from '@/core/infrastructure/monitoring/clientLogger';
await infoLog('Component mounted', { component: 'UserProfile' });
```

## 🌍 **Dynamic Language System** (Core Feature)

### **Architecture**

- **Single Source of Truth**: `User.baseLanguageCode` for translation preferences
- **Adaptive Content**: All content automatically adapts when user changes base language
- **Translation Priority**: Native language translation > Original definition
- **Flexible Learning**: Learn Danish with English/Spanish/any base language support

### **Key Utilities**

- `getBestDefinitionForUser()` - Translation-aware content display
- `shouldUseTranslations()` - Language preference detection
- Dynamic list inheritance with language adaptation

## 🎵 **Audio/TTS Architecture** (Cost-Optimized)

### **Audio Sources Priority**

1. **Database Audio Files** (Primary) - Real recordings stored in blob storage
2. **Web Speech API** (Fallback) - Browser-based TTS for practice mode
3. **❌ No Google Cloud TTS** - Explicitly disabled to avoid costs

### **Audio Services**

- `AudioService.playAudioFromDatabase()` - Blob storage audio playback
- `AudioDownloadService` - External audio download and local storage
- `audioDownloadService` - Singleton for Danish/Merriam-Webster audio download

### **Blob Storage Organization**

```
vercel-blob/
├── audio/
│   ├── da/words/          # Danish word audio
│   ├── en/words/          # English word audio
│   └── definitions/       # Definition audio
```

## 🤖 **AI Integrations**

### **DeepSeek API** (Cost-Effective AI)

- **Purpose**: Word extraction from definitions (~$0.0001 per definition)
- **Location**: `src/core/infrastructure/services/deepseek-service.ts`
- **Admin Integration**: Available in `/admin/dictionaries` for batch processing
- **Rate Limiting**: 5 requests/second max, batch processing up to 50 definitions

### **Other AI Features**

- **Translation API**: Google Translate (free tier)
- **Image AI**: Pexels API for vocabulary images
- **Smart Word Selection**: AI-powered difficulty assessment for practice sessions

## 🖼️ **Image Authentication System**

### **Problem Solved**

Next.js Image component + authenticated endpoints (`/api/images/`) = broken images

### **Solution Components**

- **AuthenticatedImage**: Auto-detects authenticated endpoints, uses unoptimized mode only when needed
- **ImageWithFallback**: Enhanced error handling with authentication support
- **Consolidated Config**: `next.config.mjs` with CORS headers and image optimization

## 🔧 **Environment Validation System**

### **Multi-Tier Validation**

```bash
pnpm run validate-env      # Full validation with detailed errors
pnpm run env:check        # Check file existence
pnpm run env:template     # Generate missing .env files
```

### **Environment Hierarchy** (Priority Order)

1. `.env.local` (development secrets)
2. `.env.development` (dev overrides)
3. `.env.test` (test environment)
4. `.env` (production)

### **Pre-Build Validation**

- **Automatic**: Runs before every build via `prebuild` script
- **Build Blocking**: Invalid environments prevent deployment
- **Detailed Errors**: Specific guidance for missing/invalid variables

## 🔄 **Development Workflow**

### **Git Hooks (Husky)**

- **Pre-commit**: ESLint + Prettier + staged files only
- **Pre-push**: Validation checks
- **Conventional Commits**: Standardized commit messages

### **Code Quality Pipeline**

```bash
# Automatic on commit
lint-staged → eslint --fix → prettier --write

# Manual quality checks
pnpm lint           # ESLint check
pnpm test:run      # Full test suite
pnpm validate-env  # Environment validation
```

### **Development Best Practices**

- **Hot Reload**: Configured for state preservation
- **Performance Monitoring**: Vercel Speed Insights + custom performance monitor
- **Error Tracking**: Comprehensive error boundaries and logging
- **Type Safety**: Strict TypeScript with no `any` types allowed

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

// Logging (ALWAYS use these for consistency)
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import {
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';

// Audio (Database-only, no external TTS)
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.8+
- **Database**: PostgreSQL (Neon) + Prisma 6.7+
- **Validation**: Zod for schema validation and type safety
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Redux Toolkit + Redux Persist
- **Auth**: NextAuth.js v5
- **Performance Monitoring**: Vercel Speed Insights + Custom Performance Monitor
- **AI Services**: DeepSeek API (word extraction), Google Translate (free tier)
- **Media Services**: Pexels (images), Vercel Blob (audio storage)
- **Package Manager**: pnpm

## Performance Monitoring & Optimization

The application includes comprehensive performance monitoring through:

### Vercel Speed Insights Integration

- **Package**: `@vercel/speed-insights` v1.2.0
- **Location**: Integrated in root layout (`src/app/layout.tsx`)
- **Component**: Custom `SpeedInsights` component (`src/components/shared/SpeedInsights.tsx`)
- **Features**:
  - Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
  - Real User Monitoring (RUM)
  - 100% sampling rate for comprehensive data collection
  - Development debugging enabled
  - Integration with autonomous logging system

### Custom Performance Monitor

- **Location**: `src/core/infrastructure/monitoring/performanceMonitor.ts`
- **Capabilities**:
  - Navigation timing analysis
  - Resource loading performance tracking
  - Layout shift detection
  - Paint timing optimization
  - Autonomous issue detection with recommendations
  - Performance pattern recognition

### Performance Thresholds

- **LCP (Largest Contentful Paint)**: Good < 2.5s, Poor > 4s
- **FID (First Input Delay)**: Good < 100ms, Poor > 300ms
- **CLS (Cumulative Layout Shift)**: Good < 0.1, Poor > 0.25
- **TTFB (Time to First Byte)**: Good < 800ms, Poor > 1.8s

### Autonomous Debugging

- Performance data automatically logged for AI analysis
- Issue detection with actionable recommendations
- Integration with clientLogger for comprehensive monitoring
- Development console access via `window.KeystrokePerformance`

## Configuration Standards

**Next.js Configuration**: The project uses **`next.config.mjs`** as the single source of configuration. This file contains:

- Image optimization settings and remote patterns
- Authentication-aware image handling for `/api/images/` endpoints
- CORS headers for proper image delivery
- TypeScript build settings
- Logging configuration for debugging
- Cache control headers for performance

**Important**: Always use `next.config.mjs` (ES modules format) for all configuration changes. Do not create duplicate `next.config.js` files.

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
- **Logging**: `logs/server.log`, `logs/client.log`
- **Backups**: `tests/danishDicitonary/backupProcess/backups/[latest-date]/backup.json`

## URLs

- **Production**: https://keystroke-app-v2.vercel.app/
- **Development**: http://localhost:3000
- **Speed Insights Dashboard**: https://vercel.com/anton-shashlovs-projects/keystroke_app/speed-insights

## Build Status & Performance

- **Build Process**: ✅ Optimized with environment validation
- **Bundle Size**: ✅ Well-optimized (102 kB shared bundle)
- **Security**: ✅ Environment variables properly secured
- **Performance**: ⭐⭐⭐⭐⭐ (5/5) - Enhanced with Vercel Speed Insights
- **Core Web Vitals**: ✅ Comprehensive monitoring enabled

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
- **MODERNIZED**: Admin WordDetail Edit System - Completely modernized the admin edit-word functionality to edit specific WordDetails instead of entire Words. The system now navigates using WordDetail IDs, allowing precise editing of individual word variants/parts of speech without affecting other WordDetails of the same word. Features include: 1) WordDetail-specific editing with clear separation between Word fields (shared across all WordDetails) and WordDetail fields (specific to the variant), 2) Comprehensive form with all WordDetail properties (part of speech, variant, gender, etymology, phonetic, forms, frequency, source), 3) Inline editing of related definitions and audio files, 4) Warning system about Word field impacts, 5) Modern shadcn/ui interface with proper validation and error handling. The new `fetchWordDetailById` and `updateWordDetailById` actions provide targeted CRUD operations for WordDetail management.
- **NEW**: DeepSeek API Integration - Implemented cost-effective AI-powered word extraction system for admin dictionary management. Features include: 1) DeepSeek API service with batch processing and rate limiting (5 requests/second max), 2) Cost optimization achieving ~$0.0001 per definition (~$0.001 per 1K tokens), 3) Server actions for single and batch word extraction with database integration, 4) DeepSeekWordExtractionDialog component with language selection, progress tracking, and comprehensive result display, 5) DefinitionToOneWord table integration for mapping definitions to exact words, 6) Token usage tracking and cost estimation, 7) Error handling with detailed logging and user feedback. The system allows admins to select definitions, choose target language, and automatically extract matching words using AI while maintaining database relationships through the new DefinitionToOneWord mapping table.
- **NEW**: Next.js Image Authentication Solution - Comprehensive solution for authenticated image endpoints that eliminates the need for img tag workarounds. Features include: 1) AuthenticatedImage component that automatically detects `/api/images/` endpoints and uses unoptimized mode only for those while maintaining Next.js optimization for all other sources, 2) Enhanced ImageWithFallback component with auto-detection of authenticated endpoints, 3) Consolidated next.config.mjs with proper image configuration, CORS headers, and cache settings, 4) Improved middleware.ts with CORS headers for image API requests, 5) Maintains all Next.js Image benefits (lazy loading, priority, sizes) while fixing authentication issues. This solution preserves performance and functionality while providing proper error handling and future-proofing for any authenticated image endpoints.
- **NEW**: Manual Danish Forms Management System - Comprehensive solution for adding Danish word forms that are missed by the automatic `transformDanishForms.ts` processor. Features include: 1) ManualFormsDialog component with intuitive form builder interface accessible via admin/dictionaries actions menu, 2) Standardized definition generation using `getDanishFormDefinition` utility for linguistically accurate Danish form descriptions, 3) Auto-fill functionality that generates appropriate definitions based on base word and relationship type, 4) Complete database integration creating Word, WordDetails, Definition, and relationship records, 5) Support for all Danish grammatical relationships (comparative_da, superlative_da, definite_form_da, plural_da, etc.), 6) Transaction-safe operations with smart upserts and comprehensive error handling, 7) Server actions for reliable backend processing with proper validation and logging. This system ensures comprehensive coverage of Danish language morphology including irregular forms like "stor → større → størst" that automatic processing might miss.

## Critical Issues Identified

### Database Schema Enhancement - ✅ RESOLVED

**Community List Tracking**: ~~The current schema lacks proper tracking of copied community lists.~~ **FIXED**: Added `sourceUserListId` field to `UserList` model to track the origin of community lists copied by users.

**Implemented Schema Change**:

```prisma
model UserList {
  // ... existing fields ...
  sourceUserListId    String?               @map("source_user_list_id") @db.Uuid
  sourceUserList      UserList?             @relation("UserListCopies", fields: [sourceUserListId], references: [id])
  copiedByUsers       UserList[]            @relation("UserListCopies")
  // ... rest of fields ...
}
```

This enables:

1. ✅ Proper tracking of community list copies
2. ✅ Accurate `isInUserCollection` detection
3. ✅ Update propagation from original to copies
4. ✅ Community list popularity metrics

**Note**: Database migration required with `pnpm run p-migrate` to apply schema changes.
