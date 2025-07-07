'use server';

import { PrismaClient } from '@prisma/client';
import { LearningStatus } from '@/core/types';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';

import {
  PracticeType,
  LearningAnalytics,
  DifficultyAnalysis,
  ProgressMetrics,
} from './practice-types';

const prisma = new PrismaClient();

/**
 * Track comprehensive word progress with all database integrations
 */
export async function trackCompleteWordProgress(
  userDictionaryId: string,
  sessionId: string,
  userInput: string,
  isCorrect: boolean,
  exerciseType: PracticeType,
  responseTime: number,
): Promise<{
  success: boolean;
  progressData?: {
    userDictionary: Record<string, unknown>;
    sessionItem: Record<string, unknown>;
    mistake?: Record<string, unknown>;
    dailyProgress?: Record<string, unknown>;
  };
  error?: string;
}> {
  try {
    // Get current user dictionary data with full context
    const userWord = await prisma.userDictionary.findUnique({
      where: { id: userDictionaryId },
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

    if (!userWord) {
      return { success: false, error: 'User word not found' };
    }

    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // 1. Update UserDictionary with comprehensive SRS data
    const currentTime = new Date();
    const updatedUserDictionary = await prisma.userDictionary.update({
      where: { id: userDictionaryId },
      data: {
        reviewCount: { increment: 1 },
        correctStreak: isCorrect ? { increment: 1 } : 0,
        ...(isCorrect ? {} : { amountOfMistakes: { increment: 1 } }),
        lastReviewedAt: currentTime,
        lastUsedInContext: currentTime,
        usageCount: { increment: 1 },
        lastSrsSuccess: isCorrect,
        // SRS interval will be calculated and updated by progression system
      },
    });

    // 2. Create UserSessionItem with detailed tracking
    const sessionItem = await prisma.userSessionItem.create({
      data: {
        sessionId,
        userDictionaryId,
        isCorrect,
        responseTime,
        attemptsCount: 1,
      },
    });

    // 3. Create LearningMistake record if incorrect
    let mistakeRecord = null;
    if (!isCorrect) {
      const wordText =
        userWord.definition.wordDetails[0]?.wordDetails?.word?.word ||
        'unknown';

      mistakeRecord = await prisma.learningMistake.create({
        data: {
          userId: userWord.userId,
          wordId:
            userWord.definition.wordDetails[0]?.wordDetails?.word?.id || 0,
          wordDetailsId:
            userWord.definition.wordDetails[0]?.wordDetailsId || null,
          definitionId: userWord.definitionId,
          userDictionaryId: userWord.id,
          type: getMistakeType(exerciseType),
          incorrectValue: userInput,
          context: JSON.stringify({
            exerciseType,
            correctAnswer: wordText,
            responseTime,
            sessionId,
            userInput,
            accuracy: calculateAccuracy(userInput, wordText),
          }),
          mistakeData: {
            exerciseType,
            userInput,
            correctAnswer: wordText,
            responseTime,
            accuracy: calculateAccuracy(userInput, wordText),
            wordDifficulty: userWord.srsLevel || 0,
            attempts: updatedUserDictionary.reviewCount,
          },
        },
      });
    }

    // 4. Update or create UserProgress for daily tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId: userWord.userId,
        date: today,
      },
    });

    let dailyProgress;
    if (existingProgress) {
      dailyProgress = await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          minutesStudied: {
            increment: Math.round(responseTime / 60000), // Convert ms to minutes
          },
          ...(isCorrect && {
            wordsLearned: { increment: 1 },
          }),
        },
      });
    } else {
      dailyProgress = await prisma.userProgress.create({
        data: {
          userId: userWord.userId,
          date: today,
          minutesStudied: Math.round(responseTime / 60000),
          wordsLearned: isCorrect ? 1 : 0,
          streakDays: 1, // Will be calculated properly by streak system
        },
      });
    }

    // 5. Update session progress
    await prisma.userLearningSession.update({
      where: { id: sessionId },
      data: {
        wordsStudied: { increment: 1 },
        ...(isCorrect && {
          correctAnswers: { increment: 1 },
        }),
        ...(!isCorrect && {
          incorrectAnswers: { increment: 1 },
        }),
      },
    });

    return {
      success: true,
      progressData: {
        userDictionary: updatedUserDictionary as Record<string, unknown>,
        sessionItem: sessionItem as Record<string, unknown>,
        ...(mistakeRecord && {
          mistake: mistakeRecord as Record<string, unknown>,
        }),
        dailyProgress: dailyProgress as Record<string, unknown>,
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(
      `Failed to track complete word progress: ${errorMessage}`,
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
 * Get comprehensive learning analytics for a user
 */
export async function getLearningAnalytics(
  userId: string,
  timeframe: 'day' | 'week' | 'month' | 'all' = 'week',
): Promise<{
  success: boolean;
  analytics?: LearningAnalytics;
  error?: string;
}> {
  try {
    const now = new Date();
    let startDate = new Date();

    // Calculate start date based on timeframe
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
      default:
        startDate = new Date('2000-01-01'); // Far in the past
        break;
    }

    // Get practice sessions
    const sessions = await prisma.userLearningSession.findMany({
      where: {
        userId,
        startTime: { gte: startDate },
      },
      include: {
        sessionItems: {
          include: {
            userDictionary: {
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
            },
          },
        },
      },
    });

    // Get learning mistakes
    const mistakes = await prisma.learningMistake.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      include: {
        userDictionary: {
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
        },
      },
    });

    // Get user progress
    const progressRecords = await prisma.userProgress.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate analytics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.endTime !== null).length;
    const totalWordsStudied = sessions.reduce(
      (sum, s) => sum + s.wordsStudied,
      0,
    );
    const totalWordsLearned = sessions.reduce(
      (sum, s) => sum + (s.wordsLearned || 0),
      0,
    );
    const totalTimeMinutes = progressRecords.reduce(
      (sum, p) => sum + p.minutesStudied,
      0,
    );

    // Calculate accuracy from session items
    const allSessionItems = sessions.flatMap((s) => s.sessionItems);
    const correctItems = allSessionItems.filter(
      (item) => item.isCorrect,
    ).length;
    const averageAccuracy =
      allSessionItems.length > 0
        ? (correctItems / allSessionItems.length) * 100
        : 0;

    // Practice type distribution based on session type
    const practiceTypeStats = sessions.reduce(
      (acc, session) => {
        const type = session.sessionType;
        if (!acc[type]) {
          acc[type] = { count: 0, totalWords: 0, accuracy: 0 };
        }
        acc[type].count++;
        acc[type].totalWords += session.wordsStudied;

        // Calculate accuracy for this session
        const sessionItems = session.sessionItems;
        const sessionCorrect = sessionItems.filter(
          (item) => item.isCorrect,
        ).length;
        const sessionAccuracy =
          sessionItems.length > 0
            ? (sessionCorrect / sessionItems.length) * 100
            : 0;
        acc[type].accuracy += sessionAccuracy;
        return acc;
      },
      {} as Record<
        string,
        { count: number; totalWords: number; accuracy: number }
      >,
    );

    // Normalize accuracy averages
    Object.keys(practiceTypeStats).forEach((type) => {
      const stats = practiceTypeStats[type];
      if (stats && stats.count > 0) {
        stats.accuracy /= stats.count;
      }
    });

    // Mistake analysis
    const mistakeTypes = mistakes.reduce(
      (acc, mistake) => {
        const type = mistake.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Daily progress trend
    const dailyProgress = progressRecords.map((record) => ({
      date: record.date,
      minutesStudied: record.minutesStudied,
      wordsLearned: record.wordsLearned,
      streakDays: record.streakDays,
    }));

    // Current streak calculation
    const currentStreak = calculateCurrentStreak(progressRecords);

    const analytics: LearningAnalytics = {
      timeframe,
      totalSessions,
      completedSessions,
      totalWordsStudied,
      totalWordsLearned,
      totalTimeMinutes,
      averageAccuracy,
      currentStreak,
      practiceTypeStats,
      mistakeTypes,
      dailyProgress,
      improvementRate: calculateImprovementRate(sessions),
      difficultyProgression: calculateDifficultyProgression(sessions),
    };

    return {
      success: true,
      analytics,
    };
  } catch (error) {
    serverLog('Error getting learning analytics', 'error', { error });
    return {
      success: false,
      error: 'Failed to get learning analytics',
    };
  }
}

/**
 * Analyze word difficulty patterns and identify problematic words
 */
export async function analyzeDifficultWords(
  userId: string,
  limit: number = 20,
): Promise<{
  success: boolean;
  analysis?: DifficultyAnalysis;
  error?: string;
}> {
  try {
    // Get words with high mistake counts and low mastery scores
    const difficultWords = await prisma.userDictionary.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { masteryScore: { lt: 50 } },
          { amountOfMistakes: { gte: 3 } },
          { learningStatus: LearningStatus.difficult },
          { learningStatus: LearningStatus.needsReview },
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
          },
        },
        mistakes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: [{ amountOfMistakes: 'desc' }, { masteryScore: 'asc' }],
      take: limit,
    });

    // Analyze mistake patterns
    const mistakePatterns = difficultWords.reduce(
      (acc, word) => {
        const wordText =
          word.definition.wordDetails[0]?.wordDetails?.word?.word || '';
        const mistakes = word.mistakes;

        mistakes.forEach((mistake) => {
          const mistakeData = mistake.mistakeData as Record<string, unknown>;
          const exerciseType =
            (mistakeData?.exerciseType as string) || 'unknown';

          const pattern = {
            type: mistake.type || 'unknown',
            word: wordText,
            frequency: 1,
            exerciseTypes: [exerciseType],
          };

          const key = `${mistake.type}-${wordText}`;
          if (acc[key]) {
            acc[key].frequency++;
            if (!acc[key].exerciseTypes.includes(exerciseType)) {
              acc[key].exerciseTypes.push(exerciseType);
            }
          } else {
            acc[key] = pattern;
          }
        });

        return acc;
      },
      {} as Record<
        string,
        {
          type: string;
          word: string;
          frequency: number;
          exerciseTypes: string[];
        }
      >,
    );

    // Calculate difficulty factors
    const difficultyFactors = difficultWords.map((word) => {
      const wordText =
        word.definition.wordDetails[0]?.wordDetails?.word?.word || '';
      const mistakeRate =
        (word.amountOfMistakes || 0) / Math.max(word.reviewCount || 1, 1);

      // Simple difficulty calculation since the method doesn't exist
      const difficultyScore = Math.min(
        100,
        (word.amountOfMistakes || 0) * 10 +
          (100 - (word.masteryScore || 0)) +
          (word.srsLevel || 0) * 5,
      );

      return {
        userDictionaryId: word.id,
        wordText,
        masteryScore: word.masteryScore || 0,
        mistakeCount: word.amountOfMistakes || 0,
        mistakeRate,
        difficultyScore,
        learningStatus: word.learningStatus,
        srsLevel: word.srsLevel || 0,
        recentMistakes: word.mistakes.map((m) => ({
          type: m.type || 'unknown',
          incorrectValue: m.incorrectValue || '',
          createdAt: m.createdAt,
        })),
      };
    });

    // Identify common mistake patterns
    const commonPatterns = Object.values(mistakePatterns)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Recommendations based on analysis
    const recommendations = generateLearningRecommendations(
      difficultyFactors,
      commonPatterns,
    );

    const analysis: DifficultyAnalysis = {
      difficultWords: difficultyFactors,
      mistakePatterns: commonPatterns,
      recommendations,
      totalDifficultWords: difficultWords.length,
      averageDifficultyScore:
        difficultyFactors.reduce((sum, w) => sum + w.difficultyScore, 0) /
        Math.max(difficultyFactors.length, 1),
    };

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    serverLog('Error analyzing difficult words', 'error', { error });
    return {
      success: false,
      error: 'Failed to analyze difficult words',
    };
  }
}

