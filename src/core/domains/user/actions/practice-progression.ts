'use server';

import { PrismaClient } from '@prisma/client';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { LearningStatus } from '@/core/types';
import { LearningMetricsCalculator } from '../utils/learning-metrics';
import {
  PracticeType,
  PracticeWord,
  ProgressionResult,
  ExerciseTypeResult,
} from './practice-types';

const prisma = new PrismaClient();

/**
 * Get exercise level mapping for progressive learning
 */
export async function getExerciseLevelMapping() {
  return {
    0: 'remember-translation' as PracticeType,
    1: 'remember-translation' as PracticeType,
    2: 'choose-right-word' as PracticeType,
    3: 'make-up-word' as PracticeType,
    4: 'write-by-definition' as PracticeType,
    5: 'write-by-sound' as PracticeType,
  };
}

/**
 * Get progression requirements for level advancement
 */
export async function getProgressionRequirements() {
  return {
    ADVANCE_THRESHOLD: 2, // Successful attempts needed to advance
    REGRESS_THRESHOLD: 3, // Failed attempts before regression
    SUCCESS_RATE_REQUIRED: 0.6, // 60% success rate required
    MIN_LEVEL: 0,
    MAX_LEVEL: 5,
  };
}

/**
 * Determine exercise type based on progressive learning level
 */
export async function determineExerciseTypeProgressive(
  word: PracticeWord,
  userPreferences?: {
    skipRememberTranslation?: boolean;
    forceDifficulty?: number;
    enabledExerciseTypes?: string[];
  },
): Promise<ExerciseTypeResult> {
  const exerciseLevelMapping = await getExerciseLevelMapping();
  const requirements = await getProgressionRequirements();

  const currentLevel = word.srsLevel ?? 0;
  const attempts = word.attempts ?? 0;
  const correctAttempts = word.correctAttempts ?? 0;
  const successRate = attempts > 0 ? correctAttempts / attempts : 0;

  // Helper function to check if exercise type is enabled
  const isTypeEnabled = (type: PracticeType): boolean => {
    if (!userPreferences?.enabledExerciseTypes) return true;
    return userPreferences.enabledExerciseTypes.includes(type);
  };

  // Get the exercise type for current level
  let exerciseType =
    exerciseLevelMapping[currentLevel as keyof typeof exerciseLevelMapping];

  // Apply user preferences
  if (
    userPreferences?.skipRememberTranslation &&
    exerciseType === 'remember-translation'
  ) {
    // Skip to next available level
    for (
      let level = currentLevel + 1;
      level <= requirements.MAX_LEVEL;
      level++
    ) {
      const nextType =
        exerciseLevelMapping[level as keyof typeof exerciseLevelMapping];
      if (isTypeEnabled(nextType)) {
        exerciseType = nextType;
        break;
      }
    }
  }

  // Force difficulty override
  if (userPreferences?.forceDifficulty) {
    const forcedLevel = Math.min(
      userPreferences.forceDifficulty,
      requirements.MAX_LEVEL,
    );
    const forcedType =
      exerciseLevelMapping[forcedLevel as keyof typeof exerciseLevelMapping];
    if (isTypeEnabled(forcedType)) {
      exerciseType = forcedType;
    }
  }

  // Ensure the selected exercise type is enabled
  if (!isTypeEnabled(exerciseType)) {
    // Find the closest enabled exercise type
    const enabledTypes = userPreferences?.enabledExerciseTypes ?? [];
    const typeToLevelMap: Record<PracticeType, number> = {
      'remember-translation': 0,
      'choose-right-word': 2,
      'make-up-word': 3,
      'write-by-definition': 4,
      'write-by-sound': 5,
      typing: 3,
      'unified-practice': 3,
    };

    // Find the enabled type closest to current level
    let closestType: PracticeType = 'remember-translation';
    let closestDistance = Infinity;

    for (const enabledType of enabledTypes) {
      const enabledLevel = typeToLevelMap[enabledType as PracticeType] || 0;
      const distance = Math.abs(enabledLevel - currentLevel);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestType = enabledType as PracticeType;
      }
    }

    exerciseType = closestType;
  }

  // Calculate progression info
  const attemptsAtCurrentLevel = attempts; // Simplified - could track level-specific attempts
  const successesAtCurrentLevel = correctAttempts; // Simplified
  const nextLevelRequirement = requirements.ADVANCE_THRESHOLD;

  // Determine if can advance or should regress
  const canAdvance =
    attemptsAtCurrentLevel >= requirements.ADVANCE_THRESHOLD &&
    successRate >= requirements.SUCCESS_RATE_REQUIRED &&
    currentLevel < requirements.MAX_LEVEL;

  const shouldRegress =
    attemptsAtCurrentLevel >= requirements.REGRESS_THRESHOLD &&
    successRate < requirements.SUCCESS_RATE_REQUIRED &&
    currentLevel > requirements.MIN_LEVEL;

  return {
    exerciseType,
    currentLevel,
    canAdvance,
    shouldRegress,
    progressInfo: {
      attemptsAtCurrentLevel,
      successesAtCurrentLevel,
      nextLevelRequirement,
    },
  };
}

