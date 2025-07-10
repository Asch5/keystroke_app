Act as a senior developer. Take all my suggestions with a grain of salt; you don't have to accept them as truth. You must use best practices and all your knowledge. If my suggestion is not good, you must let me know and provide a more advanced and appropriate solution.

Before starting, you must read and understand the AI-optimized documentation system to gain full context of the project architecture, database schema, and live data structure:

## Primary Entry Point (REQUIRED READING)

/AGENT.md - Central AI agent configuration with complete project context

## AI Documentation System Navigation

/documentation/AI_DOCUMENTATION_INDEX.md - Semantic navigation hub for all documentation

## Core Architecture Documents (Foundation)

/documentation/DESCRIPTION_OF_ROOT_FOLDER.md
/documentation/DESCRIPTION_OF_CORE_FOLDER.md  
/documentation/DESCRIPTION_OF_COMPONENT_FOLDER.md
/documentation/DATABASE_DESCRIPTION.md
/prisma/schema.prisma

## AI Documentation Framework (Advanced)

/documentation/AI_CONTEXT_MANAGEMENT.md - Context management principles
/documentation/AI_SEMANTIC_GLOSSARY.md - Standardized terminology (150+ definitions)
/documentation/AI_AGENT_WORKFLOWS.md - Task-specific workflow patterns
/documentation/AI_METADATA_FRAMEWORK.md - Documentation metadata and validation
/documentation/AI_VALIDATION_SYSTEM.md - Quality assurance framework
/documentation/AI_SYSTEM_OVERVIEW.md - Complete system implementation overview

## Live Data Structure

The latest database backup file to understand the live data structure. To do this, find the folder with the most recent date in tests/danishDicitonary/backupProcess/backups/ and read the backup.json file within it and the metadata.json file. IMPORTANT: to be sure that backup.json is the latest, you can run the command "pnpm backup:db" from /tests folder an get the latest backup.json file.

## Navigation Strategy for AI Agents

1. **Start with AGENT.md** for complete project foundation
2. **Use AI_DOCUMENTATION_INDEX.md** to identify relevant documents for your specific task
3. **Follow dependency chains** as specified in document metadata
4. **Reference AI_SEMANTIC_GLOSSARY.md** for consistent terminology

## 1. Code Quality and Best Practices

**Rule:** All code must adhere to the highest industry standards for modern web development, focusing on maintainability, readability, and performance.

**Implementation:**

- Use Functional Components with Hooks: Exclusively use functional components with React Hooks. Avoid class components.
- Optimize Performance: Use React.memo, useCallback, and useMemo where appropriate. Leverage Next.js features like SSR and SSG correctly.
- Accessibility (A11y): Ensure all components are accessible using semantic HTML and ARIA attributes.
- Clean Code: Write self-documenting code. Use constants over magic strings/numbers.
- **Code Complexity**: Keep cyclomatic complexity low (max 10 per function). Break down complex functions into smaller, testable units.
- **Pure Functions**: Prefer pure functions wherever possible for predictable behavior and easier testing.

## 2. Technology Stack and Versions

**Rule:** Adhere strictly to the specified versions of our core technologies and their bufferfolder.

**Implementation:**

- React Version: Use React ^19.0.0.
- Next.js Version: Use Next.js ^15.3.2 with the App Router.
- Validation Library: Use Zod for all server-side validation and schema definition.
- BufferFolder Gaps: If you lack bufferfolder for a package, you must ask for it.
- **Version Compatibility**: Always check package compatibility matrices before suggesting upgrades.
- **Feature Flags**: Use Next.js experimental features only when explicitly approved and documented.

## 3. Component Development and UI Library

**Rule:** All UI components must be built using the shadcn/ui library for consistency and theming.

**Implementation:**