/**
 * Calculate user's overall progress metrics
 */
export async function calculateProgressMetrics(userId: string): Promise<{
  success: boolean;
  metrics?: ProgressMetrics;
  error?: string;
}> {
  try {
    // Get all user dictionary words
    const totalWords = await prisma.userDictionary.count({
      where: { userId, deletedAt: null },
    });

    // Get words by learning status
    const statusCounts = await prisma.userDictionary.groupBy({
      by: ['learningStatus'],
      where: { userId, deletedAt: null },
      _count: { id: true },
    });

    // Get recent progress (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate learning velocity (words learned per day)
    const wordsLearnedRecently = recentProgress.reduce(
      (sum, p) => sum + p.wordsLearned,
      0,
    );
    const daysActive = recentProgress.length;
    const learningVelocity =
      daysActive > 0 ? wordsLearnedRecently / daysActive : 0;

    // Calculate mastery distribution
    const masteryDistribution = await prisma.userDictionary.groupBy({
      by: ['masteryScore'],
      where: { userId, deletedAt: null },
      _count: { id: true },
    });

    // Group mastery scores into ranges
    const masteryRanges = {
      beginner: 0, // 0-30
      intermediate: 0, // 31-70
      advanced: 0, // 71-90
      mastered: 0, // 91-100
    };

    masteryDistribution.forEach((item) => {
      const score = item.masteryScore || 0;
      if (score <= 30) masteryRanges.beginner += item._count.id;
      else if (score <= 70) masteryRanges.intermediate += item._count.id;
      else if (score <= 90) masteryRanges.advanced += item._count.id;
      else masteryRanges.mastered += item._count.id;
    });

    // Calculate current streak
    const currentStreak = calculateCurrentStreak(recentProgress);

    // Calculate completion rate
    const learnedWords =
      statusCounts.find((s) => s.learningStatus === LearningStatus.learned)
        ?._count.id || 0;
    const completionRate =
      totalWords > 0 ? (learnedWords / totalWords) * 100 : 0;

    const metrics: ProgressMetrics = {
      totalWords,
      learnedWords,
      completionRate,
      currentStreak,
      learningVelocity,
      daysActive,
      statusDistribution: statusCounts.reduce(
        (acc, item) => {
          acc[item.learningStatus] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
      masteryDistribution: masteryRanges,
      recentActivity: recentProgress.map((p) => ({
        date: p.date,
        minutesStudied: p.minutesStudied,
        wordsLearned: p.wordsLearned,
      })),
    };

    return {
      success: true,
      metrics,
    };
  } catch (error) {
    serverLog('Error calculating progress metrics', 'error', { error });
    return {
      success: false,
      error: 'Failed to calculate progress metrics',
    };
  }
}

/**
 * Helper functions
 */
function getMistakeType(exerciseType: PracticeType): string {
  switch (exerciseType) {
    case 'write-by-sound':
      return 'pronunciation';
    case 'write-by-definition':
      return 'meaning';
    case 'remember-translation':
      return 'translation';
    case 'choose-right-word':
      return 'recognition';
    case 'make-up-word':
      return 'spelling';
    default:
      return 'spelling';
  }
}

function calculateAccuracy(userInput: string, correctAnswer: string): number {
  const normalizedInput = userInput.toLowerCase().trim();
  const normalizedAnswer = correctAnswer.toLowerCase().trim();

  if (normalizedInput === normalizedAnswer) return 100;

  const distance = levenshteinDistance(normalizedInput, normalizedAnswer);
  const maxLength = Math.max(normalizedInput.length, normalizedAnswer.length);

  return Math.round(((maxLength - distance) / maxLength) * 100);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j]![i] = Math.min(
        matrix[j]![i - 1]! + 1,
        matrix[j - 1]![i]! + 1,
        matrix[j - 1]![i - 1]! + indicator,
      );
    }
  }

  return matrix[str2.length]![str1.length]!;
}