/**
 * Update word progression after practice attempt
 */
export async function updateWordProgression(
  userDictionaryId: string,
  isCorrect: boolean,
): Promise<{
  success: boolean;
  progression?: ProgressionResult;
  error?: string;
}> {
  try {
    const requirements = await getProgressionRequirements();
    const exerciseLevelMapping = await getExerciseLevelMapping();

    // Get current user dictionary entry
    const userWord = await prisma.userDictionary.findUnique({
      where: { id: userDictionaryId },
    });

    if (!userWord) {
      return {
        success: false,
        error: 'User dictionary entry not found',
      };
    }

    const currentLevel = userWord.srsLevel ?? 0;
    const currentAttempts = userWord.reviewCount ?? 0;
    const currentCorrectAttempts = Math.round(
      ((userWord.reviewCount ?? 0) * (userWord.masteryScore ?? 0)) / 100,
    );

    // Calculate new metrics
    const newAttempts = currentAttempts + 1;
    const newCorrectAttempts = isCorrect
      ? currentCorrectAttempts + 1
      : currentCorrectAttempts;
    const newSuccessRate =
      newAttempts > 0 ? newCorrectAttempts / newAttempts : 0;

    // Determine level changes
    let newLevel = currentLevel;
    let levelChanged = false;

    // Check for advancement
    if (
      isCorrect &&
      newAttempts >= requirements.ADVANCE_THRESHOLD &&
      newSuccessRate >= requirements.SUCCESS_RATE_REQUIRED &&
      currentLevel < requirements.MAX_LEVEL
    ) {
      newLevel = Math.min(currentLevel + 1, requirements.MAX_LEVEL);
      levelChanged = true;
    }
    // Check for regression
    else if (
      !isCorrect &&
      newAttempts >= requirements.REGRESS_THRESHOLD &&
      newSuccessRate < requirements.SUCCESS_RATE_REQUIRED &&
      currentLevel > requirements.MIN_LEVEL
    ) {
      newLevel = Math.max(currentLevel - 1, requirements.MIN_LEVEL);
      levelChanged = true;
    }

    // Calculate new learning status based on level and performance
    let newLearningStatus = userWord.learningStatus;
    if (newLevel === 0) {
      newLearningStatus = LearningStatus.notStarted;
    } else if (newLevel >= 1 && newLevel <= 2) {
      newLearningStatus = LearningStatus.inProgress;
    } else if (newLevel >= 3 && newLevel <= 4) {
      newLearningStatus = LearningStatus.inProgress;
    } else if (
      newLevel === 5 &&
      newSuccessRate >= requirements.SUCCESS_RATE_REQUIRED
    ) {
      newLearningStatus = LearningStatus.learned;
    }

    // Handle difficult words
    if (newSuccessRate < 0.4 && newAttempts >= 5) {
      newLearningStatus = LearningStatus.difficult;
    } else if (newSuccessRate < 0.6 && newAttempts >= 3) {
      newLearningStatus = LearningStatus.needsReview;
    }

    // Calculate new mastery score
    const newMasteryScore = LearningMetricsCalculator.calculateMasteryScore(
      newSuccessRate * 100,
      newCorrectAttempts,
      1, // Average response time - simplified
      newAttempts,
    );

    // Update the database
    await prisma.userDictionary.update({
      where: { id: userDictionaryId },
      data: {
        srsLevel: newLevel,
        learningStatus: newLearningStatus,
        masteryScore: newMasteryScore,
        progress: Math.min(newMasteryScore, 100),
        // Note: reviewCount and correctStreak updated elsewhere
      },
    });

    // Determine next exercise type
    const nextExerciseType =
      exerciseLevelMapping[newLevel as keyof typeof exerciseLevelMapping];

    const progression: ProgressionResult = {
      previousLevel: currentLevel,
      newLevel,
      levelChanged,
      newLearningStatus,
      nextExerciseType,
    };

    void serverLog(
      `Word progression updated: ${userDictionaryId} - Level ${currentLevel} → ${newLevel}`,
      'info',
      { progression },
    );

    return {
      success: true,
      progression,
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    void serverLog(
      `Failed to update word progression: ${errorMessage}`,
      'error',
      {
        userDictionaryId,
        error,
      },
    );

    return {
      success: false,
      error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
    };
  }
}

/**
 * Calculate SRS (Spaced Repetition System) intervals
 */
export async function calculateSRSInterval(
  level: number,
  isCorrect: boolean,
  consecutiveCorrect: number,
): Promise<{
  intervalHours: number;
  nextReviewDate: Date;
}> {
  // SRS intervals in hours for each level
  const baseIntervals = [1, 4, 8, 24, 72, 168]; // hours for levels 0-5

  let intervalHours = baseIntervals[Math.min(level, 5)] || 168;

  // Adjust based on performance
  if (isCorrect) {
    // Bonus for consecutive correct answers
    const bonus = Math.min(consecutiveCorrect * 0.2, 1.0); // Max 100% bonus
    intervalHours = Math.round(intervalHours * (1 + bonus));
  } else {
    // Penalty for incorrect answers - reduce interval
    intervalHours = Math.round(intervalHours * 0.5);
  }

  // Ensure minimum interval
  intervalHours = Math.max(intervalHours, 1);

  const nextReviewDate = new Date();
  nextReviewDate.setHours(nextReviewDate.getHours() + intervalHours);

  return {
    intervalHours,
    nextReviewDate,
  };
}

/**
 * Get words due for review based on SRS scheduling
 */
export async function getWordsForSRSReview(
  userId: string,
  limit: number = 20,
): Promise<PracticeWord[]> {
  try {
    const now = new Date();

    const words = await prisma.userDictionary.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { nextSrsReview: { lte: now } },
          { nextSrsReview: null }, // Never reviewed
        ],
      },
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
            image: true,
            translationLinks: {
              include: {
                translation: true,
              },
            },
          },
        },
      },
      orderBy: [{ nextSrsReview: 'asc' }, { srsLevel: 'asc' }],
      take: limit,
    });

    return words.map((word) => ({
      userDictionaryId: word.id,
      wordText: word.definition.wordDetails[0]?.wordDetails?.word?.word ?? '',
      definition: word.definition.definition,
      difficulty: word.srsLevel ?? 0,
      learningStatus: word.learningStatus,
      attempts: word.reviewCount ?? 0,
      correctAttempts: Math.round(
        ((word.reviewCount ?? 0) * (word.masteryScore ?? 0)) / 100,
      ),
      srsLevel: word.srsLevel ?? 0,
      imageUrl: word.definition.image?.url ?? undefined,
      imageId: word.definition.image?.id ?? undefined,
      imageDescription: word.definition.image?.description ?? undefined,
    }));
  } catch (error) {
    void serverLog('Error getting words for SRS review', 'error', { error });
    return [];
  }
}

