# Core Folder Documentation - Essential Reference

## Structure Overview

```
src/core/
├── domains/               # Business Logic by Domain
│   ├── auth/             # Authentication domain
│   ├── dictionary/       # Dictionary & word management
│   ├── translation/      # Translation services
│   └── user/             # User management
├── shared/               # Shared Infrastructure
│   ├── database/         # Database operations
│   ├── services/         # External services
│   ├── utils/            # Common utilities
│   ├── types/            # Shared types
│   └── hooks/            # Shared hooks
├── infrastructure/       # Technical Infrastructure
│   ├── auth/             # Auth configuration
│   ├── monitoring/       # Logging & monitoring
│   └── storage/          # Storage management
├── state/                # State Management
│   ├── slices/           # Redux slices
│   ├── features/         # Feature state
│   └── store.ts          # Store configuration
└── lib/ (legacy)         # Legacy - Maintained for compatibility
```

## Critical Redux-Persist Considerations

### **IMPORTANT: Redux Store Location**

⚠️ **The active Redux store uses slices from `src/core/lib/redux/features/`**, not `src/core/state/features/`.

**Problem**: When updating Redux actions, developers might modify the wrong auth slice location.

**Solution Pattern**:

```typescript
// ❌ Wrong import - creates actions that don't work with the actual store
import { updateUserProfile } from '@/core/state/features/authSlice';

// ✅ Correct import - uses the actual store configuration
import { updateUserProfile } from '@/core/lib/redux/features/authSlice';
```

### **Redux-Persist and Server Actions Integration**

When server actions update user data, Redux state must be synchronized for UI components to reflect changes immediately.

**Pattern for Profile Updates**:

1. **Server Action**: Updates database and returns changed fields
2. **Custom Hook**: Automatically dispatches Redux action with updated data
3. **Redux-Persist**: Automatically saves to localStorage
4. **UI Update**: Components re-render with new data

**Example Implementation**:

```typescript
// Custom hook that syncs server action with Redux
export function useUserProfileUpdate() {
  const dispatch = useDispatch();
  const [state, formAction, isPending] = useActionState(
    updateUserProfile,
    initialState,
  );

  useEffect(() => {
    if (state.success && state.updatedUser) {
      // This automatically triggers redux-persist to save to localStorage
      dispatch(updateReduxUserProfile(state.updatedUser));
    }
  }, [state.success, state.updatedUser, dispatch]);

  return { state, formAction, isPending };
}
```

**Key Points**:

- Redux-persist automatically handles localStorage persistence when state changes
- No need to manually call `persistor.flush()` or localStorage methods
- Custom hooks prevent infinite re-render loops by managing dependencies properly
- Server action responses should include updated fields for Redux sync

**Debugging Redux-Persist Issues**:

```javascript
// Check localStorage for persisted state
console.log('Persisted state:', localStorage.getItem('persist:root'));

// Verify correct store slice is being used
console.log('Store auth slice:', store.getState().auth);
```

## Import Patterns

```typescript
// Recommended domain imports
import { getWordDetails, updateWordDetails } from '@/core/domains/dictionary';
import { authenticateUser } from '@/core/domains/auth';
import { getUserStats } from '@/core/domains/user';

// Shared infrastructure
import { handlePrismaError } from '@/core/shared/database';
import { serverLog } from '@/core/infrastructure/monitoring';

// State management - CRITICAL: Use correct store location
import { useAppDispatch, store } from '@/core/lib/redux/store'; // ✅ Correct
import { updateUserProfile } from '@/core/lib/redux/features/authSlice'; // ✅ Correct
import { selectUser } from '@/core/lib/redux/features/authSlice'; // ✅ Correct

// Custom hooks for server action + Redux sync
import { useUserProfileUpdate } from '@/core/shared/hooks/useUserProfileUpdate';

// Legacy imports (still work)
import { getWordDetails } from '@/core/lib/actions/dictionaryActions';
```

## Dictionary Domain (`domains/dictionary/`)

### Word CRUD Operations (`actions/word-crud-actions.ts`)

- `fetchDictionaryWords(targetLanguageId)`
- `fetchDictionaryWordDetails(targetLanguageId)`
- `addWordToUserDictionary(userId, mainDictionaryId, baseLanguageId, targetLanguageId)`
- `getWordDetails(wordText, languageCode)`
- `fetchWordById(wordId)`
- `checkWordExistsByUuid(id, uuid)`
- `deleteWordDetails(wordDetailIds)` - Delete word details with comprehensive cleanup
- `deleteWords(wordIds)` - Delete entire words with comprehensive cleanup
- `deleteSelectedWords(wordDetailIds)` - Server action for bulk word deletion

### Word Details & Complex Operations (`actions/word-details-actions.ts`)

- `updateWordDetails(wordId, updateData)`
- `processAndSaveWord(apiResponse)`
- `processAllWords(apiResponses)`
- `processOneWord(word)`

### Word Updates (`actions/word-update-actions.ts`)

- `updateWord(wordId, data)`
- `updateDefinition(definitionId, data)`
- `updateExample(exampleId, data)`

