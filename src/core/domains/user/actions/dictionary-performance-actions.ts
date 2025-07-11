'use server';

import { PrismaClient } from '@prisma/client';
import { cache } from 'react';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import {
  LearningStatus,
  UserDictionary,
  UserLearningSession,
  LearningMistake,
} from '@/core/types';

const prismaClient = new PrismaClient();

/**
 * Performance metrics for a user's dictionary and learning progress
 */
export interface DictionaryPerformanceMetrics {
  learningEfficiency: {
    averageTimeToMaster: number; // days from start to learned status
    wordsLearnedPerWeek: number;
    retentionRate: number; // percentage of learned words still retained
    masteryProgression: number; // average weekly mastery score improvement
    learningVelocity: number; // words/day over last 30 days
  };
  practicePerformance: {
    totalPracticeSessions: number;
    averageAccuracy: number;
    averageResponseTime: number; // milliseconds
    consistencyScore: number; // 0-100 based on accuracy variance
    improvementTrend: 'improving' | 'stable' | 'declining';
    recentSessionsCount: number; // last 7 days
    bestSessionScore: number;
    averageSessionDuration: number; // minutes
    // NEW: Additional response time metrics
    fastestResponseTime: number; // milliseconds
    slowestResponseTime: number; // milliseconds
    responseTimeConsistency: number; // 0-100 based on response time variance
  };
  mistakeAnalysis: {
    totalMistakes: number;
    mistakeRate: number; // mistakes per practice session
    mostProblematicWords: {
      wordText: string;
      mistakeCount: number;
      lastMistake: Date;
      mistakeTypes: string[];
    }[];
    mistakesByType: {
      type: string;
      count: number;
      percentage: number;
    }[];
    improvementRate: number; // reduction in mistake rate over time
    // NEW: Individual word mistake tracking
    averageMistakesPerWord: number;
    highestMistakeWord: {
      wordText: string;
      mistakeCount: number;
    } | null;
  };
  studyHabits: {
    studyStreak: number;
    longestStreak: number;
    averageStudyTime: number; // minutes per day
    preferredStudyTime: number; // hour of day (0-23)
    studyConsistency: number; // days studied / days available (last 30 days)
    weeklyPattern: {
      day: string;
      sessions: number;
      averageDuration: number;
    }[];
  };
  vocabularyManagement: {
    wordsAddedThisWeek: number;
    wordsAddedThisMonth: number;
    favoriteWordsCount: number;
    customModifiedWords: number;
    averageDefinitionsPerWord: number;
    wordsWithCustomNotes: number;
    wordsWithAudio: number;
    wordsWithImages: number;
  };
  reviewSystem: {
    wordsNeedingReview: number;
    overdueSrsWords: number;
    averageSrsLevel: number;
    srsDistribution: {
      level: number;
      count: number;
      percentage: number;
    }[];
    nextReviewDue: Date | null;
    reviewCompliance: number; // percentage of reviews completed on time
  };
  difficultyDistribution: {
    byLearningStatus: {
      status: LearningStatus;
      count: number;
      percentage: number;
    }[];
    byMasteryScore: {
      range: string; // e.g., "0-20", "21-40"
      count: number;
      percentage: number;
    }[];
    averageDifficulty: number;
    mostChallengingPartOfSpeech: string;
  };
  // NEW: Individual Word Performance Tracking (matching screenshot indicators)
  individualWordPerformance: {
    averageCorrectStreak: number;
    longestCorrectStreak: number;
    averageSkipRate: number; // percentage of times words are skipped
    totalSkips: number;
    averageMasteryScore: number;
    topPerformingWords: {
      wordText: string;
      masteryScore: number;
      correctStreak: number;
      srsLevel: number;
    }[];
    strugglingWords: {
      wordText: string;
      masteryScore: number;
      mistakeCount: number;
      skipCount: number;
      responseTimeAvg: number;
    }[];
  };
  // NEW: Comprehensive Performance Scores (matching screenshot Performance Score)
  performanceScores: {
    overallPerformanceScore: number; // 0-10 composite score
    mistakeRateScore: number; // 0-10 based on mistake frequency
    streakConsistencyScore: number; // 0-10 based on correct streaks
    responseTimeScore: number; // 0-10 based on response speed
    skipBehaviorScore: number; // 0-10 based on skip frequency (lower skips = higher score)
    srsProgressionScore: number; // 0-10 based on SRS level advancement
    improvementTrendScore: number; // 0-10 based on recent performance trends
  };
}

