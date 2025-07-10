# AI Agent Styling Rules & Guidelines

## Document Metadata

```yaml
title: 'AI Agent Styling Rules & Guidelines'
purpose: 'Comprehensive styling guidelines for AI agents covering semantic color usage, font systems, and component generation standards'
scope: 'Complete styling rules covering semantic color tokens, font system implementation, component patterns, and AI-specific styling guidelines'
target_audience:
  [
    'AI Agents',
    'Frontend Developers',
    'UI/UX Developers',
    'Component Library Maintainers',
  ]
complexity_level: 'Intermediate'
estimated_reading_time: '12 minutes'
last_updated: '2025-01-17'
version: '2.0.0'
dependencies:
  - 'AGENT.md'
  - 'DESIGN_SYSTEM.md'
  - 'COLOR_SYSTEM_VALIDATION_2025.md'
  - 'TYPOGRAPHY_SYSTEM_2025.md'
related_files:
  - '@src/app/globals.css'
  - '@tailwind.config.ts'
  - '@src/components/ui/'
ai_context: 'Essential for AI agents to understand mandatory styling patterns, semantic color usage, and component generation standards'
semantic_keywords:
  [
    'AI styling guidelines',
    'semantic colors',
    'design system rules',
    'component generation',
    'styling patterns',
    'color tokens',
    'font system',
    'design consistency',
  ]
```

## Executive Summary

**Purpose Statement**: This document provides comprehensive styling guidelines specifically for AI agents, ensuring consistent component generation and adherence to design system standards.

**Key Outcomes**: After reading this document, you will understand:

- Mandatory semantic color usage patterns and forbidden hard-coded colors
- Font system implementation with zero-loading semantic classes
- AI-specific component generation guidelines and styling patterns
- Complete reference for semantic color tokens across all use cases
- Decision matrix for color selection and styling consistency

**Prerequisites**: Understanding of:

- @AGENT.md - Project overview and styling requirements
- @DESIGN_SYSTEM.md - Complete design system architecture
- @COLOR_SYSTEM_VALIDATION_2025.md - Color accessibility and validation
- @TYPOGRAPHY_SYSTEM_2025.md - Font system implementation

## 🚨 CRITICAL: Zero Tolerance for Hard-Coded Colors & Fonts

### **Font System 2025 - Zero Loading Time**

**NEVER import or use external fonts. Always use the semantic font system.**

These violations are forbidden:

- ❌ `import { Inter, Roboto } from 'next/font/google'`
- ❌ `import localFont from 'next/font/local'`
- ❌ Hard-coded font families in className or styles
- ❌ Loading external fonts via link tags or @font-face

**ALWAYS use semantic font classes:**

```tsx
// ✅ CORRECT - Semantic font system
<h1 className="font-heading text-4xl font-bold">Page Title</h1>
<p className="font-body text-base leading-relaxed">Body content</p>
<code className="font-code text-sm">Technical content</code>
<span className="font-foreign-word font-medium">Foreign Word</span>
<span className="font-phonetic text-muted-foreground">/pronunciation/</span>
```

### **Zero Tolerance for Hard-Coded Colors**

**NEVER use arbitrary color values like `text-red-500`, `bg-blue-600`, `border-green-200`, etc. in any component.**

These hard-coded colors:

- ❌ Break in dark mode causing readability issues
- ❌ Cannot be controlled or themed consistently
- ❌ Violate the design system architecture
- ❌ Create maintenance nightmares

## 🎯 Mandatory Color Usage Pattern

### **ALWAYS use semantic tokens instead:**

```tsx
// ❌ WRONG - Hard-coded colors
<div className="text-red-500 bg-red-50 border-red-200">Error message</div>
<Badge className="bg-green-100 text-green-800">Success</Badge>

// ✅ CORRECT - Semantic tokens
<div className="text-error-foreground bg-error-subtle border-error-border">Error message</div>
<Badge className="bg-success-subtle text-success-foreground">Success</Badge>
```

## 📚 Complete Semantic Color Reference

### **Status & Feedback Colors**

Use these for user feedback, form validation, and system status:

```tsx
// SUCCESS (Green)
className = 'text-success-foreground'; // Dark green text
className = 'bg-success-subtle'; // Light green background
className = 'border-success-border'; // Green border
className = 'bg-success'; // Main green (use sparingly)

// ERROR (Red)
className = 'text-error-foreground'; // Dark red text
className = 'bg-error-subtle'; // Light red background
className = 'border-error-border'; // Red border
className = 'bg-error'; // Main red (use sparingly)

// WARNING (Amber)
className = 'text-warning-foreground'; // Dark amber text
className = 'bg-warning-subtle'; // Light amber background
className = 'border-warning-border'; // Amber border
className = 'bg-warning'; // Main amber (use sparingly)

// INFO (Blue)
className = 'text-info-foreground'; // Dark blue text
className = 'bg-info-subtle'; // Light blue background
className = 'border-info-border'; // Blue border
className = 'bg-info'; // Main blue (use sparingly)
```

