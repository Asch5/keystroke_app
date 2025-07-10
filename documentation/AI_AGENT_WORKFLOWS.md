# AI Agent Workflows - Keystroke App

## Document Metadata

```yaml
title: 'AI Agent Workflows'
purpose: 'Provide comprehensive workflow patterns and autonomous operation guidelines for AI agents working within the Keystroke App development environment'
scope: 'Task-specific workflows, validation frameworks, autonomous decision-making patterns, and quality assurance protocols for AI development assistance'
target_audience:
  ['AI Agents', 'Autonomous Development Systems', 'LLM-Based Tools']
complexity_level: 'Advanced'
estimated_reading_time: '18 minutes'
last_updated: '2025-01-17'
version: '1.0.0'
dependencies:
  - '@documentation/AI_DOCUMENT_TEMPLATE.md'
  - '@documentation/AI_METADATA_FRAMEWORK.md'
related_files:
  - '@src/core/infrastructure/monitoring/debugReader.ts'
  - '@documentation/AI_DOCUMENT_TEMPLATE.md'
ai_context: 'Essential workflows for autonomous AI agent operation with quality assurance and validation frameworks'
semantic_keywords:
  [
    'AI workflows',
    'autonomous development',
    'validation frameworks',
    'quality assurance',
    'decision patterns',
  ]
```

## Executive Summary

**Purpose Statement**: This document provides comprehensive workflow patterns that enable AI agents to operate autonomously and effectively within the Keystroke App development environment while maintaining code quality and architectural consistency.

**Key Outcomes**: AI agents following these workflows will:

- Execute complex development tasks with minimal supervision
- Make informed architectural decisions based on established patterns
- Validate their work against project standards automatically
- Navigate complex codebases and documentation systems efficiently
- Maintain consistency with project conventions and best practices
- Identify and resolve issues autonomously using systematic approaches

**Prerequisites**: Complete understanding of:

- @AGENT.md - Project foundation and configuration
- @AI_DOCUMENTATION_INDEX.md - Documentation navigation structure
- @AI_CONTEXT_MANAGEMENT.md - Context management principles
- @AI_SEMANTIC_GLOSSARY.md - Terminology and concepts

## Core Workflow Principles

### Autonomous Decision Framework

**Evidence-Based Decisions**: All decisions must be based on explicit evidence from documentation, code analysis, or established patterns

- **Documentation Evidence**: Direct references to architectural decisions and patterns
- **Code Pattern Evidence**: Analysis of existing implementations and consistency
- **Best Practice Evidence**: Alignment with established industry and project standards

**Validation-First Approach**: Every action includes built-in validation and verification

- **Pre-Action Validation**: Verify prerequisites and context before proceeding
- **In-Process Monitoring**: Track progress and identify issues early
- **Post-Action Verification**: Confirm successful completion and quality standards

**Conservative Progression**: Prefer safe, incremental changes over large, risky modifications

- **Minimal Viable Changes**: Implement smallest change that achieves the goal
- **Rollback Planning**: Always have clear rollback strategies
- **Impact Assessment**: Understand downstream effects before making changes

### Quality Assurance Integration

**Continuous Validation**: Quality checks integrated throughout the workflow

- **Type Safety**: Maintain TypeScript strict mode compliance
- **Architectural Compliance**: Adhere to established patterns and principles
- **Performance Impact**: Consider performance implications of all changes
- **Security Considerations**: Validate security implications and access controls

**Documentation Synchronization**: Keep documentation current with code changes

- **Immediate Updates**: Update relevant documentation with code changes
- **Cross-Reference Validation**: Ensure all references remain accurate
- **Context Preservation**: Maintain complete context in updated documentation

## Task-Specific Workflows

### Component Development Workflow

**Phase 1: Planning and Context Gathering**

1. **Requirements Analysis**
   - Review task requirements and acceptance criteria
   - Identify affected systems and components
   - Assess architectural implications and constraints

2. **Context Assembly**

   ```
   Required Reading Order:
   └── @AGENT.md (project context)
   └── @DESCRIPTION_OF_COMPONENT_FOLDER.md (component architecture)
   └── @DESIGN_SYSTEM.md (design standards)
   └── @AGENT_STYLING_RULES.md (styling guidelines)
   └── Related component documentation
   ```

3. **Pattern Identification**
   - Analyze existing similar components
   - Identify reusable patterns and utilities
   - Determine shadcn/ui components needed
   - Plan component composition strategy

**Phase 2: Implementation**

1. **Component Structure Setup**

   ```typescript
   // ✅ Standard Component Pattern
   import React from 'react';
   import {
     Card,
     CardContent,
     CardHeader,
     CardTitle,
   } from '@/components/ui/card';
   import { Button } from '@/components/ui/button';
   import { ComponentProps } from '@/core/types';

   interface ComponentNameProps {
     // Type-safe props with clear documentation
     data: ComponentData;
     onAction: (id: string) => Promise<void>;
     variant?: 'default' | 'compact';
   }

   export function ComponentName({
     data,
     onAction,
     variant = 'default',
   }: ComponentNameProps) {
     // Implementation with proper error handling
   }
   ```

