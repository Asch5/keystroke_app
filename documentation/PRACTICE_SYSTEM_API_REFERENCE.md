# Practice System API Reference

## Quick Start

```typescript
import {
  createPracticeSession,
  validateTypingInput,
  completePracticeSession,
  updateDailyProgress,
  getSRSReviewSchedule,
} from '@/core/domains/user/actions/practice-actions';
```

## Session Management

### createPracticeSession

Creates a new practice session with specified configuration.

```typescript
createPracticeSession(
  userId: string,
  config: SessionConfiguration
): Promise<{
  success: boolean;
  sessionId?: string;
  words?: PracticeWord[];
  error?: string;
}>
```

**Example**:

```typescript
const result = await createPracticeSession(userId, {
  practiceType: 'typing',
  wordsToStudy: 20,
  targetLanguageCode: 'da',
  settings: {
    autoPlayAudio: true,
    enableGameSounds: true,
    showHints: true,
    allowSkipping: false,
  },
});
```

### completePracticeSession

Completes a session and calculates final statistics.

```typescript
completePracticeSession(sessionId: string): Promise<{
  success: boolean;
  sessionResult?: PracticeSessionResult;
  error?: string;
}>
```

### updateSessionProgress

Updates session progress in real-time.

```typescript
updateSessionProgress(
  sessionId: string,
  wordCompleted: boolean,
  isCorrect: boolean
): Promise<{
  success: boolean;
  progress?: {
    wordsStudied: number;
    correctAnswers: number;
    incorrectAnswers: number;
    completionPercentage: number;
    currentAccuracy: number;
  };
  error?: string;
}>
```

## Input Validation

### validateTypingInput

Comprehensive input validation with full system integration.

```typescript
validateTypingInput(request: ValidateTypingRequest): Promise<{
  success: boolean;
  result?: ValidationResult;
  error?: string;
}>
```

**Request Interface**:

```typescript
interface ValidateTypingRequest {
  sessionId: string;
  userDictionaryId: string;
  userInput: string;
  responseTime: number; // milliseconds
}
```

**Response Interface**:

```typescript
interface ValidationResult {
  isCorrect: boolean;
  accuracy: number;
  partialCredit: boolean;
  pointsEarned: number;
  feedback: string;
  updatedProgress?: {
    newLearningStatus: LearningStatus;
    newProgress: number;
    newMasteryScore: number;
  };
}
```

## Spaced Repetition System (SRS)

### getSRSReviewSchedule

Get 7-day review schedule for a user.

```typescript
getSRSReviewSchedule(
  userId: string,
  days?: number
): Promise<{
  success: boolean;
  schedule?: Array<{
    date: string;
    wordsCount: number;
    words: Array<{
      userDictionaryId: string;
      wordText: string;
      srsLevel: number;
      nextReview: Date;
      priority: 'overdue' | 'due' | 'upcoming';
    }>;
  }>;
  error?: string;
}>
```

### getSRSStatistics

Get comprehensive SRS statistics.

```typescript
getSRSStatistics(userId: string): Promise<{
  success: boolean;
  statistics?: {
    totalWords: number;
    overdueWords: number;
    dueToday: number;
    dueTomorrow: number;
    levelDistribution: Record<number, number>;
    averageInterval: number;
    streakDays: number;
    reviewAccuracy: number;
  };
  error?: string;
}>
```

### createSRSPracticeSession

Create optimized practice session based on SRS scheduling.

```typescript
createSRSPracticeSession(
  userId: string,
  maxWords?: number,
  prioritizeOverdue?: boolean
): Promise<{
  success: boolean;
  words?: PracticeWord[];
  sessionInfo?: {
    overdueCount: number;
    dueCount: number;
    newCount: number;
  };
  error?: string;
}>
```

## Progress Tracking

### updateDailyProgress

Update daily progress with achievements.

```typescript
updateDailyProgress(
  userId: string,
  minutesStudied: number,
  wordsLearned?: number,
  sessionCompleted?: boolean
): Promise<{
  success: boolean;
  progress?: {
    date: Date;
    minutesStudied: number;
    wordsLearned: number;
    streakDays: number;
    isNewRecord: boolean;
    achievements: string[];
  };
  error?: string;
}>
```

### getDailyProgressHistory

Get user's progress history with summary.