/**
 * Update SRS data after practice session
 */
export async function updateSRSData(
  userDictionaryId: string,
  isCorrect: boolean,
): Promise<{
  success: boolean;
  srsData?: {
    newLevel: number;
    nextReview: Date;
    interval: number;
  };
  error?: string;
}> {
  try {
    const userWord = await prisma.userDictionary.findUnique({
      where: { id: userDictionaryId },
    });

    if (!userWord) {
      return { success: false, error: 'User word not found' };
    }

    const currentLevel = userWord.srsLevel ?? 0;
    const consecutiveCorrect = userWord.correctStreak ?? 0;

    // Calculate new SRS interval
    const { intervalHours, nextReviewDate } = await calculateSRSInterval(
      currentLevel,
      isCorrect,
      consecutiveCorrect,
    );

    // Update SRS fields
    await prisma.userDictionary.update({
      where: { id: userDictionaryId },
      data: {
        lastSrsSuccess: isCorrect,
        srsInterval: intervalHours,
        nextSrsReview: nextReviewDate,
        nextReviewDue: nextReviewDate,
        lastUsedInContext: new Date(),
        usageCount: { increment: 1 },
      },
    });

    return {
      success: true,
      srsData: {
        newLevel: currentLevel,
        nextReview: nextReviewDate,
        interval: intervalHours,
      },
    };
  } catch (error) {
    void serverLog('Error updating SRS data', 'error', { error });
    return {
      success: false,
      error: 'Failed to update SRS data',
    };
  }
}

