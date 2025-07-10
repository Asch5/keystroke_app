# Keystroke App Design System

## Document Metadata

```yaml
title: 'Keystroke App Design System'
purpose: 'Comprehensive design system specification including color architecture, typography, component patterns, and accessibility standards'
scope: 'Complete design system covering color semantics, typography scale, component tokens, accessibility compliance, and dark mode implementation'
target_audience:
  [
    'AI Agents',
    'UI/UX Developers',
    'Frontend Developers',
    'Design System Maintainers',
  ]
complexity_level: 'Intermediate-Advanced'
estimated_reading_time: '25 minutes'
last_updated: '2025-01-17'
version: '3.0.0'
dependencies:
  - 'AGENT.md'
  - 'AGENT_STYLING_RULES.md'
  - 'COLOR_SYSTEM_VALIDATION_2025.md'
  - 'TYPOGRAPHY_SYSTEM_2025.md'
related_files:
  - '@src/app/globals.css'
  - '@tailwind.config.ts'
  - '@components.json'
  - '@src/components/ui/'
ai_context: 'Essential for understanding design tokens, semantic color usage, component styling patterns, and accessibility implementation'
semantic_keywords:
  [
    'design system',
    'design tokens',
    'color semantics',
    'typography',
    'component patterns',
    'accessibility',
    'dark mode',
    'OKLCH colors',
    'semantic colors',
  ]
```

## Executive Summary

**Purpose Statement**: This document provides comprehensive design system specification including color architecture, typography, component patterns, and accessibility standards for the Keystroke App.

**Key Outcomes**: After reading this document, you will understand:

- Complete semantic color architecture with OKLCH implementation
- Typography scale and component styling patterns
- Accessibility compliance and dark mode optimization
- Design token organization and component integration
- Semantic color usage for learning contexts and user feedback

**Prerequisites**: Understanding of:

- @AGENT.md - Project overview and styling requirements
- @AGENT_STYLING_RULES.md - Mandatory styling rules and AI guidelines
- @COLOR_SYSTEM_VALIDATION_2025.md - Color system validation and compliance

## 🎨 Color System Architecture

The Keystroke App uses a three-tier semantic color system designed for consistency, accessibility, and perfect dark mode support.

### **System Overview**

```
┌─────────────────────┐
│   CSS Variables     │ ← Single source of truth
│   (globals.css)     │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Tailwind Config    │ ← Maps to utility classes
│ (tailwind.config.ts)│
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│    Components       │ ← Semantic usage
│   (all .tsx files)  │
└─────────────────────┘
```

### **Three-Tier Architecture**

1. **Primitive Layer**: Base OKLCH color definitions with perfect dark mode variants
2. **Semantic Layer**: Context-specific tokens (success, error, difficulty, etc.)
3. **Component Layer**: Tailwind utility classes for easy usage

## 🌈 Complete Color Reference

### **Status & Feedback Colors**

Used for user feedback, form validation, and system status messages.

#### **Success (Green System)**

```css
--semantic-success: oklch(0.65 0.15 145); /* Main green */
--semantic-success-subtle: oklch(0.95 0.02 145); /* Light background */
--semantic-success-border: oklch(0.85 0.08 145); /* Border color */
--semantic-success-foreground: oklch(0.35 0.12 145); /* Dark text */
```

**Usage Examples:**

- Form validation success
- Completed actions
- Positive status indicators
- Success banners and alerts

#### **Error (Red System)**

```css
--semantic-error: oklch(0.65 0.2 25); /* Main red */
--semantic-error-subtle: oklch(0.95 0.04 25); /* Light background */
--semantic-error-border: oklch(0.85 0.12 25); /* Border color */
--semantic-error-foreground: oklch(0.45 0.16 25); /* Dark text */
```

**Usage Examples:**

- Form validation errors
- Failed actions
- Critical alerts
- Destructive action warnings

#### **Warning (Amber System)**

```css
--semantic-warning: oklch(0.75 0.15 85); /* Main amber */
--semantic-warning-subtle: oklch(0.96 0.03 85); /* Light background */
--semantic-warning-border: oklch(0.88 0.08 85); /* Border color */
--semantic-warning-foreground: oklch(0.45 0.12 85); /* Dark text */
```