### Audio Management (`actions/audio-actions.ts`)

- `createAudioForExample(exampleId, data)`
- `createAudioForWord(wordId, data)`
- `createAudioForDefinition(definitionId, data)`
- `updateAudio(audioId, data)`

### Audio Playback Service (`services/audio-service.ts`)

- `AudioService.playAudioFromDatabase(audioUrl)` - Play audio files directly from database URLs
- `AudioService.playAudioWithFallback(audioUrl?, text, language)` - Play database audio with Web Speech API fallback
- `AudioService.playTextToSpeech(text, language)` - Web Speech API text-to-speech playback
- `AudioService.stopCurrentAudio()` - Stop any currently playing audio
- `AudioService.isPlaying()` - Check if audio is currently playing

**Key Features:**

- **Database Audio Priority**: Uses real audio files from database when available
- **Intelligent Fallback**: Automatically falls back to Web Speech API if database audio fails
- **Audio Management**: Prevents multiple audio files playing simultaneously
- **Language Support**: Supports both Danish (da-DK) and English (en-US) pronunciation
- **Error Handling**: Graceful error handling with fallback mechanisms

### Frequency Utilities (`actions/frequency-actions.ts`)

- `mapWordFrequency(wordPosition)`
- `mapFrequencyPartOfSpeech(positionInPartOfSpeech)`
- `importFrequencyJson()` - Server action for frequency import

### Text-to-Speech Operations (`actions/tts-actions.ts`)

- `generateWordTTS(wordId, languageCode, options?)` - Generate speech for a word with quality control and blob storage
- `generateDefinitionTTS(definitionId, languageCode, options?)` - Generate speech for definitions (standard quality, blob storage)
- `generateExampleTTS(exampleId, languageCode, options?)` - Generate speech for examples (standard quality, blob storage)
- `generateBatchWordTTS(wordIds, languageCode, options?)` - Batch TTS generation with rate limiting, word validation, and blob storage
- `deleteWordAudio(wordId)` - Delete audio file from blob storage and database
- `getTTSUsageStats()` - Get current usage statistics and costs
- `resetTTSUsageStats()` - Reset usage statistics (admin only)
- `getTTSQualityLevels()` - Get available quality levels and pricing
- `validateWordIdsExist(wordIds)` - Validate word IDs exist in database before processing
- `getAvailableVoiceGenders(languageCode)` - Get available voice genders for a specific language
- `getDefaultVoiceGender(languageCode)` - Get the default voice gender for a specific language
- `cleanupOrphanedAudio()` - Admin utility for blob storage cleanup

Types: `GenerateTTSResult`, `TTSBatchResult`

**Key Features:**

- **Word Validation**: All batch operations now validate word IDs exist before processing
- **ID Mapping**: UI properly converts WordDetails IDs to Word IDs for TTS processing
- **Language-Aware Voice Selection**: Automatically selects appropriate voice genders based on language support
  - **English (en)**: Supports both MALE and FEMALE voices
  - **Danish (da)**: Only supports FEMALE voices (Google Cloud limitation)
  - **Spanish, French, German, Russian**: Support both MALE and FEMALE voices
- **Smart Gender Fallback**: If requested gender isn't available, automatically uses the first available gender
- **Error Handling**: Invalid word IDs are filtered out and reported separately
- **Rate Limiting**: Respects Google Cloud TTS API limits with batching and delays
- **Cost Optimization**: Uses different quality levels for words vs definitions/examples
- **Blob Storage**: Organized folder structure for audio files in Vercel Blob

### Image Operations (`actions/image-actions.ts`)

- `generateWordImages(wordId, options?)` - Generate images for a word's definitions using Pexels API
- `generateBatchWordImages(wordIds, options?)` - Batch image generation with rate limiting and word validation
- `deleteWordImages(wordId)` - Delete all images for a word's definitions
- `getImageStats()` - Get image statistics for admin dashboard

Types: `GenerateImageResult`, `ImageBatchResult`

### User List Operations (`actions/user-list-actions.ts`)

- `getUserLists(userId, filters?)` - Get user's personal lists with full details and filtering options
- `getAvailablePublicLists(userId, userLanguages, filters?)` - Get public lists available for user collection
- `addListToUserCollection(userId, listId, userLanguages)` - Add public list to user's collection
- `removeListFromUserCollection(userId, userListId)` - Remove list from user's collection
- `createCustomUserList(userId, data)` - Create custom user-defined list
- `updateUserList(userId, userListId, data)` - Update user list customizations
- `addWordToUserList(userId, userListId, userDictionaryId)` - Add word from dictionary to list
- `removeWordFromUserList(userId, userListId, userDictionaryId)` - Remove word from list
- `getUserListWords(userId, userListId, options?)` - Get words in list with full details
- `reorderUserListWords(userId, userListId, wordOrderUpdates)` - Update word order in list

Types: `UserListWithDetails`, `PublicListSummary`, `UserListWordWithDetails`, `UserListFilters`

**Key Features:**