### **Difficulty Level Colors**

Use these for word difficulty badges and learning progress:

```tsx
// BEGINNER (Green)
className = 'bg-difficulty-beginner-subtle text-difficulty-beginner-foreground';

// ELEMENTARY (Blue)
className =
  'bg-difficulty-elementary-subtle text-difficulty-elementary-foreground';

// INTERMEDIATE (Amber)
className =
  'bg-difficulty-intermediate-subtle text-difficulty-intermediate-foreground';

// ADVANCED (Orange)
className = 'bg-difficulty-advanced-subtle text-difficulty-advanced-foreground';

// PROFICIENT (Red)
className =
  'bg-difficulty-proficient-subtle text-difficulty-proficient-foreground';
```

### **Practice Game Colors**

Use these for practice components and game modes:

```tsx
// TYPING PRACTICE (Blue)
className = 'bg-practice-typing-subtle text-practice-typing-foreground';

// MULTIPLE CHOICE (Orange)
className =
  'bg-practice-multiple-choice-subtle text-practice-multiple-choice-foreground';

// FLASHCARD (Green)
className = 'bg-practice-flashcard-subtle text-practice-flashcard-foreground';

// AUDIO PRACTICE (Purple)
className = 'bg-practice-audio-subtle text-practice-audio-foreground';
```

### **Learning Status Colors**

Use these for word learning progress and status indicators:

```tsx
// NOT STARTED (Gray)
className = 'bg-status-not-started-subtle text-status-not-started-foreground';

// IN PROGRESS (Blue)
className = 'bg-status-in-progress-subtle text-status-in-progress-foreground';

// LEARNED (Green)
className = 'bg-status-learned-subtle text-status-learned-foreground';

// NEEDS REVIEW (Amber)
className = 'bg-status-needs-review-subtle text-status-needs-review-foreground';

// DIFFICULT (Red)
className = 'bg-status-difficult-subtle text-status-difficult-foreground';
```

### **Content & Layout Colors**

Use these for general content styling:

```tsx
// NEUTRAL BACKGROUNDS
className = 'bg-content-subtle'; // Very light backgrounds
className = 'bg-content-soft'; // Card backgrounds
className = 'border-content-border'; // Border colors

// TEXT VARIATIONS
className = 'text-content-secondary'; // Secondary text
className = 'text-content-tertiary'; // Tertiary text
```

## 🎯 AI Agent Decision Matrix

### **When to Use Each Color Category:**

| Situation                | Use This Category            | Example                                                             |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------- |
| Form validation errors   | `error`                      | `text-error-foreground bg-error-subtle`                             |
| Success messages         | `success`                    | `text-success-foreground bg-success-subtle`                         |
| Warning alerts           | `warning`                    | `text-warning-foreground bg-warning-subtle`                         |
| Information banners      | `info`                       | `text-info-foreground bg-info-subtle`                               |
| Word difficulty badges   | `difficulty-*`               | `bg-difficulty-beginner-subtle text-difficulty-beginner-foreground` |
| Practice game indicators | `practice-*`                 | `bg-practice-typing-subtle text-practice-typing-foreground`         |
| Learning progress status | `status-*`                   | `bg-status-learned-subtle text-status-learned-foreground`           |
| General content          | `content-*`                  | `text-content-secondary bg-content-subtle`                          |
| Card backgrounds         | `card` or `content-soft`     | `bg-card` or `bg-content-soft`                                      |
| Borders                  | `border` or `content-border` | `border-border` or `border-content-border`                          |

## ⚡ Quick Examples for Common Scenarios

### **Form Validation**

```tsx
// Error state
<Input className={cn('border-input', error && 'border-error-border')} />;
{
  error && <p className="text-error-foreground text-sm">{error}</p>;
}

// Success state
<div className="bg-success-subtle border-success-border rounded-lg p-3">
  <CheckCircle2 className="h-4 w-4 text-success-foreground" />
  <span className="text-success-foreground">Changes saved successfully!</span>
</div>;
```

### **Difficulty Badges**