**Usage Examples:**

- Caution messages
- Non-critical alerts
- Data loss warnings
- Attention-needed states

#### **Info (Blue System)**

```css
--semantic-info: oklch(0.65 0.15 220); /* Main blue */
--semantic-info-subtle: oklch(0.95 0.03 220); /* Light background */
--semantic-info-border: oklch(0.85 0.08 220); /* Border color */
--semantic-info-foreground: oklch(0.35 0.12 220); /* Dark text */
```

**Usage Examples:**

- Information banners
- Helper text
- Neutral notifications
- Instructional content

### **Learning & Progress Colors**

#### **Difficulty Levels**

**Beginner (Green)**

```tsx
className = 'bg-difficulty-beginner-subtle text-difficulty-beginner-foreground';
```

- Easiest vocabulary words
- Basic level content
- Introductory materials

**Elementary (Blue)**

```tsx
className =
  'bg-difficulty-elementary-subtle text-difficulty-elementary-foreground';
```

- Simple vocabulary
- Basic grammar concepts
- Foundation-building content

**Intermediate (Amber)**

```tsx
className =
  'bg-difficulty-intermediate-subtle text-difficulty-intermediate-foreground';
```

- Moderate difficulty words
- Complex grammar
- Everyday conversation topics

**Advanced (Orange)**

```tsx
className = 'bg-difficulty-advanced-subtle text-difficulty-advanced-foreground';
```

- Challenging vocabulary
- Advanced grammar structures
- Academic or professional content

**Proficient (Red)**

```tsx
className =
  'bg-difficulty-proficient-subtle text-difficulty-proficient-foreground';
```

- Expert-level vocabulary
- Complex linguistic concepts
- Native-level content

#### **Learning Status**

**Not Started (Gray)**

```tsx
className = 'bg-status-not-started-subtle text-status-not-started-foreground';
```

**In Progress (Blue)**

```tsx
className = 'bg-status-in-progress-subtle text-status-in-progress-foreground';
```

**Learned (Green)**

```tsx
className = 'bg-status-learned-subtle text-status-learned-foreground';
```

**Needs Review (Amber)**

```tsx
className = 'bg-status-needs-review-subtle text-status-needs-review-foreground';
```

**Difficult (Red)**

```tsx
className = 'bg-status-difficult-subtle text-status-difficult-foreground';
```

### **Practice Game Colors**

#### **Typing Practice (Blue)**

```tsx
className = 'bg-practice-typing-subtle text-practice-typing-foreground';
```

- Word typing exercises
- Spelling practice
- Input-focused activities

#### **Multiple Choice (Orange)**

```tsx
className =
  'bg-practice-multiple-choice-subtle text-practice-multiple-choice-foreground';
```

- Selection-based exercises
- Recognition practice
- Option-based learning

#### **Flashcard (Green)**

```tsx
className = 'bg-practice-flashcard-subtle text-practice-flashcard-foreground';
```

- Memory recall exercises
- Quick review sessions
- Spaced repetition

#### **Audio Practice (Purple)**

```tsx
className = 'bg-practice-audio-subtle text-practice-audio-foreground';
```

- Listening comprehension
- Pronunciation practice
- Audio-based learning

### **Content & Layout Colors**

#### **Neutral Backgrounds**

```tsx
className = 'bg-content-subtle'; // Very light backgrounds
className = 'bg-content-soft'; // Card backgrounds
className = 'border-content-border'; // Border colors
```

#### **Text Variations**

```tsx
className = 'text-content-secondary'; // Secondary text
className = 'text-content-tertiary'; // Tertiary text
```

## 🌙 Dark Mode System

### **Automatic Dark Mode**

All semantic tokens automatically adapt to dark mode. **Never use `dark:` variants with semantic tokens.**

```tsx
// ❌ WRONG - Manual dark mode
<div className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20">

// ✅ CORRECT - Automatic adaptation
<div className="text-success-foreground bg-success-subtle">
```

### **Dark Mode Color Mapping**

