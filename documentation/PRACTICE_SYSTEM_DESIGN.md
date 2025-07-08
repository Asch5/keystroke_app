# Keystroke App Practice System Design

## Overview

The Keystroke App practice system is designed to help users learn vocabulary through a variety of interactive exercises. The system has been comprehensively refactored to provide both a unified practice experience and a legacy typing practice mode, with extensive modularization following Cursor Rules (components under 400 lines).

## 🚀 **Recent Major Improvements (2024)**

### **Vocabulary Practice Structure Revamp**

**Implementation Date**: December 2024

The vocabulary practice system has undergone a complete restructuring to align with the "Typing Practice (Legacy)" model, providing users with a comprehensive settings page before starting practice sessions.

#### **Key Features:**

- **Practice Mode Selection**: 4 distinct modes (Learn New, Continue Learning, Refresh Vocabulary, Mix Mode)
- **List Integration**: Support for user's whole dictionary, custom user lists, and inherited public lists
- **Comprehensive Settings**: Difficulty levels, word counts, exercise type selection
- **Smart Routing**: URL parameters for list selection and practice mode preservation
- **Modular Architecture**: Components following Cursor Rules (under 400 lines each)

#### **Practice Modes:**

1. **Learn New Words** - `notStarted` status words only
2. **Continue Learning** - `inProgress/difficult` status words
3. **Refresh Vocabulary** - `needsReview/learned` status words
4. **Mix Mode** - All statuses in smart learning order

### **Audio Playback System Unification**

**Implementation Date**: December 2024
**Fixed Issue**: "Failed to play audio" errors in practice games

#### **Problem Solved:**

Practice components were using direct `new Audio()` API calls, which caused:

- ❌ External URL access issues (CORS errors)
- ❌ Vercel Blob Storage authentication problems
- ❌ Inconsistent error handling across components
- ❌ No proxy support for external audio sources

#### **Solution Implemented:**

**Unified AudioService Integration** across all practice components:

```typescript
// ❌ OLD: Direct Audio API (caused failures)
const audio = new Audio(audioUrl);
await audio.play(); // Often failed with network/CORS errors

// ✅ NEW: AudioService (handles all edge cases)
await AudioService.playAudioFromDatabase(audioUrl);
```

#### **Components Updated:**

1. **PracticeAudioControls.tsx** - Switched from direct Audio API to AudioService
2. **useWriteBySoundState.ts** - Updated Write by Sound game audio handling
3. **Enhanced Error Handling** - User-friendly error messages for different failure types

#### **AudioService Benefits:**

- ✅ **URL Proxy Detection**: Automatically handles external URLs (static.ordnet.dk)
- ✅ **Vercel Blob Storage**: Direct support for blob.vercel-storage.com URLs
- ✅ **Intelligent Routing**: Same-origin vs external URL detection
- ✅ **Comprehensive Error Handling**: NotAllowedError, NetworkError, DecodeError, etc.
- ✅ **Consistent API**: Single method for all audio playback needs

#### **Error Message Examples:**

- "Audio playback blocked by browser. Please enable autoplay or click to play manually."
- "Network error while loading audio file. Please check your internet connection."
- "Audio format not supported by your browser."
- "Audio file is corrupted or invalid format."

### **Web Speech API Complete Removal**

**Implementation Date**: December 2024
**Compliance**: Strict adherence to user requirement "NEVER use Web Speech API fallback"

#### **Removed Components:**

- ❌ `playAudioWithFallback()` method from AudioService
- ❌ `playTextToSpeech()` method from AudioService
- ❌ Web Speech API fallback logic in useTypingAudioPlayback
- ❌ Browser TTS fallback in all practice components

#### **User Notification System:**

Instead of TTS fallback, users now receive clear notifications:

- 🔇 "No audio available for this word" in WordCard
- Clear visual indicators when audio is missing
- No silent fallbacks to browser TTS

### **Comprehensive Image Authentication Architecture**