2. **Accessibility Implementation**
   - Semantic HTML structure
   - ARIA attributes where needed
   - Keyboard navigation support
   - Screen reader compatibility

3. **Responsive Design**
   - Mobile-first implementation
   - Breakpoint-appropriate layouts
   - Touch-friendly interface elements

**Phase 3: Validation**

1. **Code Quality Checks**

   ```bash
   # Run before committing
   pnpm lint                    # ESLint validation
   npx tsc --noEmit            # TypeScript type checking
   pnpm test                   # Component tests
   ```

2. **Component Testing**
   - Create co-located test file (`Component.test.tsx`)
   - Test user interactions and edge cases
   - Validate accessibility features
   - Performance testing if applicable

3. **Integration Verification**
   - Verify component works in target contexts
   - Check responsive behavior across devices
   - Validate design system compliance

### Database Operation Workflow

**Phase 1: Schema Understanding**

1. **Context Assembly**

   ```
   Required Reading Order:
   └── @DATABASE_DESCRIPTION.md (complete schema understanding)
   └── @DESCRIPTION_OF_CORE_FOLDER.md (Prisma-free architecture)
   └── @TYPE_STRUCTURE_ARCHITECTURE.md (type safety patterns)
   └── @prisma/schema.prisma (current schema)
   ```

2. **Relationship Analysis**
   - Map entity relationships relevant to the task
   - Identify junction tables and constraints
   - Understand business logic implications
   - Plan for the dynamic language system

3. **Type Safety Planning**
   - Determine client vs server implementation
   - Plan type conversion strategies
   - Identify error handling requirements

**Phase 2: Implementation**

1. **Server Action Development**

   ```typescript
   // ✅ Proper Server Action Pattern
   'use server';

   import { PrismaClient } from '@prisma/client';
   import { handleDatabaseError } from '@/core/lib/database-error-handler';
   import { validateInput } from '@/core/utils/validation';
   import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

   export async function serverActionName(formData: FormData) {
     try {
       // 1. Input validation
       const validatedData = validateInput(formData);

       // 2. Authorization check
       const session = await getServerSession();
       if (!session?.user) {
         return { success: false, message: 'Unauthorized' };
       }

       // 3. Database operation with transaction if needed
       const result = await prisma.$transaction(async (tx) => {
         // Database operations
       });

       // 4. Success response
       serverLog.info('Operation completed', {
         userId: session.user.id,
         action: 'actionName',
       });
       return { success: true, data: result };
     } catch (error) {
       // 5. Error handling
       serverLog.error('Operation failed', { error, action: 'actionName' });
       return handleDatabaseError(error);
     }
   }
   ```

2. **Client Integration**

   ```typescript
   // ✅ Client Component Pattern
   import { useState } from 'react';
   import { useActionState } from 'react';
   import { toast } from '@/components/ui/use-toast';
   import { User } from '@/core/types'; // Internal types only

   export function ClientComponent() {
     const [state, formAction, isPending] = useActionState(
       serverActionName,
       initialState,
     );

     // Handle success/error states
     useEffect(() => {
       if (state.success) {
         toast.success('Operation completed successfully');
       } else if (state.message) {
         toast.error(state.message);
       }
     }, [state]);
   }
   ```

**Phase 3: Validation**

1. **Type Safety Verification**
   - Verify no `@prisma/client` imports in client code
   - Confirm proper use of internal type system
   - Validate error handling patterns

2. **Database Testing**

   ```bash
   # Server-side testing
   cd tests
   pnpm backup:db              # Get latest backup
   pnpm test:database          # Run database tests
   ```

3. **Integration Testing**
   - Test full user workflow
   - Verify error handling and edge cases
   - Confirm transaction integrity

### Feature Implementation Workflow

**Phase 1: Architecture Planning**

1. **Feature Analysis**

   ```
   Required Reading Order:
   └── @AGENT.md (project context)
   └── Feature-specific documentation (e.g., @PRACTICE_SYSTEM_DESIGN.md)
   └── @DESCRIPTION_OF_CORE_FOLDER.md (domain organization)
   └── @DATABASE_DESCRIPTION.md (data requirements)
   └── @PERFORMANCE_IMPLEMENTATION.md (performance considerations)
   ```

2. **Domain Identification**
   - Determine primary domain (auth, dictionary, practice, user)
   - Identify cross-domain interactions
   - Plan domain boundary management
   - Consider state management requirements

3. **Component Architecture**
   - Plan component hierarchy and composition
   - Identify shared components and utilities
   - Design data flow and state management
   - Plan for responsive and accessible design

