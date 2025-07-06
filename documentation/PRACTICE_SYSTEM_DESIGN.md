# Enhanced Practice System Design Document

## Overview

This document outlines the complete refactor and enhancement of the Keystroke App's practice system. The goal is to expand from the current typing practice to a comprehensive 5-practice-type system with universal components, enhanced user workflows, and sophisticated game mechanics.

## Current System Assessment

### Strengths

- **Modular Architecture**: Well-separated concerns with focused components (<400 lines each)
- **Comprehensive State Management**: useTypingPracticeState hook handles all business logic
- **Backend Integration**: Robust session management with learning analytics
- **Audio/Image Support**: Database-only audio files and authenticated image endpoints
- **Dynamic Language System**: User.baseLanguageCode as single source of truth
- **Type Safety**: Internal type system eliminating Prisma client bundling issues

### Areas for Enhancement

- **Practice Variety**: Only typing practice available, need 4 more practice types
- **User Experience**: Need universal WordCard system for consistent word review
- **Game Mechanics**: Sophisticated feedback systems and auto-advance workflows
- **Difficulty System**: Enhanced evaluation using practice type multipliers

## Practice Types Specification

### 1. Choose the Right Word (Difficulty Level 2)

**Concept**: Multiple choice translation selection
**Mechanics**:

- Display definition/translation in user's base language
- Show 4 options: 1 correct target word + 3 distractors
- Single attempt per word
- Auto-advance to WordCard after selection
- Immediate visual feedback (green/red highlighting)
- Audio pronunciation of correct answer

**UI Components**:

- Question display area with definition/translation
- 4-option button grid with hover states
- Visual feedback animations
- Auto-advance progress indicator

### 2. Make Up the Word (Difficulty Level 3)

**Concept**: Character-by-character word assembly
**Mechanics**:

- Show definition/translation and character slots for target word
- Provide scrambled character pool (correct letters + distractors)
- Click/drag characters into slots
- 3 attempts for single words, 6 attempts for phrases
- Wrong character placement shows visual feedback (shake/red flash)
- Auto-advance to WordCard after completion/attempts exhausted

**UI Components**:

- Character pool with draggable/clickable letters
- Target word slots with drop zones
- Attempt counter and visual feedback system
- Character validation and error animations

### 3. Do You Remember the Translation (Difficulty Level 1)

**Concept**: Simple recognition practice
**Mechanics**:

- Show target word with phonetic pronunciation
- Present "I Remember" / "Don't Remember" buttons
- Immediate feedback with actual translation reveal
- No time pressure, self-assessment based
- Auto-advance to WordCard for review

**UI Components**:

- Clean word presentation with large typography
- Phonetic display
- Two prominent action buttons
- Translation reveal animation
- Progress tracking

### 4. Write the Word by Definition (Difficulty Level 4)

**Concept**: Full word typing from definition
**Mechanics**:

- Display definition/translation in base language
- Free-form text input for target word
- Real-time character validation (like current typing practice)
- Single attempt with partial credit for close matches
- Optional on-screen keyboard toggle
- Auto-advance to WordCard after submission

**UI Components**:

- Definition display area
- Text input with character-by-character feedback
- Optional virtual keyboard component
- Submit button and validation feedback
- Progress indicators

### 5. Write the Word by Sound (Difficulty Level 4)

**Concept**: Audio-only word typing
**Mechanics**:

- Play audio pronunciation (database files only)
- Text input for typing the heard word
- Replay button for additional listens (max 3 plays)
- Real-time character validation
- Auto-advance to WordCard after submission

**UI Components**:

- Audio control interface with waveform visualization
- Play/replay buttons with usage counter
- Text input with typing feedback
- Audio progress indicator
- Volume controls

## Universal Components Architecture

### WordCard Component

**Purpose**: Consistent word review experience across all practice types
**Features**:

- Target word display with phonetic notation
- Definition in user's base language
- Example sentences with translations
- Audio pronunciation controls
- Associated image display (if available)
- "Next" button for manual progression
- Learning status indicators

**Design Pattern**:

```
[Target Word] [Audio Button]
[Phonetic Pronunciation]
[Definition/Translation]
[Example Sentences]
[Associated Image]
[Next Button]
```

### UniversalProgressIndicator Component

**Purpose**: Consistent progress tracking across all practice types
**Features**:

- Current word position (X of Y)
- Progress bar with completion percentage
- Session type badge
- Time elapsed (if applicable)
- Accuracy indicator

### PracticeGameContainer Component

**Purpose**: Wrapper for all practice game components
**Features**:

- Consistent padding and layout
- Error boundary for game failures
- Loading states
- Universal keyboard shortcuts
- Accessibility support

## Enhanced User Workflows

### New vs Familiar Word Logic

```
Word Assessment:
├── New Word (first encounter)
│   └── Show WordCard FIRST → Then Practice Game
└── Familiar Word (seen before)
    └── Practice Game FIRST → Auto-advance to WordCard
```

### Auto-Advance Pattern