function calculateCurrentStreak(
  progressRecords: Array<{
    date: Date;
    minutesStudied: number;
    wordsLearned: number;
    streakDays: number;
  }>,
): number {
  if (progressRecords.length === 0) return 0;

  // Sort by date descending
  const sorted = progressRecords.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const record of sorted) {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff === streak && record.wordsLearned > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateImprovementRate(
  sessions: Array<{
    startTime: Date;
    sessionItems: Array<{ isCorrect: boolean }>;
  }>,
): number {
  if (sessions.length < 2) return 0;

  const sorted = sessions.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

  const calculateAccuracyForSessions = (sessionGroup: typeof firstHalf) => {
    const allItems = sessionGroup.flatMap((s) => s.sessionItems);
    const correctItems = allItems.filter((item) => item.isCorrect).length;
    return allItems.length > 0 ? (correctItems / allItems.length) * 100 : 0;
  };

  const firstAvg = calculateAccuracyForSessions(firstHalf);
  const secondAvg = calculateAccuracyForSessions(secondHalf);

  return secondAvg - firstAvg;
}

function calculateDifficultyProgression(
  sessions: Array<{
    startTime: Date;
    sessionItems: Array<{ isCorrect: boolean }>;
  }>,
): Array<{
  date: Date;
  averageDifficulty: number;
  accuracy: number;
}> {
  return sessions.map((session) => {
    const sessionItems = session.sessionItems;
    const correctItems = sessionItems.filter((item) => item.isCorrect).length;
    const accuracy =
      sessionItems.length > 0 ? (correctItems / sessionItems.length) * 100 : 0;

    return {
      date: session.startTime,
      averageDifficulty: 1, // Simplified - could be enhanced
      accuracy,
    };
  });
}

function generateLearningRecommendations(
  difficultWords: Array<{
    userDictionaryId: string;
    wordText: string;
    masteryScore: number;
    mistakeCount: number;
    mistakeRate: number;
    difficultyScore: number;
    learningStatus: LearningStatus;
    srsLevel: number;
    recentMistakes: Array<{
      type: string;
      incorrectValue: string;
      createdAt: Date;
    }>;
  }>,
  patterns: Array<{
    type: string;
    word: string;
    frequency: number;
    exerciseTypes: string[];
  }>,
): string[] {
  const recommendations: string[] = [];

  if (difficultWords.length > 10) {
    recommendations.push(
      'Focus on reviewing your most difficult words more frequently',
    );
  }

  if (patterns.some((p) => p.type === 'spelling')) {
    recommendations.push('Practice spelling exercises to improve accuracy');
  }

  if (patterns.some((p) => p.type === 'pronunciation')) {
    recommendations.push(
      'Spend more time with audio exercises and phonetic practice',
    );
  }

  if (patterns.some((p) => p.type === 'meaning')) {
    recommendations.push(
      'Review word definitions and contexts more thoroughly',
    );
  }

  const avgDifficulty =
    difficultWords.reduce((sum, w) => sum + w.difficultyScore, 0) /
    Math.max(difficultWords.length, 1);
  if (avgDifficulty > 70) {
    recommendations.push(
      'Consider using easier exercise types for problematic words',
    );
  }

  return recommendations;
}

/**
 * Update daily progress with comprehensive tracking
 */
export async function updateDailyProgress(
  userId: string,
  minutesStudied: number,
  wordsLearned: number = 0,
  sessionCompleted: boolean = false,
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
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create today's progress
    let existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        date: today,
      },
    });

    const isNewDay = !existingProgress;
    let newStreakDays = 1;

    if (existingProgress) {
      // Update existing progress
      existingProgress = await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          minutesStudied: { increment: minutesStudied },
          wordsLearned: { increment: wordsLearned },
        },
      });
    } else {
      // Create new progress entry
      // First, calculate current streak
      const recentProgress = await prisma.userProgress.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30, // Look at last 30 days
      });

      newStreakDays = calculateStreakDays(recentProgress);

      existingProgress = await prisma.userProgress.create({
        data: {
          userId,
          date: today,
          minutesStudied,
          wordsLearned,
          streakDays: newStreakDays,
        },
      });
    }

    // Check for achievements
    const achievements = await checkDailyAchievements(
      userId,
      existingProgress.minutesStudied,
      existingProgress.wordsLearned,
      newStreakDays,
      isNewDay && sessionCompleted,
    );

    // Check if this is a new personal record
    const personalBest = await prisma.userProgress.findFirst({
      where: { userId },
      orderBy: [{ minutesStudied: 'desc' }, { wordsLearned: 'desc' }],
      take: 1,
    });

    const isNewRecord =
      !personalBest ||
      existingProgress.minutesStudied > personalBest.minutesStudied ||
      existingProgress.wordsLearned > personalBest.wordsLearned;

    serverLog('Daily progress updated', 'info', {
      userId,
      date: today,
      minutesStudied: existingProgress.minutesStudied,
      wordsLearned: existingProgress.wordsLearned,
      streakDays: newStreakDays,
      isNewRecord,
      achievements,
    });

    return {
      success: true,
      progress: {
        date: today,
        minutesStudied: existingProgress.minutesStudied,
        wordsLearned: existingProgress.wordsLearned,
        streakDays: newStreakDays,
        isNewRecord,
        achievements,
      },
    };
  } catch (error) {
    serverLog('Error updating daily progress', 'error', { error });
    return { success: false, error: 'Failed to update daily progress' };
  }
}

