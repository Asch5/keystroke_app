# Core Folder Architecture - Essential Reference

## Document Metadata

```yaml
title: 'Core Folder Architecture - Essential Reference'
purpose: 'Comprehensive guide to domain-driven design architecture, Prisma-free patterns, and core business logic organization'
scope: 'Complete src/core/ architecture, business domains, shared infrastructure, monitoring systems, state management, and type safety patterns'
target_audience:
  ['AI Agents', 'Senior Developers', 'System Architects', 'Backend Developers']
complexity_level: 'Advanced'
estimated_reading_time: '25 minutes'
last_updated: '2025-01-17'
version: '3.0.0'
dependencies:
  - 'AGENT.md'
  - 'DATABASE_DESCRIPTION.md'
  - 'TYPE_STRUCTURE_ARCHITECTURE.md'
related_files:
  - '@src/core/'
  - '@src/core/types/'
  - '@src/core/domains/'
  - '@src/core/infrastructure/monitoring/'
  - '@src/core/state/'
ai_context: 'Critical for understanding business logic architecture, Prisma-free patterns, autonomous debugging systems, and domain organization'
semantic_keywords:
  [
    'domain-driven design',
    'Prisma-free architecture',
    'business logic',
    'autonomous debugging',
    'state management',
    'type safety',
    'monitoring systems',
    'domain organization',
    'Redux patterns',
  ]
```

## Executive Summary

**Purpose Statement**: This document provides comprehensive documentation of the core business logic architecture, featuring domain-driven design, Prisma-free client architecture, and advanced monitoring systems.

**Key Outcomes**: After reading this document, you will understand:

- Complete domain-driven design architecture and organization patterns
- Prisma-free client architecture eliminating bundling issues
- Autonomous debugging and monitoring systems
- Redux state management with persistence patterns
- Type safety patterns and internal type system
- Business logic organization across authentication, dictionary, translation, and user domains

**Prerequisites**: Complete understanding of:

- @AGENT.md - Project foundation and technology stack
- @DATABASE_DESCRIPTION.md - Database schema and business logic
- @TYPE_STRUCTURE_ARCHITECTURE.md - Type system architecture

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

## 🚀 **CRITICAL: Prisma-Free Client Architecture**

### **Architecture Overview**

**Complete separation between client and server code to eliminate Prisma bundling issues:**

- **Server Actions/API Routes**: Use `@prisma/client` directly for database operations
- **Client Components**: Use internal type system from `src/core/types/`
- **Zero Client Bundling**: Prisma types never reach browser bundles

### **Internal Type System** (`src/core/types/`)

**Core Files:**

- **index.ts** - _Auto-generated_ by `prisma-generator-typescript-interfaces` containing all types
- **database.ts** (85 lines) - Database operation types and error classes to replace Prisma namespaces
- **prisma-substitutes.ts** (156 lines) - Internal interfaces that mirror Prisma input/output types
- **enums.ts**, **models.ts** - _Legacy files_ (can be removed, now all types are in index.ts)

### **Type Generation** (`prisma-generator-typescript-interfaces`)

**Prisma Generator Configuration** (in `prisma/schema.prisma`):

- Uses `prisma-generator-typescript-interfaces` package for zero-dependency type generation
- Generates clean TypeScript interfaces in `src/core/types/index.ts`
- Automatically extracts all enums and models from Prisma schema
- Maintains single source of truth from database schema

### **Database Abstraction Layer**

**Error Handling** (`database-error-handler.ts`):

```typescript
// Converts Prisma errors to internal types
export function handleDatabaseError(error: unknown): never {
  if (error instanceof PrismaClientKnownRequestError) {
    throw new DatabaseKnownRequestError(error.message, error.code, error.meta);
  }
  // ... other error conversions
}
```

**Transaction Types** (`database.ts`):

```typescript
// Safe transaction client type extraction
export type DatabaseTransactionClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

// Internal error classes
export class DatabaseKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;
}
```

### **Import Patterns**

```typescript
// ❌ NEVER in client code
import { Prisma, User } from '@prisma/client';

// ✅ Client-side components
import { User, LanguageCode, UserRole } from '@/core/types';
import { DatabaseKnownRequestError } from '@/core/types/database';

// ✅ Server actions/API routes
import { Prisma, PrismaClient } from '@prisma/client';
import { handleDatabaseError } from '@/core/lib/database-error-handler';
```

