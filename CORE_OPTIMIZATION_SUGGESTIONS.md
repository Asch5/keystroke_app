# Core Folder Optimization Suggestions

## 🎯 Current Issues & Optimization Opportunities

### **Problems Identified:**

1. **Mixed Concerns**: Database operations split between `db/` and `actions/`
2. **Large Files**: `dictionaryActions.ts` (35KB) - violates SRP
3. **Inconsistent Organization**: Some domain logic scattered across folders
4. **Type Organization**: All types in one flat folder
5. **Utils Confusion**: Nested utils with some files at root level

---

## 🏗️ **Recommended Optimized Structure**

```
src/core/
├── domains/                    # 🆕 Domain-driven organization
│   ├── auth/
│   │   ├── actions/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   ├── dictionary/
│   │   ├── actions/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   ├── user/
│   │   ├── actions/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   └── translation/
│       ├── actions/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── index.ts
├── shared/                     # 🆕 Shared functionality
│   ├── database/
│   │   ├── client.ts
│   │   ├── middleware/
│   │   ├── error-handler.ts
│   │   └── types/
│   ├── services/              # Cross-domain services
│   │   ├── image/
│   │   ├── frequency/
│   │   └── external-apis/
│   ├── utils/                 # Pure utility functions
│   │   ├── formatting/
│   │   ├── validation/
│   │   ├── logging/
│   │   └── common/
│   ├── hooks/                 # Reusable React hooks
│   ├── constants/             # Application constants
│   └── types/                 # Shared types only
├── infrastructure/             # 🆕 Infrastructure concerns
│   ├── auth/
│   │   ├── config.ts
│   │   ├── providers/
│   │   └── middleware/
│   ├── monitoring/
│   │   ├── logging.ts
│   │   └── error-tracking.ts
│   └── storage/
└── state/                     # 🆕 Global state management
    ├── store.ts
    ├── slices/
    │   ├── auth.ts
    │   ├── user-dictionary.ts
    │   └── theme.ts
    └── middleware/
```

---

## 🔄 **Migration Strategy**

### **Phase 1: Domain Separation**

```bash
# Create domain-based structure
mkdir -p src/core/domains/{auth,dictionary,user,translation}
mkdir -p src/core/shared/{database,services,utils,hooks,constants,types}
mkdir -p src/core/infrastructure/{auth,monitoring,storage}
mkdir -p src/core/state/{slices,middleware}
```

### **Phase 2: Move Files by Domain**

#### **Auth Domain**

```typescript
// src/core/domains/auth/actions/index.ts
export { authenticate, signUp } from './auth-actions';
export type { StateAuth, StateSignup } from './types';

// src/core/domains/auth/services/index.ts
export { AuthService } from './auth-service';

// src/core/domains/auth/types/index.ts
export type { User, Session, AuthConfig } from './auth-types';
```

#### **Dictionary Domain**

```typescript
// src/core/domains/dictionary/actions/index.ts
export {
  fetchDictionaryWords,
  getWordDetails,
  updateWord,
} from './word-actions';
export { processDanishVariant } from './danish-actions';

// Split large dictionaryActions.ts into:
// - word-actions.ts (basic CRUD)
// - word-details-actions.ts (complex operations)
// - danish-actions.ts (Danish-specific)
// - frequency-actions.ts (frequency operations)
```

---

## 📁 **Detailed Folder Explanations**

### **1. `/domains/` - Domain-Driven Design**

**Purpose**: Organize code by business domain, not technical layer

**Benefits**:

- ✅ High cohesion within domains
- ✅ Clear boundaries
- ✅ Easier to maintain and test
- ✅ Team ownership per domain

**Structure Example**:

```typescript
// src/core/domains/dictionary/index.ts
export * from './actions';
export * from './services';
export * from './types';
export * from './utils';

// Clean imports throughout the app:
import { getWordDetails, WordDetails } from '@/core/domains/dictionary';
```

### **2. `/shared/` - Cross-Domain Functionality**

**Purpose**: Reusable components that multiple domains need

**Database Example**:

```typescript
// src/core/shared/database/client.ts
export { prisma } from './prisma-client';
export { withTransaction } from './transaction-helper';

// src/core/shared/database/middleware/index.ts
export { performanceMiddleware } from './performance';
export { errorHandlingMiddleware } from './error-handling';
```

### **3. `/infrastructure/` - Technical Concerns**

**Purpose**: Non-business logic like auth config, monitoring

**Auth Config Example**:

```typescript
// src/core/infrastructure/auth/config.ts
export const authConfig = {
  // NextAuth configuration
};

// src/core/infrastructure/monitoring/logging.ts
export class Logger {
  // Centralized logging
}
```

### **4. `/state/` - Global State Management**

**Purpose**: Centralized Redux configuration

**Benefits**:

- ✅ Clear separation from business logic
- ✅ Easy to configure middleware
- ✅ Type-safe state management

---

## 🎯 **File Size & Complexity Guidelines**

### **Split Large Files**

