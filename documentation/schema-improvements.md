# Schema Improvements Documentation

This document outlines the improvements made to the database schema to enhance performance, data integrity, and feature support.

## 1. Performance Optimizations

### 1.1 Full-Text Search with tsVector

```prisma
model Word {
  // ...
  searchVector   Unsupported("tsvector") @default(dbgenerated("to_tsvector('english', coalesce(word, ''))")) @map("search_vector")
  // ...

  @@index([searchVector], type: Gin, map: "idx_word_search_vector")
}
```

**Benefits:**

- Enables fast linguistic-aware text search
- Supports language-specific stemming and tokenization
- Indexed using GIN for efficient query performance
- Significantly faster than LIKE queries for text search

**Implementation Notes:**

- Requires PostgreSQL extensions (pg_trgm)
- Search queries should use `to_tsquery` for best performance
- Can be expanded to include additional fields in the search vector

### 1.2 Denormalized Word Counts

```prisma
model List {
  // ...
  wordCount        Int  @default(0) @map("wordCount")
  learnedWordCount Int  @default(0) @map("learned_word_count")
  // ...
}
```

**Benefits:**

- Avoids expensive COUNT queries when displaying lists
- Enables quick calculation of learning progress percentages
- Improves UI responsiveness for list displays

**Implementation Notes:**

- Must be updated whenever words are added/removed from a list
- Should implement triggers or application logic to maintain consistency

### 1.3 Strategic Indexing for Learning Algorithms

```prisma
model UserDictionary {
  // ...
  @@index([userId, learningStatus], map: "idx_learning_status")
  @@index([userId, nextReviewDue], map: "idx_next_review")
  @@index([userId, progress], map: "idx_progress")
  @@index([userId, correctStreak], map: "idx_streak")
  // ...
}
```

**Benefits:**

- Optimizes spaced repetition algorithm queries
- Enables fast retrieval of words due for review
- Supports efficient sorting by learning progress
- Improves performance of learning analytics

## 2. Schema Enhancements

### 2.1 Version Tracking for Dictionary Entries

```prisma
model MainDictionary {
  // ...
  version             Int      @default(1) @map("version")
  versionNotes        String?  @map("version_notes") @db.VarChar(500)
  lastVersionUpdate   DateTime? @map("last_version_update")
  // ...

  @@index([version, wordId], map: "idx_version_tracking")
}
```

**Benefits:**

- Supports audit trails for dictionary content changes
- Enables rollback to previous definitions if needed
- Allows tracking of content quality improvements over time
- Facilitates contributor attribution for crowdsourced content

### 2.2 Learning Status Enum

```prisma
enum LearningStatus {
  notStarted
  inProgress
  learned
  needsReview
  difficult
}

model UserDictionary {
  // ...
  learningStatus  LearningStatus  @default(notStarted) @map("learning_status")
  // ...
}
```

**Benefits:**

- Replaces multiple boolean flags with a single enum
- Improves code readability and maintainability
- Ensures only valid status combinations are possible
- Makes queries more intuitive

### 2.3 User Learning Sessions Model

```prisma
model UserLearningSession {
  id                    String       @id @default(uuid()) @db.Uuid
  // ... fields for tracking study activity ...
  sessionItems          UserSessionItem[]
  // ... relationships ...

  @@index([userId, startTime], map: "idx_user_sessions_by_date")
  @@index([userId, sessionType], map: "idx_user_sessions_by_type")
}
```

**Benefits:**

- Enables detailed analytics on learning patterns
- Supports gamification features (streaks, achievements)
- Provides data for personalized learning recommendations
- Facilitates A/B testing of learning methods

### 2.4 Structured User Settings

```prisma
model UserSettings {
  id                    String    @id @default(uuid()) @db.Uuid
  userId                String    @unique @map("user_id") @db.Uuid
  dailyGoal             Int       @default(5) @map("daily_goal")
  // ... specific settings fields ...
  user                  User      @relation(fields: [userId], references: [id])
}
```

**Benefits:**

- Replaces generic JSON fields with typed columns
- Improves query capabilities on settings
- Enhances data validation and integrity
- Makes settings documentation more explicit

## 3. Implementation Guidelines

### 3.1 Database Extensions

The schema now requires PostgreSQL extensions:

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgVector(map: "vector"), pg_trgm]
}
```

These must be enabled on your PostgreSQL instance.

### 3.2 Migration Considerations

When applying these changes to an existing database:

1. **Data Preservation:** These changes should be non-destructive to existing data
2. **Backfilling:** New fields need to be populated for existing records
3. **Indexing Performance:** Creating new indexes may lock tables briefly
4. **Application Changes:** Update application code to leverage new structures

### 3.3 Performance Monitoring

After implementing these changes, monitor:

- Query execution times
- Index usage statistics
- Cache hit rates
- Database size growth

### 3.4 Future Optimizations

Potential next steps:

- Implement database partitioning for large tables
- Consider materialized views for complex analytics
- Evaluate columnar storage for historical data
- Implement row-level security policies