- **Composite Key Support**: Properly handles UserListWord composite primary key (userListId, userDictionaryId)
- **List Type Management**: Supports both inherited public lists and custom user-created lists
- **Advanced Filtering**: Search, difficulty, language, custom/inherited list filtering
- **Translation Integration**: Displays definitions in user's native language when available
- **Image Support**: Includes image associations through Definition model
- **Proper Type Safety**: Corrected TypeScript types for all database operations
- **Schema Compliance**: Fixed invalid property references and relationship includes

**Key Features:**

- **Word Validation**: All batch operations validate word IDs exist before processing
- **Definition-Based**: Images are generated for word definitions, not just words
- **Language-Aware Processing**:
  - **English words**: Uses definitions directly for Pexels image search
  - **Non-English words (Danish, etc.)**: Uses English translations of definitions for better search results
  - This ensures optimal image quality and relevance across all languages
- **Pexels Integration**: Uses Pexels API for high-quality, relevant images
- **Smart Search**: Uses word text and definition content for better image matching
- **Overwrite Control**: Option to replace existing images or skip words with images
- **Rate Limiting**: Respects Pexels API limits with conservative concurrent requests
- **Error Handling**: Invalid word IDs are filtered out and reported separately
- **Statistics**: Provides comprehensive stats for admin monitoring

### Grammatical Form Handling

**Feature Overview**:

- Skips image generation for grammatical form definitions (e.g., "Past participle of", "Past tense of {it}${baseWord}{/it}")
- Applies to both English (Merriam-Webster) and Danish (Ordnet) dictionary processing
- Improves performance by avoiding unnecessary image generation

**Implementation Details**:

- Added `isGrammaticalFormDefinition` method to detect grammatical forms using regex patterns
- Added `getGrammaticalFormType` helper method to categorize grammatical forms
- Modified `getOrCreateDefinitionImage` and `getOrCreateTranslatedDefinitionImage` to skip image generation for grammatical forms

**Patterns Detected**:

- **English**: Past tense, past participle, present participle, third person singular, plural forms, spelling variants
- **Danish**: Present tense (nutid), past tense (datid), past participle (førnutid), imperative (bydeform), definite forms, comparative/superlative forms

**Testing**:

- Comprehensive test cases in `imageService-grammatical-forms.test.ts`
- Detailed documentation in `imageService-grammatical-forms-summary.md`

### List Management (`actions/list-actions.ts`)

- `fetchCategories()` - Fetch all categories for list creation
- `createListWithWords(listData)` - Create a new list with selected words
- `createCategory(name, description?)` - Create a new category
- `createListAction(prevState, formData)` - Server action for list creation with redirect
- `addWordsToList(listId, definitionIds)` - Add words to existing list

### User List Word Management (`actions/user-list-actions.ts`)

- `addWordToUserList(userId, userListId, userDictionaryId)` - Add a word from user's dictionary to a specific list
- `removeWordFromUserList(userId, userListId, userDictionaryId)` - Remove a word from a user's list (does not delete from dictionary)
- `getUserListBasicInfo(userId, userListId)` - Get basic information about a user list including word counts and learning progress

### Advanced List Management (`actions/list-management-actions.ts`)

- `fetchAllLists(filters?)` - Comprehensive list fetching with filtering, search, and pagination
- `getListDetails(listId)` - Get detailed information about a single list
- `updateList(listId, data)` - Update list information
- `deleteList(listId)` - Soft delete a list
- `restoreList(listId)` - Restore a deleted list
- `updateListAction(listId, prevState, formData)` - Server action for list updates with redirect

Types: `ListWithDetails`, `ListFilters`, `ListsResponse`

### Word Search with Translation Support (`actions/word-search-actions.ts`)

- `searchWords(searchQuery, languageCode, userId?, page?, pageSize?)` - Basic word search with translations included
- `searchWordsForUser(searchQuery, languageCode, userId, userNativeLanguage, page?, pageSize?)` - User-specific search that applies translation logic based on user's native language
- `addDefinitionToUserDictionary(userId, definitionId, baseLanguageCode, targetLanguageCode)` - Add definition to user's dictionary
- `removeDefinitionFromUserDictionary(userId, userDictionaryId)` - Remove definition from user's dictionary

**Translation Features:**

- **Native Language Support**: Automatically shows translations in user's native language when available
- **Fallback Logic**: Falls back to original definitions when translations aren't available
- **Enhanced Search Results**: Includes translation data in search results for user-specific display
- **Language-Aware Display**: Prioritizes user's native language for better learning experience

Types: `WordSearchResult`, `WordDefinitionResult` (enhanced with translation fields)

### Translation Utilities (`utils/translation-utils.ts`)

- `getBestDefinitionForUser(originalDefinition, originalLanguageCode, translations, userNativeLanguage)` - Get the best definition/translation to display based on user's native language
- `getBestExampleForUser(originalExample, originalLanguageCode, translations, userNativeLanguage)` - Get the best example translation to display
- `shouldUseTranslations(userNativeLanguage, contentLanguage)` - Check if translations should be used for this user's language configuration

**Translation Logic:**

