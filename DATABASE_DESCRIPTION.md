# Database Architecture & Design Guide

This document provides a comprehensive overview of the database schema, design principles, and key business logic. It should be read alongside `prisma/schema.prisma` for a complete understanding. This guide explains the **"why"** and **"how"** behind the data model, while the schema file provides the technical **"what."**

## 1. Core Philosophy & Design Principles

- **Definition-Centric Model:** The core of the user's learning experience revolves around the `Definition` model, not just the `Word` model. When a user adds a "word" to their dictionary, they are actually adding a specific `Definition` of that word. This allows for granular learning (e.g., learning the noun form of "run" separately from the verb form).
- **Separation of Public vs. User Data:** The schema strictly separates public, immutable data (e.g., `List`, `Word`, `Definition`) from user-specific, mutable data (e.g., `UserList`, `UserDictionary`). This prevents users from altering master dictionary content and allows for personal customization.
- **Normalized Media and Translations:** `Audio`, `Image`, and `Translation` are separate models linked via junction tables. This is a highly efficient design that allows a single asset (like an audio file) to be reused across multiple definitions or examples, reducing storage and simplifying updates.
- **Soft Deletes:** Most user-generated content (e.g., `UserList`, `UserDictionary`) uses a `deletedAt` field for soft deletes, allowing for data recovery and preserving user history.

## 2. High-Level Data Domains

The schema is organized into the following logical domains:

- **User & Authentication:** Manages user identity, settings, and application preferences.
- **Dictionary Content (The "Master" Dictionary):** Contains the master definitions, words, examples, and media from various sources. This is the application's core knowledge base.
- **User Learning & Progress (The "Personal" Dictionary):** Tracks an individual user's journey, vocabulary, lists, and performance.
- **Relationships & Connections:** The glue that connects the other domains, defining how words and definitions relate to each other.
- **Gamification & Social:** Models related to user achievements and group learning.

## 3. Domain-by-Domain Model Deep Dive

This section provides a detailed breakdown of the models within each domain.

### A. User & Authentication

_Purpose: To manage user identity, authentication, and global preferences._

- **`User`**: The central model for a user account. It stores credentials, language preferences (`baseLanguageCode`, `targetLanguageCode`), and role.
- **`UserSettings`**: A one-to-one extension of `User` for storing fine-grained, configurable settings like daily goals, notification toggles, and theme preferences.

### B. Dictionary Content (The "Master" Dictionary)

_Purpose: To store the rich, multi-source dictionary data that users will learn from._

- **`Word`**: Represents a unique word string in a specific language (e.g., the text "run" in English). This is the highest-level container.
- **`WordDetails`**: Represents a word's specific grammatical role. For example, the `Word` "run" might have two `WordDetails` entries: one for `PartOfSpeech.noun` and one for `PartOfSpeech.verb`. This is where `partOfSpeech` and `gender` are stored.
- **`Definition`**: The specific meaning of a `WordDetails` entry. This is the atomic unit of learning for a user. It contains the definition text, usage notes, and links to examples and media.
- **`DefinitionExample`**: An illustrative sentence that demonstrates the usage of a `Definition`.
- **`Audio`, `Image`, `Translation`**: These are normalized, reusable assets. A single `Audio` file can be linked to multiple definitions or examples via junction tables (`DefinitionAudio`, `ExampleAudio`).

### C. User Learning & Progress (The "Personal" Dictionary)

_Purpose: To track everything about a specific user's learning journey._

- **`UserDictionary`**: **The cornerstone of user progress.** A record here links a `User` to a specific `Definition` they have chosen to learn. It tracks their mastery (`learningStatus`), Spaced Repetition System (SRS) data (`srsLevel`, `nextSrsReview`), personal notes, and performance metrics (`correctStreak`, `amountOfMistakes`).
- **`UserList`**: A user's personal vocabulary list. It can be a customized copy of a public `List` or one they created from scratch. It is populated by `UserListWord` records.
- **`UserListWord`**: A junction table that links a `UserList` to a `UserDictionary` entry, defining which of the user's learned words belong to which personal list.
- **`UserLearningSession`**: A record of a single study period (e.g., a 15-minute review session). It captures the start/end times, score, and number of correct/incorrect answers.
- **`LearningMistake`**: Logs every time a user makes a mistake with a specific word or definition. This data is crucial for identifying "difficult words" and tailoring future review sessions.

