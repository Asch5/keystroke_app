# Keystroke App - AI Agent Configuration

## Document Metadata

```yaml
title: Keystroke App - AI Agent Configuration
purpose: Central AI agent configuration with complete project context and development guidelines
scope: Comprehensive project overview covering architecture, guidelines, and agent instructions
target_audience: AI agents, senior developers, project maintainers, system architects
complexity_level: advanced
estimated_reading_time: 30 minutes
last_updated: 2025-01-25
version: 1.0.0
dependencies: []
related_files:
  - 'documentation/AI_DOCUMENTATION_INDEX.md'
  - 'documentation/DESCRIPTION_OF_CORE_FOLDER.md'
  - 'documentation/DESCRIPTION_OF_COMPONENT_FOLDER.md'
  - 'documentation/DATABASE_DESCRIPTION.md'
ai_context:
  summary: 'Primary AI agent configuration document providing complete project context, architecture overview, and development guidelines'
  use_cases:
    - 'Primary entry point for AI agent project understanding'
    - 'Complete project architecture reference'
    - 'Development workflow and standards guidance'
    - 'Technology stack and configuration overview'
  key_concepts:
    [
      'ai_agent_config',
      'project_architecture',
      'development_guidelines',
      'technology_stack',
      'system_overview',
    ]
semantic_keywords:
  [
    'AI agent configuration',
    'project overview',
    'architecture guidelines',
    'technology stack',
    'development workflow',
    'system architecture',
    'Next.js application',
    'language learning platform',
    'database design',
    'component architecture',
  ]
```

## Executive Summary

This document serves as the central AI agent configuration for the Keystroke App, a comprehensive multi-language learning platform. It provides complete project context, architectural guidelines, and development standards for AI agents and senior developers working on the system.

**Key System Features:**

- Multi-language learning platform with dynamic language support
- Prisma-free client architecture for optimal performance
- Autonomous debugging capabilities with AI-powered analysis
- Comprehensive practice system with spaced repetition algorithms
- Advanced component architecture with modular design patterns

**Prerequisites:**

- This is the primary entry point - no dependencies required
- Comprehensive documentation system available in `/documentation/` directory
- AI-optimized documentation structure for enhanced agent comprehension

## Project Overview

**Keystroke App** is a comprehensive language learning platform with dynamic multi-language support where users can learn any target language with any base language. The application provides AI-powered vocabulary building, spaced repetition learning, and comprehensive dictionary management with flexible language combinations.

### Core Features

- **Dynamic Language System**: Single source of truth for translation preferences with instant language switching
- **Prisma-Free Client Architecture**: Complete separation of client/server code to eliminate bundling issues
- **Autonomous Debugging**: AI-powered log analysis and pattern recognition
- **Multi-Modal Learning**: Audio, visual, and contextual vocabulary learning
- **Advanced Practice System**: Typing practice, flashcards, and gamified learning modes

### Technology Stack

- **Frontend**: React 19, Next.js 15.3.2 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions, Prisma ORM
- **Database**: PostgreSQL with comprehensive relational schema
- **State Management**: Redux Toolkit with persistence
- **UI Components**: shadcn/ui library with consistent design system
- **Authentication**: NextAuth.js with role-based access control

## Agent Instructions

### Primary Role

Act as a senior full-stack developer with expertise in modern React/Next.js applications, database architecture, and AI-powered features. Follow established architectural patterns and maintain code quality standards.

### Critical Guidelines

1. **Architecture Adherence**: Follow the Prisma-free client architecture - never import `@prisma/client` in client code
2. **Type Safety**: Use internal type system from `@/core/types` for client components
3. **Component Standards**: All UI components must use shadcn/ui library and follow design system
4. **Testing Strategy**: Maintain dual testing architecture (co-located component tests, separate server tests)
5. **Performance Focus**: Implement lazy loading, code splitting, and bundle optimization
6. **Accessibility**: Ensure WCAG 2.1 AA compliance across all components