- **Priority System**: Native language translation > Original definition
- **Language Matching**: Automatically detects when user's native language matches content language
- **Flexible Display**: Returns both translated content and original for reference
- **Type Safety**: Comprehensive TypeScript interfaces for translation data

Types: `TranslationData`, `DefinitionDisplayData`

## Auth Domain (`domains/auth/`)

### Actions

- `authenticate(prevState, formData)` - User login
- `signUp(prevState, formData)` - User registration
- `checkRole(allowedRoles)` - Role verification

### Types

- `StateAuth`, `StateSignup` - Form state types

## User Domain (`domains/user/`)

### User Settings Actions (`actions/user-settings-actions.ts`)

- `updateUserProfile(prevState, formData)` - Update user profile information (name, email, languages, profile picture)
- `updateUserLearningSettings(prevState, formData)` - Update learning preferences (goals, notifications, session settings)
- `updateAppSettings(prevState, formData)` - Update application settings (theme, language, notifications)
- `getUserSettings()` - Get user's complete settings
- `deleteUserAccount(prevState, formData)` - Soft delete user account

**Settings Management Features:**

- **Profile Management**: Name, email, profile picture upload with Vercel Blob storage
- **Language Configuration**: Base and target language selection from 12 supported languages
- **Learning Preferences**: Daily goals (1-100 words), difficulty levels (1-5), session duration (5-120 min)
- **Audio & Sound**: Sound effects, auto-play audio, audio quality preferences
- **Notifications**: Learning reminders, progress notifications, review intervals (1-30 days)
- **Theme & Appearance**: Light/dark/system theme, interface language
- **Privacy Controls**: Account deletion with confirmation, data export (planned)

### Session Management Actions

- `createLearningSession(userId, data)`
- `updateLearningSession(sessionId, data)`
- `addSessionItem(sessionId, data)`
- `getSessionStats(userId)`
- `getSessionHistory(userId, page, pageSize, filters?)`
- `getCurrentSession(userId)`

### User Statistics

- `calculateUserStats(user)`
- `calculateLearningProgress(user)`

### Settings Types (`types/user-settings.ts`)

- `CompleteUserSettings` - Combined user and settings interface
- `UserProfileUpdateData`, `LearningSettingsUpdateData`, `AppSettingsUpdateData` - Update data types
- `LanguageOption`, `DifficultyOption`, `ThemeOption` - UI option types
- `NotificationSettings`, `LearningReminderSettings` - Detailed settings structures
- `UserLearningPreferences` - Learning style and preference types

### Settings Constants (`utils/settings-constants.ts`)

- `LANGUAGE_OPTIONS` - 12 supported languages with flags and native names
- `DIFFICULTY_OPTIONS` - 5 difficulty levels with descriptions
- `SESSION_DURATION_OPTIONS` - Session duration choices (5 min - 2 hours)
- `REVIEW_INTERVAL_OPTIONS` - Review frequency options (daily to monthly)
- `THEME_OPTIONS` - Theme choices with descriptions
- `DEFAULT_USER_SETTINGS` - Default values for new users
- Helper functions: `getLanguageByCode()`, `getDifficultyByValue()`, etc.

### User Statistics Actions (`actions/user-stats-actions.ts`)

- `getUserStatistics(userId)` - Get comprehensive user statistics including learning progress, session analytics, mistake analysis, achievements, daily progress, and language proficiency
- `getLearningAnalytics(userId, days?)` - Get detailed learning analytics for charts and analysis including daily progress, mistake patterns, learning behaviors, and vocabulary growth
- `calculateStreak(userId)` - Calculate current and longest learning streaks
- `calculateImprovementRate(sessions)` - Calculate improvement rate based on recent performance
- `calculateGoalAchievementRate(sessions, dailyGoal)` - Calculate goal achievement percentage
- `estimateProficiencyLevel(vocabularySize, averageMasteryScore)` - Estimate user's language proficiency level

**Statistics Features:**

- **Learning Progress**: Total vocabulary, words learned/in-progress/needing review, mastery scores, learning streaks
- **Session Analytics**: Total sessions, study time, accuracy rates, performance trends, activity patterns
- **Mistake Analysis**: Error tracking, improvement rates, difficult words identification, mistake type distribution
- **Achievement System**: Points, badges, recent achievements, gamification elements
- **Daily Goals**: Progress tracking, goal achievement rates, weekly/monthly summaries
- **Language Proficiency**: Estimated level based on vocabulary size and performance metrics
- **Visual Analytics**: Charts for progress tracking, vocabulary growth, weekly activity distribution

Types: `UserStatistics`, `LearningAnalytics`, `ProficiencyLevel`

### User Dictionary Actions (`actions/user-dictionary-actions.ts`)

- `getUserDictionary(userId, filters?)` - Get user's dictionary words with comprehensive filtering, sorting, search, and pagination
- `updateWordLearningStatus(userId, userDictionaryId, learningStatus, additionalData?)` - Update learning status for a word in user's dictionary
- `toggleWordFavorite(userId, userDictionaryId)` - Add/remove word from favorites
- `updateUserWordCustomData(userId, userDictionaryId, customData)` - Update user's custom word data (notes, tags, custom definitions)
- `removeWordFromUserDictionary(userId, userDictionaryId)` - Remove word from user's dictionary (soft delete)
- `getUserDictionaryStats(userId)` - Get user dictionary statistics and status breakdown