- **In Games**: No "Next" buttons - automatic progression to WordCard
- **In WordCard**: Manual "Next" button for user-controlled review time
- **Audio Integration**: Automatic pronunciation after game completion

### Sound Integration Strategy

**Success Sounds** (database stored):

- Correct answer: Cheering/celebration sound
- Incorrect answer: Gentle error sound (not harsh)
- Session completion: Achievement sound

**Word Audio** (database stored):

- Automatic playback after game completion
- Manual replay controls in WordCard
- Volume controls and mute options

## Enhanced Backend Requirements

### Session Management Extensions

```typescript
interface EnhancedPracticeSession {
  sessionId: string;
  practiceType:
    | 'typing'
    | 'choose-right-word'
    | 'make-up-word'
    | 'remember-translation'
    | 'write-by-definition'
    | 'write-by-sound';
  words: PracticeWord[];
  difficultyLevel: number;
  currentWordIndex: number;
  settings: PracticeSettings;
}

interface PracticeWord {
  // Existing fields...
  isNewWord: boolean; // Determines workflow pattern
  gameAttempts: number; // Tracks attempts in current game
  maxAttempts: number; // Based on practice type
  characterPool?: string[]; // For make-up-word game
  distractorOptions?: string[]; // For choose-right-word game
}
```

### Difficulty Evaluation System

```typescript
const PRACTICE_TYPE_MULTIPLIERS = {
  'remember-translation': 0.5, // Difficulty 1
  'choose-right-word': 1.0, // Difficulty 2
  'make-up-word': 1.5, // Difficulty 3
  'write-by-definition': 2.0, // Difficulty 4
  'write-by-sound': 2.5, // Difficulty 4+
  typing: 1.2, // Current system
};
```

### Audio Management Enhancement

- Extend existing AudioService for game-specific sounds
- Implement audio preloading for smooth experience
- Add audio queue management for rapid-fire games

## Implementation Architecture

### Directory Structure

```
src/components/features/practice/
├── shared/
│   ├── WordCard.tsx
│   ├── UniversalProgressIndicator.tsx
│   ├── PracticeGameContainer.tsx
│   └── PracticeAudioControls.tsx
├── games/
│   ├── ChooseRightWordGame.tsx
│   ├── MakeUpWordGame.tsx
│   ├── RememberTranslationGame.tsx
│   ├── WriteByDefinitionGame.tsx
│   └── WriteBySound Game.tsx
├── hooks/
│   ├── useGameState.ts
│   ├── useWordCardState.ts
│   ├── usePracticeAudio.ts
│   └── useGameSettings.ts
└── EnhancedPracticeContent.tsx
```

### Component Hierarchy

```
EnhancedPracticeContent
├── UniversalProgressIndicator
├── PracticeGameContainer
│   ├── [Specific Game Component]
│   └── PracticeAudioControls
├── WordCard
│   ├── PracticeAudioControls
│   └── Next Button
└── PracticeSettings
```

## State Management Strategy

### Central State Hook

```typescript
interface EnhancedPracticeState {
  session: EnhancedPracticeSession | null;
  currentPhase: 'game' | 'word-card' | 'summary';
  gameState: GameSpecificState;
  wordCardState: WordCardState;
  audioState: AudioState;
  progressState: ProgressState;
}
```

### Game-Specific State Interfaces

Each practice type will have its own state interface while sharing common patterns through the universal state system.

## Accessibility & Performance

### Accessibility Features

- Full keyboard navigation for all games
- Screen reader support with descriptive labels
- High contrast mode compatibility
- Focus management across components
- Audio controls with keyboard shortcuts

### Performance Optimizations

- Component memoization for game components
- Audio preloading and caching
- Image lazy loading with proper fallbacks
- Virtual scrolling for large option lists
- Debounced input validation

## Testing Strategy

### Component Testing (Co-located)

- Individual game component tests
- WordCard interaction testing
- Audio integration testing
- State management hook testing

### Integration Testing (Server-side)

- Complete practice session workflows
- Database session management
- Audio file serving and management
- Learning analytics accuracy

## Migration Strategy

### Phase 1: Universal Components

1. Create WordCard component
2. Implement UniversalProgressIndicator
3. Build enhanced state management hooks
4. Update existing typing practice to use new components

### Phase 2: Game Implementation

1. Choose the Right Word game (simplest)
2. Do You Remember the Translation game
3. Make Up the Word game
4. Write by Definition/Sound games (most complex)

### Phase 3: Integration & Polish

1. Enhanced audio integration
2. Difficulty evaluation system
3. Comprehensive testing
4. Performance optimization

## Success Metrics

### User Experience Metrics

- Session completion rates across practice types
- User engagement time per practice type
- Preferred practice type adoption rates
- Learning effectiveness per practice type

### Technical Metrics

- Component render performance (<16ms)
- Audio loading times (<1s)
- Error rates across games
- Memory usage optimization

This design provides a comprehensive foundation for implementing the enhanced practice system while maintaining the app's architectural excellence and user experience standards.
