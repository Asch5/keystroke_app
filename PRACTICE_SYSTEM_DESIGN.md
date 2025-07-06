# Keystroke App Practice System Design

## Overview

The Keystroke App practice system is designed to help users learn vocabulary through a variety of interactive exercises. The system has been refactored to provide a unified practice experience that automatically selects appropriate exercises based on word familiarity and learning progress.

## Practice Types

The system includes the following exercise types:

1. **Remember Translation** (Level 1) - Simple recognition exercise showing a word and its translation
2. **Choose Right Word** (Level 2) - Multiple choice exercise with 4 options
3. **Make Up Word** (Level 3) - Drag and drop letters to form the correct word
4. **Write by Definition** (Level 4) - Type the word based on its definition
5. **Write by Sound** (Level 5) - Type the word based on its pronunciation

## Unified Practice System

Instead of selecting individual practice types, users now experience a unified practice flow that:

1. Automatically selects the most appropriate exercise type based on word familiarity and learning progress
2. Shows WordCard first for new words to introduce them before testing
3. Starts with exercises directly for familiar words
4. Dynamically adjusts difficulty based on user performance

## Technical Implementation

### Word Progression Algorithm

The system uses a sophisticated algorithm (`determineExerciseType`) to select the appropriate exercise based on:

- Word familiarity (attempts, learning status)
- Success rate (correct attempts / total attempts)
- Audio availability (for write-by-sound exercises)
- User preferences (can skip easier exercises)

### Manual Navigation

Exercises 4 and 5 (Write by Definition and Write by Sound) now include "Next" buttons instead of auto-advancing, giving users control over their learning pace.

### Server Actions

The practice system uses Next.js server actions for database operations with proper async/await patterns:

- `createUnifiedPracticeSession` - Creates a practice session with dynamic exercise selection
- `updateWordProgressAndSelectNext` - Updates word progress and determines the next exercise type
- `determineExerciseType` - Selects the appropriate exercise based on learning metrics
- `getPracticeTypeConfigs` - Provides configuration for each practice type

## Technical Fixes

### 'use server' Compliance

Fixed the 'use server' directive requirements by:

- Converting exported objects (PRACTICE_TYPE_CONFIGS, PRACTICE_TYPE_MULTIPLIERS) to async functions
- Creating internal constants for use within the file
- Using proper async/await patterns for all exported functions

### React Hook Dependencies

Fixed missing dependencies in useEffect hooks:

- Added proper dependency arrays to useEffect hooks
- Used useCallback for functions referenced in useEffect dependencies
- Restructured component code to avoid dependency cycles

### TypeScript Type Safety

Enhanced type safety throughout the practice system:

- Added proper type definitions for practice configs
- Fixed LearningStatus enum comparisons
- Added null checks and default values
- Used proper TypeScript techniques for indexing objects with string keys
- Added comprehensive interface definitions for all components

## User Experience

The practice system now provides:

1. **Adaptive Learning** - Exercise difficulty matches user proficiency
2. **Proper Introduction** - New words are properly introduced before testing
3. **User Control** - Manual navigation through exercises with Next buttons
4. **Comprehensive Feedback** - Visual and audio feedback for learning reinforcement
5. **Progress Tracking** - Session progress with accuracy and score metrics

## Future Enhancements

Potential future improvements include:

1. **Spaced Repetition** - Implement SRS algorithm for optimal review scheduling
2. **Performance Analytics** - Track and visualize learning patterns over time
3. **Personalized Difficulty** - Further customize exercise selection based on user preferences
4. **Additional Exercise Types** - Expand with more interactive learning activities
5. **Mobile Optimization** - Enhanced touch interactions for mobile users
