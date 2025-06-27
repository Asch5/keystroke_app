/**
 * Difficulty Assessment System
 *
 * Implements a multi-factor model for assessing word difficulty based on:
 * 1. User-Centric Performance Metrics (Dynamic & Personalized)
 * 2. Inherent Linguistic Metrics (Static & Global)
 *
 * This system provides the foundation for intelligent word selection across
 * all practice types and learning modes.
 */

import { PrismaClient, LearningStatus } from '@prisma/client';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

const prisma = new PrismaClient();

/**
 * Configuration for difficulty assessment weights and thresholds
 */
export const DIFFICULTY_ASSESSMENT_CONFIG = {
  // Weight distribution between performance and linguistic factors
  WEIGHTS: {
    PERFORMANCE: 0.7, // User's actual experience with the word
    LINGUISTIC: 0.3, // Inherent word properties
  },

  // Performance metric weights (sum should equal 1.0)
  PERFORMANCE_WEIGHTS: {
    MISTAKE_RATE: 0.25, // Primary indicator of difficulty
    CORRECT_STREAK: 0.2, // Stability in memory
    SRS_LEVEL: 0.15, // Spaced repetition progress
    LEARNING_STATUS: 0.15, // Explicit difficulty flags
    RESPONSE_TIME: 0.1, // Cognitive load indicator
    SKIP_RATE: 0.1, // Behavioral confidence signal
    RECENCY_FREQUENCY: 0.05, // Forgetting curve consideration
  },

  // Linguistic metric weights (sum should equal 1.0)
  LINGUISTIC_WEIGHTS: {
    WORD_RARITY: 0.3, // Frequency in language
    PHONETIC_IRREGULARITY: 0.2, // Spelling-pronunciation mismatch
    POLYSEMY: 0.15, // Multiple meanings
    WORD_LENGTH: 0.15, // Character count complexity
    SEMANTIC_ABSTRACTION: 0.1, // Concrete vs abstract concepts
    RELATIONAL_COMPLEXITY: 0.1, // Number of linguistic relationships
  },

  // Thresholds for difficulty classification
  DIFFICULTY_THRESHOLDS: {
    VERY_EASY: 0.2,
    EASY: 0.4,
    MEDIUM: 0.6,
    HARD: 0.8,
    VERY_HARD: 1.0,
  },

  // Response time thresholds (in milliseconds)
  RESPONSE_TIME_THRESHOLDS: {
    FAST: 3000, // Under 3 seconds
    AVERAGE: 8000, // 3-8 seconds
    SLOW: 15000, // 8-15 seconds
    VERY_SLOW: 30000, // Over 15 seconds
  },

  // SRS level mappings
  SRS_DIFFICULTY_MAPPING: {
    0: 1.0, // New word - maximum difficulty
    1: 0.8, // Learning - high difficulty
    2: 0.6, // Reviewing - medium difficulty
    3: 0.4, // Familiar - low difficulty
    4: 0.2, // Mastered - very low difficulty
    5: 0.1, // Expert - minimal difficulty
  },
} as const;

/**
 * Interfaces for difficulty assessment
 */
export interface UserPerformanceMetrics {
  mistakeRate: number;
  correctStreak: number;
  srsLevel: number;
  learningStatus: string;
  averageResponseTime: number;
  skipRate: number;
  recencyScore: number;
  reviewFrequency: number;
}

export interface LinguisticMetrics {
  wordRarity: number;
  phoneticIrregularity: number;
  polysemy: number;
  wordLength: number;
  semanticAbstraction: number;
  relationalComplexity: number;
}

export interface DifficultyScore {
  composite: number;
  performance: number;
  linguistic: number;
  classification: 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';
  confidence: number;
  factors: {
    performance: UserPerformanceMetrics;
    linguistic: LinguisticMetrics;
  };
}

/**
 * Learning Unit Interface
 * Represents any learning item that can be practiced across different modes
 */
