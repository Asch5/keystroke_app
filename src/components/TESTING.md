# Component Testing Structure

This document outlines the comprehensive testing structure for the components folder, following the CURSOR RULES pattern of **co-located tests** alongside the code they test.

## Testing Philosophy

According to the CURSOR RULES:

> **Test Location: Keep test files alongside the code they are testing (e.g., MyComponent.test.tsx next to MyComponent.tsx)**

Our testing approach follows these principles:

1. **Co-location**: Test files are placed next to the components they test
2. **Comprehensive Coverage**: Critical business logic and complex components have accompanying tests
3. **Pragmatic Testing**: Focus on user behavior and functionality rather than implementation details
4. **Mobile-First**: Test responsive behavior and mobile interactions

## Testing Infrastructure

### Framework Setup

- **Testing Framework**: Vitest (fast, modern alternative to Jest)
- **React Testing**: @testing-library/react (behavior-driven testing)
- **Environment**: jsdom (browser environment simulation)
- **Mocking**: Vitest built-in mocking capabilities

### Configuration Files

- `vitest.config.ts` - Main Vitest configuration
- `src/test-setup.ts` - Global test setup and mocks
- Component-specific test files: `Component.test.tsx`

### Global Mocks

The test setup includes mocks for:

- Next.js modules (navigation, image, auth)
- Prisma client and types
- Audio playback (Web Audio API)
- Local/session storage
- Toast notifications (sonner)
- Responsive design (matchMedia)

## Testing Structure by Feature

### Practice Components (`/features/practice`)

The practice system has comprehensive test coverage for the recently fixed functionality:

#### Core Hook Tests: `useTypingPracticeState.test.ts`

**Critical Tests for Recent Fixes:**

- ✅ **Skip Functionality**: Verifies that skipping shows correct word (was broken)
- ✅ **Word Progression**: Ensures proper advancement through words (was stuck)
- ✅ **Enter Key Behavior**: Tests keyboard navigation patterns
- ✅ **Auto-submit Settings**: Validates setting-based behavior

**Test Categories:**

- Session initialization and management
- Word input handling and validation
- Progress calculation and state updates
- Error handling and edge cases

#### Component Integration Tests: `TypingWordInput.test.tsx`

**Critical Tests for Enter Key Fixes:**

- ✅ **Enter with no input → Skip word**
- ✅ **Enter with input → Submit word**
- ✅ **Enter while showing results → Next word**
- ✅ **Button interactions and hints**
- ✅ **Audio integration and settings**

#### Full Workflow Tests: `TypingPracticeContent.test.tsx`

**Integration Testing:**

- Complete typing practice workflow
- Skip and progression workflow (fixed behavior)
- Audio playback integration
- Settings application and persistence
- Progress tracking and score updates
- Error handling and edge cases
- Responsive design validation

#### Test Utilities: `test-utils.ts`

Shared testing utilities for consistent test data:

- Mock practice words with audio and images
- Session state creators
- Word result generators
- Common test props and helpers
- Event simulation utilities

### Dictionary Components (`/features/dictionary`)

**Planned Test Coverage:**

- `MyDictionaryContent.test.tsx` - Search, filtering, pagination
- `AddNewWordContent.test.tsx` - Word search and addition workflow
- `WordListsContent.test.tsx` - List management and organization
- `DictionaryFilters.test.tsx` - Filter and sort functionality

### Admin Components (`/features/admin`)

**Planned Test Coverage:**

- `AdminDictionaryTable.test.tsx` - Data table interactions
- `WordDetails.test.tsx` - Word detail display and editing
- `WordDetailEditForm.test.tsx` - Form validation and submission

### Shared Components (`/shared`)

**Testing Priority:**

- Form components with validation
- Data display components with user interactions
- Dialog components with state management
- Navigation components with routing

## Testing Patterns

### 1. Component Testing Pattern

```typescript
describe('ComponentName', () => {
  // Setup and mocks
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering tests
  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<Component {...requiredProps} />);
      expect(screen.getByRole('...')).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      const onClickMock = vi.fn();

      render(<Component onClick={onClickMock} />);
      await user.click(screen.getByRole('button'));

      expect(onClickMock).toHaveBeenCalled();
    });
  });

  // Integration tests
  describe('Integration', () => {
    it('should work with other components', () => {
      // Test component interactions
    });
  });
});
```

### 2. Hook Testing Pattern

```typescript
describe('useCustomHook', () => {
  it('should return expected values', () => {
    const { result } = renderHook(() => useCustomHook());

    expect(result.current.someValue).toBe(expectedValue);
  });

  it('should handle actions correctly', async () => {
    const { result } = renderHook(() => useCustomHook());

    await act(async () => {
      await result.current.someAction();
    });

    expect(result.current.someState).toBe(expectedState);
  });
});
```

