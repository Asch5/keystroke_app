# Keystroke App Practice System Design

## Overview

The Keystroke App practice system is designed to help users learn vocabulary through a variety of interactive exercises. The system has been comprehensively refactored to provide both a unified practice experience and a legacy typing practice mode, with extensive modularization following Cursor Rules (components under 400 lines).

## Practice Types

The system includes the following exercise types with progressive learning levels:

1. **Remember Translation** (Level 0-1) - Simple recognition exercise showing a word and its translation
2. **Choose Right Word** (Level 2) - Multiple choice exercise with 4 options
3. **Make Up Word** (Level 3) - Drag and drop letters to form the correct word
4. **Write by Definition** (Level 4) - Type the word based on its definition
5. **Write by Sound** (Level 5) - Type the word based on its pronunciation

## Progressive Learning System

### Level-Based Word Progression

**Implementation Date**: December 2024

The system now uses a sophisticated progressive learning algorithm that ensures words advance through exercise levels sequentially:

#### Exercise Level Mapping

- **Level 0**: New words start with Remember Translation
- **Level 1**: Remember Translation (confidence building)
- **Level 2**: Choose Right Word (recognition)
- **Level 3**: Make Up Word (construction)
- **Level 4**: Write by Definition (recall)
- **Level 5**: Write by Sound (mastery)

#### Progression Rules

**Advancement Requirements**:

- **Advance Threshold**: 2 successful attempts at current level
- **Success Rate Required**: 60% or higher to maintain/advance
- **Sequential Progression**: Words cannot skip levels (must complete Level 1 before Level 2)

**Regression Rules**:

- **Regression Threshold**: 3 failed attempts with success rate below 60%
- **Level Decrease**: Words regress to previous level when failing
- **Minimum Level**: Words can regress to Level 0 (restart learning)

#### Database Integration

**SRS Level Tracking**: Uses existing `UserDictionary.srsLevel` field (0-5) to track progression
**Learning Status Updates**: Automatically updates based on level:

- Level 0: `notStarted`
- Levels 1-2: `inProgress`
- Levels 3-4: `inProgress` (with higher mastery score)
- Level 5: `learned`
- Failed words: `needsReview` or `difficult`

#### Progressive Algorithm Functions

**`determineExerciseTypeProgressive`** - Determines exercise type based on current level

- Respects user-enabled exercise types
- Enforces sequential progression
- Provides progression analytics

**`updateWordProgression`** - Updates word progression after practice attempts

- Calculates level advancement/regression
- Updates learning status and mastery score
- Manages SRS review intervals

#### Settings Integration

**Exercise Type Filtering**: Progressive system respects user settings:

- Only uses exercise types enabled in `VocabularyPracticeSettings`
- Falls back to available types when preferred type is disabled
- Maintains progression logic within enabled types

**Benefits of Progressive Learning**:

1. **Structured Learning**: Words follow a logical difficulty progression
2. **Prevents Skipping**: Users must master basics before advanced exercises
3. **Smart Regression**: Failed attempts move back to appropriate level
4. **Personalized Pace**: Each word progresses at its own rate
5. **Status Accuracy**: Learning status reflects actual mastery level

## Practice System Architecture

The practice system now supports two main modes:

### 1. Unified Practice System (Enhanced Practice)

**Location**: `/dashboard/practice/enhanced`

**Main Components**:

- `EnhancedPracticeContent.tsx` (177 lines) - Main orchestrator for unified practice
- `PracticeGameRenderer.tsx` (153 lines) - Renders appropriate game components
- `PracticeSessionSummary.tsx` (81 lines) - Session completion summary
- `PracticeWordCardRenderer.tsx` (37 lines) - Word card display

**State Management**:

- `usePracticeGameState.ts` (180 lines) - Unified practice state management

**Features**:

- Automatically selects the most appropriate exercise type based on word familiarity and learning progress
- Shows WordCard first for new words to introduce them before testing
- Starts with exercises directly for familiar words
- Dynamically adjusts difficulty based on user performance

