# Core Folder Documentation - Optimized Structure

This document provides a comprehensive overview of all functions and services available in the **optimized** `src/core/` folder. Use this reference to avoid writing duplicate code and to understand what functionality is already available.

## 📁 New Optimized Structure Overview

```
src/core/
├── domains/               # 🏢 Domain-Driven Business Logic
│   ├── auth/             # Authentication domain
│   ├── dictionary/       # Dictionary & word management
│   ├── translation/      # Translation services
│   └── user/             # User management
├── shared/               # 🔧 Shared Infrastructure
│   ├── database/         # Database operations
│   ├── services/         # External services
│   ├── utils/            # Common utilities
│   ├── types/            # Shared types
│   └── hooks/            # Shared hooks
├── infrastructure/       # 🏗️ Technical Infrastructure
│   ├── auth/             # Auth configuration
│   ├── monitoring/       # Logging & monitoring
│   └── storage/          # Storage management
├── state/                # 📊 State Management
│   ├── slices/           # Redux slices
│   ├── features/         # Feature state
│   └── store.ts          # Store configuration
└── lib/ (legacy)         # 📦 Legacy - Maintained for compatibility
```

---

## 🏢 **DOMAINS** - Business Logic by Domain

### 📚 Dictionary Domain (`domains/dictionary/`)

**Main word and dictionary operations - Clean domain organization**

#### **Recommended Imports** ✨

```typescript
// ✅ NEW: Clean domain imports
import {
  getWordDetails,
  addWordToUserDictionary,
  updateWordDetails,
  WordEntryData,
} from '@/core/domains/dictionary';

// ✅ STILL WORKS: Legacy imports (backward compatible)
import { getWordDetails } from '@/core/lib/actions/dictionaryActions';
```

#### **Word CRUD Operations** (`actions/word-crud-actions.ts`)

- **`fetchDictionaryWords(targetLanguageId)`** - Get dictionary words for a language
- **`fetchDictionaryWordDetails(targetLanguageId)`** - Get comprehensive WordDetails items with word text, part of speech, variant, frequencies, source, definition, audio, and image information
- **`addWordToUserDictionary(userId, mainDictionaryId, baseLanguageId, targetLanguageId)`** - Add word to user's personal dictionary
- **`getWordDetails(wordText, languageCode)`** - Get comprehensive word information
- **`fetchWordById(wordId)`** - Get word by ID
- **`checkWordExistsByUuid(id, uuid)`** - Check if word exists using Merriam-Webster UUID

#### **Word Details & Complex Operations** (`actions/word-details-actions.ts`)

- **`updateWordDetails(wordId, updateData)`** - Comprehensive word update with transaction
- **`processAndSaveWord(apiResponse)`** - Process and save complete word data
- **`processAllWords(apiResponses)`** - Batch process multiple words
- **`processOneWord(word)`** - Process single word entry

#### **Word Updates** (`actions/word-update-actions.ts`)

- **`updateWord(wordId, data)`** - Update basic word information
- **`updateDefinition(definitionId, data)`** - Update definition text and labels
- **`updateExample(exampleId, data)`** - Update example sentences

#### **Audio Management** (`actions/audio-actions.ts`)

- **`createAudioForExample(exampleId, data)`** - Add audio to example
- **`createAudioForWord(wordId, data)`** - Add audio to word
- **`createAudioForDefinition(definitionId, data)`** - Add audio to definition
- **`updateAudio(audioId, data)`** - Update audio file information

#### **Frequency Utilities** (`actions/frequency-actions.ts`)

- **`mapWordFrequency(wordPosition)`** - Convert position to frequency enum
- **`mapFrequencyPartOfSpeech(positionInPartOfSpeech)`** - Convert POS position to frequency

#### **Domain Utilities** (`utils/`)

- **Word formatting and processing utilities**
- **Domain-specific validation helpers**
- **Frequency calculation utilities**

### 🔐 Auth Domain (`domains/auth/`)

