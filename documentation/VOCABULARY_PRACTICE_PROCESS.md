# Vocabulary Practice Process - Step-by-Step Guide

## Overview

This document describes the complete flow of the Vocabulary Practice system, from initiation to completion. It's structured as a questionnaire format to allow easy identification of what works correctly and what needs modification.

---

## 1. System Initialization

### Current Process:

**Q: How does the system start when a user clicks "Vocabulary Practice"?**

**A: Current Implementation:**

1. User navigates to `/dashboard/practice/enhanced`
2. `EnhancedPracticePageContent` component loads
3. System loads user settings via `useVocabularyPracticeSettings()` hook
4. Settings are retrieved from Redux store (`selectVocabularyPracticeSettings`)
5. Default settings if no custom settings exist:
   - `autoPlayAudioOnWordCard: true`
   - `showDefinitionImages: true`
   - `showPhoneticPronunciation: true`
   - `showPartOfSpeech: true`
   - `wordsCount: 10`
   - `difficultyLevel: 3`

**✅ What Works:** Settings loading, Redux integration
**❌ What Needs Fixing:** None identified - this part works correctly

### What I Want to Change:

- [ ] _(Add any desired changes to initialization here)_

---

## 2. Word Selection Process

### Current Process:

**Q: How does the system choose which words to practice?**

**A: Current Implementation:**

1. System calls `createUnifiedPracticeSession()` or `createEnhancedPracticeSession()`
2. Parameters used for word selection:
   - `userId`: Current user ID
   - `userListId`: If practicing from a specific user list (optional)
   - `listId`: If practicing from a public list (optional)
   - `difficultyLevel`: From settings (1-5 scale)
   - `wordsCount`: From settings (default: 10)
   - `targetLanguageCode`: Currently hardcoded to 'da' (Danish)

3. **Word Selection Algorithm:**
   - If `userListId` or `listId` specified: Select from that specific list
   - Otherwise: Select from user's entire dictionary
   - Prioritizes words with status: `notStarted`, `inProgress`, `difficult`
   - Uses SRS (Spaced Repetition System) to prioritize review-due words
   - Applies difficulty filtering based on user's difficulty level setting

**✅ What Works:** List-specific selection, SRS integration
**❌ What Needs Fixing:** Limited language support (hardcoded Danish)

### What I Want to Change:

- [ ] Add support for multiple target languages
- [ ] _(Add other desired changes to word selection)_

---

## 3. Practice Type Decision

### Current Process:

**Q: How does the system decide what type of practice exercise to show next?**

**A: Current Implementation:**

1. **Unified Practice System** (`practiceType: 'unified-practice'`):
   - Extracts enabled exercise types from settings:
     - `enableRememberTranslation` → 'remember-translation'
     - `enableChooseRightWord` → 'choose-right-word'
     - `enableMakeUpWord` → 'make-up-word'
     - `enableWriteByDefinition` → 'write-by-definition'
     - `enableWriteBySound` → 'write-by-sound'

2. **Exercise Type Selection Logic:**
   - System uses `determineExerciseType()` function
   - Considers user's performance history with specific words
   - Applies difficulty progression (easier → harder exercises)
   - Fallback to first enabled exercise type if specific logic fails

3. **Current Default Flow:**
   - All exercise types enabled by default
   - System automatically selects based on word familiarity and user performance

**✅ What Works:** Multiple exercise types, settings-based enabling/disabling
**❌ What Needs Fixing:** Exercise selection algorithm needs refinement

### What I Want to Change:

- [ ] Improve intelligent exercise type selection based on learning progress
- [ ] Add user preference learning (system learns what exercises user prefers)
- [ ] _(Add other desired changes to practice type decision)_

---

## 4. Word Card Display Phase

### Current Process:

**Q: What happens when a word card is shown to the user?**

**A: Current Implementation:**