**Dictionary Management Features:**

- **Comprehensive Filtering**: Learning status, part of speech, difficulty level, favorites, modified words, review status
- **Advanced Search**: Search across words, definitions, custom notes, and translations
- **Flexible Sorting**: Sort by word, progress, mastery score, last reviewed date, creation date
- **Pagination**: Efficient pagination with configurable page sizes
- **Learning Progress**: Track learning status, progress percentage, mastery scores, review counts
- **Customization**: Custom definitions, notes, tags, difficulty levels, phonetic transcriptions
- **Favorites System**: Mark important words for quick access
- **Review Management**: SRS-based review scheduling and tracking

Types: `UserDictionaryItem`, `UserDictionaryFilters`, `UserDictionaryResponse`

### Dictionary Display Utilities (`utils/dictionary-display-utils.ts`)

- `getDisplayDefinition(word, userNativeLanguage)` - Get the best definition to display for a user based on their native language
- `shouldShowTranslations(userNativeLanguage, targetLanguageCode)` - Check if a user should see translations based on their language settings

**Display Logic:**

- **Translation-Aware Display**: Automatically shows translations when user's native language differs from target language
- **Fallback Support**: Returns original definition when translations aren't available
- **Flexible Interface**: Works with any word object that has definition and translations
- **User Experience**: Improves comprehension by showing definitions in user's native language

Types: `WordWithTranslations`

### Practice Actions (`actions/practice-actions.ts`)

- `createTypingPracticeSession(request)` - Create a new typing practice session with intelligent word selection
- `validateTypingInput({sessionId, userDictionaryId, userInput, responseTime})` - Validate user typing input with accuracy calculation and learning progress updates
- `completePracticeSession(sessionId)` - Complete practice session with achievements detection and summary generation
- `getPracticeSessionProgress(sessionId)` - Get live practice session progress and statistics

Types: `CreatePracticeSessionRequest`, `PracticeWord`, `DifficultyConfig`, `TypingValidationResult`, `PracticeSessionSummary`

**Practice System Features:**

- **Intelligent Word Selection**: Prioritizes words needing review based on learning status (notStarted, inProgress, difficult) and time since last review
- **Adaptive Difficulty**: 5 difficulty levels affecting session parameters (word count, time limits, typo tolerance)
- **Real-Time Validation**: Character-by-character accuracy calculation with configurable typo tolerance
- **Spaced Repetition Integration**: Updates SRS intervals and next review dates based on performance
- **Achievement System**: Automatic detection of achievements (Perfect Score, Excellence, Quick Learner, Speed Demon)
- **Progress Tracking**: Updates learning status, mastery scores, and review counts in user dictionary
- **Performance Analytics**: Tracks response times, accuracy, and learning patterns
- **Session Management**: Complete lifecycle from creation to completion with detailed summaries

### Learning Metrics Configuration (`utils/learning-metrics.ts`)

- `LearningMetricsCalculator` - Class with methods for accuracy calculation, mastery scoring, learning status determination, and typing validation
- `LEARNING_METRICS` - Core learning thresholds (min correct attempts: 3, accuracy threshold: 80%, mastery score: 85%)
- `PRACTICE_SESSION_CONFIG` - Session parameters per difficulty level (words per session: 10, time limit: 30s)
- `TYPING_PRACTICE_METRICS` - Typing-specific metrics (typo tolerance: 10%, speed thresholds, partial credit system)
- `DIFFICULTY_ADJUSTMENT` - 5 difficulty levels with adaptive triggers for progression

**Key Algorithms:**

- **Character-Level Accuracy**: Precise typing validation with character-by-character comparison
- **Spaced Repetition**: Calculates next review dates based on performance and current SRS level
- **Mastery Scoring**: Complex scoring system considering accuracy, speed, and difficulty
- **Adaptive Difficulty**: Automatic difficulty adjustment based on sustained performance
- **Learning Status Progression**: Smart progression from notStarted → inProgress → learned based on multiple success criteria

### Legacy User Actions

- `getUsers(page, limit, searchQuery?, sortBy?, sortOrder?)`
- `getUserDetails(userId)`
- `getUserByEmail(email)`
- `updateUserStatus(userId, status)`
- `deleteUser(userId)`

### Types

- `UserWithStats`, `UserWithStatsAndMeta`, `UserStats`
- `UserLearningSession`, `UserSessionItem`
- `SessionState`, `SessionStatsResponse`
- `CreateSessionRequest`, `UpdateSessionRequest`

## Translation Domain (`domains/translation/`)

### Translation Processing

- `processTranslationsForWord(mainWordId, mainWordText, wordData)`
- `processEnglishTranslationsForDanishWord(danishWordData, variantData, tx)`

## Shared Services (`shared/services/`)

### External Services