### Code Quality Standards

- **No `any` Types**: Use proper TypeScript typing throughout codebase
- **File Size Limits**: Keep components under 400 lines, break down monolithic files
- **Single Responsibility**: Each component/function should have one clear purpose
- **Error Handling**: Implement comprehensive error boundaries and graceful degradation
- **Logging**: Use structured logging with `serverLogger` and `clientLogger` utilities

## Project Structure

### Key Directories

#### `/src/core/` - Business Logic Hub

@documentation/DESCRIPTION_OF_CORE_FOLDER.md

**Organization**: Domain-driven design with clear separation of concerns

- `domains/` - Business logic organized by feature domains
- `shared/` - Shared infrastructure and utilities
- `infrastructure/` - Technical infrastructure (auth, monitoring, storage)
- `state/` - Redux store and state management
- `types/` - Internal type system (Prisma-free architecture)

#### `/src/components/` - UI Component Library

@documentation/DESCRIPTION_OF_COMPONENT_FOLDER.md

**Organization**: Feature-based component structure

- `features/` - Domain-specific components (admin, auth, dashboard, practice)
- `shared/` - Reusable components across features
- `ui/` - shadcn/ui component primitives
- `layouts/` - Page layout components

#### `/documentation/` - Comprehensive Documentation

Contains 26+ specialized documentation files covering:

- Architecture guides (@documentation/TYPE_STRUCTURE_ARCHITECTURE.md)
- Design systems (@documentation/DESIGN_SYSTEM.md)
- Practice system (@documentation/PRACTICE_SYSTEM_DESIGN.md)
- Performance guides (@documentation/PERFORMANCE_IMPLEMENTATION.md)
- Database schema (@documentation/DATABASE_DESCRIPTION.md)

### Root Structure

@documentation/DESCRIPTION_OF_ROOT_FOLDER.md

**Key Configuration Files**:

- `prisma/schema.prisma` - Database schema and type generation
- `next.config.mjs` - Consolidated Next.js configuration (ES modules)
- `components.json` - shadcn/ui configuration
- `vitest.config.ts` - Component testing configuration

## Database Architecture

### Schema Overview

@prisma/schema.prisma
@documentation/DATABASE_DESCRIPTION.md

**Core Philosophy**: Definition-centric learning model with strict separation of public/user data

**Key Models**:

- **User Management**: `User`, `UserSettings` with dynamic language preferences
- **Dictionary Content**: `Word` → `WordDetails` → `Definition` hierarchy
- **User Learning**: `UserDictionary`, `UserList`, `UserLearningSession` for progress tracking
- **Media & Assets**: Normalized `Audio`, `Image`, `Translation` with junction tables
- **Relationships**: Complex linguistic relationships between words and definitions

### Dynamic Language System

**Single Source of Truth**: `User.baseLanguageCode` for all translation preferences
**Flexible Learning**: Users can learn any target language (e.g., Danish, Spanish, French) with any base language (e.g., English, Spanish, German) and switch languages instantly
**No Duplication**: Content models only store `targetLanguageCode` (vocabulary language being learned)

## Development Workflows

### Package Management

- **Package Manager**: pnpm (required)
- **Development**: `pnpm dev` (assumed running)
- **Testing**: `pnpm test` (component tests), `cd tests && pnpm test:*` (server tests)
- **Database**: `pnpm p-studio`, `pnpm p-migrate`, `pnpm p-generate`
- **Linting**: `pnpm lint`, `npx tsc --noEmit`

### Testing Architecture

**Dual System Approach**:

1. **Component Tests**: Co-located with components using Vitest + React Testing Library
2. **Server Tests**: Separate `/tests/` folder with own package.json for database/API testing

### Backup System