### 2. Legacy Typing Practice System

**Location**: `/dashboard/practice/typing`

**Main Components**:

- `TypingPracticeContent.tsx` (192 lines) - Main typing practice orchestrator
- `TypingPracticeHeader.tsx` (103 lines) - Session statistics and progress
- `TypingWordInput.tsx` (107 lines) - Main typing interface (refactored from 493 lines)
- `TypingSessionSummary.tsx` (73 lines) - Results display
- `TypingGettingStarted.tsx` (32 lines) - Welcome screen

**Modular Input Components** (refactored from TypingWordInput):

- `TypingWordDisplay.tsx` (95 lines) - Word display with images and debug info
- `TypingInputField.tsx` (73 lines) - OTP-style input field
- `TypingResultFeedback.tsx` (79 lines) - Result feedback and word comparison
- `TypingControls.tsx` (66 lines) - Control buttons
- `TypingAudioButton.tsx` (67 lines) - Audio functionality

**State Management Hooks** (refactored from useTypingPracticeState):

- `useTypingPracticeState.ts` (153 lines) - Main orchestrator hook (refactored from 440 lines)
- `useTypingSessionManager.ts` (273 lines) - Session creation, completion, and state
- `useTypingWordValidator.ts` (175 lines) - Word validation and result tracking
- `useTypingInputManager.ts` (71 lines) - Input handling and auto-submit
- `useTypingInputState.ts` (204 lines) - Typing input state management

## Universal WordCard Component

### Enhanced WordCard Functionality (NEW)

**Component**: `WordCard.tsx` (204 lines) - Universal word review component

**Key Features**:

- **Automatic Audio Playback**: Plays word pronunciation when card appears (configurable)
- **Manual Audio Control**: Play button for on-demand audio playback
- **Comprehensive Word Display**: Shows word text, phonetic pronunciation, definition, translation, part of speech, learning status
- **Visual Content**: Displays word images when available with proper aspect ratio
- **Learning Status Badges**: Color-coded badges for learning progress (New, In Progress, Learned, Difficult, Needs Review)
- **Responsive Design**: Mobile-first design with proper touch targets
- **Accessibility**: ARIA labels and semantic HTML structure

**Integration**:

- `PracticeWordCardRenderer.tsx` (78 lines) - Wrapper component for practice sessions
- Integrated into `EnhancedPracticeContent.tsx` for unified practice system
- Supports both automatic and manual audio playback modes
- Configurable through `VocabularyPracticeSettings`

**Audio Integration**:

- Uses `AudioService` for consistent audio playback
- Supports both database-stored audio and external URLs
- Automatic playback prevention for repeated words
- Loading states and error handling

## Game Components Architecture

### Modular Game Structure

All game components have been refactored to follow the modular pattern:

#### Write by Sound Game (Level 5)

**Main Component**: `WriteBySoundGame.tsx` (111 lines) - Reduced from 450 lines

**Modular Components**:

- `useWriteBySoundState.ts` (203 lines) - Game state management
- `WriteBySoundHeader.tsx` (40 lines) - Game header with instructions
- `WriteBySoundAudioControls.tsx` (85 lines) - Audio controls with replay functionality
- `WriteBySoundHint.tsx` (25 lines) - Word length hint display
- `WriteBySoundInput.tsx` (95 lines) - Input section with character feedback
- `WriteBySoundFeedback.tsx` (85 lines) - Feedback section with results

#### Write by Definition Game (Level 4)

**Main Component**: `WriteByDefinitionGame.tsx` (96 lines) - Reduced from 416 lines

**Modular Components**:

- `useWriteByDefinitionState.ts` (220 lines) - Game state management
- `WriteByDefinitionHeader.tsx` (106 lines) - Definition display and controls
- `WriteByDefinitionInput.tsx` (103 lines) - Input field with character feedback
- `WriteByDefinitionFeedback.tsx` (88 lines) - Results display with audio controls
- `WriteByDefinitionKeyboard.tsx` (64 lines) - Virtual keyboard component