- `frequencyService.ts` - Word frequency analysis
- `FrequencyManager.ts` - Frequency data caching (prevents duplicate API calls)
- `imageService.ts` - Image generation and management
- `pexelsService.ts` - Pexels API integration
- `translationService.ts` - Translation service integration
- `textToSpeechService.ts` - Google Cloud Text-to-Speech with cost optimization
- `blobStorageService.ts` - Vercel Blob storage for audio files with organized folder structure

### WordService

- `WordService.upsertWord(tx, source, wordText, languageCode, options)`
- `WordService.upsertWordDetails(..., config, gender?, forms?)`
- `WordService.upsertWordDetailsDanish(...)` - For Danish API
- `WordService.upsertWordDetailsMerriam(...)` - For Merriam API

### FrequencyManager Methods

- `getFrequencyData(word, languageCode, partOfSpeech?)`
- `clearCache()`
- `getCacheSize()`

## Shared Database (`shared/database/`)

### Database Client (`client.ts`)

- Database client configuration

### Error Handling (`error-handler.ts`)

- `handlePrismaError(error)` - Standardized Prisma error handling
- `ErrorResponse` - Error response interface

### Middleware (`middleware/`)

- `performanceMiddleware` - Query performance monitoring
- `errorHandlingMiddleware` - Error handling and logging
- `softDeleteMiddleware` - Soft delete functionality
- `batchingMiddleware` - Query batching optimization

## Shared Hooks (`shared/hooks/`)

### Cross-Domain Hooks

- `useSetUserDataToRedux()` - Sync user data to Redux
- `syncUserData()` - Internal sync function
- `useUser()` - Redux-based hook for accessing current user state with type safety

### Utility Functions

- `cn()` - Utility function for conditional classnames using clsx and tailwind-merge

### Session Management Hooks

- `useSession()` - Complete session management
- `useSessionStats(userId?)` - Session statistics with caching
- `useRealTimeSessionStats(userId?)` - Real-time session stats

## State Management (`state/`)

### Store Configuration (`store.ts`)

- `store` - Configured Redux store
- `useAppDispatch()` - Typed dispatch hook
- Types: `RootState`, `AppDispatch`

### Auth Slice (`slices/authSlice.ts`)

```typescript
interface AuthState {
  user: UserBasicData | null;
  isAuthenticated: boolean;
}
```

Selectors: `selectUser(state)`, `selectIsAuthenticated(state)`

### User Dictionary Slice (`slices/userDictionarySlice.ts`)

```typescript
interface UserDictionaryState {
  items: UserDictionaryItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  sortBy: 'word' | 'difficulty' | 'progress' | 'reviewCount' | 'lastReviewedAt';
  sortOrder: 'asc' | 'desc';
}
```

Selectors: `selectUserDictionary(state)`, `selectUserDictionaryStatus(state)`, `selectUserDictionaryError(state)`

### Session Slice (`features/sessionSlice.ts`)

```typescript
interface SessionState {
  currentSession: UserLearningSession | null;
  sessionItems: UserSessionItem[];
  sessionHistory: UserLearningSession[];
  isSessionActive: boolean;
  loading: boolean;
  error: string | null;
  sessionStats: SessionStatsResponse | null;
}
```

Async Thunks: `startLearningSession(request)`, `endLearningSession({sessionId, updates})`, `addSessionItem({sessionId, item})`, `fetchSessionStats(userId)`, `fetchSessionHistory({userId, page, pageSize, filters})`

Selectors: `selectCurrentSession(state)`, `selectSessionItems(state)`, `selectIsSessionActive(state)`, `selectSessionLoading(state)`, `selectSessionError(state)`, `selectSessionStats(state)`, `selectSessionAccuracy(state)`, `selectSessionProgress(state)`

## Infrastructure

### Auth (`infrastructure/auth/`)

- JWT and session configuration
- Edge runtime compatibility
- `authorize(credentials)` - Custom credential validation

### Monitoring (`infrastructure/monitoring/`)

- `serverLog(message, level?, context?)` - Server-side file logging

## Legacy Lib (`lib/`) - Backward Compatibility

### Database Processing (`lib/db/`)

#### Merriam-Webster API Processing (`processMerriamApi.ts`)

Helper Functions: `mapPartOfSpeech(apiFl)`, `mapSourceType(apiSrc)`, `processEtymology(etymologyData)`, `extractExamples(dt, language)`, `cleanupDefinitionText(text)`, `cleanupExampleText(text)`

#### Danish Dictionary Processing (`processOrdnetApi.ts`)

Core Functions: `processTranslationsForWord(tx, mainWordId, mainWordText, wordData)`, `processAndSaveDanishWord(danishWordData, pTx?)`, `upsertWord(tx, source, wordText, languageCode, options?)`, `upsertWordDetails(tx, wordId, partOfSpeech, source, ...)`

Utility Functions: `extractSubjectLabels(labels)`, `extractGeneralLabels(labels)`, `extractGrammaticalNote(labels)`, `extractUsageNote(labels)`, `mapStemPosToEnum(stemPos)`, `getRelationshipDescription(relationType)`