/**
 * Get user's daily progress history
 */
export async function getDailyProgressHistory(
  userId: string,
  days: number = 30,
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
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const progressHistory = await prisma.userProgress.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate summary statistics
    const totalDays = progressHistory.length;
    const totalMinutes = progressHistory.reduce(
      (sum, p) => sum + p.minutesStudied,
      0,
    );
    const totalWords = progressHistory.reduce(
      (sum, p) => sum + p.wordsLearned,
      0,
    );
    const currentStreak = calculateCurrentStreak(progressHistory);
    const longestStreak = Math.max(
      ...progressHistory.map((p) => p.streakDays),
      0,
    );
    const averageMinutesPerDay = totalDays > 0 ? totalMinutes / totalDays : 0;
    const averageWordsPerDay = totalDays > 0 ? totalWords / totalDays : 0;

    // Mark streak days
    const history = progressHistory.map((progress) => ({
      date: progress.date,
      minutesStudied: progress.minutesStudied,
      wordsLearned: progress.wordsLearned,
      streakDays: progress.streakDays,
      isStreakDay: progress.wordsLearned > 0, // Consider it a streak day if words were learned
    }));

    return {
      success: true,
      history,
      summary: {
        totalDays,
        totalMinutes,
        totalWords,
        currentStreak,
        longestStreak,
        averageMinutesPerDay,
        averageWordsPerDay,
      },
    };
  } catch (error) {
    serverLog('Error getting daily progress history', 'error', { error });
    return { success: false, error: 'Failed to get progress history' };
  }
}

