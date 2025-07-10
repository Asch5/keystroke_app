# AI Semantic Glossary - Keystroke App

## Document Metadata

```yaml
title: 'AI Semantic Glossary'
purpose: 'Provide comprehensive terminology definitions and semantic relationships for consistent AI agent understanding across all documentation'
scope: 'All technical terminology, concepts, patterns, and domain-specific language used throughout the Keystroke App documentation system'
target_audience: ['AI Agents', 'LLM Systems', 'Documentation Maintainers']
complexity_level: 'Intermediate'
estimated_reading_time: '15 minutes'
last_updated: '2025-01-17'
version: '1.0.0'
dependencies:
  - 'AGENT.md'
  - 'AI_DOCUMENTATION_INDEX.md'
related_files:
  - '@src/core/types/'
  - '@prisma/schema.prisma'
ai_context: 'Essential reference for consistent terminology and concept understanding across all documentation'
semantic_keywords:
  [
    'terminology',
    'definitions',
    'concepts',
    'semantic relationships',
    'AI vocabulary',
  ]
```

## Executive Summary

**Purpose Statement**: This glossary establishes a unified vocabulary and semantic framework that ensures consistent understanding of technical terminology across all Keystroke App documentation and AI agent interactions.

**Key Outcomes**: AI agents using this glossary will:

- Use consistent terminology across all documentation interactions
- Understand the precise meaning and context of technical terms
- Navigate semantic relationships between concepts effectively
- Generate accurate and contextually appropriate responses
- Maintain consistency when creating or updating documentation

**Prerequisites**: Basic understanding of:

- @AGENT.md - Project overview and technology stack
- @AI_DOCUMENTATION_INDEX.md - Documentation structure and organization

## Core Architecture Terminology

### System Architecture

**Prisma-Free Client Architecture**

- **Definition**: Complete separation between client-side and server-side code to eliminate Prisma client bundling issues
- **Context**: Critical architectural pattern that prevents "PrismaClient is unable to run in this browser environment" errors
- **Implementation**: Client components use `@/core/types`, server actions use `@prisma/client` directly
- **Related Terms**: Type Safety, Client-Server Separation, Bundle Optimization
- **Anti-Pattern**: Importing `@prisma/client` in client-side components

**Dynamic Language System**

- **Definition**: Single source of truth architecture where `User.baseLanguageCode` drives all translation preferences
- **Context**: Enables users to change their base language once and see all content adapted instantly
- **Implementation**: Content models store only `targetLanguageCode`, translation preferences inherited from user profile
- **Related Terms**: Single Source of Truth, Language Flexibility, Translation System
- **Key Benefit**: No language duplication, instant adaptation to user preference changes

**Domain-Driven Design (DDD)**

- **Definition**: Architectural approach organizing code by business domains rather than technical layers
- **Context**: Used in `src/core/domains/` for business logic organization
- **Implementation**: Separate domains for auth, dictionary, translation, user management
- **Related Terms**: Business Logic, Domain Separation, Modular Architecture
- **Examples**: `auth/`, `dictionary/`, `translation/`, `user/`

**Feature-Based Organization**

- **Definition**: Component organization strategy grouping by features rather than technical function
- **Context**: Used in `src/components/features/` for UI component structure
- **Implementation**: Components grouped by functional areas (admin, practice, dashboard)
- **Related Terms**: Component Architecture, UI Organization, Modular Components
- **Examples**: `features/admin/`, `features/practice/`, `features/dashboard/`

### Technology Stack Terms

**shadcn/ui**

- **Definition**: React component library providing unstyled, accessible components built on Radix UI
- **Context**: Mandated UI component system for all interface development
- **Implementation**: All UI components must use shadcn/ui primitives
- **Related Terms**: Design System, Component Library, Accessibility
- **Configuration**: `components.json`, installed in `src/components/ui/`

**Next.js App Router**

- **Definition**: File-system based routing system in Next.js 13+ using the `app/` directory
- **Context**: Routing architecture for the application structure
- **Implementation**: Pages defined in `src/app/` with layout hierarchies
- **Related Terms**: Server Components, Client Components, Nested Layouts
- **Key Features**: Streaming, Suspense, Server Actions

**Server Actions**

- **Definition**: React Server Components feature enabling server-side form handling and data mutations
- **Context**: Primary method for database operations and server-side logic
- **Implementation**: Functions marked with `'use server'` directive
- **Related Terms**: Form Handling, Database Operations, Server-Side Logic
- **Security**: Must include validation and authorization checks

