# Core Folder Documentation

This document provides a comprehensive overview of all functions and services available in the `src/core/` folder. Use this reference to avoid writing duplicate code and to understand what functionality is already available.

## 📁 Structure Overview

```
src/core/
├── lib/
│   ├── actions/          # Server actions for Next.js
│   ├── auth/            # Authentication configuration
│   ├── data/            # Static data and constants
│   ├── db/              # Database operations and API processing
│   ├── hooks/           # Custom React hooks
│   ├── redux/           # State management
│   ├── server/          # Server-side utilities
│   ├── services/        # External service integrations
│   └── utils/           # Utility functions
└── types/               # TypeScript type definitions
```

---

## 🚀 Actions (`lib/actions/`)

### Authentication Actions (`authActions.ts`)

- **`authenticate(prevState, formData)`** - User login authentication
- **`signUp(prevState, formData)`** - User registration
- **Types**: `StateAuth`, `StateSignup` - Form state types for auth operations

### Dictionary Actions (`dictionaryActions.ts`)

**Main dictionary operations and data management**

#### Word Management

- **`fetchDictionaryWords(targetLanguageId)`** - Get dictionary words for a language
- **`addWordToUserDictionary(userId, mainDictionaryId, baseLanguageId, targetLanguageId)`** - Add word to user's personal dictionary
- **`getWordDetails(wordText, languageCode)`** - Get comprehensive word information
- **`fetchWordById(wordId)`** - Get word by ID
- **`checkWordExistsByUuid(id, uuid)`** - Check if word exists using Merriam-Webster UUID

#### Word Updates

- **`updateWord(wordId, data)`** - Update basic word information
- **`updateDefinition(definitionId, data)`** - Update definition text and labels
- **`updateExample(exampleId, data)`** - Update example sentences
- **`updateAudio(audioId, data)`** - Update audio file information
- **`updateWordDetails(wordId, updateData)`** - Comprehensive word update with transaction

#### Audio Management

- **`createAudioForExample(exampleId, data)`** - Add audio to example
- **`createAudioForWord(wordId, data)`** - Add audio to word
- **`createAudioForDefinition(definitionId, data)`** - Add audio to definition

#### Frequency Utilities

- **`mapWordFrequency(wordPosition)`** - Convert position to frequency enum
- **`mapFrequencyPartOfSpeech(positionInPartOfSpeech)`** - Convert POS position to frequency

### Danish Dictionary Actions (`danishDictionaryActions/danishWordActions.ts`)

- **`processDanishVariantOnServer(variant, originalWord)`** - Process Danish word variants
- **`processImagesForTranslatedDefinitions(definitions, wordText)`** - Generate images for definitions

### Database Actions (`databaseActions.ts`)

- **`cleanupDatabase()`** - General database cleanup operations

### User Actions (`userActions.ts`)

- **`updateUserProfile(prevState, formData)`** - Update user profile information
- **Types**: `State`, `UserSettings`, `UpdateData` - User-related type definitions

---

## 🔐 Authentication (`lib/auth/`)

### Role Management (`checkRole.ts`)

- **`checkRole(allowedRoles)`** - Verify user role permissions

### Configuration (`config.ts`, `edge-config.ts`)

- **JWT and session configuration** for Next.js authentication
- **Edge runtime compatibility** for auth

### Providers (`providers.ts`)

- **`authorize(credentials)`** - Custom credential validation

---

## 💾 Database Operations (`lib/db/`)

### Merriam-Webster API Processing (`processMerriamApi.ts`)

**Complete pipeline for processing English dictionary data**

#### Main Processing Functions

- **`getWordFromMerriamWebster(prevState, formData)`** - Fetch word from Merriam-Webster API
- **`processAndSaveWord(apiResponse)`** - Process and save complete word data
- **`processAllWords(apiResponses)`** - Batch process multiple words
- **`processOneWord(word)`** - Process single word entry

#### Helper Functions