/**
 * Get weekly progress summary
 */
export async function getWeeklyProgressSummary(
  userId: string,
  weeksBack: number = 4,
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
}> {
  try {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(endDate.getDate() - weeksBack * 7);
    startDate.setHours(0, 0, 0, 0);

    const progressData = await prisma.userProgress.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    // Group by weeks
    const weeks: Array<{
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
    }> = [];

    for (let i = 0; i < weeksBack; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekData = progressData.filter((p) => {
        const date = new Date(p.date);
        return date >= weekStart && date <= weekEnd;
      });

      const totalMinutes = weekData.reduce(
        (sum, p) => sum + p.minutesStudied,
        0,
      );
      const totalWords = weekData.reduce((sum, p) => sum + p.wordsLearned, 0);
      const activeDays = weekData.filter((p) => p.wordsLearned > 0).length;
      const maxStreak = Math.max(...weekData.map((p) => p.streakDays), 0);
      const averageMinutesPerDay = activeDays > 0 ? totalMinutes / 7 : 0;
      const averageWordsPerDay = activeDays > 0 ? totalWords / 7 : 0;

      // Define goals (these could be user-configurable)
      const weeklyMinuteGoal = 150; // 2.5 hours per week
      const weeklyWordGoal = 50; // 50 words per week
      const consistencyGoal = 5; // 5 active days per week

      weeks.push({
        weekStart,
        weekEnd,
        totalMinutes,
        totalWords,
        activeDays,
        streakDays: maxStreak,
        averageMinutesPerDay,
        averageWordsPerDay,
        goalsMet: {
          minuteGoal: totalMinutes >= weeklyMinuteGoal,
          wordGoal: totalWords >= weeklyWordGoal,
          consistencyGoal: activeDays >= consistencyGoal,
        },
      });
    }

    // Calculate comparison between first and last week
    let comparison = null;
    if (weeks.length >= 2) {
      const firstWeek = weeks[0];
      const lastWeek = weeks[weeks.length - 1];

      const minutesChange = lastWeek!.totalMinutes - firstWeek!.totalMinutes;
      const wordsChange = lastWeek!.totalWords - firstWeek!.totalWords;
      const streakChange = lastWeek!.streakDays - firstWeek!.streakDays;

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      const improvementScore =
        (minutesChange > 0 ? 1 : 0) +
        (wordsChange > 0 ? 1 : 0) +
        (streakChange > 0 ? 1 : 0);

      if (improvementScore >= 2) trend = 'improving';
      else if (improvementScore === 0) trend = 'declining';

      comparison = {
        minutesChange,
        wordsChange,
        streakChange,
        trend,
      };
    }

    return {
      success: true,
      weeks,
      ...(comparison && { comparison }),
    };
  } catch (error) {
    serverLog('Error getting weekly progress summary', 'error', { error });
    return { success: false, error: 'Failed to get weekly summary' };
  }
}