export interface LearningUnit {
  id: string;
  type: 'word' | 'phrase' | 'grammar' | 'pronunciation';
  content: {
    primary: string; // The main content (word text, phrase, etc.)
    secondary?: string; // Additional context (definition, example, etc.)
    metadata: Record<string, unknown>;
  };
  difficulty: DifficultyScore;
  userProgress: {
    attempts: number;
    successes: number;
    lastAttempt: Date | null;
    nextReview: Date | null;
  };
}

/**
 * Type for user dictionary entries with includes - using actual Prisma types
 */
type UserDictionaryWithIncludes = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.userDictionary.findUnique<{
        where: { id: string };
        include: {
          definition: {
            include: {
              wordDetails: {
                include: {
                  wordDetails: {
                    include: {
                      word: true;
                      definitions: {
                        include: { definition: true };
                      };
                    };
                  };
                };
              };
              translationLinks: true;
            };
          };
          sessionItems: true;
          mistakes: true;
        };
      }>
    >
  >
>;

/**
 * Session item type for performance calculation
 */
interface SessionItemType {
  responseTime: number | null;
}

/**
 * Core Difficulty Assessment Class
 */
export class DifficultyAssessment {
  /**
   * Calculate comprehensive difficulty score for a user's dictionary entry
   */
  static async calculateDifficultyScore(
    userId: string,
    userDictionaryId: string,
  ): Promise<DifficultyScore> {
    try {
      // Fetch comprehensive data for the word
      const userDictionaryEntry = await prisma.userDictionary.findUnique({
        where: { id: userDictionaryId },
        include: {
          definition: {
            include: {
              wordDetails: {
                include: {
                  wordDetails: {
                    include: {
                      word: true,
                      definitions: {
                        include: { definition: true },
                      },
                    },
                  },
                },
              },
              translationLinks: true,
            },
          },
          sessionItems: {
            orderBy: { createdAt: 'desc' },
            take: 20, // Last 20 attempts for performance analysis
          },
          mistakes: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            }, // Last 30 days
          },
        },
      });

      if (!userDictionaryEntry) {
        throw new Error(`UserDictionary entry not found: ${userDictionaryId}`);
      }

      // Calculate performance metrics
      const performanceMetrics =
        await this.calculatePerformanceMetrics(userDictionaryEntry);

      // Calculate linguistic metrics
      const linguisticMetrics = await this.calculateLinguisticMetrics(
        userDictionaryEntry.definition,
      );

      // Calculate normalized scores
      const performanceScore =
        this.calculateNormalizedPerformanceScore(performanceMetrics);
      const linguisticScore =
        this.calculateNormalizedLinguisticScore(linguisticMetrics);

      // Calculate composite score
      const compositeScore =
        DIFFICULTY_ASSESSMENT_CONFIG.WEIGHTS.PERFORMANCE * performanceScore +
        DIFFICULTY_ASSESSMENT_CONFIG.WEIGHTS.LINGUISTIC * linguisticScore;

      // Determine classification
      const classification = this.classifyDifficulty(compositeScore);

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(
        userDictionaryEntry.reviewCount,
        userDictionaryEntry.sessionItems.length,
      );