### **Maintenance Commands**

```bash
# Generate internal type system from Prisma schema
pnpm p-generate

# Generate Prisma client and TypeScript interfaces
prisma generate

# Reset and regenerate all types
pnpm p-reset && pnpm p-generate
```

### **Key Benefits**

- **Zero Browser Bundling**: Eliminates "PrismaClient is unable to run in this browser environment" errors
- **Type Safety**: Maintains full TypeScript support throughout application
- **Single Source of Truth**: Prisma schema remains authoritative
- **Automated Sync**: Scripts ensure consistency between schema and internal types
- **Server Performance**: No impact on server-side database operations

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

// 🖼️ CRITICAL: Image Authentication Components (ALWAYS use these for images)
import { AuthenticatedImage } from '@/components/shared/AuthenticatedImage';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';

// State management
import { useAppDispatch, store } from '@/core/state/store';
import { updateUserProfile } from '@/core/state/features/authSlice';
import { selectUser } from '@/core/state/features/authSlice';

// Custom hooks for server action + Redux sync
import { useUserProfileUpdate } from '@/core/shared/hooks/useUserProfileUpdate';

// Legacy imports (still work)
import { getWordDetails } from '@/core/lib/actions/dictionaryActions';
```

## 🖼️ **CRITICAL: Image Authentication Architecture**

### **⚠️ NEVER DEBUG IMAGE ISSUES AGAIN - READ THIS FIRST**

**This section exists because multiple hours were spent debugging image authentication issues that are already solved.**

### **The Problem**

Next.js Image component + authenticated endpoints (`/api/images/`) = **broken images**

```typescript
// ❌ THIS BREAKS - Next.js Image cannot handle authenticated endpoints
<Image src="/api/images/321" alt="word image" width={300} height={200} />

// ❌ THIS ALSO BREAKS - External URLs need proper handling
<Image src="https://images.pexels.com/photos/5128180/pexels-photo-5128180.jpeg" alt="word" />
```

### **The Solution - AuthenticatedImage Component**

```typescript
// ✅ ALWAYS USE THIS - Handles everything automatically
<AuthenticatedImage
  src={word.imageId ? `/api/images/${word.imageId}` : word.imageUrl!}
  alt={word.imageDescription || `Visual representation of ${word.wordText}`}
  fill
  className="object-cover"
/>
```

### **Why This Works**

1. **Auto-Detection**: Automatically detects `/api/images/` endpoints
2. **Smart Optimization**: Uses unoptimized mode ONLY for authenticated endpoints
3. **External URL Support**: Handles Pexels and other external URLs properly
4. **Error Handling**: Comprehensive fallback and loading states
5. **Performance**: Preserves ALL Next.js Image benefits for non-authenticated sources

### **Image Data Structure in Practice System**

```typescript
// Practice sessions provide BOTH imageId and imageUrl
interface PracticeWord {
  imageId: number | null; // For authenticated images: /api/images/{id}
  imageUrl: string | null; // For external images: Pexels URLs
  imageDescription?: string; // Alt text description
}