#### Other Games

- `RememberTranslationGame.tsx` (241 lines) - Level 1 recognition exercise
- `ChooseRightWordGame.tsx` (221 lines) - Level 2 multiple choice
- `MakeUpWordGame.tsx` (370 lines) - Level 3 drag and drop (needs refactoring)

## Practice Settings Architecture

### Modular Settings System

#### Legacy Typing Practice Settings

**Main Component**: `TypingPracticeSettings.tsx` (165 lines) - Reduced from 487 lines

**Modular Settings Components**:

- `SessionConfigurationSettings.tsx` (98 lines) - Words count and difficulty
- `TimeSettings.tsx` (71 lines) - Time limit toggle and slider
- `AudioSoundSettings.tsx` (112 lines) - Audio and sound options
- `BehaviorDisplaySettings.tsx` (98 lines) - Behavior and display settings
- `SettingsSummary.tsx` (57 lines) - Settings summary display

**State Management**:

- `useTypingPracticeSettings.ts` (110 lines) - Settings state management

#### Vocabulary Practice Settings (NEW)

**Main Component**: `VocabularyPracticeSettings.tsx` (249 lines) - Comprehensive vocabulary practice configuration

**Modular Settings Components**:

- `ExerciseTypeSettings.tsx` (239 lines) - Exercise type selection with individual controls
- `VocabularySessionConfigurationSettings.tsx` (175 lines) - Session configuration (words count, difficulty, word card settings)
- `VocabularyTimeSettings.tsx` (73 lines) - Time limit settings for vocabulary practice
- `VocabularyAudioSettings.tsx` (132 lines) - Audio settings (auto-play, game sounds, volume)
- `VocabularyBehaviorSettings.tsx` (261 lines) - Behavior and display settings for vocabulary practice

**State Management**:

- `useVocabularyPracticeSettings.ts` (193 lines) - Comprehensive vocabulary practice settings management

**Key Features**:

- **Exercise Type Selection**: Toggle individual exercise types (Remember Translation, Choose Right Word, Make Up Word, Write by Definition, Write by Sound)
- **Adaptive Configuration**: Settings adapt to enabled exercise types
- **Comprehensive Audio Control**: Auto-play settings for Word Card and game start
- **Advanced Behavior Settings**: Pause on incorrect answers, show correct answers, adaptive difficulty
- **Visual Display Options**: Control visibility of progress bar, images, phonetic pronunciation, part of speech, learning status
- **LocalStorage Persistence**: Settings persist across browser sessions
- **Enhanced Dialog Interface**: Full-screen scrollable modal with organized sections and responsive design

### Enhanced Dialog Interface

**Implementation**: `VocabularyPracticeSettingsDialog.tsx` (330 lines)

**Features**:

- **Full-Screen Modal**: Takes up 95% of viewport width and 90% of viewport height for maximum usability
- **Scrollable Content**: Smooth scrolling with `ScrollArea` component for handling long content
- **Organized Sections**: Clear section headers with separators for better navigation
- **Responsive Header**: Settings icon, title, description, and action buttons (Reset All, Close)
- **Comprehensive Summary**: Live settings summary showing current configuration at the bottom
- **Auto-Save Indication**: Clear messaging that settings are automatically saved
- **Action Footer**: Close and Done buttons for user convenience
- **Mobile Optimized**: Works perfectly on all screen sizes with responsive design

**User Experience**:

1. **Access**: Click "Practice Settings" button in Vocabulary Practice card
2. **Interface**: Full-screen dialog opens with organized sections
3. **Navigation**: Scroll through different setting categories smoothly
4. **Configuration**: Adjust any of the 20+ available settings
5. **Feedback**: See live summary of current configuration
6. **Completion**: Close dialog and settings are automatically preserved

## Practice Overview System

### List Selection and Practice Type Choice

**Main Component**: `PracticeOverviewContent.tsx` (164 lines) - Reduced from 403 lines