- **`mapPartOfSpeech(apiFl)`** - Convert API part of speech to enum
- **`mapSourceType(apiSrc)`** - Convert API source to enum
- **`processEtymology(etymologyData)`** - Extract and format etymology
- **`extractExamples(dt, language)`** - Extract examples and usage notes
- **`cleanupDefinitionText(text)`** - Clean definition formatting
- **`cleanupExampleText(text)`** - Clean example text formatting

### Danish Dictionary Processing (`processOrdnetApi.ts`)

**Processing Danish dictionary data from Ordnet API**

#### Core Functions

- **`processTranslationsForWord(tx, mainWordId, mainWordText, wordData)`** - Process Danish translations
- **`processAndSaveDanishWord(danishWordData, pTx?)`** - Save Danish word with all relations
- **`upsertWord(tx, source, wordText, languageCode, options?)`** - Create/update word records
- **`upsertWordDetails(tx, wordId, partOfSpeech, source, ...)`** - Create/update word details

#### Utility Functions

- **`extractSubjectLabels(labels)`** - Extract subject classification labels
- **`extractGeneralLabels(labels)`** - Extract general usage labels
- **`extractGrammaticalNote(labels)`** - Extract grammatical information
- **`extractUsageNote(labels)`** - Extract usage notes
- **`mapStemPosToEnum(stemPos)`** - Map stem part of speech
- **`getRelationshipDescription(relationType)`** - Get relationship descriptions

### User Database Operations (`user.ts`)

**User management and statistics**

#### User Management

- **`getUsers(page, limit, searchQuery?, sortBy?, sortOrder?)`** - Get paginated users
- **`getUserDetails(userId)`** - Get detailed user information
- **`getUserByEmail(email)`** - Find user by email
- **`updateUserStatus(userId, status)`** - Update user status
- **`deleteUser(userId)`** - Delete user account

#### Statistics

- **`calculateUserStats(user)`** - Calculate user learning statistics
- **`calculateLearningProgress(user)`** - Calculate learning progress metrics

#### Types

- **`UserWithStats`** - User with learning statistics
- **`UserWithStatsAndMeta`** - Extended user data
- **`UserStats`** - Statistics interface

### Translation Processing (`wordTranslationProcessor.ts`)

**Handle word translations between English and Danish**

#### Main Functions

- **`processTranslationsForWord(mainWordId, mainWordText, wordData)`** - Process all translations for a word
- **`processEnglishTranslationsForDanishWord(danishWordData, variantData, tx)`** - Process English translations of Danish content

---

## 🔧 Services (`lib/services/`)

### Available Services

- **`frequencyService.ts`** - Word frequency analysis
- **`imageService.ts`** - Image generation and management
- **`pexelsService.ts`** - Pexels API integration for images
- **`translationService.ts`** - Translation service integration

---

## 🎯 Redux State Management (`lib/redux/`)

### Auth Slice (`features/authSlice.ts`)

**Authentication state management**

#### State Interface

```typescript
interface AuthState {
  user: UserBasicData | null;
  isAuthenticated: boolean;
}
```

#### Selectors

- **`selectUser(state)`** - Get current user
- **`selectIsAuthenticated(state)`** - Get authentication status

### Theme Slice (`features/themeSlice.ts`)

**Theme management**

#### State Interface

```typescript
type ThemeState = {
  mode: 'light' | 'dark' | 'system';
};
```

### User Dictionary Slice (`features/userDictionarySlice.ts`)

**User's personal dictionary management**

#### State Interface

```typescript
interface UserDictionaryState {
  items: UserDictionaryItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  sortBy: 'word' | 'difficulty' | 'progress' | 'reviewCount' | 'lastReviewedAt';
  sortOrder: 'asc' | 'desc';
}
```

#### Selectors

- **`selectUserDictionary(state)`** - Get dictionary items
- **`selectUserDictionaryStatus(state)`** - Get loading status
- **`selectUserDictionaryError(state)`** - Get error state

### Store Configuration (`store.ts`)

- **`store`** - Configured Redux store with persistence
- **`useAppDispatch()`** - Typed dispatch hook
- **Types**: `RootState`, `AppDispatch`

---

## 🪝 Hooks (`lib/hooks/`)

### Redux Data Sync (`useSetUserDataToRedux.ts`)