**Redux Toolkit (RTK)**

- **Definition**: Official Redux library providing simplified store setup and state management
- **Context**: Global state management solution with persistence
- **Implementation**: Store located in `src/core/state/`, slices for different features
- **Related Terms**: State Management, Global State, Redux-Persist
- **Pattern**: Server actions update database, hooks dispatch Redux updates

## Database & Data Terminology

### Core Data Models

**Definition-Centric Learning Model**

- **Definition**: Data architecture where `Definition` is the atomic unit of learning, not `Word`
- **Context**: Users learn specific meanings rather than general words
- **Implementation**: `Word` → `WordDetails` → `Definition` hierarchy
- **Related Terms**: Learning Model, Data Architecture, User Progress
- **Example**: Learning "run" as a noun separate from "run" as a verb

**Soft Deletes**

- **Definition**: Marking records as deleted using `deletedAt` timestamp rather than physical deletion
- **Context**: Enables data recovery and preserves user history
- **Implementation**: Filter `deletedAt: null` in queries for active records
- **Related Terms**: Data Recovery, User History, Logical Deletion
- **Models**: `UserList`, `UserDictionary`, most user-generated content

**Junction Tables**

- **Definition**: Linking tables that create many-to-many relationships between entities
- **Context**: Enables normalized media sharing and complex relationships
- **Implementation**: `DefinitionAudio`, `ExampleAudio`, `UserListWord`, etc.
- **Related Terms**: Normalization, Media Sharing, Relationships
- **Benefit**: Single audio file can be linked to multiple definitions/examples

### Data Relationships

**Public vs User Data Separation**

- **Definition**: Strict separation between immutable public content and mutable user content
- **Context**: Prevents users from altering master dictionary while enabling personalization
- **Implementation**: `List`/`Word`/`Definition` (public) vs `UserList`/`UserDictionary` (personal)
- **Related Terms**: Data Integrity, Content Management, User Customization
- **Security**: Master content remains pristine, user modifications isolated

**List Inheritance System**

- **Definition**: Two-tier system where user lists can inherit from public lists or be completely custom
- **Context**: Enables both guided learning (official lists) and personal customization
- **Implementation**: `UserList.listId` references `List.id` for inheritance, `null` for custom
- **Related Terms**: Content Inheritance, List Management, Learning Paths
- **Types**: Official Public Lists, Community User Lists, Personal User Lists

## Learning & Practice Terminology

### Learning Mechanics

**Spaced Repetition System (SRS)**

- **Definition**: Learning algorithm that schedules review of content based on memory strength
- **Context**: Core learning mechanism for vocabulary retention
- **Implementation**: `srsLevel`, `nextSrsReview` in `UserDictionary`
- **Related Terms**: Memory Retention, Learning Algorithm, Review Scheduling
- **Algorithm**: Increasing intervals between reviews based on performance

**Learning Status Progression**

- **Definition**: Stages of word mastery from new to learned
- **Context**: Tracks user progress and determines content difficulty
- **Implementation**: Enum values in `UserDictionary.learningStatus`
- **Related Terms**: Progress Tracking, Mastery Levels, Learning Metrics
- **Progression**: `new` → `learning` → `review` → `learned`

**Practice Types**

- **Definition**: Different modes of vocabulary practice and interaction
- **Context**: Varied learning approaches for different learning styles
- **Implementation**: Separate components and logic for each type
- **Related Terms**: Learning Modes, Practice Variety, Engagement
- **Types**: Typing Practice, Flashcards, Quiz Mode, Games

### Audio & Media

**Audio Service Architecture**

- **Definition**: Layered audio playback system with fallbacks and proxy support
- **Context**: Handles multiple audio sources with reliability and performance
- **Implementation**: `AudioService.playAudioFromDatabase()` with blob storage
- **Related Terms**: Media Management, Audio Playback, Service Architecture
- **Sources**: Database audio (primary), Web Speech API (fallback), No Google Cloud TTS

**Blob Storage System**

- **Definition**: Binary large object storage for audio files and media assets
- **Context**: Scalable media storage with efficient access patterns
- **Implementation**: Vercel Blob storage with organized directory structure
- **Related Terms**: Media Storage, Performance, Scalability
- **Organization**: `audio/da/words/`, `audio/en/words/`, `definitions/`

## Development & Testing Terminology

### Testing Architecture

**Dual Testing System**