**Authentication and authorization business logic**

#### **Available Actions**

- **`authenticate(prevState, formData)`** - User login authentication
- **`signUp(prevState, formData)`** - User registration
- **Types**: `StateAuth`, `StateSignup` - Form state types for auth operations

#### **Role Management**

- **`checkRole(allowedRoles)`** - Verify user role permissions

### 👤 User Domain (`domains/user/`)

**User management and profile operations**

#### **User Management Actions**

- **`updateUserProfile(prevState, formData)`** - Update user profile information
- **`getUsers(page, limit, searchQuery?, sortBy?, sortOrder?)`** - Get paginated users
- **`getUserDetails(userId)`** - Get detailed user information
- **`getUserByEmail(email)`** - Find user by email
- **`updateUserStatus(userId, status)`** - Update user status
- **`deleteUser(userId)`** - Delete user account

#### **User Statistics**

- **`calculateUserStats(user)`** - Calculate user learning statistics
- **`calculateLearningProgress(user)`** - Calculate learning progress metrics

#### **Types**

- **`UserWithStats`** - User with learning statistics
- **`UserWithStatsAndMeta`** - Extended user data
- **`UserStats`** - Statistics interface
- **`State`, `UserSettings`, `UpdateData`** - User-related type definitions

### 🌐 Translation Domain (`domains/translation/`)

**Translation services and language processing**

#### **Translation Processing**

- **`processTranslationsForWord(mainWordId, mainWordText, wordData)`** - Process all translations for a word
- **`processEnglishTranslationsForDanishWord(danishWordData, variantData, tx)`** - Process English translations of Danish content

---

## 🔧 **SHARED** - Common Infrastructure

### 💾 Database Operations (`shared/database/`)

#### **Database Client** (`client.ts`)

- Database client configuration and connection (moved from `prisma.ts`)

#### **Error Handling** (`error-handler.ts`)

- **`handlePrismaError(error)`** - Standardized Prisma error handling
- **`ErrorResponse`** - Error response interface

#### **Middleware** (`middleware/`)

- **`performanceMiddleware`** - Query performance monitoring
- **`errorHandlingMiddleware`** - Error handling and logging
- **`softDeleteMiddleware`** - Soft delete functionality
- **`batchingMiddleware`** - Query batching optimization
- **`PrismaOperationError`** - Custom error class

### 🔧 Shared Services (`shared/services/`)

#### **External Service Integrations**

- **`frequencyService.ts`** - Word frequency analysis
- **`imageService.ts`** - Image generation and management
- **`pexelsService.ts`** - Pexels API integration for images
- **`translationService.ts`** - Translation service integration

### 🛠️ Shared Utilities (`shared/utils/`)

#### **Common Utilities**

- **General utility functions**
- **Cross-domain helper functions**
- **Validation utilities**
- **Formatting utilities**

### 🪝 Shared Hooks (`shared/hooks/`)

#### **Cross-Domain Hooks**

- **`useSetUserDataToRedux()`** - Sync user data to Redux store
- **`syncUserData()`** - Internal sync function

### 📝 Shared Types (`shared/types/`)

#### **Common Type Definitions**

- **Cross-domain interfaces**
- **Shared data structures**
- **API response types**

---

## 🏗️ **INFRASTRUCTURE** - Technical Foundation

### 🔐 Auth Infrastructure (`infrastructure/auth/`)

#### **Configuration & Providers**

- **JWT and session configuration** for Next.js authentication
- **Edge runtime compatibility** for auth
- **`authorize(credentials)`** - Custom credential validation

### 📊 Monitoring (`infrastructure/monitoring/`)

#### **Logging System**

- **`serverLog(message, level?, context?)`** - Server-side file logging
- **Performance monitoring utilities**

### 💽 Storage (`infrastructure/storage/`)

#### **Storage Management**

- **File storage utilities**
- **Asset management**

---

## 📊 **STATE** - Redux State Management

### 🏪 Store Configuration (`state/store.ts`)