- **`useSetUserDataToRedux()`** - Sync user data to Redux store
- **`syncUserData()`** - Internal sync function

---

## 🛠️ Utilities (`lib/utils/`)

### Word Details Adapter (`wordDetailsAdapter.ts`)

- **`convertWordEntryDataToWordDetails(wordEntryData)`** - Convert between data formats
- **`mapFrequencyToEnum(frequency)`** - Convert frequency numbers to enums

### Utility Categories

#### Common Dictionary Utils (`commonDictUtils/`)

- **`frequencyUtils.ts`** - Frequency calculation and mapping
- **`wordsFormators.ts`** - Word formatting utilities

#### Danish Dictionary Utils (`danishDictionary/`)

- **`mapDaEng.ts`** - Danish-English mapping utilities
- **`transformDanishForms.ts`** - Danish word form transformations

#### Database Utils (`dbUtils/`)

- **`audioCleanup.ts`** - Audio file cleanup
- **`cleanUpTables.ts`** - Database table cleanup
- **`dbCleanupService.ts`** - Comprehensive database cleanup

#### Other Utils

- **`dictionaryHelpers.ts`** - Dictionary operation helpers
- **`logUtils.ts`** - Logging utilities
- **`navigation.ts`** - Navigation helpers
- **`saveJson.ts`** - JSON file operations
- **`serverInit.ts`** - Server initialization
- **`utils.ts`** - General utility functions

#### Validations (`validations/`)

- **`danishDictionaryValidator.ts`** - Danish dictionary data validation

---

## 📊 Server Utilities (`lib/server/`)

### Logging (`serverLogger.ts`)

- **`logToFile(message, level?, context?)`** - Server-side file logging

---

## 📋 Data (`lib/data/`)

### Navigation (`navLinks.ts`)

- Static navigation link definitions

---

## 🏗️ Database Infrastructure

### Prisma Configuration (`prisma.ts`)

- Database client configuration and connection

### Error Handling (`prisma-error-handler.ts`)

- **`handlePrismaError(error)`** - Standardized Prisma error handling
- **`ErrorResponse`** - Error response interface

### Middleware (`prisma-middleware.ts`)

- **`performanceMiddleware`** - Query performance monitoring
- **`errorHandlingMiddleware`** - Error handling and logging
- **`softDeleteMiddleware`** - Soft delete functionality
- **`batchingMiddleware`** - Query batching optimization
- **`PrismaOperationError`** - Custom error class

---

## 📝 Types (`types/`)

### Core Type Definitions

- **`definition.ts`** - Definition-related types
- **`dictionary.ts`** - Dictionary and word types
- **`nav.ts`** - Navigation types
- **`next-auth.d.ts`** - NextAuth type extensions
- **`translationDanishTypes.ts`** - Danish translation types
- **`user.ts`** - User-related types
- **`word.ts`** - Word entity types
- **`wordDefinition.ts`** - Word definition types

---

## 🎯 Usage Guidelines

### Before Creating New Functions:

1. **Search this documentation** for existing functionality
2. **Check the appropriate folder** based on your needs:
   - Actions: Server-side operations
   - Services: External API integrations
   - Utils: Pure functions and helpers
   - Redux: State management
   - Types: Type definitions

### Naming Conventions:

- **Actions**: Use verb + noun (e.g., `updateWord`, `fetchUser`)
- **Services**: Use service name + operation (e.g., `translationService.translate`)
- **Utils**: Use descriptive function names (e.g., `cleanupText`, `formatDate`)
- **Types**: Use PascalCase with descriptive names

### File Organization:

- **Group related functions** in the same file
- **Use index files** for clean imports
- **Follow the established folder structure**
- **Add proper TypeScript types** for all functions

---

## 🚨 Important Notes

1. **Transaction Usage**: Many database operations use Prisma transactions for data consistency
2. **Error Handling**: All async functions should handle errors appropriately
3. **Type Safety**: All functions are fully typed with TypeScript
4. **Server Actions**: All database operations are server-side actions
5. **State Management**: Use Redux for client-side state, server actions for server state

---

_Last Updated: [Current Date]_
_Version: 1.0_