      return {
        composite: Math.round(compositeScore * 1000) / 1000, // Round to 3 decimal places
        performance: Math.round(performanceScore * 1000) / 1000,
        linguistic: Math.round(linguisticScore * 1000) / 1000,
        classification,
        confidence,
        factors: {
          performance: performanceMetrics,
          linguistic: linguisticMetrics,
        },
      };
    } catch (error) {
      serverLog(`Error calculating difficulty score: ${error}`, 'error', {
        userId,
        userDictionaryId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Calculate user-centric performance metrics
   */
  private static async calculatePerformanceMetrics(
    userDictionaryEntry: UserDictionaryWithIncludes,
  ): Promise<UserPerformanceMetrics> {
    const {
      reviewCount,
      amountOfMistakes,
      correctStreak,
      srsLevel,
      learningStatus,
      skipCount,
      lastReviewedAt,
      sessionItems,
    } = userDictionaryEntry;

    // Calculate mistake rate
    const mistakeRate =
      reviewCount > 0 ? amountOfMistakes / (reviewCount + 1) : 0;

    // Calculate average response time from session items
    const responseTimes = sessionItems
      .filter((item: SessionItemType) => item.responseTime)
      .map((item: SessionItemType) => item.responseTime as number);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Calculate skip rate
    const skipRate =
      reviewCount > 0 ? skipCount / (reviewCount + skipCount) : 0;

    // Calculate recency score (how recently the word was reviewed)
    const recencyScore = this.calculateRecencyScore(lastReviewedAt);

    // Review frequency score
    const reviewFrequency = this.calculateReviewFrequency(
      reviewCount,
      userDictionaryEntry.timeWordWasStartedToLearn,
    );

    return {
      mistakeRate,
      correctStreak,
      srsLevel,
      learningStatus,
      averageResponseTime,
      skipRate,
      recencyScore,
      reviewFrequency,
    };
  }

  /**
   * Calculate inherent linguistic metrics
   */
  private static async calculateLinguisticMetrics(
    definition: UserDictionaryWithIncludes['definition'],
  ): Promise<LinguisticMetrics> {
    const wordDetails = definition.wordDetails[0]?.wordDetails;
    const word = wordDetails?.word;

    if (!wordDetails || !word) {
      // Return default metrics if no word details available
      return {
        wordRarity: 0.5,
        phoneticIrregularity: 0.5,
        polysemy: 0.3,
        wordLength: 0.5,
        semanticAbstraction: 0.5,
        relationalComplexity: 0.3,
      };
    }

    // Word rarity (based on frequency) - use word's frequencyGeneral since WordDetails only has frequency
    const wordRarity = this.calculateWordRarity(
      wordDetails.frequency,
      word.frequencyGeneral,
    );

    // Phonetic irregularity
    const phoneticIrregularity = this.calculatePhoneticIrregularity(
      word.word,
      wordDetails.phonetic,
    );

    // Polysemy (number of meanings) - using wordDefinitions from schema
    const polysemy = this.calculatePolysemy(
      wordDetails.definitions?.length || 1,
    );

    // Word length complexity
    const wordLength = this.calculateWordLengthComplexity(word.word);

    // Semantic abstraction (concrete vs abstract)
    const semanticAbstraction = this.calculateSemanticAbstraction(definition);

    // Relational complexity - using empty array as fallback since relationships were removed
    const relationalComplexity = this.calculateRelationalComplexity(0);

    return {
      wordRarity,
      phoneticIrregularity,
      polysemy,
      wordLength,
      semanticAbstraction,
      relationalComplexity,
    };
  }

  /**
   * Calculate normalized performance score (0-1)
   */
  private static calculateNormalizedPerformanceScore(
    metrics: UserPerformanceMetrics,
  ): number {
    const weights = DIFFICULTY_ASSESSMENT_CONFIG.PERFORMANCE_WEIGHTS;

    // Normalize each metric to 0-1 scale (higher = more difficult)
    const normalizedMistakeRate = Math.min(metrics.mistakeRate, 1.0);
    const normalizedCorrectStreak = Math.max(0, 1 - metrics.correctStreak / 10); // Invert: lower streak = higher difficulty
    const normalizedSrsLevel =
      DIFFICULTY_ASSESSMENT_CONFIG.SRS_DIFFICULTY_MAPPING[
        metrics.srsLevel as keyof typeof DIFFICULTY_ASSESSMENT_CONFIG.SRS_DIFFICULTY_MAPPING
      ] || 1.0;
    const normalizedLearningStatus = this.normalizeLearningStatus(
      metrics.learningStatus,
    );
    const normalizedResponseTime = this.normalizeResponseTime(
      metrics.averageResponseTime,
    );
    const normalizedSkipRate = Math.min(metrics.skipRate, 1.0);
    const normalizedRecencyFrequency =
      (metrics.recencyScore + (1 - metrics.reviewFrequency)) / 2;

    // Calculate weighted sum
    return (
      weights.MISTAKE_RATE * normalizedMistakeRate +
      weights.CORRECT_STREAK * normalizedCorrectStreak +
      weights.SRS_LEVEL * normalizedSrsLevel +
      weights.LEARNING_STATUS * normalizedLearningStatus +
      weights.RESPONSE_TIME * normalizedResponseTime +
      weights.SKIP_RATE * normalizedSkipRate +
      weights.RECENCY_FREQUENCY * normalizedRecencyFrequency
    );
  }

  /**
   * Calculate normalized linguistic score (0-1)
   */
  private static calculateNormalizedLinguisticScore(
    metrics: LinguisticMetrics,
  ): number {
    const weights = DIFFICULTY_ASSESSMENT_CONFIG.LINGUISTIC_WEIGHTS;

    // All linguistic metrics are already normalized to 0-1 during calculation
    return (
      weights.WORD_RARITY * metrics.wordRarity +
      weights.PHONETIC_IRREGULARITY * metrics.phoneticIrregularity +
      weights.POLYSEMY * metrics.polysemy +
      weights.WORD_LENGTH * metrics.wordLength +
      weights.SEMANTIC_ABSTRACTION * metrics.semanticAbstraction +
      weights.RELATIONAL_COMPLEXITY * metrics.relationalComplexity
    );
  }

  // Helper methods for specific calculations
  private static calculateRecencyScore(lastReviewedAt: Date | null): number {
    if (!lastReviewedAt) return 1.0; // No review = maximum difficulty

    const daysSinceReview =
      (Date.now() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(daysSinceReview / 30, 1.0); // 30 days = full difficulty
  }

  private static calculateReviewFrequency(
    reviewCount: number,
    startedLearning: Date | null,
  ): number {
    if (!startedLearning || reviewCount === 0) return 0;

    const daysSinceLearning =
      (Date.now() - startedLearning.getTime()) / (1000 * 60 * 60 * 24);
    const reviewsPerDay = reviewCount / Math.max(daysSinceLearning, 1);
    return Math.min(reviewsPerDay, 1.0);
  }

  private static calculateWordRarity(
    frequency: number | null,
    frequencyGeneral: number | null,
  ): number {
    const freq = frequency || frequencyGeneral || 0;
    if (freq === 0) return 1.0; // Unknown frequency = high difficulty

    // Assume frequency is ranked 1-10000, normalize inversely
    return Math.min((10000 - freq) / 10000, 1.0);
  }

  private static calculatePhoneticIrregularity(
    word: string,
    phonetic: string | null,
  ): number {
    if (!phonetic) return 0.5; // Unknown phonetic = medium difficulty

    // Simple heuristic: compare string similarity
    const similarity = this.calculateStringSimilarity(
      word.toLowerCase(),
      phonetic.toLowerCase(),
    );
    return 1 - similarity; // Less similar = more irregular = higher difficulty
  }

  private static calculatePolysemy(definitionCount: number): number {
    // More definitions = higher complexity
    return Math.min(definitionCount / 10, 1.0); // Cap at 10 definitions
  }

  private static calculateWordLengthComplexity(word: string): number {
    const length = word.length;
    if (length <= 4) return 0.1;
    if (length <= 7) return 0.3;
    if (length <= 10) return 0.6;
    return 1.0;
  }

  private static calculateSemanticAbstraction(
    definition: UserDictionaryWithIncludes['definition'],
  ): number {
    // If there's an associated image, it's likely more concrete
    return definition.imageId ? 0.2 : 0.8; // Abstract concepts are harder
  }

  private static calculateRelationalComplexity(
    relationshipCount: number,
  ): number {
    return Math.min(relationshipCount / 20, 1.0); // Cap at 20 relationships
  }

  private static normalizeLearningStatus(status: string): number {
    const statusMap: Record<string, number> = {
      notStarted: 1.0,
      difficult: 0.9,
      needsReview: 0.7,
      inProgress: 0.5,
      learned: 0.2,
    };
    return statusMap[status] || 0.5;
  }

  private static normalizeResponseTime(responseTime: number): number {
    const thresholds = DIFFICULTY_ASSESSMENT_CONFIG.RESPONSE_TIME_THRESHOLDS;

    if (responseTime <= thresholds.FAST) return 0.1;
    if (responseTime <= thresholds.AVERAGE) return 0.3;
    if (responseTime <= thresholds.SLOW) return 0.6;
    if (responseTime <= thresholds.VERY_SLOW) return 0.8;
    return 1.0;
  }

  private static classifyDifficulty(
    score: number,
  ): 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard' {
    const thresholds = DIFFICULTY_ASSESSMENT_CONFIG.DIFFICULTY_THRESHOLDS;

    if (score <= thresholds.VERY_EASY) return 'very_easy';
    if (score <= thresholds.EASY) return 'easy';
    if (score <= thresholds.MEDIUM) return 'medium';
    if (score <= thresholds.HARD) return 'hard';
    return 'very_hard';
  }

  private static calculateConfidence(
    reviewCount: number,
    sessionCount: number,
  ): number {
    const dataPoints = reviewCount + sessionCount;
    if (dataPoints === 0) return 0.1; // Very low confidence for new words
    if (dataPoints < 3) return 0.3; // Low confidence
    if (dataPoints < 10) return 0.6; // Medium confidence
    if (dataPoints < 20) return 0.8; // High confidence
    return 1.0; // Maximum confidence
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.calculateLevenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static calculateLevenshteinDistance(
    str1: string,
    str2: string,
  ): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1,
          );
        }
      }
    }

    return matrix[str2.length]![str1.length]!;
  }

  /**
   * Batch calculate difficulty scores for multiple words
   */
  static async calculateBatchDifficultyScores(
    userId: string,
    userDictionaryIds: string[],
  ): Promise<Map<string, DifficultyScore>> {
    const results = new Map<string, DifficultyScore>();

    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < userDictionaryIds.length; i += batchSize) {
      const batch = userDictionaryIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (id) => {
        try {
          const score = await this.calculateDifficultyScore(userId, id);
          return { id, score };
        } catch (error) {
          serverLog(
            `Failed to calculate difficulty for ${id}: ${error}`,
            'error',
          );
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((result) => {
        if (result) {
          results.set(result.id, result.score);
        }
      });
    }

    return results;
  }

  /**
   * Get intelligent word selection for practice sessions
   */
  static async getIntelligentWordSelection(
    userId: string,
    targetWords: number,
    options: {
      userListId?: string;
      listId?: string;
      difficultyDistribution?: {
        hard: number; // Percentage (0-1)
        medium: number; // Percentage (0-1)
        easy: number; // Percentage (0-1)
      };
      excludeRecentlyPracticed?: boolean;
    } = {},
  ): Promise<LearningUnit[]> {
    const {
      userListId,
      listId,
      difficultyDistribution = { hard: 0.2, medium: 0.5, easy: 0.3 },
      excludeRecentlyPracticed = true,
    } = options;

    // Get user dictionary entries
    const whereClause: {
      userId: string;
      id?: { in: string[] };
      definitionId?: { in: number[] };
      lastReviewedAt?: { lt: Date };
    } = { userId };

    if (userListId) {
      const userListWords = await prisma.userListWord.findMany({
        where: { userListId },
        select: { userDictionaryId: true },
      });
      whereClause.id = { in: userListWords.map((ulw) => ulw.userDictionaryId) };
    } else if (listId) {
      const listWords = await prisma.listWord.findMany({
        where: { listId },
        select: { definitionId: true },
      });
      whereClause.definitionId = { in: listWords.map((lw) => lw.definitionId) };
    }

    if (excludeRecentlyPracticed) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      whereClause.lastReviewedAt = { lt: yesterday };
    }

    const userDictionaryEntries = await prisma.userDictionary.findMany({
      where: whereClause,
      include: {
        definition: {
          include: {
            wordDetails: {
              include: {
                wordDetails: {
                  include: { word: true },
                },
              },
            },
          },
        },
      },
      take: Math.min(targetWords * 3, 100), // Get more than needed for selection
    });

    // Calculate difficulty scores
    const difficultyScores = await this.calculateBatchDifficultyScores(
      userId,
      userDictionaryEntries.map((entry) => entry.id),
    );

    // Categorize words by difficulty
    interface CategorizedWord {
      entry: (typeof userDictionaryEntries)[0];
      difficulty: DifficultyScore;
    }

    const categorizedWords: Record<string, CategorizedWord[]> = {
      very_hard: [],
      hard: [],
      medium: [],
      easy: [],
      very_easy: [],
    };

    userDictionaryEntries.forEach((entry) => {
      const difficultyScore = difficultyScores.get(entry.id);
      if (difficultyScore && categorizedWords[difficultyScore.classification]) {
        categorizedWords[difficultyScore.classification]!.push({
          entry,
          difficulty: difficultyScore,
        });
      }
    });

    // Select words according to distribution
    const selectedWords: CategorizedWord[] = [];
    const hardCount = Math.ceil(targetWords * difficultyDistribution.hard);
    const mediumCount = Math.ceil(targetWords * difficultyDistribution.medium);
    const easyCount = targetWords - hardCount - mediumCount;

    // Select hard words (combine very_hard and hard)
    const hardWords = [
      ...(categorizedWords.very_hard || []),
      ...(categorizedWords.hard || []),
    ];
    selectedWords.push(...this.selectRandomWords(hardWords, hardCount));

    // Select medium words
    selectedWords.push(
      ...this.selectRandomWords(categorizedWords.medium || [], mediumCount),
    );

    // Select easy words (combine easy and very_easy)
    const easyWords = [
      ...(categorizedWords.easy || []),
      ...(categorizedWords.very_easy || []),
    ];
    selectedWords.push(...this.selectRandomWords(easyWords, easyCount));

    // Convert to LearningUnit format
    return selectedWords.map(({ entry, difficulty }) =>
      this.convertToLearningUnit(entry, difficulty),
    );
  }

  private static selectRandomWords<T>(words: T[], count: number): T[] {
    if (words.length <= count) return words;

    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private static convertToLearningUnit(
    entry: {
      id: string;
      definitionId: number;
      lastReviewedAt: Date | null;
      nextReviewDue: Date | null;
      reviewCount: number;
      definition: {
        definition: string;
        wordDetails: Array<{
          wordDetails: {
            partOfSpeech: string | null;
            phonetic: string | null;
            etymology: string | null;
            word: {
              id: number;
              word: string;
            };
          };
        }>;
      };
    },
    difficulty: DifficultyScore,
  ): LearningUnit {
    const wordDetails = entry.definition.wordDetails[0]?.wordDetails;
    const word = wordDetails?.word;

    return {
      id: entry.id,
      type: 'word',
      content: {
        primary: word?.word || 'unknown',
        secondary: entry.definition.definition,
        metadata: {
          partOfSpeech: wordDetails?.partOfSpeech || null,
          phonetic: wordDetails?.phonetic || null,
          etymology: wordDetails?.etymology || null,
          definitionId: entry.definitionId,
          wordId: word?.id || null,
        },
      },
      difficulty,
      userProgress: {
        attempts: entry.reviewCount || 0,
        successes: entry.reviewCount || 0,
        lastAttempt: entry.lastReviewedAt,
        nextReview: entry.nextReviewDue,
      },
    };
  }
}