/**
 * Get comprehensive dictionary performance metrics
 */
export const getDictionaryPerformanceMetrics = cache(
  async (
    userId: string,
  ): Promise<{
    success: boolean;
    metrics?: DictionaryPerformanceMetrics;
    error?: string;
  }> => {
    try {
      void serverLog(
        `Fetching dictionary performance metrics for user ${userId}`,
        'info',
        { userId },
      );

      // Parallel data fetching for performance
      const [
        userDictionaryStats,
        practiceSessions,
        mistakeData,
        recentActivity,
        srsData,
      ] = await Promise.all([
        // User dictionary statistics
        prismaClient.userDictionary.findMany({
          where: { userId, deletedAt: null },
          include: {
            definition: {
              include: {
                image: true,
                audioLinks: { include: { audio: true } },
                wordDetails: {
                  include: {
                    wordDetails: {
                      include: { word: true },
                    },
                  },
                },
              },
            },
            mistakes: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                },
              },
            },
          },
        }),

        // Practice sessions
        prismaClient.userLearningSession.findMany({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
          include: {
            sessionItems: true,
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Mistake analysis
        prismaClient.learningMistake.findMany({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            word: true,
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
        }),

        // Recent activity for trends
        prismaClient.userDictionary.findMany({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          select: {
            createdAt: true,
            learningStatus: true,
            masteryScore: true,
          },
          orderBy: { createdAt: 'desc' },
        }),

        // SRS data for review system
        prismaClient.userDictionary.findMany({
          where: { userId, deletedAt: null },
          select: {
            srsLevel: true,
            nextSrsReview: true,
            lastReviewedAt: true,
          },
        }),
      ]);

      // Calculate learning efficiency
      const learningEfficiency = calculateLearningEfficiency(
        userDictionaryStats,
        recentActivity.map((item) => ({
          ...item,
          learningStatus: item.learningStatus,
          masteryScore: item.masteryScore,
          createdAt: item.createdAt,
        })) as UserDictionary[],
      );

      // Calculate practice performance
      const practicePerformance =
        calculatePracticePerformance(practiceSessions);

      // Calculate mistake analysis
      const mistakeAnalysis = calculateMistakeAnalysis(
        mistakeData,
        userDictionaryStats,
      );

      // Calculate study habits
      const studyHabits = calculateStudyHabits(practiceSessions);

      // Calculate vocabulary management metrics
      const vocabularyManagement = calculateVocabularyManagement(
        userDictionaryStats,
        recentActivity.map((item) => ({
          ...item,
          learningStatus: item.learningStatus,
          masteryScore: item.masteryScore,
          createdAt: item.createdAt,
        })) as UserDictionary[],
      );

      // Calculate review system
      const reviewSystem = calculateReviewSystem(
        srsData.map((item) => ({
          ...item,
          srsLevel: item.srsLevel,
          nextSrsReview: item.nextSrsReview,
          lastReviewedAt: item.lastReviewedAt,
        })) as UserDictionary[],
      );

      // Calculate difficulty distribution
      const difficultyDistribution =
        calculateDifficultyDistribution(userDictionaryStats);

      // Calculate individual word performance
      const individualWordPerformance = calculateIndividualWordPerformance(
        practiceSessions,
        userDictionaryStats,
      );

      // Calculate performance scores
      const performanceScores = calculatePerformanceScores(
        practiceSessions,
        userDictionaryStats,
      );

      const metrics: DictionaryPerformanceMetrics = {
        learningEfficiency,
        practicePerformance,
        mistakeAnalysis,
        studyHabits,
        vocabularyManagement,
        reviewSystem,
        difficultyDistribution,
        individualWordPerformance,
        performanceScores,
      };

      void serverLog(
        `Successfully calculated dictionary performance metrics for user ${userId}`,
        'info',
        { userId, metricsCount: Object.keys(metrics).length },
      );

      return {
        success: true,
        metrics,
      };
    } catch (error) {
      const errorMessage = `Failed to fetch dictionary performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`;
      void serverLog(errorMessage, 'error', { userId, error });

      handlePrismaError(error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
);

/**
 * Calculate learning efficiency metrics
 */
function calculateLearningEfficiency(
  userDictionaryStats: UserDictionary[],
  recentActivity: UserDictionary[],
) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Calculate average time to master
  const learnedWords = userDictionaryStats.filter(
    (word) => word.learningStatus === LearningStatus.learned,
  );

  const timeToMasterDays = learnedWords
    .filter((word) => word.timeWordWasStartedToLearn && word.timeWordWasLearned)
    .map((word) => {
      const start = new Date(word.timeWordWasStartedToLearn!);
      const learned = new Date(word.timeWordWasLearned!);
      return (learned.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    });

  const averageTimeToMaster =
    timeToMasterDays.length > 0
      ? timeToMasterDays.reduce((sum, days) => sum + days, 0) /
        timeToMasterDays.length
      : 0;

  // Words learned per week
  const wordsLearnedThisWeek = learnedWords.filter(
    (word) =>
      word.timeWordWasLearned &&
      new Date(word.timeWordWasLearned) >= sevenDaysAgo,
  ).length;

  // Retention rate (learned words that haven't regressed)
  const retentionRate =
    learnedWords.length > 0
      ? (learnedWords.filter(
          (word) => word.learningStatus === LearningStatus.learned,
        ).length /
          learnedWords.length) *
        100
      : 0;

  // Learning velocity (words/day over last 30 days)
  const recentLearned = recentActivity.filter(
    (word) => word.learningStatus === LearningStatus.learned,
  ).length;
  const learningVelocity = recentLearned / 30;

  // Mastery progression
  const masteryScores = recentActivity
    .map((word) => word.masteryScore || 0)
    .sort((a, b) => a - b);
  const masteryProgression =
    masteryScores.length > 1
      ? (masteryScores[masteryScores.length - 1] || 0) - (masteryScores[0] || 0)
      : 0;

  return {
    averageTimeToMaster,
    wordsLearnedPerWeek: wordsLearnedThisWeek,
    retentionRate,
    masteryProgression,
    learningVelocity,
  };
}

/**
 * Calculate practice performance metrics
 */
function calculatePracticePerformance(practiceSessions: UserLearningSession[]) {
  if (practiceSessions.length === 0) {
    return {
      totalPracticeSessions: 0,
      averageAccuracy: 0,
      averageResponseTime: 0,
      consistencyScore: 0,
      improvementTrend: 'stable' as const,
      recentSessionsCount: 0,
      bestSessionScore: 0,
      averageSessionDuration: 0,
      fastestResponseTime: 0,
      slowestResponseTime: 0,
      responseTimeConsistency: 0,
    };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentSessions = practiceSessions.filter(
    (session) => new Date(session.createdAt) >= sevenDaysAgo,
  );

  // Calculate accuracy
  const totalCorrect = practiceSessions.reduce(
    (sum, session) => sum + (session.correctAnswers || 0),
    0,
  );
  const totalAnswers = practiceSessions.reduce(
    (sum, session) =>
      sum + (session.correctAnswers || 0) + (session.incorrectAnswers || 0),
    0,
  );
  const averageAccuracy =
    totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

  // Calculate response time from session items
  const allResponseTimes = practiceSessions
    .flatMap((session) => session.sessionItems || [])
    .map((item) => item.responseTime)
    .filter((time) => time && time > 0);

  const validResponseTimes = allResponseTimes.filter((time) => time != null);
  const averageResponseTime =
    validResponseTimes.length > 0
      ? validResponseTimes.reduce((sum, time) => sum + time, 0) /
        validResponseTimes.length
      : 0;

  // Calculate consistency score (lower variance = higher consistency)
  const sessionAccuracies = practiceSessions.map((session) => {
    const correct = session.correctAnswers || 0;
    const total =
      (session.correctAnswers || 0) + (session.incorrectAnswers || 0);
    return total > 0 ? (correct / total) * 100 : 0;
  });

  const meanAccuracy =
    sessionAccuracies.reduce((sum, acc) => sum + acc, 0) /
    sessionAccuracies.length;
  const variance =
    sessionAccuracies.reduce(
      (sum, acc) => sum + Math.pow(acc - meanAccuracy, 2),
      0,
    ) / sessionAccuracies.length;
  const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

  // Determine improvement trend
  const recentHalf = practiceSessions.slice(
    0,
    Math.floor(practiceSessions.length / 2),
  );
  const olderHalf = practiceSessions.slice(
    Math.floor(practiceSessions.length / 2),
  );

  const recentAvgAccuracy =
    recentHalf.length > 0
      ? recentHalf.reduce((sum, session) => {
          const correct = session.correctAnswers || 0;
          const total =
            (session.correctAnswers || 0) + (session.incorrectAnswers || 0);
          return sum + (total > 0 ? (correct / total) * 100 : 0);
        }, 0) / recentHalf.length
      : 0;

  const olderAvgAccuracy =
    olderHalf.length > 0
      ? olderHalf.reduce((sum, session) => {
          const correct = session.correctAnswers || 0;
          const total =
            (session.correctAnswers || 0) + (session.incorrectAnswers || 0);
          return sum + (total > 0 ? (correct / total) * 100 : 0);
        }, 0) / olderHalf.length
      : 0;

  let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
  const improvementThreshold = 5; // 5% improvement threshold
  if (recentAvgAccuracy > olderAvgAccuracy + improvementThreshold) {
    improvementTrend = 'improving';
  } else if (recentAvgAccuracy < olderAvgAccuracy - improvementThreshold) {
    improvementTrend = 'declining';
  }

  // Calculate additional metrics
  const fastestResponseTime =
    allResponseTimes.length > 0
      ? Math.min(...allResponseTimes.filter((t) => t != null))
      : 0;
  const slowestResponseTime =
    allResponseTimes.length > 0
      ? Math.max(...allResponseTimes.filter((t) => t != null))
      : 0;

  // Response time consistency (lower variance = higher consistency)
  const meanResponseTime = averageResponseTime;
  const responseTimeVariance =
    validResponseTimes.length > 0
      ? validResponseTimes.reduce(
          (sum, time) => sum + Math.pow(time - meanResponseTime, 2),
          0,
        ) / validResponseTimes.length
      : 0;
  const responseTimeConsistency = Math.max(
    0,
    100 - Math.sqrt(responseTimeVariance) / 10,
  );

  return {
    totalPracticeSessions: practiceSessions.length,
    averageAccuracy,
    averageResponseTime,
    consistencyScore,
    improvementTrend,
    recentSessionsCount: recentSessions.length,
    bestSessionScore: Math.max(...practiceSessions.map((s) => s.score || 0), 0),
    averageSessionDuration:
      practiceSessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
      practiceSessions.length /
      60, // Convert to minutes
    fastestResponseTime,
    slowestResponseTime,
    responseTimeConsistency,
  };
}

/**
 * Calculate mistake analysis metrics
 */
function calculateMistakeAnalysis(
  mistakeData: LearningMistake[],
  userDictionaryStats: UserDictionary[],
) {
  if (mistakeData.length === 0) {
    return {
      totalMistakes: 0,
      mistakeRate: 0,
      mostProblematicWords: [],
      mistakesByType: [],
      improvementRate: 0,
      averageMistakesPerWord: 0,
      highestMistakeWord: null,
    };
  }

  const totalMistakes = mistakeData.length;
  const uniqueSessions = new Set(
    mistakeData.map((m) => m.createdAt.toDateString()),
  ).size;
  const mistakeRate = uniqueSessions > 0 ? totalMistakes / uniqueSessions : 0;

  // Group mistakes by word
  const mistakesByWord = new Map<
    string,
    { count: number; types: Set<string>; lastMistake: Date }
  >();
  mistakeData.forEach((mistake) => {
    const wordKey = mistake.word?.word || 'Unknown';
    if (!mistakesByWord.has(wordKey)) {
      mistakesByWord.set(wordKey, {
        count: 0,
        types: new Set(),
        lastMistake: mistake.createdAt,
      });
    }
    const wordMistakes = mistakesByWord.get(wordKey)!;
    wordMistakes.count++;
    wordMistakes.types.add(mistake.type);
    if (mistake.createdAt > wordMistakes.lastMistake) {
      wordMistakes.lastMistake = mistake.createdAt;
    }
  });

  // Most problematic words
  const mostProblematicWords = Array.from(mistakesByWord.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([wordText, data]) => ({
      wordText,
      mistakeCount: data.count,
      lastMistake: data.lastMistake,
      mistakeTypes: Array.from(data.types),
    }));

  // Mistakes by type
  const mistakeTypeCount = new Map<string, number>();
  mistakeData.forEach((mistake) => {
    mistakeTypeCount.set(
      mistake.type,
      (mistakeTypeCount.get(mistake.type) || 0) + 1,
    );
  });

  const mistakesByType = Array.from(mistakeTypeCount.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / totalMistakes) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate improvement rate (simplified)
  const improvementRate = 0; // Would need historical data

  // Average mistakes per word
  const averageMistakesPerWord =
    userDictionaryStats.length > 0
      ? userDictionaryStats.reduce(
          (sum, word) => sum + (word.amountOfMistakes || 0),
          0,
        ) / userDictionaryStats.length
      : 0;

  // Highest mistake word
  const highestMistakeWord =
    userDictionaryStats.length > 0
      ? userDictionaryStats
          .filter((word) => (word.amountOfMistakes || 0) > 0)
          .sort(
            (a, b) => (b.amountOfMistakes || 0) - (a.amountOfMistakes || 0),
          )[0]
      : null;

  return {
    totalMistakes,
    mistakeRate,
    mostProblematicWords,
    mistakesByType,
    improvementRate,
    averageMistakesPerWord,
    highestMistakeWord: highestMistakeWord
      ? {
          wordText: 'Word', // Would need to join with word data
          mistakeCount: highestMistakeWord.amountOfMistakes || 0,
        }
      : null,
  };
}

/**
 * Calculate study habits metrics
 */
function calculateStudyHabits(practiceSessions: UserLearningSession[]) {
  // Calculate streaks
  const sessionDates = practiceSessions
    .map((session) => new Date(session.createdAt).toDateString())
    .filter((date, index, array) => array.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const uniqueDates = [...new Set(sessionDates)];

  // Calculate streaks by checking consecutive days
  let dateIndex = uniqueDates.length - 1;
  const checkDate = new Date();

  // Current streak
  while (dateIndex >= 0 && uniqueDates[dateIndex]) {
    checkDate.setDate(checkDate.getDate() - 1);
    const checkDateString = checkDate.toDateString();
    if (uniqueDates[dateIndex] === checkDateString) {
      dateIndex--;
    } else {
      break;
    }
  }

  const currentStreak = uniqueDates.length - 1 - dateIndex;

  // Longest streak (simplified calculation)
  const longestStreak = Math.max(currentStreak, uniqueDates.length);

  // Average study time
  const totalStudyTime = practiceSessions.reduce(
    (sum, session) => sum + (session.duration || 0),
    0,
  );
  const averageStudyTime =
    practiceSessions.length > 0
      ? totalStudyTime / practiceSessions.length / 60 // Convert to minutes
      : 0;

  // Preferred study time (hour of day)
  const hourCounts = new Array(24).fill(0);
  practiceSessions.forEach((session) => {
    const hour = new Date(session.startTime).getHours();
    hourCounts[hour]++;
  });
  const preferredStudyTime = hourCounts.indexOf(Math.max(...hourCounts));

  // Study consistency (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSessions = practiceSessions.filter(
    (session) => new Date(session.createdAt) >= thirtyDaysAgo,
  );
  const studyConsistency = (recentSessions.length / 30) * 100;

  // Weekly pattern
  const weeklyPattern = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ].map((day, index) => {
    const daySessions = practiceSessions.filter(
      (session) => new Date(session.startTime).getDay() === index,
    );
    return {
      day,
      sessions: daySessions.length,
      averageDuration:
        daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
            daySessions.length /
            60
          : 0,
    };
  });

  return {
    studyStreak: currentStreak,
    longestStreak,
    averageStudyTime,
    preferredStudyTime,
    studyConsistency,
    weeklyPattern,
  };
}

/**
 * Calculate vocabulary management metrics
 */
function calculateVocabularyManagement(
  userDictionaryStats: UserDictionary[],
  recentActivity: UserDictionary[],
) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const wordsAddedThisWeek = recentActivity.filter(
    (word) => new Date(word.createdAt) >= sevenDaysAgo,
  ).length;

  const wordsAddedThisMonth = recentActivity.filter(
    (word) => new Date(word.createdAt) >= thirtyDaysAgo,
  ).length;

  const favoriteWordsCount = userDictionaryStats.filter(
    (word) => word.isFavorite,
  ).length;

  const customModifiedWords = userDictionaryStats.filter(
    (word) => word.isModified,
  ).length;

  const averageDefinitionsPerWord = 1; // Simplified

  const wordsWithCustomNotes = userDictionaryStats.filter(
    (word) => word.customNotes,
  ).length;

  const wordsWithAudio = userDictionaryStats.length; // Simplified
  const wordsWithImages = userDictionaryStats.length; // Simplified

  return {
    wordsAddedThisWeek,
    wordsAddedThisMonth,
    favoriteWordsCount,
    customModifiedWords,
    averageDefinitionsPerWord,
    wordsWithCustomNotes,
    wordsWithAudio,
    wordsWithImages,
  };
}

/**
 * Calculate review system metrics
 */
function calculateReviewSystem(srsData: UserDictionary[]) {
  const now = new Date();

  const wordsNeedingReview = srsData.filter(
    (word) => word.nextReviewDue && new Date(word.nextReviewDue) <= now,
  ).length;

  const overdueSrsWords = srsData.filter(
    (word) => word.nextSrsReview && new Date(word.nextSrsReview) < now,
  ).length;

  const averageSrsLevel =
    srsData.length > 0
      ? srsData.reduce((sum, word) => sum + (word.srsLevel || 0), 0) /
        srsData.length
      : 0;

  // SRS distribution
  const srsLevelCounts = new Map<number, number>();
  srsData.forEach((word) => {
    const level = word.srsLevel || 0;
    srsLevelCounts.set(level, (srsLevelCounts.get(level) || 0) + 1);
  });

  const srsDistribution = Array.from(srsLevelCounts.entries())
    .map(([level, count]) => ({
      level,
      count,
      percentage: srsData.length > 0 ? (count / srsData.length) * 100 : 0,
    }))
    .sort((a, b) => a.level - b.level);

  // Next review due
  const upcomingReviews = srsData
    .filter((word) => word.nextReviewDue)
    .sort(
      (a, b) =>
        new Date(a.nextReviewDue!).getTime() -
        new Date(b.nextReviewDue!).getTime(),
    );

  const nextReviewDue =
    upcomingReviews.length > 0
      ? new Date(upcomingReviews[0]!.nextReviewDue!)
      : null;

  // Review compliance (simplified)
  const reviewCompliance = 85; // Would need historical data

  return {
    wordsNeedingReview,
    overdueSrsWords,
    averageSrsLevel,
    srsDistribution,
    nextReviewDue,
    reviewCompliance,
  };
}

/**
 * Calculate difficulty distribution metrics
 */
function calculateDifficultyDistribution(
  userDictionaryStats: UserDictionary[],
) {
  // Learning status distribution
  const statusCounts = new Map();
  userDictionaryStats.forEach((word) => {
    const status = word.learningStatus;
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  const byLearningStatus = Array.from(statusCounts.entries()).map(
    ([status, count]) => ({
      status,
      count,
      percentage:
        userDictionaryStats.length > 0
          ? (count / userDictionaryStats.length) * 100
          : 0,
    }),
  );

  // Mastery score distribution
  const masteryRanges = [
    { range: '0-20', min: 0, max: 20 },
    { range: '21-40', min: 21, max: 40 },
    { range: '41-60', min: 41, max: 60 },
    { range: '61-80', min: 61, max: 80 },
    { range: '81-100', min: 81, max: 100 },
  ];

  const byMasteryScore = masteryRanges.map((range) => {
    const count = userDictionaryStats.filter(
      (word) =>
        (word.masteryScore || 0) >= range.min &&
        (word.masteryScore || 0) <= range.max,
    ).length;
    return {
      range: range.range,
      count,
      percentage:
        userDictionaryStats.length > 0
          ? (count / userDictionaryStats.length) * 100
          : 0,
    };
  });

  // Average difficulty
  const averageDifficulty =
    userDictionaryStats.length > 0
      ? userDictionaryStats.reduce(
          (sum, word) => sum + (100 - (word.masteryScore || 0)),
          0,
        ) / userDictionaryStats.length
      : 0;

  // Most challenging part of speech (simplified)
  const mostChallengingPartOfSpeech = 'noun';

  return {
    byLearningStatus,
    byMasteryScore,
    averageDifficulty,
    mostChallengingPartOfSpeech,
  };
}

/**
 * Calculate individual word performance metrics
 */
function calculateIndividualWordPerformance(
  practiceSessions: UserLearningSession[],
  userDictionaryStats: UserDictionary[],
) {
  if (userDictionaryStats.length === 0) {
    return {
      averageCorrectStreak: 0,
      longestCorrectStreak: 0,
      averageSkipRate: 0,
      totalSkips: 0,
      averageMasteryScore: 0,
      topPerformingWords: [],
      strugglingWords: [],
    };
  }

  // Calculate streak metrics
  const correctStreaks = userDictionaryStats.map(
    (word) => word.correctStreak || 0,
  );
  const averageCorrectStreak =
    correctStreaks.reduce((sum, streak) => sum + streak, 0) /
    correctStreaks.length;
  const longestCorrectStreak = Math.max(...correctStreaks);

  // Calculate skip metrics
  const skipCounts = userDictionaryStats.map((word) => word.skipCount || 0);
  const totalSkips = skipCounts.reduce((sum, count) => sum + count, 0);
  const averageSkipRate =
    userDictionaryStats.length > 0
      ? totalSkips / userDictionaryStats.length / 100 // Convert to percentage
      : 0;

  // Calculate mastery score
  const masteryScores = userDictionaryStats.map(
    (word) => word.masteryScore || 0,
  );
  const averageMasteryScore =
    masteryScores.reduce((sum, score) => sum + score, 0) / masteryScores.length;

  // Get top performing words (top 10 by mastery score)
  const topPerformingWords = userDictionaryStats
    .sort((a, b) => (b.masteryScore || 0) - (a.masteryScore || 0))
    .slice(0, 10)
    .map((word) => ({
      wordText: 'Word', // Would need to join with word data
      masteryScore: word.masteryScore || 0,
      correctStreak: word.correctStreak || 0,
      srsLevel: word.srsLevel || 0,
    }));

  // Get struggling words (bottom 10 by mastery score, but with some activity)
  const strugglingWords = userDictionaryStats
    .filter(
      (word) => (word.amountOfMistakes || 0) > 0 || (word.skipCount || 0) > 0,
    )
    .sort((a, b) => {
      // Sort by combination of low mastery score and high mistakes/skips
      const aScore =
        (a.masteryScore || 0) -
        (a.amountOfMistakes || 0) * 2 -
        (a.skipCount || 0);
      const bScore =
        (b.masteryScore || 0) -
        (b.amountOfMistakes || 0) * 2 -
        (b.skipCount || 0);
      return aScore - bScore;
    })
    .slice(0, 10)
    .map((word) => ({
      wordText: 'Word', // Would need to join with word data
      masteryScore: word.masteryScore || 0,
      mistakeCount: word.amountOfMistakes || 0,
      skipCount: word.skipCount || 0,
      responseTimeAvg: 0, // Will be calculated from session items if available
    }));

  return {
    averageCorrectStreak,
    longestCorrectStreak,
    averageSkipRate,
    totalSkips,
    averageMasteryScore,
    topPerformingWords,
    strugglingWords,
  };
}

/**
 * Calculate performance scores
 */
function calculatePerformanceScores(
  practiceSessions: UserLearningSession[],
  userDictionaryStats: UserDictionary[],
) {
  if (userDictionaryStats.length === 0) {
    return {
      overallPerformanceScore: 0,
      mistakeRateScore: 0,
      streakConsistencyScore: 0,
      responseTimeScore: 0,
      skipBehaviorScore: 0,
      srsProgressionScore: 0,
      improvementTrendScore: 0,
    };
  }

  // Calculate mistake rate score (0-10, higher is better)
  const totalMistakes = userDictionaryStats.reduce(
    (sum, word) => sum + (word.amountOfMistakes || 0),
    0,
  );
  const avgMistakesPerWord = totalMistakes / userDictionaryStats.length;
  const mistakeRateScore = Math.max(0, 10 - avgMistakesPerWord * 2); // Less mistakes = higher score

  // Calculate streak consistency score (0-10, higher is better)
  const streaks = userDictionaryStats.map((word) => word.correctStreak || 0);
  const avgStreak =
    streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length;
  const streakConsistencyScore = Math.min(10, avgStreak / 2); // Cap at 10

  // Calculate response time score (0-10, faster is better)
  const responseTimes = practiceSessions.flatMap((session) =>
    (session.sessionItems || [])
      .map((item) => item.responseTime || 0)
      .filter((time) => time > 0),
  );
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length
      : 5000; // Default 5 seconds
  const responseTimeScore = Math.max(0, 10 - avgResponseTime / 1000); // Faster = higher score

  // Calculate skip behavior score (0-10, fewer skips is better)
  const totalSkips = userDictionaryStats.reduce(
    (sum, word) => sum + (word.skipCount || 0),
    0,
  );
  const avgSkipsPerWord = totalSkips / userDictionaryStats.length;
  const skipBehaviorScore = Math.max(0, 10 - avgSkipsPerWord * 2); // Fewer skips = higher score

  // Calculate SRS progression score (0-10, higher SRS levels are better)
  const srsLevels = userDictionaryStats.map((word) => word.srsLevel || 0);
  const avgSrsLevel =
    srsLevels.reduce((sum, level) => sum + level, 0) / srsLevels.length;
  const srsProgressionScore = Math.min(10, avgSrsLevel * 2); // Cap at 10

  // Calculate improvement trend score (0-10, based on recent performance)
  const recentSessions = practiceSessions.slice(0, 10); // Last 10 sessions
  const recentAccuracy =
    recentSessions.length > 0
      ? recentSessions.reduce((sum, session) => {
          const accuracy =
            (session.correctAnswers || 0) /
              ((session.correctAnswers || 0) +
                (session.incorrectAnswers || 0)) || 0;
          return sum + accuracy;
        }, 0) / recentSessions.length
      : 0.5;
  const improvementTrendScore = recentAccuracy * 10; // Convert to 0-10 scale

  // Calculate overall performance score (weighted average)
  const overallPerformanceScore =
    mistakeRateScore * 0.25 + // 25% weight on mistakes
    streakConsistencyScore * 0.2 + // 20% weight on streaks
    responseTimeScore * 0.15 + // 15% weight on response time
    skipBehaviorScore * 0.15 + // 15% weight on skip behavior
    srsProgressionScore * 0.15 + // 15% weight on SRS progression
    improvementTrendScore * 0.1; // 10% weight on improvement trend

  return {
    overallPerformanceScore: Math.round(overallPerformanceScore * 10) / 10, // Round to 1 decimal
    mistakeRateScore: Math.round(mistakeRateScore * 10) / 10,
    streakConsistencyScore: Math.round(streakConsistencyScore * 10) / 10,
    responseTimeScore: Math.round(responseTimeScore * 10) / 10,
    skipBehaviorScore: Math.round(skipBehaviorScore * 10) / 10,
    srsProgressionScore: Math.round(srsProgressionScore * 10) / 10,
    improvementTrendScore: Math.round(improvementTrendScore * 10) / 10,
  };
}