- **Definition**: Separate testing strategies for client and server code
- **Context**: Different concerns require different testing approaches
- **Implementation**: Co-located component tests, separate `/tests/` folder for server tests
- **Related Terms**: Testing Strategy, Separation of Concerns, Quality Assurance
- **Tools**: Vitest + React Testing Library (client), Custom harnesses (server)

**Co-located Testing**

- **Definition**: Test files placed next to the components they test
- **Context**: Improves maintainability and discovery of component tests
- **Implementation**: `Button.test.tsx` next to `Button.tsx`
- **Related Terms**: Test Organization, Maintainability, Component Testing
- **Scope**: Component behavior, user interactions, UI logic

**Server-Side Testing**

- **Definition**: Testing strategy for database operations, API integrations, and server logic
- **Context**: Complex integration testing requiring database and external services
- **Implementation**: Separate `/tests/` folder with own `package.json`
- **Related Terms**: Integration Testing, Database Testing, API Testing
- **Examples**: Database backups, TTS services, translation APIs

### Performance & Monitoring

**Autonomous Debugging**

- **Definition**: AI-powered system for automatic issue detection and analysis
- **Context**: Proactive problem identification and resolution guidance
- **Implementation**: `DebugReader` class with pattern recognition and health monitoring
- **Related Terms**: AI Debugging, Pattern Recognition, Health Monitoring
- **Access**: `window.KeystrokeDebug` in development mode

**Core Web Vitals**

- **Definition**: Google's standardized metrics for web performance and user experience
- **Context**: Performance benchmarks for user experience optimization
- **Implementation**: Vercel Speed Insights integration with custom monitoring
- **Related Terms**: Performance Metrics, User Experience, Web Standards
- **Metrics**: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)

**Bundle Analysis**

- **Definition**: Analysis of JavaScript bundle sizes and optimization opportunities
- **Context**: Performance optimization through code splitting and tree shaking
- **Implementation**: `pnpm analyze` commands generating detailed reports
- **Related Terms**: Performance Optimization, Code Splitting, Tree Shaking
- **Output**: `.next/analyze/client.html`, `.next/analyze/server.html`

## Security & Authentication Terminology

### Authentication Architecture

**NextAuth.js**

- **Definition**: Authentication library for Next.js applications with provider support
- **Context**: Session-based authentication with role management
- **Implementation**: Configuration in `src/auth.ts` with provider setup
- **Related Terms**: Authentication, Session Management, OAuth
- **Features**: Multiple providers, JWT tokens, database sessions

**Role-Based Access Control (RBAC)**

- **Definition**: Security model restricting access based on user roles
- **Context**: Different permission levels for users, admins, and system operations
- **Implementation**: `UserRole` enum with permission checking in middleware
- **Related Terms**: Authorization, Permissions, Access Control
- **Roles**: `user`, `admin`, `superadmin`

**Image Authentication**

- **Definition**: Specialized system for serving authenticated image content
- **Context**: Secure image delivery with proper access control
- **Implementation**: `/api/images/` endpoints with authentication checks
- **Related Terms**: Secure Media, Access Control, CDN Integration
- **Challenge**: Next.js Image optimization with authenticated endpoints

### Security Measures

**Input Validation**

- **Definition**: Server-side validation of all user input using schema validation
- **Context**: Prevent injection attacks and ensure data integrity
- **Implementation**: Zod schemas for all server actions and API routes
- **Related Terms**: Data Validation, Security, Schema Validation
- **Principle**: Never trust client-side validation alone

**Rate Limiting**

- **Definition**: Restriction of request frequency to prevent abuse and manage resources
- **Context**: Protect AI services and external APIs from overuse
- **Implementation**: Service-specific limits (e.g., 5 requests/second for DeepSeek)
- **Related Terms**: API Protection, Resource Management, Abuse Prevention
- **Application**: AI services, external API calls, user actions

## UI & Design Terminology

### Design System

**Design Tokens**

- **Definition**: Named entities storing visual design decisions (colors, spacing, typography)
- **Context**: Consistent design implementation across all components
- **Implementation**: CSS custom properties in `globals.css`
- **Related Terms**: Design Consistency, Visual Hierarchy, Brand Standards
- **Examples**: Color variables, spacing scale, typography scale

**Accessibility (A11y)**