```typescript
getDailyProgressHistory(
  userId: string,
  days?: number
): Promise<{
  success: boolean;
  history?: Array<{
    date: Date;
    minutesStudied: number;
    wordsLearned: number;
    streakDays: number;
    isStreakDay: boolean;
  }>;
  summary?: {
    totalDays: number;
    totalMinutes: number;
    totalWords: number;
    currentStreak: number;
    longestStreak: number;
    averageMinutesPerDay: number;
    averageWordsPerDay: number;
  };
  error?: string;
}>
```

### getWeeklyProgressSummary

Get weekly progress trends and goal tracking.

```typescript
getWeeklyProgressSummary(
  userId: string,
  weeksBack?: number
): Promise<{
  success: boolean;
  weeks?: Array<{
    weekStart: Date;
    weekEnd: Date;
    totalMinutes: number;
    totalWords: number;
    activeDays: number;
    streakDays: number;
    averageMinutesPerDay: number;
    averageWordsPerDay: number;
    goalsMet: {
      minuteGoal: boolean;
      wordGoal: boolean;
      consistencyGoal: boolean;
    };
  }>;
  comparison?: {
    minutesChange: number;
    wordsChange: number;
    streakChange: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  error?: string;
}>
```

## Analytics

### getLearningAnalytics

Get comprehensive learning analytics.

```typescript
getLearningAnalytics(
  userId: string,
  timeframe?: 'day' | 'week' | 'month' | 'all'
): Promise<{
  success: boolean;
  analytics?: LearningAnalytics;
  error?: string;
}>
```

**LearningAnalytics Interface**:

```typescript
interface LearningAnalytics {
  timeframe: 'day' | 'week' | 'month' | 'all';
  totalSessions: number;
  completedSessions: number;
  totalWordsStudied: number;
  totalWordsLearned: number;
  totalTimeMinutes: number;
  averageAccuracy: number;
  currentStreak: number;
  practiceTypeStats: Record<
    string,
    {
      count: number;
      totalWords: number;
      accuracy: number;
    }
  >;
  mistakeTypes: Record<string, number>;
  dailyProgress: Array<{
    date: Date;
    minutesStudied: number;
    wordsLearned: number;
    streakDays: number;
  }>;
  improvementRate: number;
  difficultyProgression: Array<{
    date: Date;
    averageDifficulty: number;
    accuracy: number;
  }>;
}
```

### analyzeDifficultWords

Analyze user's most difficult words with recommendations.

```typescript
analyzeDifficultWords(
  userId: string,
  limit?: number
): Promise<{
  success: boolean;
  analysis?: DifficultyAnalysis;
  error?: string;
}>
```

## Session Analytics

### getSessionAnalytics

Get detailed analytics for a specific session.

```typescript
getSessionAnalytics(sessionId: string): Promise<{
  success: boolean;
  analytics?: {
    duration: number;
    averageResponseTime: number;
    accuracyTrend: number[];
    difficultyProgression: number[];
    timeSpentPerWord: number;
    learningEfficiency: number;
    mistakePatterns: Record<string, number>;
    strongestAreas: string[];
    areasForImprovement: string[];
  };
  error?: string;
}>
```

### getEnhancedSessionSummary

Get comprehensive session summary with insights.

```typescript
getEnhancedSessionSummary(sessionId: string): Promise<{
  success: boolean;
  summary?: {
    basicStats: {
      duration: number;
      totalWords: number;
      correctAnswers: number;
      accuracy: number;
      score: number;
    };
    performance: {
      averageResponseTime: number;
      fastestResponse: number;
      slowestResponse: number;
      consistencyScore: number;
    };
    learning: {
      wordsLearned: number;
      newWordsMastered: number;
      reviewWordsImproved: number;
      masteryProgression: number;
    };
    insights: {
      strongestCategories: string[];
      challengingCategories: string[];
      timeEfficiency: string;
      accuracyTrend: string;
    };
  };
  error?: string;
}>
```

## Unified Practice System

### createUnifiedPracticeSession

Create intelligent practice session with dynamic exercise selection.

```typescript
createUnifiedPracticeSession(
  userId: string,
  config: SessionConfiguration
): Promise<{
  success: boolean;
  session?: UnifiedPracticeSession;
  error?: string;
}>
```

### determineExerciseType

Determine optimal exercise type for a word based on mastery.

```typescript
determineExerciseType(
  userDictionary: UserDictionary,
  userSettings?: Record<string, unknown>
): Promise<{
  exerciseType: PracticeType;
  reasoning: string;
  confidence: number;
}>
```