**Modular Components**:

- `PracticeTypeCard.tsx` (94 lines) - Individual practice type display
- `VocabularyListSelector.tsx` (210 lines) - Vocabulary list selection with details

**Features**:

- Support for all user vocabulary
- User's custom lists and inherited public lists
- Difficulty level filtering and word count display
- Practice type selection with feature descriptions

## Recent Enhancements (2024)

### Vocabulary Practice Settings System

**Implementation Date**: December 2024

**Key Achievements**:

- ✅ **Universal WordCard Enhancement**: Added automatic audio playback and manual play button to WordCard component
- ✅ **Comprehensive Settings Framework**: Created modular vocabulary practice settings system with 20+ configuration options
- ✅ **Exercise Type Control**: Individual toggles for all 5 exercise types with adaptive configuration
- ✅ **Advanced Audio Settings**: Auto-play controls for Word Card and game start, volume control, game sound effects
- ✅ **Behavior Customization**: Pause on incorrect answers, show correct answers, adaptive difficulty, skip difficult words
- ✅ **Display Preferences**: Control visibility of progress bar, images, phonetic pronunciation, part of speech, learning status
- ✅ **Settings Integration**: Seamless integration with enhanced practice system and localStorage persistence
- ✅ **Dialog Scrolling Fix**: Fixed ScrollArea configuration for proper scrolling in settings dialog
- ✅ **Complete Settings Application**: All settings now properly apply to practice components

**Recent Fixes (Latest Update)**:

1. **Dialog Scrolling Issue Resolved**: Fixed `VocabularyPracticeSettingsDialog` by moving padding from ScrollArea content to ScrollArea itself, enabling proper scrolling behavior across all screen sizes
2. **Settings Integration Complete**: All vocabulary practice settings now properly propagate to and control practice components:
   - `showProgressBar` - Controls Universal Progress Indicator visibility
   - `autoPlayAudioOnWordCard` - Controls automatic audio in WordCard component
   - `autoPlayAudioOnGameStart` - Controls automatic audio when games start
   - `showPhoneticPronunciation` - Controls phonetic display in WordCard
   - `showPartOfSpeech` - Controls part of speech display in WordCard
   - `showDefinitionImages` - Controls image display in WordCard and games
   - `showLearningStatus` - Controls learning status badge visibility

**Progressive Learning System Implementation (December 2024)**:

3. **Exercise Settings Fix**: Fixed bug where enabled exercise types in user settings were not being applied to practice sessions
   - Updated `createUnifiedPracticeSession` to properly pass `enabledExerciseTypes` from user settings
   - Fixed `determineExerciseTypeProgressive` to respect user's enabled exercise types
   - Exercise types now correctly filter based on user preferences in settings

4. **Progressive Learning Algorithm**: Implemented comprehensive level-based word progression system
   - **Sequential Progression**: Words must advance through levels 0→1→2→3→4→5 sequentially
   - **Smart Advancement**: 2 successful attempts + 60% success rate required to advance
   - **Intelligent Regression**: 3 failed attempts with <60% success rate triggers level decrease
   - **Database Integration**: Uses existing `UserDictionary.srsLevel` field for tracking progression
   - **Learning Status Updates**: Automatically updates learning status based on progression level

5. **Validation Integration**: Integrated progressive learning into existing practice validation
   - Updated `validateTypingInput` to use `updateWordProgression` for level-based updates
   - Maintains compatibility with existing typing practice while adding progressive features
   - Preserves all existing learning metrics and session tracking

**Technical Implementation Details**:

- **Enhanced Dialog Interface**: `VocabularyPracticeSettingsDialog.tsx` (330 lines) - Full-screen scrollable modal with proper ScrollArea configuration
- **Settings Propagation**: Settings flow from `EnhancedPracticePageContent` → `EnhancedPracticeContent` → `PracticeGameRenderer` & `PracticeWordCardRenderer`
- **Display Control**: WordCard component dynamically shows/hides elements based on user settings
- **Audio Control**: Both WordCard and game components respect audio auto-play preferences
- **Type Safety**: All components use proper TypeScript interfaces for settings integration

