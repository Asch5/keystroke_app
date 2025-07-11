# Error Boundary System

This directory contains a comprehensive error boundary system that provides graceful error handling across all major sections of the Keystroke App.

## Overview

The error boundary system follows React best practices and provides:

- **Context-aware error messages** for different application sections
- **Consistent visual design** with shadcn/ui components
- **Proper error logging** using the clientLogger system
- **Recovery options** including retry, back navigation, and home navigation
- **Development-friendly error details** with stack traces in dev mode
- **Accessibility compliance** with proper ARIA attributes

## Components

### ErrorBoundaryBase

The foundation component that provides:

- Consistent error UI with Card-based layout
- Configurable error messages and actions
- Automatic error logging with context
- Development mode error details
- Navigation options (back, home, retry)

### Specialized Error Boundaries

Each section has a specialized error boundary:

#### DashboardErrorBoundary

- **Context**: Dashboard pages and overview
- **Features**: Dashboard-specific error messaging
- **Navigation**: Back button only (already in dashboard context)

#### DictionaryErrorBoundary

- **Context**: Dictionary management and word-related features
- **Features**: Reassuring messages about data safety
- **Navigation**: Full navigation options with retry capability

#### AdminErrorBoundary

- **Context**: Admin panel and management interfaces
- **Features**: Technical support messaging for admin errors
- **Navigation**: Full navigation options

#### PracticeErrorBoundary

- **Context**: Practice sessions and learning activities
- **Features**: Progress preservation messaging
- **Navigation**: Session reset capabilities

#### SettingsErrorBoundary

- **Context**: Settings pages and configuration
- **Features**: Preference safety messaging
- **Navigation**: Full navigation options

## Implementation Coverage

### ✅ Implemented Locations

**Layouts:**

- `/src/app/(dashboard)/dashboard/layout.tsx` - DashboardErrorBoundary
- `/src/app/admin/layout.tsx` - AdminErrorBoundary

**Dictionary Pages:**

- `/src/app/(dashboard)/dashboard/dictionary/page.tsx` - DictionaryErrorBoundary
- `/src/app/(dashboard)/dashboard/dictionary/add-word/page.tsx` - DictionaryErrorBoundary
- `/src/app/(dashboard)/dashboard/dictionary/lists/page.tsx` - DictionaryErrorBoundary

**Practice Pages:**

- `/src/app/(dashboard)/dashboard/practice/page.tsx` - PracticeErrorBoundary
- Practice game components already have PracticeGameContainer with error boundaries

**Settings Pages:**

- `/src/app/(dashboard)/dashboard/settings/page.tsx` - SettingsErrorBoundary

**Admin Pages:**

- All admin pages inherit from admin layout with AdminErrorBoundary

### 🎯 Error Boundary Strategy

**Level 1: Layout Level**

- Catches errors in entire sections (dashboard, admin)
- Provides section-wide error recovery

**Level 2: Page Level**

- Catches errors in specific features (dictionary, practice, settings)
- Provides feature-specific error messaging

**Level 3: Component Level**

- Individual components with high error risk
- Custom error handling for specific use cases

## Usage Examples

### Basic Usage

```tsx
import { DictionaryErrorBoundary } from '@/components/shared/error-boundaries';

export function DictionaryFeature() {
  return (
    <DictionaryErrorBoundary>
      <MyDictionaryContent />
    </DictionaryErrorBoundary>
  );
}
```

### With Custom Retry Logic

```tsx
import { PracticeErrorBoundary } from '@/components/shared/error-boundaries';

export function PracticeSession() {
  const resetSession = () => {
    // Custom session reset logic
  };

  return (
    <PracticeErrorBoundary onRetry={resetSession}>
      <PracticeContent />
    </PracticeErrorBoundary>
  );
}
```

### Custom Error Boundary

```tsx
import { ErrorBoundaryBase } from '@/components/shared/error-boundaries';

export function CustomFeatureErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ErrorBoundaryBase
      fallbackTitle="Custom Feature Error"
      fallbackDescription="Something went wrong with this specific feature."
      errorContext="CustomFeature"
      showHomeButton={true}
      showBackButton={true}
    >
      {children}
    </ErrorBoundaryBase>
  );
}
```

## Error Logging

All error boundaries automatically log errors using the clientLogger system:

```typescript
errorLog(`${errorContext} Error Boundary: ${error.message}`, {
  errorInfo,
  timestamp: new Date().toISOString(),
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  url: typeof window !== 'undefined' ? window.location.href : 'unknown',
});
```

Logs are stored in:

- **Browser**: Console + localStorage (development)
- **Server**: `logs/client.log` (production)

## Testing Error Boundaries

### Development Testing

To test error boundaries in development, you can:

1. **Throw errors in components:**

```tsx
export function TestComponent() {
  if (Math.random() > 0.5) {
    throw new Error('Test error for error boundary');
  }
  return <div>Component rendered successfully</div>;
}
```

2. **Use browser dev tools:**

- Open React Dev Tools
- Find a component wrapped by error boundary
- Use "Suspend this component" or similar tools

3. **Network failures:**

- Disable network in dev tools
- Navigate to pages that fetch data

### Production Monitoring

Error boundaries integrate with the autonomous debugging system:

- Errors are automatically logged and categorized
- Patterns are detected for common issues
- Health monitoring tracks error frequency

## Best Practices

### When to Add Error Boundaries

**✅ Add error boundaries for:**

- Layout components that wrap large sections
- Pages with data fetching and complex state
- Components with external API calls
- Practice sessions and user interactions
- Admin interfaces with critical operations

**❌ Don't add error boundaries for:**

- Simple presentational components
- Components that are already wrapped
- Very small utility components

### Error Boundary Placement

**Correct - Wrapping meaningful sections:**

```tsx
<DictionaryErrorBoundary>
  <DictionaryHeader />
  <DictionaryContent />
  <DictionaryFooter />
</DictionaryErrorBoundary>
```

**Incorrect - Too granular:**

```tsx
<ErrorBoundary>
  <Button>Click me</Button>
</ErrorBoundary>
```

### Error Message Guidelines

- **Be reassuring** about data safety
- **Provide context** about what went wrong
- **Offer clear actions** for recovery
- **Avoid technical jargon** in user-facing messages
- **Include contact information** for persistent issues

## Future Enhancements

### Planned Improvements

1. **Root Layout Error Boundary**
   - Catch catastrophic errors at the application level
   - Provide emergency recovery options

2. **Error Reporting Integration**
   - Automatic error reporting to monitoring services
   - User feedback collection on errors

3. **Smart Recovery**
   - Automatic retry with exponential backoff
   - Progressive degradation of features

4. **Error Analytics**
   - Error frequency tracking
   - Most common error patterns
   - User impact analysis

## Compliance

This error boundary system ensures compliance with:

- **Cursor Rules #11**: Enhanced Error Handling
- **React Best Practices**: Error boundary patterns
- **Accessibility Guidelines**: Proper ARIA attributes and semantic HTML
- **Logging Standards**: Structured error logging with context
