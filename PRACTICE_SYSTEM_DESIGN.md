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

Instead of selecting individual practice types, users now access a unified practice system that:

1. Automatically selects appropriate exercise types based on:
   - Word familiarity (new vs. familiar)
   - Success rate (< 30%, 30-60%, 60-80%, > 80%)
   - Audio availability (for write-by-sound)

2. Implements a workflow pattern:
   - New words show a WordCard first to introduce the word
   - Familiar words start directly with an exercise

3. Dynamically adjusts difficulty:
   - Easier exercises for words with low success rates
   - Harder exercises for words with high success rates

## Implementation Details

### Key Components

1. **EnhancedPracticePageContent** - Main container for the unified practice system
2. **EnhancedPracticeContent** - Manages the practice session and exercise selection
3. **PracticeGameContainer** - Wrapper for all game types
4. **Individual Game Components** - Specialized components for each exercise type

### Exercise Progression

The `determineExerciseType` function selects the appropriate exercise type based on:

- Word learning status
- Success rate
- Audio availability

### User Controls

- Exercises 4 & 5 (Write by Definition and Write by Sound) now include "Next" buttons instead of auto-advancing
- All exercises provide appropriate feedback and progress tracking

### Practice Overview

The practice overview page has been simplified to offer:

- Unified "Vocabulary Practice" option (all 5 exercise types combined)
- Legacy typing practice option (for backward compatibility)

## Technical Implementation

- `UnifiedPracticeWord` interface extends `PracticeWord` with dynamic exercise selection
- `PRACTICE_TYPE_CONFIGS` updated to set `autoAdvance: false` for exercises 4 & 5
- `createUnifiedPracticeSession` function manages the creation of adaptive practice sessions
- `updateWordProgressAndSelectNext` function handles progression between words and exercises

## Future Enhancements

Potential future improvements include:

- More sophisticated learning algorithms
- Additional exercise types
- Enhanced analytics and progress tracking
- Personalized difficulty adjustment