**Implementation Date**: Ongoing
**Status**: ✅ **FULLY WORKING**

#### **Image Display Priority System:**

```typescript
// WordCard.tsx - Correct implementation
<AuthenticatedImage
  src={word.imageId ? `/api/images/${word.imageId}` : word.imageUrl!}
  alt={word.imageDescription || `Visual representation of ${word.wordText}`}
  fill
  className="object-cover"
/>
```

#### **Authentication Approach:**

1. **Database Images**: `/api/images/{id}` with authentication
2. **External Images**: Direct URLs (Pexels) with fallback handling
3. **Error Handling**: Graceful degradation with user notifications

### **Vocabulary Practice Settings System Enhancement**

**NEW: Comprehensive Settings Management** (December 2024)

The vocabulary practice system now includes a full-featured settings interface similar to typing practice:

#### **VocabularyPracticeContent.tsx** (249 lines)

- Practice mode selection with word count and difficulty display
- Integrated settings dialog access
- List selection for targeted vocabulary practice
- Real-time practice session creation

#### **VocabularyPracticeSettings Components**:

- `ExerciseTypeSettings.tsx` (239 lines) - Individual exercise type toggles
- `VocabularySessionConfigurationSettings.tsx` (175 lines) - Session parameters
- `VocabularyTimeSettings.tsx` (73 lines) - Time limit configuration
- `VocabularyAudioSettings.tsx` (132 lines) - Audio and sound preferences
- `VocabularyBehaviorSettings.tsx` (261 lines) - Behavior and display options

#### **Settings Categories Available**:

**Exercise Type Control**:

- Remember Translation (Level 0-1)
- Choose Right Word (Level 2)
- Make Up Word (Level 3)
- Write by Definition (Level 4)
- Write by Sound (Level 5)

**Session Configuration**:

- Words count (5-50 words per session)
- Difficulty level (1-5 scale)
- Show word card first (introduction mode)
- Auto-advance settings

**Audio & Sound**:

- Auto-play on word card display
- Auto-play on game start
- Game sound effects with volume control
- Audio quality preferences

**Visual & Behavior**:

- Definition images display
- Phonetic pronunciation
- Part of speech badges
- Learning status indicators
- Progress bar visibility
- Pause on incorrect answers
- Show correct answers on mistakes

### **Technical Architecture Improvements**

#### **Enhanced Practice Actions**

**Server Actions with Audio/Image Fixes**:

- `createVocabularyPracticeSession()` - Mode-specific word selection with proper audio/image data
- `selectVocabularyPracticeWords()` - Enhanced database queries including junction tables
- `createEnhancedPracticeSession()` - Unified practice session creation with media support

**Practice Mode Configuration**:

```typescript
const PRACTICE_MODES = {
  'learn-new': { statuses: ['notStarted'], name: 'Learn New Words' },
  'continue-learning': {
    statuses: ['inProgress', 'difficult'],
    name: 'Continue Learning',
  },
  'refresh-vocabulary': {
    statuses: ['needsReview', 'learned'],
    name: 'Refresh Vocabulary',
  },
  'mix-mode': {
    statuses: ['notStarted', 'inProgress', 'difficult', 'needsReview'],
    name: 'Mix Mode',
  },
};
```

#### **WordCard Component Enhancement**

**Universal WordCard Features**:

- ✅ **Audio Support**: Database audio files with manual play button
- ✅ **Image Display**: Authenticated images with proper fallback handling
- ✅ **No TTS Fallback**: Clear messaging when audio unavailable
- ✅ **Development Debugging**: Visual debug information in development mode
- ✅ **Responsive Design**: Mobile-first layout with proper touch targets

**Enhanced Error Handling**:

```typescript
// WordCard.tsx - Enhanced debugging and error handling
{process.env.NODE_ENV === 'development' && (
  <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
    🔧 Image Debug: ID={word.imageId}, URL={word.imageUrl?.substring(0, 50)}...
    <br />
    Using: {word.imageId ? `/api/images/${word.imageId}` : 'External URL'}
  </div>
)}
```