**Recent Updates:**

- **Enhanced PartOfSpeech Support**: Added support for new Danish part-of-speech types:
  - `'udråbsord'` → `PartOfSpeech.exclamation`
  - `'førsteled'` → `PartOfSpeech.first_part` (new enum value)
- **Type System Integration**: Updated `PartOfSpeechForStems`, `PartOfSpeechDanish`, and `DetailCategoryDanish` types to include the new values
- **Validation Updates**: Enhanced Danish dictionary validator to recognize the new part-of-speech categories
- **Database Schema**: Added `first_part // førsteled` to the PartOfSpeech enum in Prisma schema with corresponding migration

#### Validation System (`utils/validations/danishDictionaryValidator.ts`)

Core Functions: `validateDanishDictionary(data, context)`, `extractEnumSuggestions(validationResult)`, `isValidationAcceptable(validationResult)`

Types: `ValidationSummary`, `ValidationIssue`

### Word Search Operations (`actions/word-search-actions.ts`)

- `searchWords(searchQuery, languageCode, userId?, page?, pageSize?)` - Search words in database with pagination and user dictionary status
- `addDefinitionToUserDictionary(userId, definitionId, baseLanguageCode, targetLanguageCode)` - Add specific definition to user's dictionary
- `removeDefinitionFromUserDictionary(userId, userDictionaryId)` - Remove definition from user's dictionary (soft delete)

Types: `WordSearchResult`, `WordDefinitionResult`

**Key Features:**

- **Comprehensive Search**: Searches words by text with case-insensitive matching
- **User Context**: Shows which definitions are already in user's dictionary
- **Pagination Support**: Built-in pagination for large result sets
- **Definition-Level Management**: Users can add/remove individual definitions rather than entire words
- **Soft Delete**: Removed words can be restored if re-added
- **Multi-Language Support**: Search across different language dictionaries
- **Rich Metadata**: Returns audio, image, example count, and learning status information

### User List Management Operations (`actions/user-list-actions.ts`)

- `getUserLists(userId, filters?)` - Get user's personal lists with filtering and sorting
- `getAvailablePublicLists(userId, userLanguages, filters?)` - Get public lists user can add to collection
- `addListToUserCollection(userId, listId, userLanguages)` - Add public list to user's collection
- `removeListFromUserCollection(userId, userListId)` - Remove list from user's collection (soft delete)
- `createCustomUserList(userId, data)` - Create custom user list
- `updateUserList(userId, userListId, data)` - Update user list customizations
- `addWordToUserList(userId, userListId, userDictionaryId)` - Add word from user dictionary to a list

Types: `UserListWithDetails`, `PublicListSummary`, `UserListFilters`

**Key Features:**

- **Dual List Types**: Manages both inherited public lists and custom user lists
- **Customization Support**: Users can customize names, descriptions, difficulty for inherited lists
- **Collection Management**: Add/remove public lists from personal collection
- **Word Management**: Add individual words from user dictionary to specific lists
- **Order Management**: Maintains proper ordering of words within lists
- **Duplicate Prevention**: Validates against adding same word twice to a list
- **Rich Metadata**: Includes progress tracking, word counts, sample words
- **Language Filtering**: Shows lists matching user's language preferences
- **Ownership Validation**: Ensures users can only modify their own lists and words

### Practice Session Management (`actions/practice-actions.ts`)

- `createTypingPracticeSession(request)` - Create new typing practice session with intelligent word selection and audio integration
- `validateTypingInput(request)` - Validate user's typing input with accuracy calculation and learning progress updates
- `completePracticeSession(sessionId)` - Complete practice session with summary and achievements
- `getPracticeSessionProgress(sessionId)` - Get current session progress and statistics

Types: `PracticeWord`, `CreatePracticeSessionRequest`, `ValidateTypingRequest`, `PracticeSessionProgress`

**Key Features:**

- **Intelligent Word Selection**: Prioritizes words needing review based on learning status, progress, and time since last review
- **Audio Integration**: Includes database audio URLs for each practice word with automatic fallback to TTS
- **Real-Time Validation**: Character-by-character accuracy checking with typo tolerance
- **Learning Progress Tracking**: Updates user dictionary with new learning metrics after each word
- **Adaptive Difficulty**: Configurable difficulty levels affecting session parameters
- **Session Management**: Complete session lifecycle from creation to completion with statistics
- **Achievement System**: Automatic achievement detection and notification
- **Spaced Repetition**: Integrates with learning metrics for optimal review scheduling
- **Performance Analytics**: Tracks response times, accuracy, and learning patterns
- **Translation Support**: Shows definitions in user's base language while practicing target language words

### Learning Metrics Configuration (`utils/learning-metrics.ts`)

Comprehensive configuration system for learning thresholds and progress calculation:

- **Learning Thresholds**: Configurable criteria for marking words as learned, difficult, or mastered
- **Practice Session Config**: Default settings for session duration, word counts, and scoring
- **Typing Practice Metrics**: Character-level accuracy requirements and typo tolerance
- **Difficulty Adjustment**: Automatic difficulty scaling based on user performance
- **LearningMetricsCalculator**: Utility class for accuracy, mastery score, and learning status calculations

