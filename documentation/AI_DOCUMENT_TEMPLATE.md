# AI Document Template

## Document Metadata

```yaml
title: AI Document Template
purpose: Standardized template for creating AI-optimized documentation with consistent structure and metadata
scope: Complete template specification with examples and guidelines for documentation creation
target_audience: Technical writers, developers, AI agents creating documentation
complexity_level: beginner
estimated_reading_time: 10 minutes
last_updated: 2025-01-25
version: 1.0.0
dependencies: []
related_files:
  - 'documentation/AI_METADATA_FRAMEWORK.md'
  - 'documentation/AI_VALIDATION_SYSTEM.md'
  - 'documentation/AI_SEMANTIC_GLOSSARY.md'
ai_context:
  summary: 'Standardized template for creating AI-readable documentation with proper metadata structure and semantic optimization'
  use_cases:
    - 'Creating new documentation files'
    - 'Standardizing documentation structure'
    - 'Ensuring AI comprehension optimization'
    - 'Maintaining documentation consistency'
  key_concepts:
    [
      'documentation_template',
      'metadata_structure',
      'ai_optimization',
      'standardization',
      'semantic_markup',
    ]
semantic_keywords:
  [
    'documentation template',
    'AI optimization',
    'metadata structure',
    'semantic markup',
    'standardization',
    'technical writing',
    'documentation guidelines',
    'template specification',
  ]
```

## Executive Summary

This template provides the standardized structure for creating AI-optimized documentation throughout the project. It ensures consistency, completeness, and optimal AI comprehension through proper metadata structure and semantic organization.

**Key Features:**

- Standardized YAML metadata structure for AI optimization
- Executive summary format for quick comprehension
- Semantic keyword optimization for enhanced searchability
- Consistent section organization and formatting guidelines

**Prerequisites:**

- Basic understanding of YAML syntax
- Familiarity with technical documentation principles

## Template Structure

### Required Header Format

````markdown
# Document Title

## Document Metadata

```yaml
title: [Document Title]
purpose: [Brief purpose statement]
scope: [What this document covers]
target_audience: [Who should read this]
complexity_level: [beginner|intermediate|advanced]
estimated_reading_time: [X minutes]
last_updated: [YYYY-MM-DD]
version: [X.X.X]
dependencies:
  - '@documentation/[dependency1].md'
  - '@documentation/[dependency2].md'
related_files:
  - '[relative/path/to/file]'
ai_context:
  summary: '[One-sentence summary for AI comprehension]'
  use_cases:
    - '[Use case 1]'
    - '[Use case 2]'
  key_concepts: ['concept1', 'concept2', 'concept3']
semantic_keywords:
  [
    'keyword1',
    'keyword2',
    'keyword3',
    'longer keyword phrase',
    'technical term',
  ]
```
````

## Executive Summary

[Provide 2-3 paragraph overview of the document covering:

- What the document accomplishes
- Key features or outcomes
- Prerequisites for understanding]

**Key [Features/Outcomes/Components]:**

- Bullet point 1
- Bullet point 2
- Bullet point 3

**Prerequisites:**

- Understanding of X from @documentation/Y.md
- Familiarity with Z concepts

````

### Section Organization Guidelines

1. **Document Metadata** - Always first, contains complete YAML metadata
2. **Executive Summary** - High-level overview with key points and prerequisites
3. **Main Content** - Organized by logical sections with clear headers
4. **Examples** - Code examples with proper syntax highlighting
5. **References** - Cross-references using @documentation/ notation
6. **Appendices** - Additional supporting information if needed

### Metadata Field Specifications

#### Required Fields

- **title**: Exact document title matching the H1 header
- **purpose**: One-sentence description of document purpose
- **scope**: What topics/areas the document covers
- **target_audience**: Primary intended readers
- **complexity_level**: beginner, intermediate, or advanced
- **estimated_reading_time**: Realistic time estimate in minutes
- **last_updated**: ISO date format (YYYY-MM-DD)
- **version**: Semantic versioning (X.X.X)

#### Optional Fields

- **dependencies**: Other documents required for understanding
- **related_files**: Relevant source code or configuration files
- **ai_context**: Specific context for AI comprehension
- **semantic_keywords**: Keywords for enhanced searchability

### Cross-Reference Guidelines

Use the `@documentation/` notation for all internal references:

```markdown
See @documentation/RELATED_DOCUMENT.md for more details.
````

Valid reference formats:

- `@documentation/FILENAME.md` - Links to documentation files
- `@prisma/schema.prisma` - Links to Prisma schema
- `@src/path/to/file.ts` - Links to source files

### Code Example Guidelines

Always use proper syntax highlighting:

```typescript
// ✅ Good: Proper TypeScript example
interface ExampleInterface {
  property: string;
  method(): Promise<void>;
}
```

```bash
# ✅ Good: Shell command example
pnpm docs:validate
```

### Semantic Keyword Guidelines

Include 5-10 relevant keywords:

- Primary concepts (2-3 keywords)
- Technical terms (2-3 keywords)
- Process keywords (1-2 keywords)
- Context keywords (1-2 keywords)

Example:

```yaml
semantic_keywords:
  [
    'documentation template',
    'AI optimization',
    'metadata structure',
    'technical writing',
    'standardization',
    'template specification',
  ]
```

## Validation Checklist

Before publishing documentation, verify:

- [ ] YAML metadata is complete and valid
- [ ] Executive summary provides clear overview
- [ ] All cross-references use proper @documentation/ notation
- [ ] Code examples include proper syntax highlighting
- [ ] Semantic keywords are relevant and comprehensive
- [ ] Estimated reading time is realistic
- [ ] Document follows logical section organization

## Example Implementation

See existing documentation files for implementation examples:

- @documentation/DATABASE_DESCRIPTION.md - Complex technical documentation
- @documentation/DESIGN_SYSTEM.md - Design-focused documentation
- @documentation/PRACTICE_SYSTEM_DESIGN.md - Architecture documentation

## Quality Standards

All documentation must:

1. Pass validation using `pnpm docs:validate`
2. Include complete metadata structure
3. Provide clear executive summary
4. Use consistent formatting and organization
5. Include relevant cross-references and examples