1. **Word Card Components:**
   - `PracticeWordCardRenderer` → `WordCard` component
   - Settings applied conditionally:
     - Images: Only shown if `settings.showDefinitionImages = true` AND image data exists
     - Audio: Always included if `audioUrl` exists
     - Phonetic: Only if `settings.showPhoneticPronunciation = true` AND phonetic data exists
     - Part of Speech: Only if `settings.showPartOfSpeech = true` AND data exists

2. **Audio Functionality:**
   - Auto-play: Controlled by `settings.autoPlayAudioOnWordCard`
   - Manual play: Audio button available if `audioUrl` exists
   - Audio Service: Uses `AudioService.playAudioFromDatabase()`
   - Proxy support: External URLs (like ordnet.dk) use `/api/audio/proxy`

3. **Image Display:**
   - Uses `AuthenticatedImage` component for secure image loading
   - Supports both `imageId` (database images via `/api/images/{id}`) and `imageUrl`
   - AspectRatio component maintains 16:9 ratio

**✅ What Works:** Component structure, settings integration
**❌ What Needs Fixing:**

- Images may not display due to conditional rendering issues
- Audio button may not appear due to conditional logic
- Settings may not be properly initialized

### What I Want to Change:

- [x] **FIXED** - Ensure images display when settings enable them and data exists
- [x] **FIXED** - Ensure audio button always appears when audio URL exists
- [ ] Add image loading states and error handling
- [ ] _(Add other desired changes to word card display)_

---

## 5. Exercise Execution

### Current Process:

**Q: How do the actual practice exercises work?**

**A: Current Implementation:**

1. **Game Rendering:**
   - `PracticeGameRenderer` component handles exercise display
   - Different components for each exercise type:
     - Remember Translation: Simple recognition exercise
     - Choose Right Word: Multiple choice selection
     - Make Up Word: Character assembly game
     - Write by Definition: Typing exercise
     - Write by Sound: Audio-based typing

2. **User Input Processing:**
   - Each game has its own input validation logic
   - Answer checking varies by exercise type
   - Progress tracking per attempt
   - Mistake counting and analysis

3. **Audio Integration:**
   - Game-start audio: Controlled by `settings.autoPlayAudioOnGameStart`
   - Game sounds: Controlled by `settings.enableGameSounds`
   - Volume: Controlled by `settings.gameSoundVolume`

**✅ What Works:** Multiple exercise types, audio integration
**❌ What Needs Fixing:** Input validation consistency, progress tracking

### What I Want to Change:

- [ ] Standardize input validation across all exercise types
- [ ] Improve feedback mechanisms
- [ ] _(Add other desired changes to exercise execution)_

---

## 6. Progress Tracking & Session Management

### Current Process:

**Q: How does the system track learning progress during a session?**

**A: Current Implementation:**

1. **Session State Management:**
   - `usePracticeGameState` hook manages session flow
   - Tracks: `currentPhase`, `currentWordIndex`, `sessionProgress`
   - Phases: `'word-card'`, `'game'`, `'summary'`

2. **Progress Tracking:**
   - `sessionProgress.correctAnswers`
   - `sessionProgress.incorrectAnswers`
   - `sessionProgress.currentScore`
   - `sessionProgress.timeStarted`

3. **Word Completion Logic:**
   - `handleWordComplete()` function called after each exercise
   - Updates learning status in user dictionary
   - Advances to next word or shows summary

**✅ What Works:** Session state management, basic progress tracking
**❌ What Needs Fixing:** Progress persistence, detailed analytics

### What I Want to Change:

- [ ] Improve progress persistence between sessions
- [ ] Add detailed performance analytics
- [ ] _(Add other desired changes to progress tracking)_

---

## 7. Settings & Customization

### Current Process:

**Q: How do user settings affect the practice experience?**

**A: Current Implementation:**