### 3. Integration Testing Pattern

```typescript
describe('Feature Integration', () => {
  it('should complete full workflow', async () => {
    // 1. Render component
    render(<FeatureComponent />);

    // 2. Simulate user actions
    await user.click(screen.getByRole('button', { name: /start/ }));

    // 3. Verify state changes
    await waitFor(() => {
      expect(screen.getByText('Expected Result')).toBeInTheDocument();
    });

    // 4. Continue workflow
    await user.type(screen.getByRole('textbox'), 'input');

    // 5. Verify final state
    expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
  });
});
```

## Key Testing Scenarios

### 1. Keyboard Navigation (Recently Fixed)

```typescript
it('should handle Enter key correctly', () => {
  render(<Component />);

  // Simulate Enter key press
  fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

  expect(expectedBehavior).toHaveOccurred();
});
```

### 2. Audio Playback

```typescript
it('should play audio after action', async () => {
  const mockPlayAudio = vi.fn();

  render(<Component onPlayAudio={mockPlayAudio} />);

  await user.click(screen.getByRole('button', { name: /skip/ }));

  expect(mockPlayAudio).toHaveBeenCalledWith(
    expectedWord,
    expectedAudioUrl,
    expectedCorrectness
  );
});
```

### 3. Responsive Design

```typescript
it('should display correctly on mobile', () => {
  // Mock mobile viewport
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation((query) => ({
      matches: query.includes('max-width: 768px'),
      // ... other properties
    })),
  });

  render(<ResponsiveComponent />);

  expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
});
```

### 4. Settings Integration

```typescript
it('should apply user settings', () => {
  const mockSettings = { autoSubmit: true, showImages: false };

  render(<Component settings={mockSettings} />);

  // Verify setting-dependent behavior
  expect(autoSubmitBehavior).toBeTruthy();
  expect(screen.queryByTestId('image')).not.toBeInTheDocument();
});
```

## Running Tests

### Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests once
pnpm test:run

# Run with coverage
pnpm test:coverage
```

### Test File Patterns

- `src/**/*.test.{ts,tsx}` - Component and hook tests
- `src/**/*.spec.{ts,tsx}` - Integration and e2e tests
- `src/**/test-utils.ts` - Shared testing utilities

## Debugging Tests

### Console Output

Tests include comprehensive console logging for debugging:

```typescript
console.log('🎯 Action triggered:', { state, input });
console.log('📊 Result received:', result);
console.log('✅ Expected behavior confirmed');
```

### Visual Debugging

Use Vitest UI for visual test debugging:

```bash
pnpm test:ui
```

### Test Data Inspection

```typescript
// Log rendered component structure
screen.debug();

// Log specific elements
console.log(screen.getByRole('button').outerHTML);

// Log test state
console.log('Current state:', result.current);
```

## Coverage Goals

### Critical Components (Must Have Tests)

- ✅ **Typing Practice System** - Complete coverage implemented
- 🔄 **Dictionary Management** - In progress
- 📋 **Admin Word Management** - Planned
- 📋 **User Authentication** - Planned

### Coverage Targets

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Priority Areas

1. **User Interactions** - All clickable elements and form inputs
2. **Business Logic** - Core functionality and state management
3. **Error Handling** - Error states and recovery mechanisms
4. **Responsive Design** - Mobile and desktop layouts
5. **Accessibility** - Screen reader and keyboard navigation

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Testing implementation details
expect(component.state.internalCounter).toBe(5);

// ✅ Testing user-observable behavior
expect(screen.getByText('5 items')).toBeInTheDocument();
```

### 2. Use Realistic Test Data

```typescript
// ❌ Minimal test data
const word = { text: 'a' };

// ✅ Realistic test data
const word = {
  userDictionaryId: 1,
  wordText: 'hund',
  definition: 'dog',
  audioUrl: 'http://example.com/audio.mp3',
  // ... other realistic properties
};
```

### 3. Test Error Scenarios

```typescript
it('should handle API failures gracefully', async () => {
  mockApiCall.mockRejectedValue(new Error('Network error'));

  render(<Component />);
  await user.click(screen.getByRole('button'));

  expect(screen.getByText('Failed to load')).toBeInTheDocument();
});
```

### 4. Keep Tests Fast and Independent

- Mock external dependencies
- Use fake timers for time-dependent tests
- Clean up after each test
- Avoid testing multiple concerns in one test

## Contributing to Tests

When adding new components or modifying existing ones:

1. **Add co-located test file** next to your component
2. **Test critical user paths** and edge cases
3. **Mock external dependencies** appropriately
4. **Follow existing patterns** in similar test files
5. **Update this documentation** if adding new testing patterns

Remember: Good tests increase confidence in your code and help prevent regressions, especially for critical functionality like the typing practice system we just fixed!