/**
 * Enhanced streak calculation with detailed analysis
 */
function calculateStreakDays(
  recentProgress: Array<{
    date: Date;
    minutesStudied: number;
    wordsLearned: number;
    streakDays: number;
  }>,
): number {
  if (recentProgress.length === 0) return 1;

  // Sort by date descending
  const sortedProgress = recentProgress.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if user studied yesterday
  const yesterdayProgress = sortedProgress.find((p) => {
    const progressDate = new Date(p.date);
    progressDate.setHours(0, 0, 0, 0);
    return progressDate.getTime() === yesterday.getTime();
  });

  // If no progress yesterday, streak starts fresh
  if (!yesterdayProgress || yesterdayProgress.wordsLearned === 0) {
    return 1;
  }

  // Continue existing streak
  return (yesterdayProgress.streakDays || 0) + 1;
}

/**
 * Check for daily achievements and gamification milestones
 */
async function checkDailyAchievements(
  userId: string,
  minutesStudied: number,
  wordsLearned: number,
  streakDays: number,
  firstSessionToday: boolean,
): Promise<string[]> {
  const achievements: string[] = [];

  // Time-based achievements
  if (minutesStudied >= 60) {
    achievements.push('Hour Scholar - Studied for 60+ minutes today!');
  } else if (minutesStudied >= 30) {
    achievements.push('Dedicated Learner - 30+ minutes of study!');
  }

  // Word-based achievements
  if (wordsLearned >= 50) {
    achievements.push('Word Master - Learned 50+ words today!');
  } else if (wordsLearned >= 20) {
    achievements.push('Vocabulary Builder - Learned 20+ words!');
  } else if (wordsLearned >= 10) {
    achievements.push('Progress Maker - 10 words learned!');
  }

  // Streak-based achievements
  if (streakDays >= 30) {
    achievements.push('Consistency Champion - 30 day streak!');
  } else if (streakDays >= 14) {
    achievements.push('Two Week Warrior - 14 day streak!');
  } else if (streakDays >= 7) {
    achievements.push('Week Wonder - 7 day streak!');
  } else if (streakDays >= 3) {
    achievements.push('Streak Starter - 3 days in a row!');
  }

  // First session achievements
  if (firstSessionToday) {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
      achievements.push('Early Bird - Morning study session!');
    } else if (hour >= 21 || hour < 5) {
      achievements.push('Night Owl - Late evening study!');
    }
  }

  // Weekly milestone check
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weeklyProgress = await prisma.userProgress.findMany({
    where: {
      userId,
      date: { gte: weekStart },
    },
  });

  const weeklyMinutes = weeklyProgress.reduce(
    (sum, p) => sum + p.minutesStudied,
    0,
  );
  const weeklyWords = weeklyProgress.reduce(
    (sum, p) => sum + p.wordsLearned,
    0,
  );

  if (weeklyMinutes >= 300) {
    achievements.push('Weekly Champion - 5+ hours this week!');
  }

  if (weeklyWords >= 100) {
    achievements.push('Vocabulary Virtuoso - 100+ words this week!');
  }

  return achievements;
}