**Key Metrics:**

- Minimum 3 correct attempts to mark word as "learned"
- 80% accuracy threshold for learned status
- 85% mastery score for full mastery
- Spaced repetition intervals: [1, 3, 7, 14, 30, 60] days
- 10% character tolerance for minor typos
- Adaptive time limits based on difficulty level

### Other Legacy Actions (`lib/actions/`)

- `cleanupDatabase()` - Database cleanup operations
- `processDanishVariantOnServer(variant, originalWord)` - Process Danish variants
- `processImagesForTranslatedDefinitions(definitions, wordText)` - Generate images

## Usage Guidelines

1. Use domain-based imports for new code
2. Legacy imports remain functional
3. File size target: < 8KB per file
4. Check existing functionality before creating new functions
5. Follow domain organization for business logic

## Migration Status

All components completed with 100% backward compatibility maintained.

# Core Folder Architecture

## Overview

The `core` folder contains the fundamental business logic, data access layers, and shared utilities for the keystroke application. It follows Domain-Driven Design principles and clean architecture patterns.

## Structure

### `/domains`

Contains domain-specific business logic organized by functional areas:

- **auth/**: Authentication and authorization logic
- **dictionary/**: Word and definition management
- **translation/**: Translation services and logic
- **user/**: User management and profiles

Each domain follows this structure:

- `actions/`: Server actions and business operations
- `services/`: Core business services
- `types/`: Domain-specific TypeScript interfaces
- `utils/`: Domain-specific utilities

### `/infrastructure`

Infrastructure concerns and external integrations:

- **auth/**: Authentication providers and middleware
- **monitoring/**: Logging and error tracking
- **storage/**: File and data storage abstractions
- **types/**: Infrastructure-related types

### `/lib`

Legacy library code and utilities:

- Database connections, actions, and utilities
- Redux store configuration
- Service integrations
- Validation utilities

### `/shared`

Shared services and utilities used across domains:

- **constants/**: Application-wide constants
- **database/**: Database schemas and middleware
- **hooks/**: Reusable React hooks
- **services/**: Cross-domain services (WordService, FrequencyManager, etc.)
- **types/**: Shared TypeScript interfaces
- **utils/**: Common utilities

### `/state`

State management (Redux):

- **features/**: Feature-specific state slices
- **middleware/**: Redux middleware
- **slices/**: Redux toolkit slices

### `/types`

Global TypeScript type definitions

## Key Services

### WordService

Central service for word and word details operations. Located in `/shared/services/WordService.ts`.

**Conditional Update Strategy**:
To prevent overwriting existing database values with null or empty strings, the service uses a conditional update pattern:

```typescript
// Only add properties to update object if they have meaningful values
const updateData: WordDetailsUpdateData = {
  isPlural: isPlural, // Always update required fields
  source: source,
};

// Conditionally add optional fields
if (phonetic !== null && phonetic !== undefined && phonetic.trim() !== '') {
  updateData.phonetic = phonetic;
}

if (frequency !== null && frequency !== undefined) {
  updateData.frequency = frequency;
}
```

**Benefits**:

- Preserves existing data when new data is empty/null
- Prevents accidental data loss during updates
- Maintains data integrity across API integrations
- Type-safe with proper TypeScript interfaces

**Usage Pattern**:
This pattern should be applied to any update operations where preserving existing data is important, especially when:

- Integrating with external APIs that may return incomplete data
- Updating records where some fields are optional
- Merging data from multiple sources

### FrequencyManager

Manages word frequency data across different sources and languages.

### ImageService

Handles image search and assignment for dictionary definitions.

## Design Principles

1. **Domain Separation**: Clear boundaries between different business domains
2. **Dependency Direction**: Dependencies flow inward toward the core domain logic
3. **Shared Abstractions**: Common functionality is abstracted into shared services
4. **Type Safety**: Strong TypeScript typing throughout
5. **Data Integrity**: Conditional update strategies prevent accidental data loss
6. **Clean Interfaces**: Well-defined interfaces between layers

## Database Interaction Patterns

### Conditional Updates

When updating database records, always consider whether null/empty values should overwrite existing data:

```typescript
// ❌ Avoid - may overwrite existing data with null
const updateData = {
  field1: value1 || null,
  field2: value2 || null,
};

// ✅ Preferred - preserve existing data
const updateData: UpdateInterface = { requiredField: value };
if (value1 !== null && value1 !== undefined) {
  updateData.field1 = value1;
}
```

### Transaction Management

Use Prisma transactions for complex operations involving multiple database writes to ensure data consistency.

## Integration Points

The core folder integrates with:

- Next.js API routes (through actions)
- React components (through hooks and services)
- External APIs (through infrastructure services)
- Database (through Prisma ORM)

## Future Considerations

- Consider moving legacy `/lib` code into appropriate domain folders
- Evaluate extracting common patterns into reusable abstractions
- Monitor for opportunities to further improve type safety and data integrity patterns