### **User Experience Improvements**

#### **Streamlined Practice Flow**

1. **Practice Selection** - Choose vocabulary practice from main practice page
2. **Mode Selection** - Select learning mode based on current needs
3. **Settings Configuration** - Comprehensive settings with live preview
4. **List Selection** - Choose vocabulary source (whole dictionary, custom lists, public lists)
5. **Practice Execution** - Enhanced practice session with proper media support

#### **Settings Persistence & Sync**

- **Database Integration**: Settings stored in `User.settings.practice.vocabulary` JSON field
- **Real-time Sync**: Changes persist across devices and browser sessions
- **Redux Integration**: Immediate UI updates with background database sync
- **Export/Import**: Complete settings backup and restore functionality

### **Performance & Quality Improvements**

#### **Component Modularization Achievements**

Following Cursor Rules for component size and responsibility:

| Component                      | Original Lines | Refactored Lines | Reduction | Status      |
| ------------------------------ | -------------- | ---------------- | --------- | ----------- |
| **VocabularyPracticeContent**  | 0 (new)        | 249              | N/A       | ✅ Complete |
| **VocabularyPracticeSettings** | 0 (new)        | ~900 total       | N/A       | ✅ Modular  |
| **WordCard Component**         | 204            | 223 (+debug)     | Enhanced  | ✅ Improved |
| **Practice Actions**           | Enhanced       | Enhanced         | Better    | ✅ Fixed    |

#### **Audio/Image System Reliability**

- **Database Audio Priority**: Real audio files from blob storage (primary source)
- **No Cost Overruns**: Completely removed Google Cloud TTS fallback to prevent unexpected costs
- **Image Authentication**: Proper handling of both database images and external URLs
- **Error Recovery**: Graceful fallback with clear user messaging

### **Future Enhancements Roadmap**

#### **Immediate Priorities**

1. **Complete Testing**: Add comprehensive test coverage for vocabulary practice components
2. **Performance Optimization**: React.memo and optimization patterns for larger components
3. **Mobile Enhancement**: Touch interaction improvements and mobile-specific UI

#### **Planned Features**

1. **Advanced Analytics**: Detailed learning progress tracking and insights
2. **Spaced Repetition Enhancement**: More sophisticated SRS algorithm with performance-based intervals
3. **Social Features**: Shared practice sessions and collaborative learning
4. **Offline Support**: Practice sessions available without internet connection

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
- ✅ **Database Settings Persistence**: Complete integration with Redux state management and database synchronization
- ✅ **Loading State Handling**: Proper loading state management to prevent undefined access errors
- ✅ **Settings Integration**: Seamless integration with enhanced practice system and cross-device sync

**Recent Fixes (Latest Update)**:

1. **Settings Loading Race Condition Fixed**: Resolved critical error where `wordsCount` was undefined due to component accessing settings before they were loaded from database
   - Added proper `isLoaded` state checking in `EnhancedPracticePageContent`
   - Components now wait for settings to load before accessing properties
   - Loading states show appropriate messages ("Loading settings..." vs "Creating practice session...")

2. **Database Persistence Complete**: Full integration with existing Redux settings system
   - Added `VocabularyPracticeSettings` interface to Redux `settingsSlice`
   - Implemented database transformation utilities for vocabulary practice settings
   - Created Redux actions and selectors for vocabulary practice settings management
   - Enhanced `useVocabularyPracticeSettings` hook with database persistence capabilities

3. **Cross-Device Synchronization**: Settings now persist across devices and browser sessions
   - Uses same robust sync system as admin dictionary filters
   - Settings stored in User.settings JSON field in database
   - Automatic sync with pending changes tracking and error handling
   - Real-time updates across multiple tabs/sessions

**Technical Implementation Details**:

