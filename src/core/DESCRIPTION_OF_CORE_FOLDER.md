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
│   ├── storage/          # Storage management
│   ├── services/         # AI services (DeepSeek)
│   └── middleware/       # Request processing & image handling
├── state/                # State Management
│   ├── slices/           # Redux slices
│   ├── features/         # Feature state
│   └── store.ts          # Store configuration
└── lib/ (legacy)         # Legacy - Maintained for compatibility
```

## 📊 **CRITICAL: Comprehensive Monitoring & Autonomous Debugging System**

### **Enhanced Logging Architecture** (`infrastructure/monitoring/`)

**Core Components:**

- **serverLogger.ts** (41 lines) - Structured server-side logging with environment detection
- **clientLogger.ts** (366 lines) - Environment-aware client logging with dual storage (console + localStorage + file system)
- **debugReader.ts** (500 lines) - AI-powered log analysis and autonomous debugging
- **performanceMonitor.ts** (380 lines) - Performance tracking with autonomous pattern detection
- **autonomousDebugDemo.ts** (249 lines) - Demonstration of autonomous debugging capabilities

### **Autonomous Debugging Features** (AI-Powered)

**DebugReader Class** (`debugReader.ts`):

- `analyzeCurrentState()` - Comprehensive system state analysis
- `getSystemHealthReport()` - Real-time health assessment
- `searchForIssue(query)` - Targeted issue investigation
- `detectPatterns()` - Automatic pattern recognition for auth, database, API, performance, and UX issues
- **Browser Access**: `window.KeystrokeDebug` in development mode

**Log Storage Locations:**

- Server logs: `logs/server.log`
- Client logs (server-side): `logs/client.log` (JSON format)
- Client logs (browser-side): `localStorage` under `keystroke_client_logs`

### **Performance Monitoring Integration**

- **Vercel Speed Insights**: Real-time Core Web Vitals tracking
- **Custom Performance Monitor**: Navigation timing, resource loading, layout shift detection
- **Development Console**: `window.KeystrokePerformance` for manual debugging

## Critical Redux-Persist Considerations

### **Redux Store Location**

✅ **The Redux store and slices are located in `src/core/state/`**.

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
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import {
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';

// AI Services (Cost-Optimized)
import { deepSeekService } from '@/core/infrastructure/services/deepseek-service';

// Audio (Database-Only, No External TTS)
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import { audioDownloadService } from '@/core/shared/services/external-apis/audioDownloadService';

// State management
import { useAppDispatch, store } from '@/core/state/store';
import { updateUserProfile } from '@/core/state/features/authSlice';
import { selectUser } from '@/core/state/features/authSlice';

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

### Word Search & Dictionary Management (`actions/word-search-actions.ts`)

- `searchWords(searchTerm, languageCode, userNativeLanguage?)` - Search dictionary with translation prioritization
- `searchWordsForUser(userId, searchTerm, languageCode)` - User-specific search with native language support
- `addDefinitionToUserDictionary(userId, definitionId, baseLanguageCode, targetLanguageCode)` - Add specific definition to user dictionary
- `removeDefinitionFromUserDictionary(userId, userDictionaryId)` - Remove definition from user dictionary (soft delete)
- `checkDefinitionsInUserDictionary(userId, definitionIds)` - Check dictionary status for multiple definitions
- Types: `WordSearchResult`, `WordDefinitionResult` with translation and dictionary status fields

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

### 🤖 **DeepSeek AI Integration** (`actions/deepseek-actions.ts`)

**NEW: Cost-Effective AI Word Extraction System**

- `extractWordFromDefinition(input)` - Extract single word from definition using DeepSeek API
- `extractWordsFromDefinitionsBatch(prevState, formData)` - Batch word extraction with database integration
- `getDefinitionWordConnections(definitionIds)` - Query existing definition-to-word connections
- `findOrCreateWord(wordText, languageCode)` - Find existing word or create new one for DeepSeek results
- `connectDefinitionToWord(definitionId, wordId)` - Create DefinitionToOneWord relationship

**Key Features:**

- **Cost Optimization**: Achieves ~$0.0001 per definition (~$0.001 per 1K tokens)
- **Batch Processing**: Up to 50 definitions per batch with rate limiting (5 requests/second max)
- **Database Integration**: Automatic word creation and DefinitionToOneWord relationship management
- **Error Handling**: Comprehensive error handling with detailed serverLog integration
- **Token Tracking**: Real-time token usage monitoring and cost estimation
- **Language Support**: Multi-language word extraction with source/target language configuration
- **Duplicate Prevention**: Checks for existing definition-word connections before creating new ones

Types: `ExtractWordResult`, `ExtractWordsBatchResult`

### Manual Forms Management (`actions/manual-forms-actions.ts`)

**NEW: Danish Word Forms System for Missed Automatic Processing**

- `addManualWordForms({baseWordDetailId, baseWordText, forms})` - Add manually created Danish word forms that were missed by automatic processing
- `generateFormDefinition(baseWordText, relatedWordText, relationshipType)` - Generate default definition for manual forms
- `determinePartOfSpeechForForm(relationshipType, basePartOfSpeech)` - Determine appropriate part of speech for form

**Manual Forms Features:**

- **Danish Form Processing**: Handles forms missed by `transformDanishForms.ts` automatic processing
- **Standardized Definitions**: Integrates with `getDanishFormDefinition` for linguistically accurate definitions
- **Relationship Types**: Supports all Danish grammatical relationships (comparative_da, superlative_da, definite_form_da, etc.)
- **Database Integration**: Creates complete Word, WordDetails, Definition, and relationship records
- **Smart Upserts**: Handles existing words gracefully with proper error handling
- **Transaction Safety**: Uses database transactions for data consistency
- **Admin Interface**: Provides ManualFormsDialog component for easy form addition via admin/dictionaries interface

Types: `ManualFormData`, `AddManualFormsRequest`, `AddManualFormsResponse`

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
- `getAvailablePublicLists(userId, userLanguages, filters?)` - Get public lists available for user collection (official lists from List table)
- `getPublicUserLists(userId, userLanguages, filters?)` - Get community lists shared by other users (from UserList table with isPublic=true)
- `addListToUserCollection(userId, listId, userLanguages)` - Add public list to user's collection
- `addPublicUserListToCollection(userId, publicUserListId, userLanguages)` - Clone public user list to user's collection with full word copying
- `removeListFromUserCollection(userId, userListId)` - Remove list from user's collection
- `createCustomUserList(userId, data)` - Create custom user-defined list
- `updateUserList(userId, userListId, data)` - Update user list customizations
- `addWordToUserList(userId, userListId, userDictionaryId)` - Add word from dictionary to list
- `removeWordFromUserList(userId, userListId, userDictionaryId)` - Remove word from list
- `getUserListWords(userId, userListId, options?)` - Get words in list with full details
- `reorderUserListWords(userId, userListId, wordOrderUpdates)` - Update word order in list

Types: `UserListWithDetails`, `PublicListSummary`, `PublicUserListSummary`, `UserListWordWithDetails`, `UserListFilters`

**Key Features:**

- **Dual List System**: Supports both official lists (List table) and community lists (UserList table with isPublic=true)
- **Public List Discovery**: Simplified filtering without language constraints for broader list discovery
- **Community List Support**: Users can share their custom lists with isPublic flag and others can clone them
- **Creator Attribution**: Community lists show who created them for proper attribution
- **Full List Cloning**: Adding community lists copies all words via transaction-based operations
- **Composite Key Support**: Properly handles UserListWord composite primary key (userListId, userDictionaryId)
- **List Type Management**: Supports both inherited public lists and custom user-created lists
- **Advanced Filtering**: Search, difficulty, language, custom/inherited list filtering
- **Translation Integration**: Displays definitions in user's native language when available
- **Image Support**: Includes image associations through Definition model
- **Proper Type Safety**: Corrected TypeScript types for all database operations
- **Schema Compliance**: Fixed invalid property references and relationship includes

**Recent Fixes:**

- **Fixed Filtering Logic**: Resolved issue where language filtering was preventing public lists from appearing by default
- **Consistent Search Behavior**: Both official and community lists now show all available lists by default, with search filtering applied when needed
- **Simplified Query Logic**: Removed conflicting AND/OR conditions that were causing empty results

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

### Danish Form Definition Utilities (`utils/danishDictionary/getDanishFormDefinition.ts`)

- `getDanishFormDefinition(baseWordText, relatedWordText, relationshipType)` - Generate standardized definitions for Danish word forms based on grammatical relationships

**Danish Form Definition Features:**

- **Comprehensive Coverage**: Supports all Danish grammatical relationships (definite_form_da, plural_da, comparative_da, superlative_da, etc.)
- **Linguistic Accuracy**: Provides both Danish and English terminology for each form type
- **Standardized Output**: Consistent definition format across all form types
- **Integration Ready**: Used by both automatic form processing and manual form addition
- **Error Handling**: Graceful handling of unknown relationship types with logging

**Example Definitions:**

- `comparative_da`: "Comparative form (komparativ) of {baseWord}"
- `superlative_da`: "Superlative form (superlativ) of {baseWord}"
- `definite_form_da`: "Definite form (bestemt form) of {baseWord}"
- `plural_da`: "Plural form (flertal) of {baseWord}"

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

- `createTypingPracticeSession(request)` - Create a new typing practice session with intelligent word selection and **authenticated image URL generation**
- `validateTypingInput({sessionId, userDictionaryId, userInput, responseTime})` - Validate user typing input with accuracy calculation and learning progress updates
- `completePracticeSession(sessionId)` - Complete practice session with achievements detection and summary generation
- `getPracticeSessionProgress(sessionId)` - Get live practice session progress and statistics

Types: `CreatePracticeSessionRequest`, `PracticeWord`, `DifficultyConfig`, `TypingValidationResult`, `PracticeSessionSummary`

**🖼️ Image URL Construction Fix**:

- **Fixed Image Display**: Updated `createTypingPracticeSession()` to generate proper authenticated image URLs using `/api/images/{id}` format instead of direct external URLs
- **Authentication Support**: Images now properly utilize the authenticated image proxy system for secure access
- **Consistent Handling**: Ensures all practice session images use the same URL pattern as other app components

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

### 🚀 **Enhanced Learning Progress Tracking** (`utils/difficulty-assessment.ts`)

**NEW: Comprehensive Multi-Factor Difficulty Assessment System**

- `DifficultyAssessment.calculateDifficultyScore(userId, userDictionaryId)` - Calculate comprehensive difficulty score using both user performance and linguistic metrics
- `DifficultyAssessment.calculateBatchDifficultyScores(userId, userDictionaryIds[])` - Batch difficulty calculation for efficient processing
- `DifficultyAssessment.getIntelligentWordSelection(userId, targetWords, options)` - Smart word selection for practice sessions
- `LearningProgressTracker.updateLearningProgress(userId, learningUnitId, practiceType, result)` - Universal progress tracking across practice types
- `LearningProgressTracker.trackSkip(userId, learningUnitId, practiceType)` - Track skip behavior for difficulty assessment

**Key Features:**

- **Multi-Factor Assessment**: Combines user performance metrics (mistake rate, correct streak, SRS level, response time, skip rate) with linguistic metrics (word rarity, phonetic irregularity, polysemy, word length)
- **Dynamic Difficulty**: User-centric difficulty scores that adapt based on individual learning patterns
- **Universal Learning Units**: Extensible architecture supporting any type of learning content (words, phrases, grammar, pronunciation)
- **Intelligent Word Selection**: Strategic word distribution (hard/medium/easy) for optimal learning sessions
- **Comprehensive Analytics**: Detailed difficulty progression tracking and learning pattern analysis

### Practice Session Management (`utils/practice-session-manager.ts`)

**NEW: Advanced Practice Session Orchestration with Adaptive Difficulty**

- `PracticeSessionManager.createSession(options)` - Create intelligent practice sessions with difficulty-based word selection
- `PracticeSessionManager.processAttempt(sessionId, attempt)` - Process attempts with adaptive feedback and difficulty adjustment
- `PracticeSessionManager.completeSession(session)` - Generate comprehensive session summaries with learning analytics
- `PracticeSessionManager.pauseSession()` / `resumeSession()` / `abandonSession()` - Full session lifecycle management

**Supported Practice Types:**

- **Typing Practice**: Character-by-character accuracy with typo tolerance
- **Flashcards**: Multiple acceptable answers with semantic matching
- **Pronunciation**: Speech recognition confidence scoring
- **Quiz**: Multiple choice and text input with flexible evaluation
- **Games**: Extensible framework for gamified learning

**Adaptive Features:**

- **Real-time Difficulty Adjustment**: Automatically adjusts word difficulty based on performance patterns
- **Mistake Pattern Analysis**: Tracks and categorizes different types of learning mistakes
- **Response Time Analytics**: Monitors cognitive load through timing analysis
- **Session Recommendations**: AI-powered suggestions for optimal next learning activities

### Enhanced Practice Actions (`actions/enhanced-practice-actions.ts`)

**NEW: Server Actions with AI-Powered Word Selection and Difficulty Optimization**

- `createIntelligentPracticeSession(request)` - Create practice sessions with AI-powered word selection and difficulty optimization
- `processIntelligentAttempt(request)` - Process learning attempts with comprehensive feedback and adaptive adjustment
- `completeIntelligentSession(sessionId)` - Complete sessions with detailed analytics and learning progression insights
- `getWordDifficultyAssessment(userId, userDictionaryId)` - Get individual word difficulty assessments
- `getBatchDifficultyAssessments(userId, userDictionaryIds[])` - Batch difficulty analysis for vocabulary management

**Advanced Features:**

- **Practice Type Specialization**: Customized evaluation logic for each practice mode
- **Confidence-Based Learning**: Uses assessment confidence levels to determine review scheduling
- **Adaptive Feedback Generation**: Context-aware encouragement and explanations
- **Learning Achievement Tracking**: Automatic detection and celebration of learning milestones

### Configuration and Metrics

**Difficulty Assessment Configuration** (`DIFFICULTY_ASSESSMENT_CONFIG`):

- **Performance Weights**: Mistake rate (25%), correct streak (20%), SRS level (15%), learning status (15%), response time (10%), skip rate (10%), recency/frequency (5%)
- **Linguistic Weights**: Word rarity (30%), phonetic irregularity (20%), polysemy (15%), word length (15%), semantic abstraction (10%), relational complexity (10%)
- **Dynamic Weight Adjustment**: New users start with 100% linguistic weighting, transitioning to 70% performance / 30% linguistic as data accumulates

**Practice Configurations** (`PRACTICE_CONFIGS`):

- **Typing**: 10 words, 10min, adaptive difficulty, skipping enabled
- **Flashcards**: 15 words, 15min, adaptive difficulty, no skipping
- **Pronunciation**: 8 words, 8min, fixed difficulty, skipping enabled
- **Quiz**: 20 words, 20min, fixed difficulty, no skipping

## Database Schema Enhancements

### UserDictionary Model Updates

**NEW FIELD**: `skipCount INT DEFAULT 0` - Tracks behavioral skip patterns for difficulty assessment

**Enhanced Analytics Fields**:

- `skipCount`: Number of times user has skipped this word during practice
- `srsLevel`: Enhanced spaced repetition system with 6 levels (0-5)
- `masteryScore`: Composite mastery calculation (0-100) incorporating multiple factors
- `nextSrsReview`: Intelligent review scheduling based on performance patterns

### Learning Unit Architecture

**Universal Learning Interface**: All practice types now work with standardized `LearningUnit` objects:

```typescript
interface LearningUnit {
  id: string;
  type: 'word' | 'phrase' | 'grammar' | 'pronunciation';
  content: {
    primary: string; // Main content to learn
    secondary?: string; // Additional context
    metadata: Record<string, any>; // Type-specific data
  };
  difficulty: DifficultyScore;
  userProgress: {
    attempts: number;
    successes: number;
    lastAttempt: Date | null;
    nextReview: Date | null;
  };
}
```

This architecture enables:

- **Cross-Practice Compatibility**: Same word can be practiced in typing, flashcards, pronunciation, etc.
- **Unified Progress Tracking**: Consistent metrics across all learning modalities
- **Extensible Content Types**: Easy addition of new learning content beyond words
- **Intelligent Scheduling**: Unified review system optimizing across all practice types

## Translation Domain (`domains/translation/`)

### Translation Processing

- `processTranslationsForWord(mainWordId, mainWordText, wordData)`
- `processEnglishTranslationsForDanishWord(danishWordData, variantData, tx)`

## Infrastructure Services (`infrastructure/services/`)

### 🤖 **DeepSeek API Service** (`deepseek-service.ts`)

**NEW: Cost-Effective AI Integration**

- `DeepSeekService.extractWord(request)` - Extract single word from definition using AI
- `DeepSeekService.extractWordsBatch(request)` - Batch word extraction with rate limiting
- `DeepSeekService.validateConnection()` - Test API connectivity and authentication
- `deepSeekService` - Singleton instance for application use

**Key Features:**

- **Cost Optimization**: Optimized prompts and token limits achieve ~$0.0001 per definition
- **Rate Limiting**: Built-in delays to respect API limits (5 requests/second max)
- **Batch Processing**: Efficient batch processing for up to 50 definitions
- **Token Tracking**: Real-time token usage monitoring and cost calculation
- **Error Handling**: Comprehensive error handling with detailed logging
- **Language Support**: Multi-language support with source/target language configuration
- **Quality Control**: Deterministic output with temperature=0 and stop tokens

Types: `DeepSeekWordRequest`, `DeepSeekWordResponse`, `DeepSeekBatchRequest`, `DeepSeekBatchResponse`

## Shared Services (`shared/services/`)

### External Services

- `frequencyService.ts` - Word frequency analysis
- `FrequencyManager.ts` - Frequency data caching (prevents duplicate API calls)
- `imageService.ts` - Image generation and management
- `pexelsService.ts` - Pexels API integration
- `translationService.ts` - Translation service integration
- `textToSpeechService.ts` - Google Cloud Text-to-Speech with cost optimization
- `blobStorageService.ts` - Vercel Blob storage for audio files with organized folder structure

### 🎵 **Audio Download Service** (`shared/services/external-apis/audioDownloadService.ts`)

**NEW: External Audio Download & Local Storage System**

- `AudioDownloadService.downloadAndStoreAudio(externalUrl, metadata)` - Download single audio file from external URL and store in blob storage
- `AudioDownloadService.downloadAndStoreBatchAudio(audioFiles, baseMetadata)` - Batch download multiple audio files with rate limiting
- `AudioDownloadService.checkAudioUrl(url)` - Validate external URL without downloading
- `audioDownloadService` - Singleton instance for application use

Types: `ExternalAudioDownloadResult`, `ExternalAudioFile`

**Key Features:**

- **Cost Control**: Eliminates unexpected costs from external TTS services by downloading and storing audio locally
- **Reliability**: Audio files stored in Vercel Blob storage for consistent availability
- **Performance**: Faster audio loading from local storage vs external URLs
- **Intelligent Processing**: Detects if URLs are already in blob storage to avoid redundant downloads
- **File Validation**: Comprehensive validation for file size (10MB limit), content type, and download timeouts (30s)
- **Error Handling**: Graceful error handling with detailed logging for failed downloads
- **Metadata Integration**: Rich metadata for organized blob storage including language, quality, and word context
- **Batch Processing**: Efficient batch downloading with appropriate delays between requests
- **Storage Organization**: Structured folder organization in blob storage by language and content type

**Architecture Integration:**

- **Dictionary Processing**: Both Danish (Ordnet) and Merriam-Webster APIs now download external audio files before storing URLs in database
- **Blob Storage**: Seamless integration with existing `blobStorageService.ts` for file management
- **Database Schema**: Compatible with existing Audio model - URLs point to blob storage instead of external sites
- **Backward Compatibility**: Existing audio playback functionality works transparently with blob storage URLs

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

Selectors: `selectCurrentSession(state)`, `selectSessionItems(state)`, `selectIsSessionActive(state)`