**Phase 2: Implementation Strategy**

1. **Modular Development**
   - Break feature into focused components (<400 lines each)
   - Implement single responsibility principle
   - Create reusable utilities and hooks
   - Plan for testability and maintainability

2. **Progressive Implementation**

   ```
   Implementation Order:
   1. Core types and interfaces
   2. Server actions and database operations
   3. Business logic and utilities
   4. UI components (bottom-up)
   5. Integration and routing
   6. Testing and validation
   ```

3. **Quality Gates**
   - Type safety validation at each step
   - Component testing before integration
   - Performance testing for complex features
   - Accessibility validation throughout

**Phase 3: Integration and Validation**

1. **System Integration**
   - Verify feature works with existing systems
   - Test cross-domain interactions
   - Validate state management integration
   - Confirm routing and navigation

2. **Performance Validation**

   ```bash
   pnpm analyze                # Bundle analysis
   # Performance testing in development
   # Core Web Vitals monitoring
   ```

3. **Documentation Updates**
   - Update relevant documentation files
   - Add feature to appropriate indexes
   - Create usage examples and patterns
   - Update quick reference sections

### Debugging and Troubleshooting Workflow

**Phase 1: Issue Identification**

1. **Autonomous Debugging Setup**

   ```typescript
   // Use the autonomous debugging system
   import { DebugReader } from '@/core/infrastructure/monitoring/debugReader';

   // Analyze current system state
   const analysis = await DebugReader.analyzeCurrentState();
   console.log('System Analysis:', analysis);

   // Get health report
   const health = await DebugReader.getSystemHealthReport();
   console.log('System Health:', health);

   // Search for specific issues
   const issueAnalysis = await DebugReader.searchForIssue(
     'authentication error',
   );
   console.log('Issue Analysis:', issueAnalysis);
   ```

2. **Context Gathering**

   ```
   Debugging Information Sources:
   └── @DEBUGGING_SYSTEM.md (debugging tools and processes)
   └── @logs/server.log (server-side logs)
   └── @logs/client.log (client-side logs)
   └── Browser localStorage (client logs)
   └── Network requests and responses
   └── Browser console errors and warnings
   ```

3. **Pattern Recognition**
   - Common authentication issues
   - Database connection problems
   - Performance bottlenecks
   - Component rendering issues
   - State management conflicts

**Phase 2: Systematic Diagnosis**

1. **Issue Classification**

   ```
   Issue Categories:
   ├── Authentication/Authorization
   ├── Database/Data Access
   ├── Component/UI Rendering
   ├── Performance/Optimization
   ├── Configuration/Environment
   └── External Service Integration
   ```

2. **Diagnostic Procedures**
   - **Authentication Issues**: Check session, tokens, role permissions
   - **Database Issues**: Verify connections, query syntax, transaction integrity
   - **Component Issues**: Check props, state, lifecycle, event handling
   - **Performance Issues**: Analyze bundle size, render cycles, network requests
   - **Configuration Issues**: Verify environment variables, service configurations

3. **Root Cause Analysis**
   - Trace issue to source using logging and debugging tools
   - Identify contributing factors and dependencies
   - Assess impact and priority
   - Plan resolution strategy

**Phase 3: Resolution and Prevention**

1. **Solution Implementation**
   - Apply minimal, targeted fixes
   - Test fix in isolation before integration
   - Verify no regressions introduced
   - Update relevant documentation

2. **Validation and Testing**

   ```bash
   # Comprehensive testing after fixes
   pnpm lint                   # Code quality
   npx tsc --noEmit           # Type checking
   pnpm test                  # Component tests
   cd tests && pnpm test:*    # Server tests
   ```

3. **Prevention Measures**
   - Update documentation with lessons learned
   - Improve error handling and logging
   - Add tests to prevent regression
   - Share patterns and solutions

### Performance Optimization Workflow

**Phase 1: Performance Assessment**

1. **Baseline Measurement**

   ```bash
   pnpm analyze                # Generate bundle analysis
   # Core Web Vitals measurement
   # Performance monitoring setup
   ```

2. **Context Assembly**

   ```
   Required Reading Order:
   └── @PERFORMANCE_IMPLEMENTATION.md (optimization strategies)
   └── @COMPONENT_REFACTORING_SUMMARY.md (refactoring patterns)
   └── @DESCRIPTION_OF_CORE_FOLDER.md (monitoring systems)
   ```

3. **Bottleneck Identification**
   - Bundle size analysis
   - Runtime performance profiling
   - Network request optimization
   - Database query performance
   - Component render optimization

**Phase 2: Optimization Implementation**

1. **Code Splitting**

   ```typescript
   // ✅ Dynamic imports for large components
   import dynamic from 'next/dynamic';

   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <LoadingSkeleton />,
     ssr: false // If appropriate
   });
   ```