- **Definition**: Design and development practices ensuring usability for people with disabilities
- **Context**: WCAG 2.1 AA compliance requirement for all components
- **Implementation**: Semantic HTML, ARIA attributes, keyboard navigation
- **Related Terms**: Inclusive Design, WCAG Compliance, Usability
- **Standards**: WCAG 2.1 AA, Section 508, ADA compliance

**Responsive Design**

- **Definition**: Design approach creating optimal viewing across device sizes
- **Context**: Mobile-first methodology with progressive enhancement
- **Implementation**: Tailwind CSS responsive utilities with breakpoint strategy
- **Related Terms**: Mobile-First, Progressive Enhancement, Breakpoints
- **Strategy**: Design for mobile, enhance for larger screens

### Component Patterns

**Compound Components**

- **Definition**: Component pattern where multiple components work together as a cohesive unit
- **Context**: Complex UI patterns with multiple related parts
- **Implementation**: Parent component coordinating child component behavior
- **Related Terms**: Component Composition, React Patterns, UI Architecture
- **Examples**: Accordion, Dropdown, Dialog systems

**Render Props Pattern**

- **Definition**: React pattern sharing code between components using props with function values
- **Context**: Flexible component composition and behavior sharing
- **Implementation**: Components accepting function props for rendering logic
- **Related Terms**: Component Patterns, Code Reuse, Composition
- **Use Cases**: Data fetching, state management, conditional rendering

## AI & Integration Terminology

### AI Services

**DeepSeek API**

- **Definition**: Cost-effective AI service for natural language processing tasks
- **Context**: Word extraction from definitions and content analysis
- **Implementation**: `deepseek-service.ts` with rate limiting and batch processing
- **Related Terms**: AI Integration, NLP, Cost Optimization
- **Pricing**: ~$0.0001 per definition, highly cost-effective

**Prompt Engineering**

- **Definition**: Art and science of crafting effective prompts for AI systems
- **Context**: Optimizing AI responses for specific tasks and contexts
- **Implementation**: Structured prompts with context and examples
- **Related Terms**: AI Optimization, Context Provision, Response Quality
- **Principles**: Clear instructions, context provision, example inclusion

### Development Integration

**Autonomous Development**

- **Definition**: AI-assisted development workflows with minimal human intervention
- **Context**: AI agents performing development tasks independently
- **Implementation**: Comprehensive documentation enabling autonomous operation
- **Related Terms**: AI Development, Autonomous Systems, Development Automation
- **Requirements**: Complete context, clear instructions, validation mechanisms

**Context Management**

- **Definition**: Systematic approach to maintaining information context across AI interactions
- **Context**: Ensuring AI agents have complete understanding for effective operation
- **Implementation**: Structured documentation with explicit dependencies and relationships
- **Related Terms**: Information Architecture, AI Context, Knowledge Management
- **Challenges**: Context boundaries, information completeness, relationship mapping

## Glossary Maintenance

### Terminology Evolution

**Semantic Consistency**

- **Definition**: Uniform use of terminology across all documentation and code
- **Context**: Prevents confusion and ensures clear communication
- **Implementation**: Regular terminology audits and consistency checks
- **Related Terms**: Documentation Quality, Communication Standards, Consistency
- **Process**: Quarterly reviews, automated checks, style guide enforcement

**Concept Relationships**

- **Definition**: Explicit mapping of how different concepts relate to each other
- **Context**: Enables AI agents to understand connections and dependencies
- **Implementation**: Cross-references, relationship diagrams, concept maps
- **Related Terms**: Knowledge Architecture, Semantic Networks, Concept Mapping
- **Visualization**: Concept dependency graphs, semantic relationship maps

### Quality Assurance

**Definition Completeness**

- **Definition**: Ensuring all terminology entries provide complete context and understanding
- **Context**: AI agents need complete definitions to operate effectively
- **Implementation**: Multi-part definitions with context, examples, and relationships
- **Related Terms**: Information Completeness, AI Context, Documentation Quality
- **Requirements**: Definition, context, implementation, relationships, examples

**Usage Validation**

- **Definition**: Verification that terminology is used consistently across all documentation
- **Context**: Maintains semantic integrity and prevents confusion
- **Implementation**: Automated scanning and manual review processes
- **Related Terms**: Quality Control, Consistency Checking, Documentation Maintenance
- **Tools**: Terminology scanners, style checkers, cross-reference validators

---

**Glossary Coverage**: 150+ terms and concepts  
**Last Audit**: January 2025  
**Next Review**: April 2025  
**Maintained By**: Development Team  
**AI Compatibility**: Optimized for all major LLM architectures