In dark mode, colors automatically become:

- **Backgrounds**: Darker, less saturated
- **Foregrounds**: Lighter, maintaining contrast
- **Borders**: Muted, appropriate contrast

Example transformation:

```css
/* Light Mode */
--semantic-success-subtle: oklch(0.95 0.02 145); /* Very light green */
--semantic-success-foreground: oklch(0.35 0.12 145); /* Dark green */

/* Dark Mode */
--semantic-success-subtle: oklch(0.15 0.05 145); /* Dark green background */
--semantic-success-foreground: oklch(0.75 0.12 145); /* Light green text */
```

## 🎯 Usage Guidelines

### **Token Selection Decision Tree**

```
Is this about user feedback?
├─ Success → use `success`
├─ Error → use `error`
├─ Warning → use `warning`
└─ Info → use `info`

Is this about learning difficulty?
├─ Word difficulty → use `difficulty-*`
└─ Learning status → use `status-*`

Is this about practice activities?
└─ Practice type → use `practice-*`

Is this general content?
├─ Background → use `content-subtle` or `content-soft`
├─ Border → use `border` or `content-border`
└─ Text → use `foreground`, `content-secondary`, or `content-tertiary`
```

### **Common Patterns**

#### **Alert/Banner Components**

```tsx
// Success banner
<div className="bg-success-subtle border-success-border rounded-lg p-4">
  <CheckCircle2 className="h-5 w-5 text-success-foreground" />
  <span className="text-success-foreground">Operation completed successfully!</span>
</div>

// Error banner
<div className="bg-error-subtle border-error-border rounded-lg p-4">
  <AlertCircle className="h-5 w-5 text-error-foreground" />
  <span className="text-error-foreground">Please correct the errors below.</span>
</div>
```

#### **Badge Components**

```tsx
const getBadgeStyles = (type: string) => {
  const styles = {
    success: 'bg-success-subtle text-success-foreground',
    error: 'bg-error-subtle text-error-foreground',
    warning: 'bg-warning-subtle text-warning-foreground',
    info: 'bg-info-subtle text-info-foreground',
  };
  return styles[type] || 'bg-content-soft text-foreground';
};

<Badge className={getBadgeStyles(type)}>{label}</Badge>;
```

#### **Form Validation**

```tsx
<Input
  className={cn(
    'border-input',
    error && 'border-error-border focus:ring-error',
  )}
/>;
{
  error && <p className="text-error-foreground text-sm mt-1">{error}</p>;
}
{
  success && (
    <p className="text-success-foreground text-sm mt-1">✓ Valid input</p>
  );
}
```

#### **Difficulty Indicators**

```tsx
const DifficultyBadge = ({ level }: { level: DifficultyLevel }) => {
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

  return (
    <Badge className={styles[level]}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
};
```

#### **Status Indicators**

```tsx
const StatusIndicator = ({ status }: { status: LearningStatus }) => {
  const config = {
    notStarted: {
      className:
        'bg-status-not-started-subtle text-status-not-started-foreground',
      icon: Circle,
      label: 'Not Started',
    },
    inProgress: {
      className:
        'bg-status-in-progress-subtle text-status-in-progress-foreground',
      icon: Clock,
      label: 'In Progress',
    },
    learned: {
      className: 'bg-status-learned-subtle text-status-learned-foreground',
      icon: CheckCircle,
      label: 'Learned',
    },
    needsReview: {
      className:
        'bg-status-needs-review-subtle text-status-needs-review-foreground',
      icon: RefreshCw,
      label: 'Needs Review',
    },
    difficult: {
      className: 'bg-status-difficult-subtle text-status-difficult-foreground',
      icon: AlertTriangle,
      label: 'Difficult',
    },
  };

  const { className, icon: Icon, label } = config[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1 rounded-full',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </div>
  );
};
```

## 🛠️ Implementation Guide

### **Step 1: Identify Semantic Purpose**

Before choosing a color, ask:

- What is the semantic meaning of this UI element?
- Is this providing user feedback?
- Is this related to learning difficulty or status?
- Is this for a specific practice activity?
- Is this general content or layout?

