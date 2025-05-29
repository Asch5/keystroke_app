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

## Import Patterns

```typescript
// Recommended domain imports
import { getWordDetails, updateWordDetails } from '@/core/domains/dictionary';
import { authenticateUser } from '@/core/domains/auth';
import { getUserStats } from '@/core/domains/user';

// Shared infrastructure
import { handlePrismaError } from '@/core/shared/database';
import { serverLog } from '@/core/infrastructure/monitoring';

// State management
import { useAppDispatch, store } from '@/core/state';
import { selectUser } from '@/core/state/slices/authSlice';

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

### List Management (`actions/list-actions.ts`)

- `fetchCategories()` - Fetch all categories for list creation
- `createListWithWords(listData)` - Create a new list with selected words
- `createCategory(name, description?)` - Create a new category
- `createListAction(prevState, formData)` - Server action for list creation with redirect
- `addWordsToList(listId, definitionIds)` - Add words to existing list

### Advanced List Management (`actions/list-management-actions.ts`)

- `fetchAllLists(filters?)` - Comprehensive list fetching with filtering, search, and pagination
- `getListDetails(listId)` - Get detailed information about a single list
- `updateList(listId, data)` - Update list information
- `deleteList(listId)` - Soft delete a list
- `restoreList(listId)` - Restore a deleted list
- `updateListAction(listId, prevState, formData)` - Server action for list updates with redirect

Types: `ListWithDetails`, `ListFilters`, `ListsResponse`

## Auth Domain (`domains/auth/`)

### Actions

- `authenticate(prevState, formData)` - User login
- `signUp(prevState, formData)` - User registration
- `checkRole(allowedRoles)` - Role verification

### Types

- `StateAuth`, `StateSignup` - Form state types

## User Domain (`domains/user/`)

### User Management Actions

- `updateUserProfile(prevState, formData)`
- `getUsers(page, limit, searchQuery?, sortBy?, sortOrder?)`
- `getUserDetails(userId)`
- `getUserByEmail(email)`
- `updateUserStatus(userId, status)`
- `deleteUser(userId)`

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