## Progressive Learning

### updateWordProgression

Update word progression through levels 0-5.

```typescript
updateWordProgression(
  userDictionaryId: string,
  isCorrect: boolean
): Promise<{
  success: boolean;
  progression?: {
    previousLevel: number;
    newLevel: number;
    levelChanged: boolean;
    newLearningStatus: LearningStatus;
    nextExerciseType: PracticeType;
  };
  error?: string;
}>
```

## Game Utilities

### generateDistractorOptions

Generate multiple choice distractors.

```typescript
generateDistractorOptions(options: {
  correctWord: string;
  targetLanguageCode: LanguageCode;
  baseLanguageCode: LanguageCode;
  partOfSpeech?: string;
}): Promise<string[]>
```

### generateCharacterPool

Generate character pool for word building exercises.

```typescript
generateCharacterPool(options: {
  correctWord: string;
  targetLanguageCode: LanguageCode;
  baseLanguageCode: LanguageCode;
  extraCharacters?: number;
}): Promise<string[]>
```

## Error Handling

All functions return a consistent error structure:

```typescript
{
  success: false,
  error: string // Human-readable error message
}
```

Common error types:

- `"User not found"`
- `"Session not found"`
- `"Invalid configuration"`
- `"Database connection error"`
- `"Insufficient permissions"`

## TypeScript Interfaces

### Core Types

```typescript
type PracticeType =
  | 'typing'
  | 'choose-right-word'
  | 'make-up-word'
  | 'remember-translation'
  | 'write-by-definition'
  | 'write-by-sound'
  | 'unified-practice';

type LearningStatus = 'new' | 'inProgress' | 'learned' | 'mastered';

type LanguageCode = 'en' | 'da' | 'sv' | 'no' | 'de' | 'fr' | 'es' | 'it';
```

### Configuration Types

```typescript
interface SessionConfiguration {
  practiceType: PracticeType;
  wordsToStudy: number;
  difficulty?: number;
  targetLanguageCode: LanguageCode;
  timeLimit?: number;
  listId?: string | null;
  userListId?: string | null;
  settings: {
    autoPlayAudio: boolean;
    enableGameSounds: boolean;
    showHints: boolean;
    allowSkipping: boolean;
  };
  enabledExerciseTypes?: string[];
}
```

## Usage Examples

### Complete Practice Flow

```typescript
// 1. Create session
const session = await createPracticeSession(userId, {
  practiceType: 'unified-practice',
  wordsToStudy: 20,
  targetLanguageCode: 'da',
  settings: {
    autoPlayAudio: true,
    enableGameSounds: true,
    showHints: true,
    allowSkipping: false,
  },
});

if (!session.success) {
  throw new Error(session.error);
}

// 2. Practice loop
for (const word of session.words!) {
  // User provides input
  const validation = await validateTypingInput({
    sessionId: session.sessionId!,
    userDictionaryId: word.userDictionaryId,
    userInput: userInput,
    responseTime: responseTime,
  });

  // Update session progress
  await updateSessionProgress(
    session.sessionId!,
    true, // word completed
    validation.result!.isCorrect,
  );
}

// 3. Complete session
const result = await completePracticeSession(session.sessionId!);

// 4. Update daily progress
await updateDailyProgress(
  userId,
  result.sessionResult!.totalTime / 60000, // convert to minutes
  result.sessionResult!.wordsLearned,
  true, // session completed
);
```

### SRS Review Session

```typescript
// Get SRS schedule
const schedule = await getSRSReviewSchedule(userId, 7);

// Create SRS-optimized session
const srsSession = await createSRSPracticeSession(userId, 20, true);

console.log(`Review session created with:
- Overdue words: ${srsSession.sessionInfo!.overdueCount}
- Due today: ${srsSession.sessionInfo!.dueCount}
- New words: ${srsSession.sessionInfo!.newCount}`);
```

### Progress Dashboard

```typescript
// Get comprehensive analytics
const analytics = await getLearningAnalytics(userId, 'week');
const weeklyProgress = await getWeeklyProgressSummary(userId, 4);
const srsStats = await getSRSStatistics(userId);

// Display dashboard data
console.log(`Weekly Summary:
- Total time: ${analytics.analytics!.totalTimeMinutes} minutes
- Words learned: ${analytics.analytics!.totalWordsLearned}
- Current streak: ${analytics.analytics!.currentStreak} days
- SRS overdue: ${srsStats.statistics!.overdueWords} words`);
```