### D. Relationships & Connections

_Purpose: To create the rich, interconnected web of linguistic data._

This is a critical domain to understand. It defines how words and definitions relate to each other beyond the simple parent/child hierarchy.

- **`WordToWordRelationship`**: Links one `Word` to another. Primarily used for direct inflections.
  - _Example:_ `(Word) begin` → `(Word) began` (type: `past_tense_en`).
- **`WordDetailsRelationship`**: Links one `WordDetails` to another. Useful for connecting different parts of speech of the same word.
  - _Example:_ `(Noun) book` → `(Verb) book` (type: `related`).
- **`DefinitionRelationship`**: Links one `Definition` to another. This is the most common relationship type for semantic connections.
  - _Example:_ `(Definition) 'happy'` → `(Definition) 'joyful'` (type: `synonym`).
- **`DefinitionToWordRelationship`**: Links a `Definition` to a `Word`. Useful for "see also" type references.
  - _Example:_ `(Definition) 'a tool for hitting nails'` → `(Word) hammer`.

## 4. Key Business Logic In-Depth

### The `Word` -> `WordDetails` -> `Definition` Hierarchy

It is crucial to understand this flow, as it dictates how content is structured and queried:

1.  A **`Word`** is just the text (e.g., "book").
2.  That `Word` has one or more **`WordDetails`** records, which represent its different grammatical roles (e.g., the noun "book", the verb "book"). `WordDetails` stores the `partOfSpeech`.
3.  Each `WordDetails` is linked to one or more **`Definition`**s via the `WordDefinition` junction table (e.g., the noun "book" can mean "a written work" or "a record of bets").

### The `List` vs. `UserList` System

This is a core concept for organizing vocabulary:

- **`List`**: A public, read-only collection of `Definition`s created by admins (e.g., "Top 100 Business English Words"). This is a **template**.
- **`UserList`**: A user's personal list. It can be:
  1.  A **"copy"** of a public `List`. The `listId` field on `UserList` links it back to the original `List` template.
  2.  A **brand new list** created from scratch by the user. In this case, `listId` is `null`.

## 5. Common Query Patterns & Best Practices

### Fetching a User's Word with the Correct Display Definition

To display a word correctly for a user (showing translations if their native language is different), you must fetch their `UserDictionary` entry and include the definition along with its translations.

```typescript
// Example: Fetching a UserDictionary item for display
const userWord = await prisma.userDictionary.findFirst({
  where: { userId: 'user-id-123', id: 'user-dictionary-id-456' },
  include: {
    definition: {
      include: {
        image: true, // Include the associated image
        translationLinks: {
          include: {
            translation: true, // Include the actual translation content
          },
        },
        wordDetails: {
          include: {
            word: true, // Include the top-level word text
          },
        },
      },
    },
  },
});
```

### Finding Related Words (e.g., Synonyms)

To find synonyms for a given definition, you query through the `DefinitionRelationship` model.

```typescript
const definitionId = 123; // The ID of the definition for 'happy'
const synonyms = await prisma.definitionRelationship.findMany({
  where: {
    fromDefinitionId: definitionId,
    type: 'synonym',
  },
  include: {
    toDefinition: true, // This includes the full definition object of the synonym
  },
});
// synonyms will be an array where each item contains the definition of a synonym like 'joyful', 'elated', etc.
```

### Querying for Soft-Deleted Items

When querying for user data, remember to filter out soft-deleted records unless you are building a "trash" or "archive" feature.

```typescript
const activeUserLists = await prisma.userList.findMany({
  where: {
    userId: 'user-id-123',
    deletedAt: null, // This is the crucial filter
  },
});
```