```typescript
// ✅ Clean state imports
import { store, useAppDispatch } from '@/core/state';
import type { RootState, AppDispatch } from '@/core/state';
```

- **`store`** - Configured Redux store with persistence
- **`useAppDispatch()`** - Typed dispatch hook
- **Types**: `RootState`, `AppDispatch`

### 🎯 State Slices (`state/slices/`)

#### **Auth Slice** (`slices/authSlice.ts`)

```typescript
interface AuthState {
  user: UserBasicData | null;
  isAuthenticated: boolean;
}
```

**Selectors:**

- **`selectUser(state)`** - Get current user
- **`selectIsAuthenticated(state)`** - Get authentication status

#### **Theme Slice** (`slices/themeSlice.ts`)

```typescript
type ThemeState = {
  mode: 'light' | 'dark' | 'system';
};
```

#### **User Dictionary Slice** (`slices/userDictionarySlice.ts`)

```typescript
interface UserDictionaryState {
  items: UserDictionaryItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  sortBy: 'word' | 'difficulty' | 'progress' | 'reviewCount' | 'lastReviewedAt';
  sortOrder: 'asc' | 'desc';
}
```

**Selectors:**

- **`selectUserDictionary(state)`** - Get dictionary items
- **`selectUserDictionaryStatus(state)`** - Get loading status
- **`selectUserDictionaryError(state)`** - Get error state

---

## 📦 **LEGACY LIB** - Backward Compatibility

_All functions remain accessible through original paths for 100% backward compatibility_

### Database Processing (`lib/db/`)

#### **Merriam-Webster API Processing** (`processMerriamApi.ts`)

**Complete pipeline for processing English dictionary data**

##### Helper Functions

- **`mapPartOfSpeech(apiFl)`** - Convert API part of speech to enum
- **`mapSourceType(apiSrc)`** - Convert API source to enum
- **`processEtymology(etymologyData)`** - Extract and format etymology
- **`extractExamples(dt, language)`** - Extract examples and usage notes
- **`cleanupDefinitionText(text)`** - Clean definition formatting
- **`cleanupExampleText(text)`** - Clean example text formatting

#### **Danish Dictionary Processing** (`processOrdnetApi.ts`)

**Processing Danish dictionary data from Ordnet API**

##### Core Functions

- **`processTranslationsForWord(tx, mainWordId, mainWordText, wordData)`** - Process Danish translations
- **`processAndSaveDanishWord(danishWordData, pTx?)`** - Save Danish word with all relations
- **`upsertWord(tx, source, wordText, languageCode, options?)`** - Create/update word records
- **`upsertWordDetails(tx, wordId, partOfSpeech, source, ...)`** - Create/update word details

##### Utility Functions

- **`extractSubjectLabels(labels)`** - Extract subject classification labels
- **`extractGeneralLabels(labels)`** - Extract general usage labels
- **`extractGrammaticalNote(labels)`** - Extract grammatical information
- **`extractUsageNote(labels)`** - Extract usage notes
- **`mapStemPosToEnum(stemPos)`** - Map stem part of speech
- **`getRelationshipDescription(relationType)`** - Get relationship descriptions

#### **Enhanced Validation System** (`utils/validations/danishDictionaryValidator.ts`) ✨

**Comprehensive Danish dictionary data validation for careful data handling**

##### Core Validation Functions

- **`validateDanishDictionary(data, context)`** - Enhanced validation with detailed analysis

  - **Returns**: `ValidationSummary` with complete validation results
  - **Features**: Unknown entity detection, structural validation, type checking
  - **Output**: Detailed issues list with paths and suggestions

- **`extractEnumSuggestions(validationResult)`** - Extract enum suggestions from validation

  - **Returns**: Record of enum names and suggested additions
  - **Purpose**: Identify new types to add to enums

- **`isValidationAcceptable(validationResult)`** - Check if validation passed acceptably
  - **Returns**: Boolean indicating if processing should continue
  - **Logic**: Returns true for warnings only, false for structural errors