## Word Difficulty Analysis

### analyzeWordDifficulty

Comprehensive analysis of word difficulty based on learning patterns and mistake data.

```typescript
analyzeWordDifficulty(
  userId: string,
  limit?: number
): Promise<{
  success: boolean;
  analysis?: {
    difficultWords: WordDifficultyMetrics[];
    averageDifficultyScore: number;
    totalAnalyzedWords: number;
    highDifficultyCount: number;
    mistakePatterns: MistakePattern[];
    globalRecommendations: string[];
  };
  error?: string;
}>
```

**WordDifficultyMetrics Interface**:

```typescript
interface WordDifficultyMetrics {
  userDictionaryId: string;
  wordText: string;
  difficultyScore: number; // 0-100, higher = more difficult
  mistakeRate: number; // Percentage of attempts that resulted in mistakes
  mistakeCount: number;
  totalAttempts: number;
  avgResponseTime: number;
  learningStatus: LearningStatus;
  srsLevel: number;
  masteryScore: number;
  consistencyScore: number; // How consistent user performance is
  recentPerformance: number; // Performance in last 10 attempts
  mistakeTypes: Record<string, number>; // Distribution of mistake types
  recommendations: string[];
}
```

**Example**:

```typescript
const analysis = await analyzeWordDifficulty(userId, 50);

if (analysis.success && analysis.analysis) {
  console.log(`Analysis Results:
  - Total words analyzed: ${analysis.analysis.totalAnalyzedWords}
  - Average difficulty: ${analysis.analysis.averageDifficultyScore}
  - High difficulty words: ${analysis.analysis.highDifficultyCount}
  - Mistake patterns found: ${analysis.analysis.mistakePatterns.length}`);

  // Most difficult words
  const topDifficult = analysis.analysis.difficultWords.slice(0, 10);
  topDifficult.forEach((word) => {
    console.log(`${word.wordText}: ${word.difficultyScore}% difficulty`);
  });
}
```

### adjustReviewFrequencyByDifficulty

Automatically adjust SRS review intervals based on word difficulty analysis.

```typescript
adjustReviewFrequencyByDifficulty(
  userId: string,
  difficultyThreshold?: number
): Promise<{
  success: boolean;
  adjustments?: DifficultyAdjustmentResult[];
  totalAdjusted?: number;
  error?: string;
}>
```

**DifficultyAdjustmentResult Interface**:

```typescript
interface DifficultyAdjustmentResult {
  userDictionaryId: string;
  oldSrsLevel: number;
  newSrsLevel: number;
  adjustmentReason: string;
  newInterval: number;
  nextReviewDate: Date;
}
```

**Example**:

```typescript
// Adjust review frequency for words with 70%+ difficulty
const adjustments = await adjustReviewFrequencyByDifficulty(userId, 70);

if (adjustments.success) {
  console.log(
    `Adjusted ${adjustments.totalAdjusted} words based on difficulty`,
  );

  adjustments.adjustments?.forEach((adj) => {
    console.log(`Word ${adj.userDictionaryId}: 
    - Level ${adj.oldSrsLevel} → ${adj.newSrsLevel}
    - Reason: ${adj.adjustmentReason}
    - Next review: ${adj.nextReviewDate}`);
  });
}
```

### getWordsNeedingAttention

Get words that require immediate attention based on difficulty metrics.

```typescript
getWordsNeedingAttention(
  userId: string,
  limit?: number
): Promise<{
  success: boolean;
  words?: Array<{
    userDictionaryId: string;
    wordText: string;
    difficultyScore: number;
    urgencyLevel: 'high' | 'medium' | 'low';
    primaryIssue: string;
    recommendedAction: string;
  }>;
  error?: string;
}>
```

**Example**:

```typescript
const attention = await getWordsNeedingAttention(userId, 20);

if (attention.success && attention.words) {
  // Group by urgency level
  const byUrgency = attention.words.reduce(
    (acc, word) => {
      acc[word.urgencyLevel] = acc[word.urgencyLevel] || [];
      acc[word.urgencyLevel].push(word);
      return acc;
    },
    {} as Record<string, typeof attention.words>,
  );

  console.log(`Words needing attention:
  - High urgency: ${byUrgency.high?.length || 0}
  - Medium urgency: ${byUrgency.medium?.length || 0}
  - Low urgency: ${byUrgency.low?.length || 0}`);

  // Show high urgency words
  byUrgency.high?.forEach((word) => {
    console.log(`🚨 ${word.wordText}: ${word.primaryIssue}
    → ${word.recommendedAction}`);
  });
}
```

