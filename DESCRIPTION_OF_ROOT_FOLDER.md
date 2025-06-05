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