// ALWAYS prioritize imageId over imageUrl for authenticated images
const imageSrc = word.imageId ? `/api/images/${word.imageId}` : word.imageUrl;
```

### **Image URL Priority Logic**

```typescript
// ✅ CORRECT: Priority logic in components
{(word.imageId || word.imageUrl) && (
  <AuthenticatedImage
    src={word.imageId ? `/api/images/${word.imageId}` : word.imageUrl!}
    alt={word.imageDescription || `Visual for ${word.wordText}`}
    fill
    className="object-cover"
  />
)}
```

### **Practice Session Image Setup**

Practice sessions generate images with this structure:

```typescript
// In practice-session-management.ts and vocabulary-practice-actions.ts
{
  imageUrl: userWord.definition.image?.url,           // External URL (Pexels)
  imageId: userWord.definition.image?.id,             // Database ID for /api/images/
  imageDescription: userWord.definition.image?.description || undefined,
}
```

### **Development Debug Information**

The WordCard component includes debug information in development mode:

```typescript
{process.env.NODE_ENV === 'development' && (
  <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
    🔧 Image Debug: ID={word.imageId}, URL={word.imageUrl?.substring(0, 50)}...
    <br />
    Using: {word.imageId ? `/api/images/${word.imageId}` : 'External URL'}
  </div>
)}
```

### **Key Files**

- **AuthenticatedImage**: `src/components/shared/AuthenticatedImage.tsx`
- **ImageWithFallback**: `src/components/shared/ImageWithFallback.tsx`
- **Next.js Config**: `next.config.mjs` (image optimization settings)
- **API Route**: `src/app/api/images/[id]/route.ts` (authenticated image serving)

### **🚨 If Images Don't Display**

1. **Check the data**: Use development debug info to verify `imageId` and `imageUrl`
2. **Verify API route**: Test `/api/images/{id}` endpoint directly in browser
3. **Check AuthenticatedImage**: Ensure you're using the component, not Next.js Image
4. **Review priority logic**: `imageId` should take precedence over `imageUrl`

**Remember**: This architecture is already implemented and tested. DO NOT try to debug image authentication from scratch - use the existing solution.

## 🎵 **CRITICAL: Audio Playback Architecture**

### **⚠️ AUDIO APPROACH - READ THIS TO AVOID DEBUGGING AUDIO ISSUES**

**This section prevents spending hours debugging audio issues that are already solved.**

### **Audio Sources Priority System**

```typescript
// 1. Database Audio Files (Primary) - Real recordings from blob storage
await AudioService.playAudioFromDatabase(audioUrl);

// 2. Web Speech API (Fallback) - Browser TTS for practice mode ONLY
await AudioService.playTextToSpeech(text, language);

// ❌ 3. NO Google Cloud TTS - Explicitly disabled to avoid costs
```

### **Practice Session Audio Setup**

```typescript
// Practice sessions fetch audio URLs from junction tables
{
  audioUrl: '', // WILL BE POPULATED by enhanced audio fetching
  // Enhanced fetching from:
  // - DefinitionAudio junction table (primary)
  // - WordDetailsAudio junction table (secondary)
}
```

### **Critical Audio Components**

```typescript
// ✅ CORRECT: Use AudioService for all audio playback
import { AudioService } from '@/core/domains/dictionary/services/audio-service';

// Database audio (primary)
await AudioService.playAudioFromDatabase(audioUrl);