```typescript
// ❌ Current: dictionaryActions.ts (35KB)
// ✅ Proposed split:

// word-crud-actions.ts (~8KB)
export async function fetchDictionaryWords() {}
export async function updateWord() {}

// word-details-actions.ts (~10KB)
export async function getWordDetails() {}
export async function updateWordDetails() {}

// frequency-actions.ts (~5KB)
export async function mapWordFrequency() {}

// danish-word-actions.ts (~8KB)
export async function processDanishVariant() {}

// audio-actions.ts (~4KB)
export async function createAudioForWord() {}
```

### **File Size Targets**

- ✅ **Actions**: Max 300 lines (~8KB)
- ✅ **Services**: Max 200 lines (~5KB)
- ✅ **Utils**: Max 100 lines (~3KB)
- ✅ **Types**: Max 150 lines (~4KB)

---

## 🔧 **Utility Organization**

### **Current Issues**

```
utils/
├── wordDetailsAdapter.ts        # Domain-specific
├── commonDictUtils/            # Domain-specific
├── danishDictionary/           # Domain-specific
├── dbUtils/                    # Infrastructure
└── validations/                # Could be shared
```

### **Optimized Organization**

```typescript
// 🎯 Domain-specific utils
domains/dictionary/utils/
├── word-adapter.ts
├── frequency-utils.ts
└── danish-utils.ts

// 🎯 Shared utils
shared/utils/
├── validation/
│   ├── schema-validator.ts
│   └── input-sanitizer.ts
├── formatting/
│   ├── text-formatter.ts
│   └── date-formatter.ts
└── common/
    ├── array-helpers.ts
    └── object-helpers.ts

// 🎯 Infrastructure utils
shared/database/utils/
├── cleanup-utils.ts
└── migration-utils.ts
```

---

## 🏃‍♂️ **Implementation Strategy**

### **Step 1: Create New Structure (Non-breaking)**

```bash
# Create new folders without moving existing files
mkdir -p src/core/domains/{auth,dictionary,user,translation}
mkdir -p src/core/shared/{database,services,utils}
```

### **Step 2: Gradual Migration**

```typescript
// Start with new files in new structure
// src/core/domains/dictionary/actions/word-crud.ts
export async function createWord() {
  // New functionality here
}

// Re-export from old location for compatibility
// src/core/lib/actions/dictionaryActions.ts
export { createWord } from '@/core/domains/dictionary/actions';
```

### **Step 3: Update Imports Gradually**

```typescript
// ❌ Old import
import { getWordDetails } from '@/core/lib/actions/dictionaryActions';

// ✅ New import
import { getWordDetails } from '@/core/domains/dictionary';
```

### **Step 4: Remove Old Files**

Once all imports are updated, remove old files.

---

## 📊 **Benefits of This Structure**

### **Developer Experience**

- ✅ **Faster navigation**: Find code by domain, not layer
- ✅ **Better IntelliSense**: Smaller, focused files
- ✅ **Cleaner imports**: Domain-based imports
- ✅ **Easier testing**: Test entire domains

### **Maintainability**

- ✅ **Single Responsibility**: Each file has one clear purpose
- ✅ **Loose Coupling**: Domains are independent
- ✅ **High Cohesion**: Related code stays together
- ✅ **Scalability**: Easy to add new domains

### **Team Collaboration**

- ✅ **Clear Ownership**: Teams can own domains
- ✅ **Reduced Conflicts**: Less overlap in files
- ✅ **Easier Onboarding**: Clear structure to understand

---

## 🚀 **Advanced Optimizations**

### **Barrel Exports**

```typescript
// src/core/domains/dictionary/index.ts
export * from './actions';
export * from './services';
export * from './types';
export * from './utils';

// Clean imports:
import {
  getWordDetails,
  WordDetails,
  WordService,
} from '@/core/domains/dictionary';
```

### **Type-Safe Boundaries**

```typescript
// src/core/domains/dictionary/types/boundaries.ts
export interface DictionaryDomain {
  actions: typeof import('./actions');
  services: typeof import('./services');
}

// Prevents accidental cross-domain imports
```

### **Domain Events**

```typescript
// src/core/domains/dictionary/events/word-events.ts
export class WordCreatedEvent {
  constructor(public readonly wordId: string) {}
}

// Enable domain communication without tight coupling
```

---

## ⚡ **Quick Wins - Start Here**

1. **Split `dictionaryActions.ts`** into 4-5 smaller files
2. **Move domain-specific utils** to domain folders
3. **Create barrel exports** for cleaner imports
4. **Establish file size limits** and enforce them
5. **Use absolute imports** with domain paths

---

## 🎯 **Success Metrics**

- ✅ **Average file size** < 8KB
- ✅ **Import depth** < 3 levels
- ✅ **Cross-domain imports** = 0
- ✅ **Build time** improvement
- ✅ **Developer satisfaction** surveys

---

_This structure follows React 19, Next.js 15.3.2, and enterprise-level best practices for scalable applications._