**Components Created**:

- `VocabularyPracticeSettings.tsx` (249 lines) - Main settings orchestrator (legacy)
- `VocabularyPracticeSettingsDialog.tsx` (330 lines) - Enhanced dialog interface for settings
- `ExerciseTypeSettings.tsx` (239 lines) - Exercise type selection with visual cards
- `VocabularySessionConfigurationSettings.tsx` (175 lines) - Session configuration
- `VocabularyTimeSettings.tsx` (73 lines) - Time limit settings
- `VocabularyAudioSettings.tsx` (132 lines) - Audio configuration
- `VocabularyBehaviorSettings.tsx` (261 lines) - Behavior and display settings
- `useVocabularyPracticeSettings.ts` (193 lines) - Settings state management hook

**Technical Excellence**:

- All components follow Cursor Rules (under 400 lines)
- Comprehensive TypeScript interfaces and type safety
- Modular architecture for maintainability and reusability
- Proper error handling and validation
- Responsive design with mobile-first approach
- Accessibility compliance with ARIA labels and semantic HTML

## Technical Implementation

### Refactoring Achievements

The practice system underwent comprehensive refactoring to comply with Cursor Rules:

| Component                       | Original Lines | Refactored Lines | Reduction | New Components Created |
| ------------------------------- | -------------- | ---------------- | --------- | ---------------------- |
| **EnhancedPracticeContent.tsx** | 461            | 177              | 62%       | 4 components           |
| **TypingWordInput.tsx**         | 493            | 107              | 78%       | 6 components           |
| **TypingPracticeSettings.tsx**  | 487            | 165              | 66%       | 5 components           |
| **WriteBySoundGame.tsx**        | 450            | 111              | 75%       | 6 components           |
| **useTypingPracticeState.ts**   | 440            | 153              | 65%       | 3 hooks                |
| **WriteByDefinitionGame.tsx**   | 416            | 96               | 77%       | 5 components           |
| **PracticeOverviewContent.tsx** | 403            | 164              | 59%       | 2 components           |

**Total Impact**: From 3,150 lines to 969 lines (**69% overall reduction**)

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

**Session Management**:

- `createUnifiedPracticeSession` - Creates a practice session with dynamic exercise selection using progressive learning
- `updateWordProgressAndSelectNext` - Updates word progress and determines the next exercise type
- `getPracticeTypeConfigs` - Provides configuration for each practice type

**Progressive Learning (NEW)**:

- `determineExerciseTypeProgressive` - Selects exercise type based on current learning level with sequential progression
- `updateWordProgression` - Updates word progression after practice attempts with level advancement/regression logic
- `EXERCISE_LEVEL_MAPPING` - Maps learning levels (0-5) to appropriate exercise types
- `PROGRESSION_REQUIREMENTS` - Defines thresholds for advancement and regression

**Legacy Support**:

- `determineExerciseType` - Original exercise selection algorithm (maintained for backward compatibility)
- `validateTypingInput` - Validates practice attempts and integrates with progressive learning system

## Component Architecture Principles

### Single Responsibility Principle

Each component now has a focused, single responsibility:

- **Game Components**: Handle specific exercise types
- **State Hooks**: Manage specific aspects of state (session, validation, input)
- **UI Components**: Handle specific UI sections (headers, inputs, feedback)

### Reusability and Composition

- Components are designed to be reusable across different contexts
- Composition over inheritance approach
- Proper prop interfaces for flexible usage

### Performance Optimizations

- React.memo applied where beneficial
- useCallback and useMemo for expensive operations
- Proper dependency arrays in useEffect hooks

### TypeScript Safety

- Comprehensive type definitions for all components
- Proper interface definitions for props and state
- Type-safe prop passing with conditional spreading

## Testing Architecture

Following Cursor Rules, tests are co-located with components:

### Current Test Coverage