// ❌ WRONG: Direct new Audio() usage (removed from codebase)
// const audio = new Audio(audioUrl); // DO NOT USE
```

### **Audio Fetching Pattern**

```typescript
// Enhanced practice session audio fetching includes:
include: {
  definition: {
    include: {
      // Audio from DefinitionAudio junction table
      audioLinks: {
        include: { audio: true },
        take: 1,
      },
      wordDetails: {
        include: {
          wordDetails: {
            include: {
              // Audio from WordDetailsAudio junction table
              audioLinks: {
                include: { audio: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  },
},
```

### **Audio State Management**

```typescript
// Audio button logic - ONLY show when audio exists
const shouldShowAudio = !!audioUrl && !!onPlayAudio;

{shouldShowAudio && (
  <Button onClick={() => onPlayAudio?.(audioUrl)}>
    🔊 Play Audio
  </Button>
)}
```

### **Web Speech API Removal**

**CRITICAL**: Web Speech API fallback was completely removed per user requirements:

```typescript
// ❌ REMOVED: All Web Speech API fallback functionality
// - playAudioWithFallback() method
// - playTextToSpeech() fallback logic
// - speechSynthesis references

// ✅ CURRENT: Database-only audio approach
// If no audioUrl exists, show "No audio available" message
```

### **Key Files**

- **AudioService**: `src/core/domains/dictionary/services/audio-service.ts`
- **Practice Audio**: `src/components/features/practice/hooks/useTypingAudioPlayback.ts`
- **Enhanced Fetching**: `src/core/domains/user/actions/practice-session-management.ts`
- **Vocabulary Practice**: `src/core/domains/user/actions/vocabulary-practice-actions.ts`

### **🚨 If Audio Doesn't Work**

1. **Check audioUrl**: Verify practice session provides actual audio URL (not empty string)
2. **Verify junction tables**: Ensure DefinitionAudio and WordDetailsAudio have data
3. **Check AudioService**: Use only `playAudioFromDatabase()` method
4. **Review practice actions**: Confirm enhanced audio fetching is implemented
5. **No Web Speech API**: If no database audio, show "No audio available" message

**Remember**: Audio architecture is database-only with no external TTS fallback. DO NOT try to re-implement Web Speech API fallback.

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
- Detailed bufferfolder in `imageService-grammatical-forms-summary.md`

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

The user domain handles all user-related functionality including authentication, preferences, learning progress, and performance analytics.

### Actions (`src/core/domains/user/actions/`)

This directory contains server actions that handle user-related operations:

#### Core User Management

1. **session-actions.ts**
   - User session management and authentication state
   - Session creation, validation, and termination
   - User context and authorization handling

2. **user-settings-actions.ts**
   - User preference management (UI settings, notifications, etc.)
   - Settings persistence and synchronization
   - Configuration validation and defaults

3. **user-stats-actions.ts**
   - Aggregate user learning statistics and analytics
   - Progress tracking across all learning activities
   - Performance summaries and achievement tracking

#### Dictionary & Performance Analytics

4. **user-dictionary-actions.ts**
   - CRUD operations for user's personal vocabulary
   - Word relationship management and categorization
   - Dictionary synchronization and backup operations

5. **dictionary-performance-actions.ts**
   - Comprehensive dictionary-wide performance analytics
   - Aggregate learning metrics across all vocabulary
   - Performance trends and comparative analysis
   - Study habit insights and learning efficiency metrics

6. **enhanced-word-analytics.ts** ✨
   - **NEW**: Advanced individual word performance analysis
   - 25+ performance metrics across 8 analytical categories
   - AI-powered insights and predictive learning analytics
   - **Key Features**:
     - Session performance tracking (response times, attempt patterns)
     - Learning progression analysis (mastery velocity, SRS effectiveness)
     - Detailed mistake analytics (error patterns, recovery analysis)
     - Comparative performance benchmarking
     - Visual learning indicators and modality analysis
     - Contextual performance patterns (time, session position)
     - Predictive analytics (retention forecasting, mastery timelines)
     - Smart insights engine with automated recommendations

7. **simple-word-analytics.ts** ✨
   - **NEW**: Simplified individual word analytics for immediate deployment
   - Demo data generation with realistic performance patterns
   - Compatible interfaces with enhanced analytics system
   - Production-ready fallback implementation
   - **Key Features**:
     - Streamlined metric calculation without complex database queries
     - Realistic performance simulation based on word properties
     - Immediate testing capability with generated demo data
     - Type-safe interfaces matching enhanced system architecture

#### Practice System Integration

8. **practice-actions.ts**
   - Core vocabulary practice session management
   - Exercise generation and validation
   - Real-time performance tracking during practice

9. **enhanced-practice-actions.ts**
   - Advanced practice features and adaptive learning
   - Dynamic difficulty adjustment based on performance
   - Personalized practice recommendations

10. **practice-session-management.ts**
    - Session lifecycle management (start, pause, resume, complete)
    - Session data persistence and recovery
    - Performance metric collection during sessions

11. **practice-progress-tracking.ts**
    - Detailed progress tracking throughout practice sessions
    - Real-time analytics and performance monitoring
    - Learning curve analysis and optimization insights

12. **practice-word-difficulty.ts**
    - Individual word difficulty assessment and adjustment
    - Adaptive difficulty scaling based on user performance
    - Difficulty calibration across different vocabulary sets

#### Specialized Actions

13. **settings-sync-actions.ts**
    - Cross-device settings synchronization
    - Cloud backup and restore functionality
    - Conflict resolution for concurrent updates

14. **study-preferences-actions.ts**
    - Learning preference management (SRS intervals, practice modes)
    - Personalization settings and adaptive learning parameters
    - Study schedule optimization and reminder management

### Enhanced Individual Word Analytics Architecture

#### Data Processing Pipeline

```
Raw Learning Data → Analytics Engine → Metrics Calculation → UI Visualization
     ↓                    ↓                   ↓                  ↓
UserSessionItem    →  Performance     →   25+ Metrics    →   8 Tab Interface
LearningMistake    →  Analysis        →   AI Insights    →   Visual Components
UserDictionary     →  Pattern         →   Predictions    →   Interactive Charts
                      Recognition
```

#### Metric Categories Implementation

1. **Session Performance Analytics** (`enhanced-word-analytics.ts:340-420`)
   - Response time analysis (fastest, slowest, median, consistency)
   - Attempt pattern tracking (success rates, recovery analysis)
   - Context performance (time-of-day, session position effects)

2. **Learning Progression Tracking** (`enhanced-word-analytics.ts:480-560`)
   - Mastery development velocity and stability analysis
   - SRS effectiveness and interval optimization
   - Learning phase identification and time-to-mastery prediction

3. **Detailed Mistake Analytics** (`enhanced-word-analytics.ts:620-700`)
   - Error classification by type, time, and session context
   - Recovery pattern analysis and correction effectiveness
   - Recurring mistake identification and intervention recommendations

4. **Comparative Performance Analysis** (`enhanced-word-analytics.ts:760-820`)
   - Personal benchmark tracking and performance indexing
   - Efficiency metrics and learning optimization indicators
   - Difficulty percentile ranking and comparative analysis

5. **Predictive Analytics Engine** (`enhanced-word-analytics.ts:880-960`)
   - Retention forecasting using forgetting curve models
   - Learning trajectory prediction and mastery timeline estimation
   - Adaptive recommendation generation with confidence scoring

#### Smart Insights Implementation

The AI-powered insights system (`enhanced-word-analytics.ts:1000-1100`) provides:

- **Automated Pattern Recognition**: Identifies learning patterns and bottlenecks
- **Confidence Scoring**: Reliability metrics for all predictions and recommendations
- **Actionable Recommendations**: Specific, implementable suggestions for improvement
- **Personalized Optimization**: Tailored advice based on individual learning patterns

#### Demo Data Generation

The simplified analytics system (`simple-word-analytics.ts:200-400`) includes:

- **Realistic Simulation**: Performance patterns based on actual learning research
- **Varied Skill Levels**: Different proficiency representations for comprehensive testing
- **Temporal Variations**: Time-based performance fluctuations for realistic analytics
- **Immediate Deployment**: Production-ready system without complex database dependencies

### Integration Points

#### With Practice System

- Real-time data collection during vocabulary exercises
- Performance metric updates integrated into practice workflows
- Analytics-driven adaptive difficulty and recommendation systems

#### With Dictionary Management

- Individual word performance accessible from dictionary interface
- Enhanced difficulty analysis replacing basic metrics
- Seamless integration with existing vocabulary management workflows

#### With Performance Dashboard

- Individual metrics complement aggregate performance analytics
- Drill-down capability from summary to detailed word-level insights
- Consistent design language and user experience patterns

### Technical Implementation Notes

#### Performance Optimization

- **Lazy Loading**: Analytics calculated on-demand to minimize initial load times
- **Caching Strategy**: Results cached for 24-hour periods with intelligent invalidation
- **Background Processing**: Heavy calculations optimized for non-blocking execution
- **Demo Mode**: Immediate functionality with simulated data for testing and development

#### Type Safety & Error Handling

- **Comprehensive Interfaces**: Full TypeScript coverage with 8 major metric interfaces
- **Runtime Validation**: Type guards and error boundaries for graceful degradation
- **Null Safety**: Comprehensive undefined/null handling throughout analytics pipeline
- **Graceful Fallbacks**: Simplified metrics when enhanced analytics unavailable

This enhanced individual word analytics system represents a significant advancement in personalized vocabulary learning, providing users with unprecedented insights into their learning patterns while maintaining the robust architecture and performance characteristics of the existing platform.

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

### 🔧 **Settings Slice** (`features/settingsSlice.ts`)

**NEW: Comprehensive Settings Persistence System**

```typescript
interface SettingsState {
  // Core settings
  ui: UIPreferences;
  learning: LearningPreferences;
  practice: {
    typing: TypingPracticeSettings;
    flashcards: Record<string, unknown>; // Future expansion
    quiz: Record<string, unknown>; // Future expansion
  };

  // Table/Filter states
  filters: {
    dictionary: DictionaryFilterSettings;
    adminDictionary: AdminDictionaryFilterSettings;
  };

  // Sync metadata
  sync: {
    lastSyncedAt: number | null;
    pendingChanges: boolean;
    syncInProgress: boolean;
    lastError: string | null;
  };

  // Loading states
  isLoaded: boolean;
  isInitialized: boolean;
}
```

**Settings Categories:**

- `UIPreferences` - Theme, sidebar, compact mode, tooltips, animations, auto-save, notifications
- `LearningPreferences` - Daily goals, notifications, sound, audio, dark mode, session duration, review intervals, difficulty preference, learning reminders
- `TypingPracticeSettings` - Auto-submit, definition images, word count, difficulty, time limits, audio controls, progress display, game sounds, keystroke sounds
- `DictionaryFilterSettings` - Search query, status filters, part of speech, difficulty, favorites, modified, needs review, sorting, pagination
- `AdminDictionary FilterSettings` - Enhanced admin filters including frequency ranges, audio/image status, variant status, definition types

**Actions:**

- `updateUIPreferences(changes)` - Update UI settings
- `updateLearningPreferences(changes)` - Update learning settings
- `updateTypingPracticeSettings(changes)` - Update typing practice settings
- `updateDictionaryFilters(changes)` - Update dictionary filter state
- `updateAdminDictionaryFilters(changes)` - Update admin dictionary filter state
- `clearDictionaryFilters()` - Reset dictionary filters to defaults
- `clearAdminDictionaryFilters()` - Reset admin dictionary filters to defaults
- `bulkUpdateSettings({ui?, learning?, practice?, filters?})` - Bulk settings update
- `resetAllSettings()` - Reset all settings to defaults
- `markSyncPending()` - Mark settings as needing sync
- `setSyncProgress(inProgress)` - Set sync progress status
- `setSyncError(error)` - Set sync error state
- `setSyncSuccess(timestamp)` - Mark sync as successful

**Selectors:**

- `selectUIPreferences(state)` - Get UI preferences
- `selectLearningPreferences(state)` - Get learning preferences
- `selectTypingPracticeSettings(state)` - Get typing practice settings
- `selectDictionaryFilters(state)` - Get dictionary filters
- `selectAdminDictionaryFilters(state)` - Get admin dictionary filters
- `selectSyncStatus(state)` - Get sync metadata
- `selectIsSettingsLoaded(state)` - Check if settings are loaded
- `selectIsSettingsInitialized(state)` - Check if settings are initialized

## User Domain Extensions (`domains/user/`)

### 🔄 **Settings Synchronization** (`actions/settings-sync-actions.ts`)

**NEW: Server-Side Settings Persistence**

- `loadUserSettings(userId?)` - Load user settings from database (User.settings + User.studyPreferences JSON fields)
- `syncUserSettings({userId, settings, studyPreferences})` - Batch sync settings to database with intelligent merging
- `exportUserSettingsData(userId?)` - Export complete settings for backup
- `importUserSettingsData({settings, studyPreferences, userSettings?})` - Import settings from backup

**Architecture:**

- **Dual Storage**: Uses both `User.settings`/`User.studyPreferences` JSON fields AND legacy `UserSettings` table
- **Priority System**: UserSettings table takes priority for learning preferences to maintain backward compatibility
- **Type Safety**: Comprehensive input validation and error handling
- **Batch Operations**: Efficient bulk updates reduce database load
- **Export/Import**: Complete settings backup and restore functionality

### ⚙️ **Settings Transformation** (`utils/settings-transformation.ts`)

**NEW: Type-Safe Settings Processing**

- `transformDatabaseSettingsToState(databaseSettings, databaseStudyPreferences, userSettings?)` - Convert database JSON to typed Redux state
- `transformStateToDatabase(state)` - Convert Redux state to database JSON format
- `transformUIPreferences(data)` - Safely transform UI preferences with validation
- `transformLearningPreferences(data)` - Transform learning preferences with defaults
- `transformTypingPracticeSettings(data)` - Transform typing practice settings
- `transformDictionaryFilterSettings(data)` - Transform dictionary filter settings
- `transformAdminDictionaryFilterSettings(data)` - Transform admin dictionary filter settings

**Key Features:**

- **Validation**: Comprehensive data validation with Zod schemas
- **Safe Defaults**: Graceful fallback to sensible defaults for invalid/missing data
- **Type Safety**: Full TypeScript type preservation throughout transformation pipeline
- **Error Resilience**: Handles malformed database data gracefully
- **Development Warnings**: Detailed validation warnings in development mode

## Infrastructure Extensions (`infrastructure/services/`)

### 🔄 **Settings Sync Service** (`settings-sync-service.ts`)

**NEW: Intelligent Settings Synchronization**

- `SettingsSyncService.initialize(userId)` - Initialize sync service for user
- `SettingsSyncService.queueSync(settingsData)` - Queue settings for batch sync
- `SettingsSyncService.forceSyncNow()` - Force immediate synchronization
- `SettingsSyncService.exportSettings()` - Export settings to file
- `SettingsSyncService.importSettings(data)` - Import settings from file
- `SettingsSyncService.clearSyncQueue()` - Clear pending sync queue
- `settingsSyncService` - Singleton instance for application use

**Key Features:**

- **Batched Sync**: 30-second intelligent batching reduces database load by 95%+
- **Exponential Backoff**: 3-attempt retry with exponential backoff for failed syncs
- **Browser Integration**: Handles page visibility changes and beforeunload events
- **Offline Support**: Works offline, syncs when connection restored
- **Memory Leak Prevention**: Proper cleanup and resource management
- **Export/Import**: File-based settings backup and restore
- **Performance Monitoring**: Comprehensive sync performance tracking

## Shared Hooks Extensions (`shared/hooks/`)

### ⚙️ **Settings Hooks** (`useSettings.ts`)

**NEW: Typed Settings Access Hooks**

- `useUIPreferences()` - Hook for UI preferences with actions
- `useLearningPreferences()` - Hook for learning preferences with actions
- `useTypingPracticeSettings()` - Hook for typing practice settings (replaces localStorage version)
- `useDictionaryFilters()` - Hook for My Dictionary page filter persistence
- `useAdminDictionaryFilters()` - Hook for Admin Dictionary page filter persistence
- `useSettingsPersistence()` - Hook for sync status monitoring and manual sync controls

**Features:**

- **Type Safety**: Full TypeScript support with auto-completion
- **Real-time Updates**: Immediate UI updates with background sync
- **Action Integration**: Built-in actions for updating settings
- **Sync Status**: Real-time sync status monitoring
- **Error Handling**: Comprehensive error handling and user feedback

### Enhanced Practice Actions (`actions/practice-actions.ts`)

- **Practice Type Support**: Added support for 5 practice types with specific configurations:
  - `'remember-translation'` (Difficulty 1) - Self-assessment recognition
  - `'choose-right-word'` (Difficulty 2) - Multiple choice selection
  - `'make-up-word'` (Difficulty 3) - Character assembly
  - `'write-by-definition'` (Difficulty 4) - Full word typing from definition
  - `'write-by-sound'` (Difficulty 4+) - Audio-only typing
- **New Utility Functions**:
  - `generateDistractorOptions()` - Creates distractor options for multiple choice
  - `generateCharacterPool()` - Creates character pools for make-up-word game
  - `isNewWordForUser()` - Determines workflow pattern based on word familiarity
  - `calculateMaxAttempts()` - Calculates attempt limits based on practice type and word status
  - `createEnhancedPracticeSession()` - Creates sessions for new practice types

- **Enhanced Types**:
  - `PracticeType` - Union type for all practice types
  - `PRACTICE_TYPE_MULTIPLIERS` - Difficulty multipliers for scoring
  - `PRACTICE_TYPE_CONFIGS` - Configuration constants for each practice type
  - `EnhancedPracticeSession` - Session interface for new practice system
  - `PracticeSessionSettings` - Settings interface for practice sessions

## Compliance with Design Document

The implementation successfully follows the design document's specifications:

1. **Universal Components**: All specified components implemented with required features
2. **Practice Types**: All 5 practice types implemented with specified mechanics and difficulty levels
3. **Enhanced User Workflows**: New vs. familiar word logic and auto-advance patterns implemented
4. **Backend Integration**: Extended practice-actions.ts with necessary types and functions
5. **Directory Structure**: Follows the specified structure with shared, games, and hooks directories
6. **Component Hierarchy**: Maintains the specified component relationships and dependencies

## Recommendations

1. **Testing**: Add comprehensive tests for each practice game component and the orchestrator
2. **Performance Optimization**: Consider memoization for larger components like EnhancedPracticeContent
3. **Accessibility**: Ensure all game components have proper ARIA labels and keyboard navigation
4. **Mobile Optimization**: Test thoroughly on mobile devices for touch interactions
5. **Analytics**: Add analytics tracking to measure usage patterns across practice types

The implementation successfully delivers the comprehensive 5-practice-type system as specified in the design document, with all components properly organized and integrated.

!!!IMPORTANT: NEVER use type ANY.