/**
 * Get comprehensive SRS review schedule for a user
 */
export async function getSRSReviewSchedule(
  userId: string,
  days: number = 7,
): Promise<{
  success: boolean;
  schedule?: {
    date: string;
    wordsCount: number;
    words: Array<{
      userDictionaryId: string;
      wordText: string;
      srsLevel: number;
      nextReview: Date;
      priority: 'overdue' | 'due' | 'upcoming';
    }>;
  }[];
  error?: string;
}> {
  try {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const words = await prisma.userDictionary.findMany({
      where: {
        userId,
        deletedAt: null,
        nextSrsReview: {
          lte: endDate,
        },
      },
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
      orderBy: { nextSrsReview: 'asc' },
    });

    // Group words by day
    const scheduleMap = new Map<string, typeof words>();

    words.forEach((word) => {
      const reviewDate = word.nextSrsReview || now;
      const dateKey = reviewDate.toISOString().split('T')[0];

      if (dateKey) {
        if (!scheduleMap.has(dateKey)) {
          scheduleMap.set(dateKey, []);
        }
        scheduleMap.get(dateKey)!.push(word);
      }
    });

    const schedule = Array.from(scheduleMap.entries()).map(([date, words]) => ({
      date,
      wordsCount: words.length,
      words: words.map((word) => {
        const reviewDate = word.nextSrsReview || now;
        let priority: 'overdue' | 'due' | 'upcoming' = 'upcoming';

        if (reviewDate <= now) {
          priority = 'overdue';
        } else if (
          reviewDate.getTime() - now.getTime() <=
          24 * 60 * 60 * 1000
        ) {
          priority = 'due';
        }

        return {
          userDictionaryId: word.id,
          wordText:
            word.definition.wordDetails[0]?.wordDetails?.word?.word ?? '',
          srsLevel: word.srsLevel ?? 0,
          nextReview: reviewDate,
          priority,
        };
      }),
    }));

    return { success: true, schedule };
  } catch (error) {
    void serverLog('Error getting SRS review schedule', 'error', { error });
    return { success: false, error: 'Failed to get SRS review schedule' };
  }
}

/**
 * Get SRS statistics for a user
 */
export async function getSRSStatistics(userId: string): Promise<{
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
}> {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(23, 59, 59, 999);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active words with SRS data
    const words = await prisma.userDictionary.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        srsLevel: true,
        srsInterval: true,
        nextSrsReview: true,
        lastSrsSuccess: true,
        reviewCount: true,
        masteryScore: true,
      },
    });

    const totalWords = words.length;
    const overdueWords = words.filter(
      (w) => w.nextSrsReview && w.nextSrsReview <= now,
    ).length;
    const dueToday = words.filter(
      (w) =>
        w.nextSrsReview && w.nextSrsReview <= today && w.nextSrsReview > now,
    ).length;
    const dueTomorrow = words.filter(
      (w) =>
        w.nextSrsReview &&
        w.nextSrsReview <= tomorrow &&
        w.nextSrsReview > today,
    ).length;

    // Level distribution
    const levelDistribution: Record<number, number> = {};
    words.forEach((word) => {
      const level = word.srsLevel ?? 0;
      levelDistribution[level] = (levelDistribution[level] ?? 0) + 1;
    });

    // Average interval
    const intervalsSum = words.reduce(
      (sum, word) => sum + (word.srsInterval ?? 0),
      0,
    );
    const averageInterval = totalWords > 0 ? intervalsSum / totalWords : 0;

    // Review accuracy
    const accuracySum = words.reduce(
      (sum, word) => sum + (word.masteryScore ?? 0),
      0,
    );
    const reviewAccuracy = totalWords > 0 ? accuracySum / totalWords : 0;

    // Calculate streak (simplified - based on recent SRS successes)
    const recentSuccesses = words.filter(
      (w) => w.lastSrsSuccess === true,
    ).length;
    const streakDays = Math.min(recentSuccesses, 30); // Cap at 30 days

    return {
      success: true,
      statistics: {
        totalWords,
        overdueWords,
        dueToday,
        dueTomorrow,
        levelDistribution,
        averageInterval,
        streakDays,
        reviewAccuracy,
      },
    };
  } catch (error) {
    void serverLog('Error getting SRS statistics', 'error', { error });
    return { success: false, error: 'Failed to get SRS statistics' };
  }
}