**Practice Components** - ✅ COMPLETE

- `useTypingPracticeState.test.ts` - State management and core functionality
- `TypingWordInput.test.tsx` - Enter key behavior and user interactions
- `TypingPracticeContent.test.tsx` - Full workflow integration tests
- `test-utils.ts` - Shared testing utilities and mock data

**Critical functionality tested**:

- ✅ Skip functionality shows correct word
- ✅ Word progression prevents getting stuck
- ✅ Enter key behavior: skip → submit → next
- ✅ Auto-submit settings integration
- ✅ Audio playback after skip/submit
- ✅ Settings persistence and application

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
6. **Modular Architecture** - Maintainable, testable, and reusable components

## Future Enhancements

Potential future improvements include:

1. **Complete Game Refactoring** - Refactor remaining games (MakeUpWordGame.tsx at 370 lines)
2. **Spaced Repetition** - Implement SRS algorithm for optimal review scheduling
3. **Performance Analytics** - Track and visualize learning patterns over time
4. **Personalized Difficulty** - Further customize exercise selection based on user preferences
5. **Additional Exercise Types** - Expand with more interactive learning activities
6. **Mobile Optimization** - Enhanced touch interactions for mobile users
7. **Advanced Testing** - Expand test coverage to all game components and hooks

## Folder Structure

```
src/components/features/practice/
├── games/
│   ├── write-by-sound/          # WriteBySoundGame modular components
│   ├── write-by-definition/     # WriteByDefinitionGame modular components
│   ├── WriteBySoundGame.tsx     # Main game component (111 lines)
│   ├── WriteByDefinitionGame.tsx # Main game component (96 lines)
│   ├── RememberTranslationGame.tsx # Level 1 game (241 lines)
│   ├── ChooseRightWordGame.tsx  # Level 2 game (221 lines)
│   └── MakeUpWordGame.tsx       # Level 3 game (370 lines - needs refactoring)
├── overview/                    # PracticeOverviewContent modular components
├── settings/                    # Practice settings components
│   ├── TypingPracticeSettings.tsx           # Legacy typing practice settings (165 lines)
│   ├── VocabularyPracticeSettings.tsx       # Main vocabulary practice settings (249 lines)
│   ├── ExerciseTypeSettings.tsx             # Exercise type selection (239 lines)
│   ├── VocabularySessionConfigurationSettings.tsx # Session config (175 lines)
│   ├── VocabularyTimeSettings.tsx           # Time settings (73 lines)
│   ├── VocabularyAudioSettings.tsx          # Audio settings (132 lines)
│   ├── VocabularyBehaviorSettings.tsx       # Behavior settings (261 lines)
│   └── [legacy typing settings]             # Legacy typing practice settings
├── hooks/                       # Refactored practice hooks
│   ├── useTypingPracticeState.ts      # Main orchestrator (153 lines)
│   ├── useTypingSessionManager.ts     # Session management (273 lines)
│   ├── useTypingWordValidator.ts      # Word validation (175 lines)
│   ├── useTypingInputManager.ts       # Input handling (71 lines)
│   ├── usePracticeGameState.ts        # Unified practice state (180 lines)
│   ├── useTypingInputState.ts         # Typing input state (204 lines)
│   ├── useVocabularyPracticeSettings.ts # Vocabulary practice settings (193 lines)
│   └── useTypingPracticeSettings.ts   # Legacy typing practice settings (110 lines)
├── shared/                      # Shared practice components
├── EnhancedPracticeContent.tsx  # Unified practice orchestrator (177 lines)
├── PracticeOverviewContent.tsx  # Practice selection (164 lines)
├── TypingPracticeContent.tsx    # Legacy typing practice (192 lines)
├── TypingWordInput.tsx          # Main typing interface (107 lines)
├── TypingPracticeSettings.tsx   # Settings interface (165 lines)
└── [other typing components]    # Modular typing components
```

This architecture ensures maintainability, testability, and adherence to modern React development practices while providing a comprehensive vocabulary learning experience.