2. **Component Optimization**

   ```typescript
   // ✅ Memoization patterns
   import { memo, useCallback, useMemo } from 'react';

   const OptimizedComponent = memo(function Component({ data, onAction }) {
     const processedData = useMemo(() => processData(data), [data]);
     const handleAction = useCallback((id: string) => onAction(id), [onAction]);

     return <div>{/* Component implementation */}</div>;
   });
   ```

3. **Bundle Optimization**
   - Tree shaking verification
   - Dependency audit and cleanup
   - Code splitting strategy
   - Asset optimization

**Phase 3: Validation and Monitoring**

1. **Performance Testing**
   - Before/after performance comparison
   - Core Web Vitals measurement
   - Load testing for critical paths
   - Mobile performance validation

2. **Monitoring Setup**
   - Performance monitoring integration
   - Alert thresholds configuration
   - Regression detection setup
   - User experience tracking

## Advanced Workflow Patterns

### Multi-Domain Feature Development

**Cross-Domain Coordination**

1. **Domain Boundary Analysis**
   - Identify all affected domains
   - Plan inter-domain communication
   - Design API contracts and interfaces
   - Manage shared state and dependencies

2. **Coordinated Implementation**
   - Implement domain-specific logic separately
   - Create integration layer for coordination
   - Test each domain in isolation
   - Validate integrated behavior

3. **Domain-Specific Validation**
   - Each domain maintains its integrity
   - Validate business rules within domains
   - Test cross-domain interactions thoroughly
   - Monitor performance across domains

### Legacy Code Integration

**Safe Integration Patterns**

1. **Strangler Fig Pattern**
   - Gradually replace legacy code
   - Maintain parallel systems during transition
   - Route traffic incrementally
   - Validate behavior continuously

2. **Adapter Pattern Implementation**
   - Create adapters for legacy interfaces
   - Maintain backward compatibility
   - Plan deprecation timeline
   - Communicate changes clearly

3. **Risk Mitigation**
   - Comprehensive testing strategy
   - Rollback plans for all changes
   - Feature flags for gradual rollout
   - Monitoring and alerting setup

### Autonomous Code Review

**Self-Validation Framework**

1. **Code Quality Checklist**
   - [ ] TypeScript strict mode compliance
   - [ ] No `any` types used
   - [ ] Proper error handling implemented
   - [ ] Accessibility requirements met
   - [ ] Performance impact assessed
   - [ ] Security considerations addressed

2. **Architecture Compliance**
   - [ ] Follows established patterns
   - [ ] Maintains domain boundaries
   - [ ] Uses appropriate abstractions
   - [ ] Implements proper separation of concerns
   - [ ] Adheres to SOLID principles

3. **Integration Validation**
   - [ ] Integrates properly with existing systems
   - [ ] Maintains API contracts
   - [ ] Preserves backward compatibility
   - [ ] Updates documentation appropriately

## Quality Assurance Framework

### Automated Validation Pipeline

**Pre-Implementation Checks**

```bash
# Context validation
- Documentation dependencies verified
- Prerequisites confirmed
- Impact assessment completed
- Implementation plan approved
```

**Implementation Validation**

```bash
# Code quality validation
pnpm lint                    # ESLint validation
npx tsc --noEmit            # TypeScript checking
pnpm test                   # Component tests
cd tests && pnpm test:*     # Server tests
```

**Post-Implementation Verification**

```bash
# Integration validation
- Feature functionality verified
- Performance impact assessed
- Documentation updated
- Cross-browser testing completed
```

### Continuous Improvement

**Learning Integration**

1. **Pattern Recognition**
   - Identify successful patterns
   - Document reusable solutions
   - Share best practices
   - Avoid anti-patterns

2. **Process Refinement**
   - Analyze workflow effectiveness
   - Identify bottlenecks and improvements
   - Update procedures based on experience
   - Optimize for common use cases

3. **Knowledge Management**
   - Update documentation continuously
   - Maintain accurate cross-references
   - Preserve institutional knowledge
   - Enable knowledge transfer

### Error Recovery Procedures

**Rollback Strategies**

1. **Immediate Rollback**
   - Git-based rollback for code changes
   - Database migration rollback
   - Configuration change reversal
   - Service restart procedures

2. **Partial Rollback**
   - Feature flag disablement
   - Traffic routing changes
   - Component-level rollback
   - Service isolation

3. **Recovery Validation**
   - System functionality verification
   - Performance impact assessment
   - User experience validation
   - Monitoring and alerting review

---

**Implementation Status**: Active  
**Workflow Coverage**: Complete development lifecycle  
**Last Review**: January 2025  
**Next Update**: Quarterly based on usage patterns  
**Maintained By**: Development Team  
**AI Compatibility**: Optimized for autonomous operation