/**
 * Bulk update SRS intervals (for maintenance/optimization)
 */
export async function bulkUpdateSRSIntervals(
  userId: string,
  recalculateAll: boolean = false,
): Promise<{
  success: boolean;
  updatedCount?: number;
  error?: string;
}> {
  try {
    const words = await prisma.userDictionary.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(recalculateAll ? {} : { nextSrsReview: null }),
      },
    });

    let updatedCount = 0;

    for (const word of words) {
      const { intervalHours, nextReviewDate } = await calculateSRSInterval(
        word.srsLevel ?? 0,
        word.lastSrsSuccess ?? false,
        word.correctStreak ?? 0,
      );

      await prisma.userDictionary.update({
        where: { id: word.id },
        data: {
          srsInterval: intervalHours,
          nextSrsReview: nextReviewDate,
          nextReviewDue: nextReviewDate,
        },
      });

      updatedCount++;
    }

    void serverLog(
      `Bulk updated SRS intervals for ${updatedCount} words`,
      'info',
      {
        userId,
        updatedCount,
      },
    );

    return { success: true, updatedCount };
  } catch (error) {
    void serverLog('Error bulk updating SRS intervals', 'error', { error });
    return { success: false, error: 'Failed to bulk update SRS intervals' };
  }
}

/**
 * Create optimized SRS practice session
 */
export async function createSRSPracticeSession(
  userId: string,
  maxWords: number = 20,
  prioritizeOverdue: boolean = true,
): Promise<{
  success: boolean;
  words?: PracticeWord[];
  sessionInfo?: {
    overdueCount: number;
    dueCount: number;
    newCount: number;
  };
  error?: string;
}> {
  try {
    const now = new Date();

    // Get overdue words first
    const overdueWords = await prisma.userDictionary.findMany({
      where: {
        userId,
        deletedAt: null,
        nextSrsReview: { lte: now },
      },
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
            image: true,
          },
        },
      },
      orderBy: { nextSrsReview: 'asc' },
      take: prioritizeOverdue ? maxWords : Math.floor(maxWords * 0.7),
    });

    const remainingSlots = maxWords - overdueWords.length;
    let dueWords: typeof overdueWords = [];
    let newWords: typeof overdueWords = [];

    if (remainingSlots > 0) {
      // Get due words (next 24 hours)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      dueWords = await prisma.userDictionary.findMany({
        where: {
          userId,
          deletedAt: null,
          nextSrsReview: {
            gt: now,
            lte: tomorrow,
          },
        },
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
              image: true,
            },
          },
        },
        orderBy: { nextSrsReview: 'asc' },
        take: Math.floor(remainingSlots * 0.7),
      });

      // Fill remaining slots with new words
      const newWordsSlots = remainingSlots - dueWords.length;
      if (newWordsSlots > 0) {
        newWords = await prisma.userDictionary.findMany({
          where: {
            userId,
            deletedAt: null,
            nextSrsReview: null,
            reviewCount: 0,
          },
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
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: newWordsSlots,
        });
      }
    }

    const allWords = [...overdueWords, ...dueWords, ...newWords];

    const practiceWords: PracticeWord[] = allWords.map((word) => ({
      userDictionaryId: word.id,
      wordText: word.definition.wordDetails[0]?.wordDetails?.word?.word ?? '',
      definition: word.definition.definition,
      difficulty: word.srsLevel ?? 0,
      learningStatus: word.learningStatus,
      attempts: word.reviewCount ?? 0,
      correctAttempts: Math.round(
        ((word.reviewCount ?? 0) * (word.masteryScore ?? 0)) / 100,
      ),
      srsLevel: word.srsLevel ?? 0,
      imageUrl: word.definition.image?.url,
      imageId: word.definition.image?.id,
      imageDescription: word.definition.image?.description ?? undefined,
    }));

    return {
      success: true,
      words: practiceWords,
      sessionInfo: {
        overdueCount: overdueWords.length,
        dueCount: dueWords.length,
        newCount: newWords.length,
      },
    };
  } catch (error) {
    void serverLog('Error creating SRS practice session', 'error', { error });
    return { success: false, error: 'Failed to create SRS practice session' };
  }
}