/**
 * Universal Learning Progress Tracker
 * Tracks progress across different practice types
 */
export class LearningProgressTracker {
  /**
   * Update learning progress after practice attempt
   */
  static async updateLearningProgress(
    userId: string,
    learningUnitId: string,
    practiceType: string,
    result: {
      isCorrect: boolean;
      responseTime?: number;
      attempts?: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update UserDictionary progress
        const currentEntry = await tx.userDictionary.findUnique({
          where: { id: learningUnitId },
          include: {
            definition: {
              include: {
                wordDetails: {
                  include: {
                    wordDetails: {
                      include: {
                        word: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!currentEntry) {
          throw new Error(`Learning unit not found: ${learningUnitId}`);
        }

        const updates: {
          reviewCount: number;
          lastReviewedAt: Date;
          correctStreak?: number;
          amountOfMistakes?: number;
          srsLevel?: number;
          nextSrsReview?: Date;
          learningStatus?: string;
          masteryScore?: number;
        } = {
          reviewCount: currentEntry.reviewCount + 1,
          lastReviewedAt: new Date(),
        };

        if (result.isCorrect) {
          updates.correctStreak = currentEntry.correctStreak + 1;
          // Update SRS level based on correct answer
          if (updates.correctStreak >= 3) {
            updates.srsLevel = Math.min(currentEntry.srsLevel + 1, 5);
            updates.nextSrsReview = this.calculateNextSrsReview(
              updates.srsLevel,
            );
          }
        } else {
          updates.amountOfMistakes = currentEntry.amountOfMistakes + 1;
          updates.correctStreak = 0;
          // Reset SRS level on mistake
          updates.srsLevel = Math.max(currentEntry.srsLevel - 1, 0);
        }

        // Update learning status based on performance
        const learningStatus = this.determineLearningStatus(
          currentEntry.reviewCount,
          updates.amountOfMistakes || currentEntry.amountOfMistakes,
          updates.correctStreak || 0,
        );

        // Update mastery score
        const masteryScore = this.calculateMasteryScore(
          updates.correctStreak || 0,
          updates.amountOfMistakes || currentEntry.amountOfMistakes,
          updates.reviewCount,
        );

        await tx.userDictionary.update({
          where: { id: learningUnitId },
          data: {
            ...updates,
            learningStatus: learningStatus as LearningStatus,
            masteryScore,
          },
        });

        // Create learning mistake record if incorrect
        if (
          !result.isCorrect &&
          currentEntry.definition.wordDetails[0]?.wordDetails
        ) {
          const wordDetails =
            currentEntry.definition.wordDetails[0].wordDetails;
          await tx.learningMistake.create({
            data: {
              userId,
              wordId: wordDetails.word.id,
              wordDetailsId: wordDetails.id,
              definitionId: currentEntry.definitionId,
              userDictionaryId: learningUnitId,
              type: practiceType,
              mistakeData: result.metadata
                ? JSON.parse(JSON.stringify(result.metadata))
                : {},
            },
          });
        }
      });

      serverLog(
        `Updated learning progress for unit ${learningUnitId}`,
        'info',
        {
          userId,
          practiceType,
          result,
        },
      );
    } catch (error) {
      serverLog(`Error updating learning progress: ${error}`, 'error', {
        userId,
        learningUnitId,
        practiceType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Track skip behavior
   */
  static async trackSkip(
    userId: string,
    learningUnitId: string,
    practiceType: string,
  ): Promise<void> {
    try {
      await prisma.userDictionary.update({
        where: { id: learningUnitId },
        data: {
          skipCount: { increment: 1 },
          lastReviewedAt: new Date(),
        },
      });

      serverLog(`Tracked skip for unit ${learningUnitId}`, 'info', {
        userId,
        practiceType,
      });
    } catch (error) {
      serverLog(`Error tracking skip: ${error}`, 'error', {
        userId,
        learningUnitId,
        practiceType,
      });
      throw error;
    }
  }

  private static calculateNextSrsReview(srsLevel: number): Date {
    const intervals = [1, 3, 7, 14, 30, 60]; // days
    const intervalDays =
      intervals[Math.min(srsLevel, intervals.length - 1)] || 1;
    return new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
  }

  private static determineLearningStatus(
    reviewCount: number,
    mistakes: number,
    streak: number,
  ): string {
    if (streak >= 5 && reviewCount >= 10) return 'learned';
    if (mistakes > reviewCount * 0.5) return 'difficult';
    if (reviewCount >= 3) return 'inProgress';
    return 'notStarted';
  }

  private static calculateMasteryScore(
    streak: number,
    mistakes: number,
    reviews: number,
  ): number {
    if (reviews === 0) return 0;
    const accuracy = (reviews - mistakes) / reviews;
    const streakBonus = Math.min(streak * 2, 20);
    return Math.min(Math.round(accuracy * 80 + streakBonus), 100);
  }
}