##### Validation Result Types

- **`ValidationSummary`** - Complete validation analysis

  - `isValid`: Overall validation status
  - `totalIssues`: Count of all issues found
  - `unknownEntitiesCount`: Count of unknown types/values
  - `structuralIssuesCount`: Count of structural problems
  - `issues`: Detailed array of `ValidationIssue` objects
  - `unknownEntitiesByCategory`: Categorized unknown entities
  - `suggestedEnumAdditions`: Formatted enum additions
  - `contextInfo`: Word text, source, timestamp

- **`ValidationIssue`** - Individual validation issue
  - `category`: Type of issue (labels, partOfSpeech, etc.)
  - `value`: The unknown/problematic value
  - `path`: JSON path to the issue location
  - `context`: Validation context (word text)
  - `severity`: 'error' | 'warning' | 'info'
  - `suggestion`: Recommended action for fix

##### Enhanced Features

- **Comprehensive Type Discovery**: Identifies all unknown enum values
- **Structural Validation**: Validates data structure integrity
- **Path Tracking**: Precise location of issues in data
- **Enum Suggestions**: Ready-to-use enum additions
- **Severity Levels**: Different handling for errors vs warnings
- **Context Awareness**: Links issues to specific words
- **Development Support**: Detailed logging for type discovery

### Other Legacy Actions (`lib/actions/`)

- **`cleanupDatabase()`** - General database cleanup operations
- **`processDanishVariantOnServer(variant, originalWord)`** - Process Danish word variants
- **`processImagesForTranslatedDefinitions(definitions, wordText)`** - Generate images for definitions

---

## 🎯 **NEW USAGE GUIDELINES**

### **Recommended Import Patterns** ✨

```typescript
// ✅ RECOMMENDED: Domain-based imports
import { getWordDetails, updateWordDetails } from '@/core/domains/dictionary';
import { authenticateUser } from '@/core/domains/auth';
import { getUserStats } from '@/core/domains/user';

// ✅ RECOMMENDED: Shared infrastructure
import { handlePrismaError } from '@/core/shared/database';
import { serverLog } from '@/core/infrastructure/monitoring';

// ✅ RECOMMENDED: State management
import { useAppDispatch, store } from '@/core/state';
import { selectUser } from '@/core/state/slices/authSlice';

// ✅ LEGACY: Still works (backward compatible)
import { getWordDetails } from '@/core/lib/actions/dictionaryActions';
```

### **File Organization Best Practices**

1. **🏢 Domain Logic**: Business rules go in `domains/`
2. **🔧 Shared Code**: Reusable utilities go in `shared/`
3. **🏗️ Infrastructure**: Technical configuration in `infrastructure/`
4. **📊 State**: All Redux code in `state/`

### **Before Creating New Functions:**

1. **Check domain structure** - Does your function belong to an existing domain?
2. **Search this documentation** for existing functionality
3. **Use clean imports** - Prefer domain-based imports
4. **Follow size limits** - Keep files under 8KB when possible

### **File Size Guidelines:**

- ✅ **Target**: < 8KB per file
- ✅ **Maximum**: < 25KB (exceptions for complex operations)
- ✅ **Split criterion**: When file serves multiple purposes

---

## 🚀 **OPTIMIZATION BENEFITS**

### **Developer Experience**

- ✅ **Faster Navigation**: Find code by business domain
- ✅ **Better IntelliSense**: Smaller, focused files
- ✅ **Cleaner Imports**: One-line domain imports
- ✅ **Easier Testing**: Cohesive, focused modules

### **Maintainability**

- ✅ **Single Responsibility**: Each file has clear purpose
- ✅ **Domain Separation**: Business logic properly organized
- ✅ **Scalable Architecture**: Easy to extend and modify
- ✅ **Type Safety**: Full TypeScript coverage maintained

### **Team Collaboration**