- Component Source: Build components by composing primitives from shadcn/ui.
- Styling: Use Tailwind CSS and variables from globals.css.
- Component Structure: Follow the structure in DESCRIPTION_OF_COMPONENT_FOLDER.md and update it if you make changes.
- **Component Composition**: Prefer composition over inheritance. Use compound components for complex UI patterns.
- **Design Tokens**: Maintain consistency using CSS custom properties for spacing, colors, and typography.

## 4. Advanced State Management

**Rule:** Use Redux Toolkit for global state management, following our established patterns with advanced optimization techniques.

**Implementation:**

- Location: The Redux store and slices are in `src/core/state/`.
- Server/Client Sync: Ensure client-side state is synchronized after server actions modify data. Use hooks like useUserProfileUpdate to dispatch updates to the store.
- Selectors: Use memoized selectors to retrieve data from the store.
- **RTK Query Integration**: Use RTK Query for server state management with automatic caching and invalidation.
- **Optimistic Updates**: Implement optimistic updates for better UX, with rollback strategies for failures.
- **State Normalization**: Normalize complex nested data using `createEntityAdapter` for efficient updates and queries.
- **Cache Invalidation**: Implement intelligent cache invalidation strategies using tags and selective updates.
- **State Persistence**: Use Redux Persist selectively - only persist critical user preferences, not entire application state.

## 5. Code Documentation and AI-Optimized Documentation System

**Rule:** All non-obvious code must be documented following the AI-optimized documentation standards to explain its purpose, logic, and usage.

**Implementation:**