```tsx
const getDifficultyStyles = (level: DifficultyLevel) => {
  const styles = {
    beginner:
      'bg-difficulty-beginner-subtle text-difficulty-beginner-foreground',
    elementary:
      'bg-difficulty-elementary-subtle text-difficulty-elementary-foreground',
    intermediate:
      'bg-difficulty-intermediate-subtle text-difficulty-intermediate-foreground',
    advanced:
      'bg-difficulty-advanced-subtle text-difficulty-advanced-foreground',
    proficient:
      'bg-difficulty-proficient-subtle text-difficulty-proficient-foreground',
  };
  return styles[level];
};

<Badge className={getDifficultyStyles(difficulty)}>{difficulty}</Badge>;
```

### **Practice Game Components**

```tsx
// Typing exercise
<Card className="bg-practice-typing-subtle border-practice-typing-border">
  <h3 className="text-practice-typing-foreground">Type the word</h3>
</Card>

// Multiple choice
<Card className="bg-practice-multiple-choice-subtle border-practice-multiple-choice-border">
  <h3 className="text-practice-multiple-choice-foreground">Choose the correct answer</h3>
</Card>
```

### **Status Indicators**

```tsx
const getStatusStyles = (status: LearningStatus) => {
  const styles = {
    notStarted:
      'bg-status-not-started-subtle text-status-not-started-foreground',
    inProgress:
      'bg-status-in-progress-subtle text-status-in-progress-foreground',
    learned: 'bg-status-learned-subtle text-status-learned-foreground',
    needsReview:
      'bg-status-needs-review-subtle text-status-needs-review-foreground',
    difficult: 'bg-status-difficult-subtle text-status-difficult-foreground',
  };
  return styles[status];
};

<Badge className={getStatusStyles(learningStatus)}>{status}</Badge>;
```

## 🛡️ Dark Mode Guarantee

**All semantic tokens automatically work in dark mode.** You never need to use `dark:` variants when using semantic tokens.

```tsx
// ❌ WRONG - Manual dark mode handling
<div className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20">
  Success message
</div>

// ✅ CORRECT - Automatic dark mode
<div className="text-success-foreground bg-success-subtle">
  Success message
</div>
```

## 📝 Enforcement Rules

### **1. Code Review Checklist**

- [ ] No hard-coded color classes (`text-*-500`, `bg-*-100`, etc.)
- [ ] All colors use semantic tokens
- [ ] No manual `dark:` variants for colors
- [ ] Colors match the component's semantic purpose

### **2. Linting Rules**

The following ESLint rules will be added to prevent violations:

```json
{
  "rules": {
    "no-hard-coded-colors": "error",
    "require-semantic-colors": "error"
  }
}
```

### **3. Migration Pattern**

When updating existing components:

1. **Identify** the semantic purpose (error, success, difficulty, etc.)
2. **Replace** hard-coded colors with semantic tokens
3. **Test** in both light and dark mode
4. **Remove** any `dark:` color variants

## 🚀 Benefits of This System

✅ **Perfect Dark Mode**: Every color automatically adapts  
✅ **Consistent Design**: Unified color language across the app  
✅ **Easy Theming**: Change tokens to rebrand instantly  
✅ **Agent-Friendly**: Clear rules prevent AI confusion  
✅ **Maintainable**: Single source of truth for colors  
✅ **Accessible**: Proper contrast ratios built-in

## 🛡️ **ESLint Enforcement**

### **Automatic Prevention**

ESLint rules automatically prevent violations:

```bash
# Font system violations
Font imports are not allowed. Use the semantic font system with CSS variables
and Tailwind classes instead. See documentation/TYPOGRAPHY_SYSTEM_2025.md

Hard-coded font families are not allowed. Use semantic font classes like
'font-heading', 'font-body', 'font-code', etc.

# Color system violations
Hard-coded text colors are not allowed. Use semantic tokens like
"text-error-foreground", "text-success-foreground", etc.
```

### **Available Font Classes**

Use these semantic font classes:

- `font-interface` - UI elements, navigation, buttons
- `font-heading` - Large headings and titles
- `font-body` - Readable body text
- `font-code` - Code blocks and technical content
- `font-reading` - Long-form articles
- `font-display` - Friendly, rounded display text
- `font-foreign-word` - Foreign language words
- `font-phonetic` - Phonetic notation
- `font-definition` - Word definitions
- `font-translation` - Translation text

## ❗ Breaking This System = Immediate Fix Required

If you create or modify a component that uses hard-coded colors or fonts:

1. **Stop immediately**
2. **Replace** with semantic tokens/font classes using this guide
3. **Test** in dark mode to verify readability
4. **Run linting** to catch any remaining violations
5. **Document** any new semantic needs for future token additions

**Remember: The user's experience depends on consistent, accessible design that works in all modes and loads instantly. This system ensures that.**