1. **Settings Categories:**
   - **Display Settings:**
     - `showProgressBar`: Controls progress indicator visibility
     - `showDefinitionImages`: Controls image display in word cards
     - `showPhoneticPronunciation`: Controls phonetic notation display
     - `showPartOfSpeech`: Controls part of speech badge display

   - **Audio Settings:**
     - `autoPlayAudioOnWordCard`: Auto-play when word card appears
     - `autoPlayAudioOnGameStart`: Auto-play when exercise starts
     - `enableGameSounds`: Game effect sounds
     - `gameSoundVolume`: Volume control (0-1 scale)

   - **Behavior Settings:**
     - `pauseOnIncorrectAnswer`: Pause session on wrong answers
     - `showCorrectAnswerOnMistake`: Show correct answer when user is wrong
     - `allowSkipDifficultWords`: Allow skipping difficult words

2. **Settings Application:**
   - Settings loaded via Redux (`useVocabularyPracticeSettings`)
   - Applied in real-time during practice session
   - Persist across browser sessions

**✅ What Works:** Settings persistence, real-time application
**❌ What Needs Fixing:** Some settings may not apply correctly

### What I Want to Change:

- [x] **FIXED** - Ensure all display settings work correctly
- [ ] Add more granular audio controls
- [ ] _(Add other desired changes to settings)_

---

## 8. Session Completion

### Current Process:

**Q: What happens when a practice session ends?**

**A: Current Implementation:**

1. **Session Summary:**
   - `PracticeSessionSummary` component displays results
   - Shows: correct/incorrect answers, time spent, overall performance
   - Achievement detection (if applicable)

2. **Progress Updates:**
   - User dictionary updated with new learning statuses
   - SRS intervals updated based on performance
   - Mistake tracking updated

3. **Navigation:**
   - User can return to practice overview
   - Option to start new session with same settings

**✅ What Works:** Summary display, navigation
**❌ What Needs Fixing:** Progress update reliability

### What I Want to Change:

- [ ] Add more detailed session analytics
- [ ] Improve progress update reliability
- [ ] _(Add other desired changes to session completion)_

---

## Current Issues Identified

### 🚨 Major Issues:

1. **WordCard Display Problems:**
   - ❌ Images not displaying (conditional rendering issue)
   - ❌ Audio button not appearing (conditional logic problem)
   - ❌ Auto-sound not working (settings application issue)

### 🔧 Recently Fixed:

- ✅ Fixed conditional rendering in `PracticeWordCardRenderer`
- ✅ Added debug logging to identify data flow issues
- ✅ Improved settings application logic

### 🎯 Debug Information Available:

When running vocabulary practice, check browser console for:

- `🔧 Vocabulary Practice Settings Debug:` - Shows current settings values
- `🎯 Practice Session Creation Debug:` - Shows session creation parameters
- `📋 Practice Session Result:` - Shows session data and first word info
- `🃏 WordCard Debug - Current Word:` - Shows word data being processed
- `🃏 WordCard Debug - Settings:` - Shows settings being applied
- `🎯 WordCard Final Props:` - Shows final props passed to WordCard

---

## Action Items

### Immediate Fixes Needed:

1. **Test the Current Fixes:**
   - Navigate to vocabulary practice
   - Check if images display correctly
   - Verify audio button appears and works
   - Test auto-play functionality

2. **If Issues Persist:**
   - Check console logs for debug information
   - Identify which data is missing (audio URLs, image IDs, etc.)
   - Verify settings are being loaded correctly

3. **Settings Verification:**
   - Go to practice settings dialog
   - Ensure all toggles are enabled for testing
   - Save settings and retry practice

### Long-term Improvements:

- [ ] Implement intelligent exercise progression algorithm
- [ ] Add performance analytics dashboard
- [ ] Improve mobile experience
- [ ] Add offline practice capabilities

---

## Questions for Review

**Please review each section and mark:**

1. **What currently works correctly?** ✅
2. **What needs immediate fixing?** ❌
3. **What would you like to change or improve?** 📝

Use this document to track progress and communicate exactly what needs to be modified in the vocabulary practice system.