## Mistake Pattern Analysis

### MistakePattern Interface

```typescript
interface MistakePattern {
  type: string; // e.g., 'spelling', 'meaning', 'pronunciation'
  description: string;
  frequency: number;
  words: string[]; // Words commonly affected
  exerciseTypes: string[]; // Exercise types where mistakes occur
  avgDifficulty: number;
  recommendations: string[];
}
```

### Common Mistake Types

- **spelling**: Character sequences or letter substitutions
- **meaning**: Wrong word meaning or translation selection
- **pronunciation**: Audio-related mistakes or phonetic errors
- **grammar**: Grammatical form or structure errors
- **timing**: Response time or pace-related issues
- **context**: Usage context or situational mistakes
- **memory**: Difficulty recalling word or meaning

## Difficulty Calculation

The system uses a sophisticated algorithm to calculate word difficulty scores (0-100):

### Factors Considered

1. **Mistake Rate** (30% weight): Percentage of incorrect attempts
2. **Consistency Score** (20% weight): Variance in performance over time
3. **Recent Performance** (25% weight): Success rate in last 10 attempts
4. **Mastery Score** (15% weight): Overall learning progress
5. **Learning Status** (10% weight): Current learning phase

### Additional Factors

- **Mistake Type Diversity**: Penalty for multiple types of mistakes
- **SRS Level**: Current spaced repetition difficulty
- **Response Time**: Speed of answers (when available)

### Difficulty Score Interpretation

- **0-30**: Easy - well mastered words
- **31-50**: Moderate - acceptable difficulty
- **51-70**: Challenging - needs attention
- **71-85**: Difficult - requires focused practice
- **86-100**: Critical - major learning challenges

## Automated Adjustments

### Review Frequency Adjustments

Based on difficulty analysis, the system can automatically:

1. **Regress SRS Level**: For words with high mistake rates
2. **Shorten Intervals**: For inconsistent performance
3. **Reset Learning**: For critically difficult words
4. **Maintain Current**: For stable but challenging words

### Adjustment Criteria

- **High Mistake Rate (>60%) + Low Consistency (<40%)**: Regress 2 levels
- **High Mistake Rate (>40%)**: Regress 1 level
- **Poor Recent Performance (<30%)**: Regress 1 level
- **Very Inconsistent (<30%)**: Shorten review intervals

## Integration Examples

### Practice Dashboard Integration

```typescript
// Get comprehensive difficulty overview
const [analysis, attention, adjustments] = await Promise.all([
  analyzeWordDifficulty(userId, 100),
  getWordsNeedingAttention(userId, 20),
  adjustReviewFrequencyByDifficulty(userId, 75),
]);

// Display difficulty dashboard
const dashboard = {
  overallDifficulty: analysis.analysis?.averageDifficultyScore || 0,
  wordsNeedingHelp: attention.words?.length || 0,
  autoAdjustments: adjustments.totalAdjusted || 0,
  topMistakeTypes: analysis.analysis?.mistakePatterns.slice(0, 3) || [],
  urgentWords: attention.words?.filter((w) => w.urgencyLevel === 'high') || [],
};
```

### Learning Strategy Optimization

```typescript
// Optimize learning strategy based on difficulty patterns
const optimization = await analyzeWordDifficulty(userId);

if (optimization.success && optimization.analysis) {
  const { mistakePatterns, globalRecommendations } = optimization.analysis;

  // Focus areas for improvement
  const focusAreas = mistakePatterns
    .filter((pattern) => pattern.frequency > 10)
    .map((pattern) => ({
      type: pattern.type,
      priority: pattern.frequency,
      recommendations: pattern.recommendations,
    }));

  // Adaptive difficulty recommendations
  if (optimization.analysis.averageDifficultyScore > 70) {
    console.log('Recommendation: Reduce practice difficulty');
  } else if (optimization.analysis.averageDifficultyScore < 30) {
    console.log('Recommendation: Increase challenge level');
  }
}
```

---

**Last Updated**: December 2024  
**Version**: 2.0.1