**Location**: `tests/danishDicitonary/backupProcess/backups/`
**Command**: `cd tests && pnpm backup:db` - Always run for latest backup.json
**Features**: Encryption, compression, incremental backups, metadata tracking

## AI Integration Guidelines

### Autonomous Debugging System

@src/core/infrastructure/monitoring/debugReader.ts

**Capabilities**:

- `DebugReader.analyzeCurrentState()` - Comprehensive system analysis
- `DebugReader.getSystemHealthReport()` - Real-time health assessment
- `DebugReader.searchForIssue(query)` - Targeted investigation
- Pattern recognition for auth, database, API, performance, UX issues

**Browser Access**: `window.KeystrokeDebug` in development mode

### Logging Standards

**Server-side**: Import `serverLog` from `@/core/infrastructure/monitoring/serverLogger`
**Client-side**: Import logging utilities from `@/core/infrastructure/monitoring/clientLogger`
**Storage**: `logs/server.log`, `logs/client.log`, localStorage (browser)

### AI Service Integration

**DeepSeek API**: Cost-effective word extraction (~$0.0001 per definition)
**Rate Limiting**: 5 requests/second, batch processing up to 50 definitions
**No Google Cloud TTS**: Explicitly disabled to avoid costs

## Security & Performance

### Authentication System

- **NextAuth.js**: Session-based authentication with role management
- **Authorization**: Server-side checks on all actions and API routes
- **Image Authentication**: Specialized system for authenticated image endpoints

### Performance Optimization

- **Bundle Analysis**: `pnpm analyze` for webpack bundle analyzer
- **Core Web Vitals**: Automated monitoring with Vercel Speed Insights
- **Code Splitting**: Strategic dynamic imports and lazy loading
- **Caching**: Redis for session data, blob storage for media assets

### Security Measures

- **Input Validation**: Zod schemas for all server actions and API routes
- **CORS Headers**: Configured in next.config.mjs for image endpoints
- **Rate Limiting**: Implemented for AI services and external API calls
- **Environment Validation**: Strict env var validation with env.mjs

## Quick Reference

### Import Patterns

```typescript
// ✅ Client Components
import { User, LanguageCode } from '@/core/types';
import { Button } from '@/components/ui/button';

// ✅ Server Actions/API Routes
import { PrismaClient } from '@prisma/client';
import { handleDatabaseError } from '@/core/lib/database-error-handler';

// ❌ Never in Client Code
import { Prisma, User } from '@prisma/client';
```

### Component Standards

```typescript
// ✅ Proper Component Structure
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/core/types';

interface Props {
  user: User;
  onAction: (id: string) => Promise<void>;
}

export function UserCard({ user, onAction }: Props) {
  // Component implementation
}
```

### Error Handling

```typescript
// ✅ Proper Error Handling
try {
  const result = await serverAction(data);
  if (!result.success) {
    toast.error(result.message);
    return;
  }
  toast.success('Action completed successfully');
} catch (error) {
  serverLog.error('Action failed', { error, userId });
  toast.error('An unexpected error occurred');
}
```

## Documentation System

This AGENT.md file serves as the central hub for AI agent configuration. For detailed information on specific topics, refer to the comprehensive documentation in `/documentation/` directory:

- **Architecture**: @documentation/TYPE_STRUCTURE_ARCHITECTURE.md
- **Components**: @documentation/DESCRIPTION_OF_COMPONENT_FOLDER.md
- **Database**: @documentation/DATABASE_DESCRIPTION.md
- **Practice System**: @documentation/PRACTICE_SYSTEM_DESIGN.md
- **Performance**: @documentation/PERFORMANCE_IMPLEMENTATION.md
- **Design System**: @documentation/DESIGN_SYSTEM.md

Each documentation file follows AI-optimized structure with complete context, consistent terminology, and semantic clarity for enhanced agent comprehension.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained By**: Development Team  
**Agent Compatibility**: Claude, GPT-4, DeepSeek, and other modern LLMs