### **Step 2: Choose Appropriate Token**

Based on the semantic purpose, select from:

- **Feedback**: `success`, `error`, `warning`, `info`
- **Difficulty**: `difficulty-*`
- **Status**: `status-*`
- **Practice**: `practice-*`
- **Content**: `content-*`, `card`, `border`

### **Step 3: Use Appropriate Variant**

- **`-subtle`**: Light backgrounds, containers
- **`-foreground`**: Text and icons
- **`-border`**: Borders and dividers
- **`DEFAULT`**: Main color (use sparingly)

### **Step 4: Test in Both Modes**

Always verify the component works in:

- ✅ Light mode
- ✅ Dark mode
- ✅ High contrast scenarios

## 🚫 Anti-Patterns to Avoid

### **Never Use Hard-Coded Colors**

```tsx
// ❌ WRONG
className = 'text-red-500 bg-red-50 border-red-200';
className = 'text-green-600 dark:text-green-400';
className = 'bg-blue-100 text-blue-800';

// ✅ CORRECT
className = 'text-error-foreground bg-error-subtle border-error-border';
className = 'text-success-foreground';
className = 'bg-info-subtle text-info-foreground';
```

### **Never Use Manual Dark Mode with Semantic Tokens**

```tsx
// ❌ WRONG - Redundant dark: variants
className = 'text-success-foreground dark:text-success-foreground';
className = 'bg-error-subtle dark:bg-error-subtle';

// ✅ CORRECT - Automatic adaptation
className = 'text-success-foreground';
className = 'bg-error-subtle';
```

### **Never Mix Hard-Coded and Semantic**

```tsx
// ❌ WRONG - Inconsistent approach
className = 'bg-success-subtle text-green-600';

// ✅ CORRECT - Consistent semantic usage
className = 'bg-success-subtle text-success-foreground';
```

## 📈 Benefits

### **For Developers**

✅ **Predictable**: Consistent patterns across all components  
✅ **Maintainable**: Single source of truth for colors  
✅ **Type-Safe**: Tailwind provides autocompletion  
✅ **Accessible**: Built-in contrast ratios

### **For AI Agents**

✅ **Clear Rules**: Unambiguous color selection guidelines  
✅ **Semantic Clarity**: Colors match their purpose  
✅ **Error Prevention**: No hard-coded color confusion  
✅ **Consistency**: Uniform approach across all tasks

### **For Users**

✅ **Perfect Dark Mode**: Every color adapts seamlessly  
✅ **Visual Consistency**: Unified design language  
✅ **Better Accessibility**: Proper contrast in all modes  
✅ **Professional Feel**: Cohesive, polished interface

### **For Design System**

✅ **Scalable**: Easy to add new semantic categories  
✅ **Flexible**: Simple theme changes via token updates  
✅ **Future-Proof**: Works with any design system evolution  
✅ **Standards-Compliant**: Follows modern design token practices

## 🔄 Migration Strategy

### **Phase 1: Audit Existing Components**

1. Identify all hard-coded color usage
2. Categorize by semantic purpose
3. Map to appropriate semantic tokens

### **Phase 2: Replace Hard-Coded Colors**

1. Update components one category at a time
2. Test each change in light and dark mode
3. Remove redundant `dark:` variants

### **Phase 3: Establish Linting Rules**

1. Add ESLint rules to prevent hard-coded colors
2. Set up pre-commit hooks for color validation
3. Update development documentation

### **Phase 4: Optimization**

1. Add new semantic tokens as needed
2. Refine color values based on usage patterns
3. Enhance accessibility contrast ratios

## 📚 Additional Resources

- **`documentation/AGENT_STYLING_RULES.md`** - Complete AI agent guidelines
- **`src/app/globals.css`** - All CSS variable definitions
- **`tailwind.config.ts`** - Tailwind utility class mappings
- **`documentation/DESCRIPTION_OF_COMPONENT_FOLDER.md`** - Component architecture with styling rules

---

**Remember: This system ensures perfect dark mode support, design consistency, and prevents AI agent confusion. Following these guidelines is mandatory for all component development and maintenance.**