**Redux Integration**:

- **Settings Slice Enhancement**: Added `VocabularyPracticeSettings` to Redux state structure
- **Actions Created**: `updateVocabularyPracticeSetting`, `updateBulkVocabularyPracticeSettings`, `resetVocabularyPracticeSettings`
- **Selectors Added**: `selectVocabularyPracticeSettings` for state access
- **Transformation Utilities**: `transformVocabularyPracticeSettings` for database JSON parsing

**Database Architecture**:

- **Storage Location**: `User.settings.practice.vocabulary` JSON field
- **Sync Service**: Uses existing settings sync service with automatic change detection
- **Error Handling**: Comprehensive error handling with fallback to default settings
- **Type Safety**: Full TypeScript support with proper interfaces and validation

**Loading State Management**:

- **Race Condition Prevention**: Components check `isLoaded` before accessing settings
- **Progressive Loading**: Clear loading messages for different states
- **Error Recovery**: Graceful handling of settings loading failures
- **Performance Optimization**: Minimal re-renders during settings updates

**Settings Propagation Flow**:

```
Database → Redux Store → useVocabularyPracticeSettings → Components
     ↑                                                        ↓
Settings Sync Service ← Pending Changes Detection ← User Interactions
```

**Default Settings Structure**:

```typescript
const DEFAULT_VOCABULARY_PRACTICE_SETTINGS = {
  // Session Configuration
  wordsCount: 10,
  difficultyLevel: 3,

  // Exercise Type Selection (all enabled by default)
  enableRememberTranslation: true,
  enableChooseRightWord: true,
  enableMakeUpWord: true,
  enableWriteByDefinition: true,
  enableWriteBySound: true,

  // Audio Settings
  autoPlayAudioOnWordCard: true,
  autoPlayAudioOnGameStart: true,
  enableGameSounds: true,
  gameSoundVolume: 0.5,

  // Display Preferences
  showDefinitionImages: true,
  showPhoneticPronunciation: true,
  showPartOfSpeech: true,
  showLearningStatus: true,
  showProgressBar: true,

  // Advanced Configuration
  makeUpWordMaxAttempts: 3,
  makeUpWordTimeLimit: 30,
  makeUpWordAdditionalCharacters: 5,
  showWordCardFirst: true,
  autoAdvanceFromWordCard: false,
  enableTimeLimit: false,
  timeLimitSeconds: 60,
};
```

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

## Troubleshooting

### Common Settings Issues

#### Settings Loading Race Condition

**Error**: `Cannot read properties of undefined (reading 'wordsCount')`
**Symptoms**: Components crash when accessing settings properties before they're loaded from database

**Root Cause**: Components trying to access Redux settings before database data has been loaded and transformed

**Solution**:

```typescript
// ❌ Wrong - accessing settings without checking if loaded
const { settings } = useVocabularyPracticeSettings();
const wordsCount = settings.wordsCount; // Can cause undefined error

// ✅ Correct - check loading state first
const { settings, isLoaded } = useVocabularyPracticeSettings();
if (!isLoaded) {
  return <LoadingSpinner />;
}
const wordsCount = settings.wordsCount; // Safe to access
```

**Prevention**: Always check `isLoaded` state before accessing settings properties in components

#### Settings Not Persisting

**Symptoms**: Settings reset to defaults after browser refresh or device change

**Debugging**:

```typescript
// Check if settings sync is working
const { hasPendingChanges, lastSyncedAt } = useSettingsPersistence();
console.log('Sync status:', { hasPendingChanges, lastSyncedAt });

// Verify settings are being saved to Redux
const settings = useAppSelector(selectVocabularyPracticeSettings);
console.log('Current settings in Redux:', settings);
```

**Solutions**:

- Ensure user is authenticated before settings operations
- Check network connectivity for database sync
- Verify settings sync service is running properly
- Check browser developer tools for any console errors during settings updates

### Component Architecture Principles
