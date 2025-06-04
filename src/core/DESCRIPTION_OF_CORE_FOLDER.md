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

### Image Operations (`actions/image-actions.ts`)

- `generateWordImages(wordId, options?)` - Generate images for a word's definitions using Pexels API
- `generateBatchWordImages(wordIds, options?)` - Batch image generation with rate limiting and word validation
- `deleteWordImages(wordId)` - Delete all images for a word's definitions
- `getImageStats()` - Get image statistics for admin dashboard

Types: `GenerateImageResult`, `ImageBatchResult`

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