- ✅ **Clear Ownership**: Teams can own specific domains
- ✅ **Reduced Conflicts**: Less overlap in large files
- ✅ **Easier Onboarding**: Intuitive, logical structure

---

## 🎯 **MIGRATION STATUS**

| Component              | Status            | Notes                               |
| ---------------------- | ----------------- | ----------------------------------- |
| Dictionary Domain      | ✅ **COMPLETED**  | 5 focused files, clean imports      |
| Auth Domain            | ✅ **COMPLETED**  | Domain structure ready              |
| User Domain            | ✅ **COMPLETED**  | Domain structure ready              |
| Translation Domain     | ✅ **COMPLETED**  | Domain structure ready              |
| Shared Infrastructure  | ✅ **COMPLETED**  | Database, services, utils organized |
| State Management       | ✅ **COMPLETED**  | Redux properly organized            |
| Backward Compatibility | ✅ **MAINTAINED** | 100% compatibility preserved        |

---

## 🔧 **Recent Fixes & Updates**

### **TypeScript Compilation Issues - RESOLVED** ✅

**Fixed Issues:**

1. **React Import Syntax**: Updated `shared/types/navigation.ts` to use `import * as React from 'react'` for better compatibility
2. **NextAuth Type Conflicts**: Made `id` property optional in User interface to match NextAuth's base types
3. **Module Resolution**: Removed duplicate external API type declarations to prevent module conflicts
4. **Cache Issues**: Cleared TypeScript build cache (`.next`, `tsconfig.tsbuildinfo`) for clean compilation

**Result**: ✅ **All barrel exports now work correctly**

### **Working Import Patterns** ✨

```typescript
// ✅ CONFIRMED WORKING: Domain-based imports
import {
  WordEntity,
  DefinitionEntity,
  FrequencyRequest,
} from '@/core/domains/dictionary/types';

import { AuthState, SessionUser } from '@/core/domains/auth/types';

import {
  ApiResponse,
  PaginatedResponse,
  LoadingState,
} from '@/core/shared/types';

// ✅ CONFIRMED WORKING: Action imports
import {
  getWordDetails,
  updateWordDetails,
  addWordToUserDictionary,
} from '@/core/domains/dictionary';
```

---

## 🚨 **Important Notes**

1. **🔄 Backward Compatibility**: All legacy imports still work
2. **✨ Modern Patterns**: New code should use domain imports
3. **📊 Performance**: Optimized for React 19 + Next.js 15.3.2
4. **🔒 Type Safety**: Full TypeScript coverage maintained and working
5. **🏗️ Architecture**: Enterprise-grade, scalable structure
6. **✅ Status**: All TypeScript compilation issues resolved

---

## 📚 **Type Definitions** (`types/`)

### **Legacy Types** (maintained for compatibility)

- **`definition.ts`** - Definition-related types
- **`dictionary.ts`** - Dictionary and word types
- **`nav.ts`** - Navigation types
- **`next-auth.d.ts`** - NextAuth type extensions
- **`translationDanishTypes.ts`** - Danish translation types
- **`user.ts`** - User-related types
- **`word.ts`** - Word entity types
- **`wordDefinition.ts`** - Word definition types

### **New Domain Types**

- **Domain-specific types** in respective `domains/*/types/` folders
- **Shared types** in `shared/types/`

---

## 🎉 **CONCLUSION**

**The core folder is now optimized with:**

- 🏢 **Domain-Driven Design** for better organization
- 🔧 **Clean Architecture** with separation of concerns
- 📊 **Modern State Management** using Redux Toolkit
- 🚀 **Performance Optimizations** for React 19 + Next.js 15.3.2
- 🔄 **100% Backward Compatibility** for seamless transition

**Use the new domain-based imports for new code, while legacy imports continue to work!**

---

_Last Updated: 2024 (Post-Optimization + TypeScript Fixes)_
_Version: 2.1 - Optimized Structure with Resolved Type Issues_
_Status: ✅ **Production Ready & TypeScript Compilation Working**_