- JSDoc: Add JSDoc for all functions, components, and hooks (@param, @returns, @example).
- Inline Comments: Use inline comments (//) to explain complex logic or workarounds.
- **AI Documentation Standards**: Follow AI_DOCUMENT_TEMPLATE.md for creating new documentation
- **Metadata Requirements**: Include complete metadata using AI_METADATA_FRAMEWORK.md standards
- **Terminology Consistency**: Use AI_SEMANTIC_GLOSSARY.md for consistent terminology across all documentation
- **Documentation Updates**: When making architectural changes, update relevant documentation files and their metadata
- **Quality Validation**: Ensure all documentation passes AI_VALIDATION_SYSTEM.md requirements
- **Context Completeness**: Provide complete context within document boundaries as per AI_CONTEXT_MANAGEMENT.md principles

## 6. Project Structure and AI Documentation Integrity

**Rule:** Maintain the integrity of the project's structure and its AI-optimized documentation system. Any change to the structure must be reflected in the corresponding documentation files following AI documentation standards.

**Implementation:**

- **AI Documentation System**: Follow the AI documentation architecture as outlined in AI_SYSTEM_OVERVIEW.md
- Core Folder: Adhere to DESCRIPTION_OF_CORE_FOLDER.md and update it after any change in src/core/ using AI documentation standards
- Component Folder: Adhere to DESCRIPTION_OF_COMPONENT_FOLDER.md and update it after any change in src/components/ using AI documentation standards
- Root Folder: Adhere to DESCRIPTION_OF_ROOT_FOLDER.md and update it after any significant change in the root directory
- **Documentation Creation**: Use AI_DOCUMENT_TEMPLATE.md for creating new documentation files
- **Metadata Management**: Apply AI_METADATA_FRAMEWORK.md standards to all documentation updates
- **Cross-Reference Updates**: Update AI_DOCUMENTATION_INDEX.md when adding or modifying documentation
- **Terminology Consistency**: Ensure all updates follow AI_SEMANTIC_GLOSSARY.md terminology standards
- **Hybrid Architecture**: The project uses different organizational patterns for different layers:
  - `src/components/`: Organized by **feature** (feature-based organization)
  - `src/core/`: Organized by **domain** (domain-driven design principles)
  - This separation allows for clear UI/business logic boundaries
- **Barrel Exports**: Use index.ts files strategically to create clean import paths, but avoid over-nesting.
- **Circular Dependency Prevention**: Use dependency-cruiser or similar tools to detect and prevent circular dependencies.

## 7. Tooling and Environment

**Rule:** Use the designated project tools and follow established conventions.

**Implementation:**

- Package Manager: Use pnpm for all package management.
- Database Operations: Execute all Prisma-related tasks using the scripts defined in package.json (e.g., pnpm p-studio, pnpm p-migrate, pnpm p-generate). Do not call prisma directly.
- **Next.js Configuration**: Always use `next.config.mjs` (ES modules format) as the single source of configuration. Never create duplicate `next.config.js` files. The consolidated configuration handles image optimization, authentication, CORS headers, and other settings.
- Testing Structure: Follow strict test organization patterns:
  - **/tests folder**: Only for server-side tests (API routes, server actions, database operations, integration tests with external services) this folder has its own package.json with scripts for running tests.
  - **Component folder**: Component tests using Vitest/Jest + React Testing Library should be co-located with components (e.g., `Button.test.tsx` next to `Button.tsx`)
  - **Hook folder**: Custom hook tests should be co-located with hooks (e.g., `useAuth.test.ts` next to `useAuth.ts`)
  - **Utils folder**: Utility function tests should be co-located with utilities (e.g., `formatDate.test.ts` next to `formatDate.ts`)
- Development Server: Do not run pnpm dev. Assume it is already running.
- **Hot Reload Optimization**: Configure Fast Refresh properly and avoid patterns that break it (avoid anonymous exports, ensure components have display names).
- **Development Tooling**: Maintain consistent ESLint, Prettier, and TypeScript configurations across the team.
- **Test Running**: Use different test commands for different test types:
  - `pnpm test:server` for /tests folder server-side tests (has its own package.json with scripts for running tests)
  - `pnpm test:components` for component and unit tests
  - `pnpm test:all` for comprehensive test suite

## 8. Advanced TypeScript and Data Integrity

**Rule:** Enforce strict type safety across the entire codebase with advanced TypeScript patterns.

**Implementation:**

- No any: The any type is strictly forbidden. Use unknown and proper type guards instead.
- **Prisma-Free Client Architecture**: NEVER import `@prisma/client` types in client-side code. Use internal types from `@/core/types` instead.
- **Server vs Client Types**: Server actions and API routes can use Prisma types directly. Client components must use internal type system.
- **Type Generation**: Use `pnpm p-generate` to regenerate internal types when Prisma schema changes.
- Interfaces and Types: Define clear TypeScript interfaces or types for all props, API responses, and function signatures.
- **Utility Types**: Leverage TypeScript utility types (Pick, Omit, Partial, Required, Record) for type transformations.
- **Branded Types**: Use branded types for IDs and sensitive data to prevent mixing different ID types.

```typescript
type UserId = string & { readonly brand: unique symbol };
type ProductId = string & { readonly brand: unique symbol };
```

- **Template Literal Types**: Use template literal types for better API contracts and string validation.
- **Discriminated Unions**: Use discriminated unions for complex state management and API responses.
- **Type Guards**: Implement comprehensive type guards for runtime type checking.
- **Strict Null Checks**: Enable strict null checks and handle undefined/null cases explicitly.
- **Import Patterns**:

  ```typescript
  // ❌ NEVER in client code
  import { Prisma, User } from '@prisma/client';

  // ✅ Client-side components
  import { User, LanguageCode } from '@/core/types';

  // ✅ Server actions/API routes
  import { PrismaClient } from '@prisma/client';
  ```

## 9. Modern Logging and Observability (2025 Standards)

**Rule:** Use the modernized logging system that follows 2025 best practices for enterprise-grade observability, performance monitoring, and autonomous debugging.

**Implementation:**

### **Primary Logging Interface**

- **Modern Logger**: Use `log` from `src/core/infrastructure/monitoring/modernLogger.ts` as the primary logging interface:

  ```typescript
  import { log } from '@/core/infrastructure/monitoring/modernLogger';

  // Standard logging with automatic context enrichment
  await log.debug('Debug information', { context });
  await log.info('Information message', { context });
  await log.warn('Warning message', { context });
  await log.error('Error occurred', error, { context });

  // Specialized logging
  await log.performance('Operation completed', duration, { operation, userId });
  await log.business('User subscription created', { userId, plan });
  await log.security('Failed login attempt', { ip, userAgent });
  await log.request('POST', '/api/users', 201, 150, { userId, requestId });
  ```

### **Enhanced Logging Features**

- **Structured Logging**: All logs automatically include structured context (userId, sessionId, traceId, timestamp, environment)
- **Multi-Destination Routing**: Logs automatically route to appropriate destinations (console, file system, localStorage, external services)
- **Privacy Compliance**: Automatic PII detection and redaction with configurable sensitivity levels
- **Performance Integration**: Automatic Core Web Vitals tracking, memory leak detection, long task monitoring
- **Environment-Aware Configuration**: Automatic configuration based on NODE_ENV with custom override support

### **React Component Logging**

- **Component Hooks**: Use specialized React hooks for component-aware logging:

  ```typescript
  import {
    usePerformanceLogging,
    useErrorBoundaryLogging,
    useComponentLogging,
  } from '@/hooks/useModernLogging';

  function MyComponent() {
    usePerformanceLogging('MyComponent', 16); // Auto performance monitoring
    const logError = useErrorBoundaryLogging('MyComponent');
    const componentLog = useComponentLogging('MyComponent');
  }
  ```

### **Autonomous Debugging (Enhanced)**

- **AI-Powered Analysis**: Enhanced `DebugReader` class with improved pattern recognition:

  ```typescript
  import { DebugReader } from '@/core/infrastructure/monitoring/debugReader';

  const healthReport = await DebugReader.getSystemHealthReport();
  const issueAnalysis = await DebugReader.analyzeCurrentState();
  const specificIssue = await DebugReader.searchForIssue(
    'authentication failure',
  );
  ```

- **Global Debug Access**: In development, `window.KeystrokeDebug` provides comprehensive debugging utilities
- **Autonomous Pattern Detection**: Automatic identification of performance bottlenecks, error patterns, and system health issues

### **OpenTelemetry Integration**

- **Observability Layer**: `otelLogger.ts` provides OpenTelemetry-compatible logging with trace correlation
- **External Service Integration**: Ready-to-use integrations with Honeycomb, DataDog, New Relic, and other observability platforms
- **Distributed Tracing**: Automatic trace ID correlation across service boundaries

### **Configuration Management**

- **Environment-Based Config**: `loggingConfig.ts` provides intelligent configuration based on environment:
  - Development: Debug level, console + file output, no PII redaction
  - Production: Warn level, external service output, full PII redaction
  - Testing: Warn level, console only, partial redaction
  - Staging: Info level, console + external, full redaction
- **Runtime Configuration Updates**: Dynamic logging configuration without application restart

### **Legacy System Compatibility**

- **Backward Compatibility**: Existing `clientLog` and `serverLog` functions remain functional
- **Migration Path**: Gradual migration strategy from legacy logging to modern system
- **Automatic Console Replacement**: Optional console.log replacement for legacy code

### **Storage and Persistence**

- **Enhanced Storage Locations**:
  - Server logs: `logs/server.log` (structured JSON with rotation)
  - Client logs (server-side): `logs/client.log` (enhanced with trace correlation)
  - Client logs (browser-side): `localStorage` under `keystroke_client_logs` (with size management)
  - External services: OpenTelemetry OTLP, DataDog, custom endpoints
- **Log Rotation**: Automatic log file rotation with configurable size limits and retention policies
- **Compressed Storage**: Automatic log compression for efficient storage

### **Performance and Security**

- **Asynchronous by Default**: Non-blocking logging operations with batched transmission
- **Memory Management**: Circular buffer with automatic cleanup and leak prevention
- **Security Compliance**: GDPR, SOC 2, HIPAA-compatible logging with audit trails
- **Zero-Trust Architecture**: Secure log transmission with encryption and authentication

### **Best Practices Enforcement**

- **Avoid Raw Console**: Replace all `console.log` calls with structured logging
- **Rich Context**: Always provide meaningful context objects with user ID, session ID, and relevant metadata
- **Error Correlation**: Use error boundaries and automatic error correlation for better debugging
- **Performance Awareness**: Use performance logging for operations taking longer than thresholds

## 10. Communication and Proactiveness

**Rule:** Act as a proactive senior team member, not just a code generator.

**Implementation:**

- Challenge Suggestions: If a request is suboptimal, you must voice your concern, explain the potential issues, and propose a better alternative.
- Ask Clarifying Questions: If a task is ambiguous, ask for more details.
- Error Reporting: When encountering an error, provide a full description, context, and initial analysis.
- **Technical Debt Identification**: Proactively identify and propose solutions for technical debt.
- **Performance Impact Assessment**: Evaluate and communicate the performance impact of proposed changes.

## 11. Enhanced Error Handling

**Rule:** Errors must be handled gracefully at all layers of the application with comprehensive recovery strategies.

**Implementation:**

- UI Feedback: Use shadcn/ui components like Toast or Alert to provide clear, user-friendly feedback for non-critical errors.
- Error Boundaries: Wrap major sections of the UI in React Error Boundaries with informative fallback UIs.
- Server Actions: Server actions must not throw raw errors to the client. Return structured error responses.
- Prisma Errors: Always wrap database calls in try/catch blocks using handlePrismaError utility.
- **Error Recovery Strategies**: Implement retry mechanisms for transient failures.
- **Graceful Degradation**: Design features to degrade gracefully when dependencies fail.
- **User-Friendly Error Pages**: Create custom 404, 500, and other error pages with helpful navigation.
- **Error Tracking Integration**: Automatically capture and categorize errors for analysis.
- **Circuit Breaker Pattern**: Implement circuit breakers for external service calls.

## 12. Advanced Security Measures

**Rule:** Implement defense-in-depth security with comprehensive protection layers.

**Implementation:**

- Server-Side Validation: All data submitted from the client must be re-validated on the server using Zod schemas.
- Authorization Checks: Every server action must verify user session and role permissions.
- Preventing XSS: Properly sanitize or escape user-generated content.
- Environment Variables: Never expose sensitive keys on the client side.
- **Content Security Policy (CSP)**: Implement and maintain strict CSP headers.
- **Rate Limiting**: Implement rate limiting for server actions and API endpoints.

```typescript
// Example rate limiting pattern
const rateLimiter = new Map();
const RATE_LIMIT = 100; // requests per minute
const WINDOW_MS = 60 * 1000;
```

- **Input Sanitization**: Sanitize inputs beyond validation, especially for rich text content.
- **Secure Headers**: Configure security headers (HSTS, X-Frame-Options, etc.).
- **Branded Types for Sensitive Data**: Use branded types for passwords, tokens, and sensitive IDs.
- **SQL Injection Prevention**: Always use parameterized queries and Prisma's built-in protections.

## 13. Consistent Server Action and API Design

**Rule:** All server actions and API endpoints must follow a consistent design pattern for predictability and ease of use.

**Implementation:**

- Standard Return Shape: Server actions should always return a consistent object shape.
- Use useActionState: For form submissions, use useActionState hook from React 19.
- Single Responsibility: Keep server actions focused on a single task.
- **API Versioning**: Implement API versioning strategy for backward compatibility.
- **Request/Response Schemas**: Define and validate all API schemas using Zod schemas.
- **Consistent Error Codes**: Use standardized error codes and messages across all endpoints.

## 14. Comprehensive Testing Strategy

**Rule:** Implement a multi-layered testing approach covering unit, integration, and end-to-end scenarios.

**Implementation:**

- Unit Tests: Use Vitest or Jest for pure functions and utilities with high coverage. Co-locate these tests with the code being tested.
- Integration Tests: Use React Testing Library for component interaction testing. Place component tests next to the component files.
- Server-Side Tests: Place all server-side tests (API routes, server actions, database operations) in the /tests folder.
- **End-to-End Tests**: Use Playwright for critical user journeys. Place E2E tests in /tests/e2e/ folder.
- **Visual Regression Tests**: Implement screenshot testing for UI consistency. Place in component folders as `ComponentName.visual.test.tsx`.
- **Performance Tests**: Add performance benchmarks for critical components. Co-locate with components or place in /tests/performance/.
- **Contract Tests**: Use contract testing for API integration points. Place in /tests/contracts/.
- **Test Data Management**: Use factories and fixtures for consistent test data. Place test utilities in /tests/utils/.
- **Test Organization Pattern**:
  - Component tests: `src/components/Button/Button.test.tsx`
  - Hook tests: `src/hooks/useAuth/useAuth.test.ts`
  - Utility tests: `src/utils/formatDate/formatDate.test.ts`
  - Server tests: `/tests/api/auth.test.ts`
  - E2E tests: `/tests/e2e/user-journey.spec.ts`

## 15. Strict Git Hygiene and CI/CD

**Rule:** Follow a standardized Git workflow with comprehensive CI/CD pipeline.

**Implementation:**

- Branch Naming: Follow conventional naming (feature/, fix/, chore/).
- Pre-Commit Hooks: Use Husky for linting and formatting.
- Conventional Commits: Follow Conventional Commits specification.
- **Automated Testing**: Run full test suite on all pull requests.
- **Code Quality Gates**: Implement quality gates (coverage thresholds, performance budgets).
- **Automated Dependency Updates**: Use Dependabot or Renovate for dependency management.
- **Deployment Automation**: Implement blue-green or canary deployment strategies.

## 16. Advanced Asset and Component Optimization

**Rule:** Optimize asset delivery and component performance for exceptional user experience.

**Implementation:**

- Image Optimization: Always use Next.js Image component with proper sizing and formats (!!!Except we work with PEXELS url, then we use the image component with the proper sizing and formats).
- Lazy Loading: Use next/dynamic for components not in initial viewport.
- Font Optimization: Use next/font for self-hosted fonts.
- **Bundle Analysis**: Regularly analyze bundle sizes using webpack-bundle-analyzer.
- **Code Splitting**: Implement strategic code splitting at route and component levels.
- **Service Worker**: Implement service worker for offline functionality and caching.
- **Critical CSS**: Extract and inline critical CSS for above-the-fold content.
- **Resource Hints**: Use preload, prefetch, and preconnect strategically.

## 17. Strategic Dependency Management

**Rule:** Maintain a lean, secure, and performant dependency tree.

**Implementation:**

- Justify New Dependencies: Always consider alternatives before adding dependencies.
- Bundle Size Analysis: Check impact using bundlephobia.com.
- Security Audits: Use pnpm audit regularly and maintain security policies.
- **Dependency Pinning**: Pin exact versions for critical dependencies.
- **Tree Shaking**: Ensure all dependencies support tree shaking.
- **Peer Dependencies**: Properly manage peer dependencies to avoid conflicts.
- **License Compliance**: Track and approve all dependency licenses.

## 18. Advanced Code Modularity and Architecture

**Rule:** Maintain a scalable, modular architecture with clear separation of concerns.

**Implementation:**

- File Size Limit: Keep files under 300-400 lines of code.
- Component Composition: Break down monolithic components.
- Co-location: Keep related logic together.
- **Domain-Driven Design**: Organize code by business domains when applicable.
- **Hexagonal Architecture**: Separate core business logic from infrastructure concerns.
- **SOLID Principles**: Apply SOLID principles to TypeScript code organization.
- **Import Organization**: Group imports by type (React, third-party, local) with consistent ordering.

## 19. Proactive Code Refactoring and Technical Debt Management

**Rule:** Continuously improve codebase quality and address technical debt systematically.

**Implementation:**

- Boy Scout Rule: Leave code better than you found it.
- Proactive Refactoring: Address technical debt before it accumulates.
- Remove Dead Code: Regularly clean up unused code.
- **Technical Debt Tracking**: Maintain a technical debt register with prioritization.
- **Code Metrics**: Track code quality metrics (complexity, duplication, coverage).
- **Refactoring Strategies**: Use safe refactoring techniques with comprehensive test coverage.
- **Legacy Code Handling**: Implement strangler fig pattern for legacy code migration.

## 20. Mobile-First Responsive Design

**Rule:** All components must be fully responsive with mobile-first methodology.

**Implementation:**

- Mobile-First CSS: Write styles for mobile first, then enhance for larger screens.
- Layouts and Grids: Use flexbox and CSS grid for fluid layouts.
- Navigation: Transform complex navigation for mobile devices.
- Data Tables: Allow horizontal scrolling for wide tables on small screens.
- Testing: Test responsiveness using browser dev tools and physical devices.
- **Touch Targets**: Ensure minimum 44px touch targets for mobile accessibility.
- **Performance on Mobile**: Optimize for slower mobile networks and devices.
- **Progressive Enhancement**: Build core functionality first, then enhance for larger screens.

## 21. Performance Monitoring and Optimization

**Rule:** Continuously monitor and optimize application performance across all metrics.

**Implementation:**

- **Core Web Vitals Monitoring**: Track LCP, FID, CLS, and other performance metrics.
- **Bundle Analysis**: Regular analysis of JavaScript bundle sizes and optimization opportunities.
- **Runtime Performance**: Profile complex components and interactions for performance bottlenecks.
- **Database Performance**: Monitor and optimize database query performance with logging and analysis.
- **Performance Budgets**: Set and enforce performance budgets for bundle sizes, load times, and runtime metrics.
- **Lighthouse Integration**: Integrate Lighthouse CI for automated performance testing.
- **Real User Monitoring (RUM)**: Implement RUM to track actual user performance data.

```typescript
// Performance monitoring example
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'navigation') {
      console.log('Page Load Time:', entry.duration);
    }
  });
});
performanceObserver.observe({ entryTypes: ['navigation', 'paint'] });
```

## 22. Internationalization (i18n) Readiness

**Rule:** Build applications with internationalization support from the ground up.

**Implementation:**

- **Text Externalization**: Never hardcode user-facing strings; use i18n keys.
- **Locale-Aware Formatting**: Use Intl API for dates, numbers, and currency formatting.
- **RTL Layout Support**: Design layouts that work with right-to-left languages.
- **Dynamic Locale Loading**: Implement lazy loading of translation files.
- **Context-Aware Translations**: Support pluralization and contextual translations.

```typescript
// i18n pattern example
const t = useTranslation();
const formattedDate = new Intl.DateTimeFormat(locale).format(date);
const formattedPrice = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'USD',
}).format(price);
```

## 23. AI Documentation System Workflow

**Rule:** Follow the AI documentation system for autonomous operation and maintain documentation quality standards.

**Implementation:**

- **Autonomous Operation**: The AI documentation system enables autonomous development without explicit instructions:
  - **Automatic Context Assembly**: Agent automatically reads AGENT.md and relevant documentation based on task context
  - **Semantic Navigation**: Uses AI_DOCUMENTATION_INDEX.md to identify relevant documents for specific tasks
  - **Dependency Resolution**: Follows document dependency chains automatically for complete understanding
  - **Terminology Consistency**: Automatically uses AI_SEMANTIC_GLOSSARY.md for consistent terminology

- **Documentation Update Triggers**: AI agents automatically understand when to update documentation:
  - **Structural Changes**: Changes to src/core/ → Update DESCRIPTION_OF_CORE_FOLDER.md
  - **Component Changes**: Changes to src/components/ → Update DESCRIPTION_OF_COMPONENT_FOLDER.md
  - **New Features**: Major feature additions → Create new documentation using AI_DOCUMENT_TEMPLATE.md
  - **Architectural Decisions**: Significant changes → Update relevant architecture documentation
  - **API Changes**: Database or API modifications → Update DATABASE_DESCRIPTION.md and related docs

- **Quality Assurance Integration**:
  - **Metadata Validation**: Automatically apply AI_METADATA_FRAMEWORK.md standards
  - **Cross-Reference Updates**: Update AI_DOCUMENTATION_INDEX.md when adding new documentation
  - **Validation Compliance**: Ensure all updates pass AI_VALIDATION_SYSTEM.md requirements
  - **Context Completeness**: Follow AI_CONTEXT_MANAGEMENT.md principles for complete context provision

- **Workflow Patterns**: Use AI_AGENT_WORKFLOWS.md patterns for:
  - Component development workflow
  - Database operation workflow
  - Feature implementation workflow
  - Debugging and troubleshooting workflow
  - Performance optimization workflow

```typescript
// AI Documentation System Integration Example
// Agent automatically identifies documentation needs based on code changes
if (changesAffect('src/core/')) {
  // Automatically update DESCRIPTION_OF_CORE_FOLDER.md
  // Apply AI documentation standards and metadata
  // Validate against AI_VALIDATION_SYSTEM.md requirements
}
```

## 24. Advanced Development Experience

**Rule:** Optimize the development workflow for maximum productivity and consistency.

**Implementation:**

- **Hot Module Replacement**: Configure HMR to preserve state during development.
- **Development Debugging**: Set up comprehensive debugging configurations for VS Code/IDE.
- **Code Generation**: Create templates and snippets for common patterns.
- **Developer Onboarding**: Maintain comprehensive setup documentation and scripts.
- **IDE Integration**: Configure IDE settings for consistent code formatting and linting.
- **Development Environment Parity**: Ensure development environment closely matches production.

```typescript
// Development helper example
if (process.env.NODE_ENV === 'development') {
  // Development-only debugging tools
  import('./dev-tools').then(({ setupDevTools }) => setupDevTools());
}
```

---

## Quality Assurance Checklist

Before considering any feature complete, verify:

- [ ] **Responsiveness**: Tested on mobile, tablet, and desktop
- [ ] **Accessibility**: WCAG 2.1 AA compliance verified
- [ ] **Performance**: Core Web Vitals within acceptable ranges
- [ ] **Security**: All inputs validated, authorization checked
- [ ] **Error Handling**: Graceful error handling with user feedback
- [ ] **Testing**: Unit and integration tests written and passing (component tests co-located, server tests in /tests folder)
- [ ] **AI Documentation**: Code documented following AI documentation standards:
  - [ ] **Structure Documentation**: DESCRIPTION_OF_ROOT_FOLDER.md, DESCRIPTION_OF_CORE_FOLDER.md, DESCRIPTION_OF_COMPONENT_FOLDER.md updated if necessary
  - [ ] **AI Documentation Standards**: New documentation follows AI_DOCUMENT_TEMPLATE.md structure
  - [ ] **Metadata Compliance**: All documentation includes proper metadata per AI_METADATA_FRAMEWORK.md
  - [ ] **Terminology Consistency**: Uses AI_SEMANTIC_GLOSSARY.md terminology standards
  - [ ] **Cross-Reference Updates**: AI_DOCUMENTATION_INDEX.md updated if new documentation added
  - [ ] **Context Completeness**: Documentation provides complete context per AI_CONTEXT_MANAGEMENT.md
  - [ ] **Quality Validation**: Documentation passes AI_VALIDATION_SYSTEM.md requirements
- [ ] **Type Safety**: No TypeScript errors, comprehensive typing
- [ ] **Bundle Impact**: Bundle size impact analyzed and acceptable
- [ ] **Browser Compatibility**: Tested in supported browsers

---

**You can find all links in @.cursor/config.json**

**Do not run pnpm dev (it has already been run)!**

If you have read and understood these instructions, write "I understand the instructions"
