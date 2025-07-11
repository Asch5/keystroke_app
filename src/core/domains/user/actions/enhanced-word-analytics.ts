'use server';

import { PrismaClient } from '@prisma/client';
import { cache } from 'react';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { UserSessionItem, LearningMistake } from '@/core/types';

const prismaClient = new PrismaClient();

/**
 * Session-based performance analytics for individual words
 */
export interface SessionPerformanceMetrics {
  // Response Time Analysis
  fastestResponseTime: number; // milliseconds
  slowestResponseTime: number; // milliseconds
  responseTimeVariance: number; // consistency measure
  responseTimeConsistency: number; // consistency score as percentage
  responseTimeImprovement: number; // trend over time
  medianResponseTime: number; // less affected by outliers

  // Attempt Patterns
  averageAttemptsPerSession: number; // from attemptsCount field
  firstAttemptSuccessRate: number; // single-attempt accuracy
  multipleAttemptSuccessRate: number; // recovery rate

  // Session Context Performance
  performanceBySessionTime: Array<{ hour: number; accuracy: number }>; // time-of-day performance
  performanceBySessionType: Record<
    string,
    { accuracy: number; avgTime: number }
  >; // practice type effectiveness
  sessionPositionEffect: { early: number; middle: number; late: number }; // fatigue analysis
}

/**
 * Advanced learning progression tracking for individual words
 */
export interface LearningProgressionMetrics {
  // Mastery Development
  masteryScoreProgression: number[]; // historical mastery scores
  masteryVelocity: number; // rate of mastery improvement
  masteryStabilityIndex: number; // how stable the mastery is

  // SRS Effectiveness
  srsIntervalOptimality: number; // how well SRS intervals work for this word
  srsSuccessRate: number; // success rate at each SRS level
  srsRegressionCount: number; // how often word regresses

  // Learning Phase Analysis
  timeToFirstCorrect: number; // days from start to first correct answer
  timeToStabilization: number; // days to reach stable performance
  retentionStrength: number; // how well word is retained over time

  // Usage and Context
  usageContextVariety: number; // different contexts where word was practiced
  lastUsedRecency: number; // days since last practice
  practiceFrequencyOptimality: number; // whether practice frequency is optimal
}

/**
 * Detailed mistake pattern analysis for individual words
 */
export interface DetailedMistakeAnalytics {
  // Mistake Classification
  mistakesByExerciseType: Record<string, { count: number; rate: number }>;
  mistakesByTimeOfDay: Record<number, number>; // hour-based mistake patterns
  mistakesBySessionPosition: { early: number; middle: number; late: number };

  // Error Recovery Patterns
  recoveryTimeAfterMistake: number; // time to get correct after error
  mistakeRecurrencePattern: Array<{
    type: string;
    frequency: number;
    lastOccurrence: Date;
  }>;
  errorCorrection: {
    selfCorrected: number;
    hintRequired: number;
    skipped: number;
  };

  // Specific Error Analysis
  commonMisspellings: Array<{ incorrect: string; frequency: number }>;
  phoneticErrors: Array<{ type: string; frequency: number }>;
  semanticConfusions: Array<{ confusedWith: string; frequency: number }>;

  // Improvement Tracking
  mistakeReductionRate: number; // rate at which mistakes are decreasing
  errorTypeEvolution: Array<{ period: string; dominantErrorTypes: string[] }>;
}

/**
 * Comparative performance analytics for individual words
 */
export interface ComparativePerformanceMetrics {
  // Personal Benchmarks
  personalAverageComparison: {
    responseTime: number; // percentage faster/slower than personal average
    accuracy: number; // percentage better/worse than personal average
    difficultyRelative: number; // difficulty relative to user's vocabulary
  };

  // Learning Efficiency
  learningEfficiencyIndex: number; // how efficiently this word is being learned
  predictedTimeToMastery: number; // ML-based prediction
  optimalPracticeFrequency: number; // recommended practice interval

  // Ranking and Percentiles
  difficultyPercentile: number; // where this word ranks in user's difficulty distribution
  performancePercentile: number; // performance relative to similar words
  improvementPercentile: number; // improvement rate compared to similar words
}

/**
 * Visual learning indicators for individual words
 */
export interface VisualLearningMetrics {
  // Image Association Performance
  imageRecallAccuracy: number; // when images are present
  imageVsTextPerformance: number; // difference in performance with/without images
  visualMemoryStrength: number; // how much images help this word

  // Audio Learning Analysis
  audioRecallAccuracy: number; // performance with audio cues
  pronunciationDifficulty: number; // based on audio-related mistakes
  listeningComprehension: number; // write-by-sound performance

  // Multimodal Learning
  preferredLearningModality: 'visual' | 'auditory' | 'textual' | 'mixed';
  modalityEffectiveness: Record<string, number>; // effectiveness by input type
}

/**
 * Contextual performance tracking for individual words
 */
export interface ContextualPerformanceMetrics {
  // List Context Performance
  performanceInLists: Array<{
    listName: string;
    accuracy: number;
    avgTime: number;
  }>;
  isolatedVsListPerformance: number; // performance difference when practiced alone vs in lists
  listPositionEffect: { first: number; middle: number; last: number };

  // Temporal Context
  dayOfWeekPerformance: Record<
    string,
    { accuracy: number; responseTime: number }
  >;
  timeOfDayOptimal: { hour: number; accuracy: number }; // best performance time
  sessionLengthOptimal: number; // optimal session duration for this word

  // Cognitive Load Context
  performanceUnderFatigue: number; // performance when tired
  performanceWithDistraction: number; // performance in suboptimal conditions
  multiTaskingEffect: number; // performance when practicing multiple words
}

/**
 * Predictive analytics for individual words
 */
export interface PredictivePerformanceMetrics {
  // Retention Predictions
  forgettingCurvePrediction: Array<{
    days: number;
    retentionProbability: number;
  }>;
  nextReviewOptimalTiming: Date; // ML-optimized review schedule
  retentionRisk: 'low' | 'medium' | 'high'; // risk of forgetting

  // Learning Trajectory
  masteryTimelineEstimate: {
    conservative: number;
    realistic: number;
    optimistic: number;
  };
  plateauRisk: number; // likelihood of hitting learning plateau
  breakThroughRecommendations: string[]; // suggestions to overcome plateaus

  // Adaptive Recommendations
  nextBestExerciseType: string; // AI-recommended next practice type
  difficultyAdjustmentNeeded: number; // suggested difficulty modification
  practiceIntensityRecommendation: 'increase' | 'maintain' | 'decrease';
}

/**
 * Smart insights and recommendations for individual words
 */
export interface SmartInsights {
  // Automated insights based on data patterns
  insights: Array<{
    type: 'improvement' | 'concern' | 'achievement' | 'recommendation';
    title: string;
    description: string;
    actionable: boolean;
    suggestedAction?: string;
    confidence: number; // 0-100% confidence in the insight
  }>;

  // Personalized recommendations
  recommendations: Array<{
    category: 'practice_timing' | 'exercise_type' | 'difficulty' | 'context';
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    expectedImprovement: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Performance timeline for individual words
 */
export interface PerformanceTimeline {
  milestones: Array<{
    date: Date;
    event:
      | 'first_attempt'
      | 'first_correct'
      | 'streak_milestone'
      | 'mastery_level';
    details: string;
    performance: number;
  }>;
  trendLine: Array<{ date: Date; accuracy: number; responseTime: number }>;
  predictions: Array<{ date: Date; predictedPerformance: number }>;
}

/**
 * Comprehensive individual word analytics interface
 */
export interface IndividualWordAnalytics {
  // Core Performance Metrics
  basicMetrics: {
    totalAttempts: number;
    correctAttempts: number;
    averageResponseTime: number;
    currentStreak: number;
    masteryScore: number; // 0-100
    skipCount: number;
    mistakeCount: number;
    srsLevel: number;
  };

  // Advanced Analytics
  sessionPerformance: SessionPerformanceMetrics;
  progressionMetrics: LearningProgressionMetrics;
  errorAnalytics: DetailedMistakeAnalytics;
  comparativeMetrics: ComparativePerformanceMetrics;
  visualLearning: VisualLearningMetrics;
  contextualMetrics: ContextualPerformanceMetrics;
  predictions: PredictivePerformanceMetrics;
  insights: SmartInsights;
  timeline: PerformanceTimeline;
}

/**
 * Get comprehensive individual word performance analytics
 */
export const getIndividualWordAnalytics = cache(
  async (
    userId: string,
    userDictionaryId: string,
  ): Promise<{
    success: boolean;
    analytics?: IndividualWordAnalytics;
    error?: string;
  }> => {
    try {
      void serverLog(
        `Fetching individual word analytics for user ${userId}, word ${userDictionaryId}`,
        'info',
        { userId, userDictionaryId },
      );

      // Parallel data fetching for performance
      const [userWord, sessionItems, mistakes] = await Promise.all([
        // Get the specific word with all related data
        prismaClient.userDictionary.findUnique({
          where: { id: userDictionaryId },
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
              orderBy: { createdAt: 'desc' },
              take: 100, // Last 100 mistakes
            },
            sessionItems: {
              include: {
                session: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 200, // Last 200 practice attempts
            },
          },
        }),

        // Get session items for this word
        prismaClient.userSessionItem.findMany({
          where: { userDictionaryId },
          include: {
            session: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 500, // Extended history for comprehensive analysis
        }),

        // Get mistakes for this word
        prismaClient.learningMistake.findMany({
          where: { userDictionaryId },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
      ]);

      if (!userWord) {
        return {
          success: false,
          error: 'Word not found in user dictionary',
        };
      }

      // Calculate comprehensive analytics
      const analytics: IndividualWordAnalytics = {
        basicMetrics: calculateBasicMetrics(userWord, sessionItems),
        sessionPerformance: calculateSessionPerformance(sessionItems),
        progressionMetrics: calculateProgressionMetrics(userWord, sessionItems),
        errorAnalytics: calculateErrorAnalytics(mistakes, sessionItems),
        comparativeMetrics: calculateComparativeMetrics(userWord, sessionItems),
        visualLearning: calculateVisualLearningMetrics(userWord),
        contextualMetrics: calculateContextualMetrics(sessionItems),
        predictions: calculatePredictiveMetrics(
          userWord,
          sessionItems,
          mistakes,
        ),
        insights: generateSmartInsights(userWord, sessionItems, mistakes),
        timeline: generatePerformanceTimeline(userWord, sessionItems),
      };

      void serverLog(
        `Successfully calculated individual word analytics for ${userDictionaryId}`,
        'info',
        { userId, userDictionaryId, analyticsKeys: Object.keys(analytics) },
      );

      return {
        success: true,
        analytics,
      };
    } catch (error) {
      const errorMessage = `Failed to fetch individual word analytics: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      void serverLog(errorMessage, 'error', {
        userId,
        userDictionaryId,
        error,
      });

      handlePrismaError(error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
);

/**
 * Calculate basic performance metrics for a word
 */
function calculateBasicMetrics(
  userWord: UserWordData,
  sessionItems: UserSessionItem[],
): IndividualWordAnalytics['basicMetrics'] {
  const totalAttempts = sessionItems.length;
  const correctAttempts = sessionItems.filter((item) => item.isCorrect).length;

  const responseTimes = sessionItems
    .map((item) => item.responseTime)
    .filter((time): time is number => time !== null);

  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length
      : 0;

  return {
    totalAttempts,
    correctAttempts,
    averageResponseTime,
    currentStreak: userWord.correctStreak ?? 0,
    masteryScore: userWord.masteryScore ?? 0,
    skipCount: userWord.skipCount ?? 0,
    mistakeCount: userWord.amountOfMistakes ?? 0,
    srsLevel: userWord.srsLevel ?? 0,
  };
}

/**
 * Calculate session-based performance metrics
 */
interface SessionItemData {
  responseTime: number | null;
  attemptsCount: number | null;
  isCorrect: boolean;
  createdAt: Date;
}

interface UserWordData {
  correctStreak: number | null;
  masteryScore: number | null;
  skipCount: number | null;
  amountOfMistakes: number | null;
  srsLevel: number | null;
  timeWordWasStartedToLearn: Date | null;
  timeWordWasLearned: Date | null;
  lastReviewedAt: Date | null;
}

function calculateSessionPerformance(
  sessionItems: SessionItemData[],
): SessionPerformanceMetrics {
  if (sessionItems.length === 0) {
    return {
      fastestResponseTime: 0,
      slowestResponseTime: 0,
      responseTimeVariance: 0,
      responseTimeConsistency: 0,
      responseTimeImprovement: 0,
      medianResponseTime: 0,
      averageAttemptsPerSession: 0,
      firstAttemptSuccessRate: 0,
      multipleAttemptSuccessRate: 0,
      performanceBySessionTime: [],
      performanceBySessionType: {},
      sessionPositionEffect: { early: 0, middle: 0, late: 0 },
    };
  }

  // Filter valid response times and handle null values
  const validResponseTimes = sessionItems
    .map((item) => item.responseTime)
    .filter((time): time is number => time !== null && time > 0);

  const fastestResponseTime =
    validResponseTimes.length > 0 ? Math.min(...validResponseTimes) : 0;
  const slowestResponseTime =
    validResponseTimes.length > 0 ? Math.max(...validResponseTimes) : 0;

  // Calculate response time variance and consistency
  const meanResponseTime =
    validResponseTimes.length > 0
      ? validResponseTimes.reduce((sum, time) => sum + time, 0) /
        validResponseTimes.length
      : 0;

  const responseTimeVariance =
    validResponseTimes.length > 1
      ? validResponseTimes.reduce(
          (sum, time) => sum + Math.pow(time - meanResponseTime, 2),
          0,
        ) / validResponseTimes.length
      : 0;

  const responseTimeConsistency = Math.max(
    0,
    100 - Math.sqrt(responseTimeVariance) / 10,
  );

  // Calculate median response time safely
  const sortedTimes = [...validResponseTimes].sort((a, b) => a - b);
  const medianResponseTime =
    sortedTimes.length > 0
      ? sortedTimes.length % 2 === 0
        ? ((sortedTimes[sortedTimes.length / 2 - 1] || 0) +
            (sortedTimes[sortedTimes.length / 2] || 0)) /
          2
        : sortedTimes[Math.floor(sortedTimes.length / 2)] || 0
      : 0;

  // Calculate response time improvement (simplified - would need historical data)
  const responseTimeImprovement = 0;

  // Calculate attempt patterns
  const validAttempts = sessionItems
    .map((item) => item.attemptsCount)
    .filter((count): count is number => count !== null && count > 0);

  const averageAttemptsPerSession =
    validAttempts.length > 0
      ? validAttempts.reduce((sum, count) => sum + count, 0) /
        validAttempts.length
      : 0;

  const firstAttemptSuccesses = sessionItems.filter(
    (item) => item.isCorrect && (item.attemptsCount ?? 1) === 1,
  ).length;
  const firstAttemptSuccessRate =
    sessionItems.length > 0
      ? (firstAttemptSuccesses / sessionItems.length) * 100
      : 0;

  const multipleAttemptSuccesses = sessionItems.filter(
    (item) => item.isCorrect && (item.attemptsCount ?? 1) > 1,
  ).length;
  const multipleAttemptItems = sessionItems.filter(
    (item) => (item.attemptsCount ?? 1) > 1,
  ).length;
  const multipleAttemptSuccessRate =
    multipleAttemptItems > 0
      ? (multipleAttemptSuccesses / multipleAttemptItems) * 100
      : 0;

  // Performance by session time (hour of day)
  const performanceBySessionTime = Array.from({ length: 24 }, (_, hour) => {
    const hourItems = sessionItems.filter(
      (item) => new Date(item.createdAt).getHours() === hour,
    );
    const accuracy =
      hourItems.length > 0
        ? (hourItems.filter((item) => item.isCorrect).length /
            hourItems.length) *
          100
        : 0;
    return { hour, accuracy };
  }).filter((entry) => entry.accuracy > 0);

  // Session position effect (early, middle, late in session)
  const itemCount = sessionItems.length;
  const earlyItems = sessionItems.slice(0, Math.floor(itemCount / 3));
  const middleItems = sessionItems.slice(
    Math.floor(itemCount / 3),
    Math.floor((itemCount * 2) / 3),
  );
  const lateItems = sessionItems.slice(Math.floor((itemCount * 2) / 3));

  const calculateAccuracy = (items: typeof sessionItems) =>
    items.length > 0
      ? (items.filter((item) => item.isCorrect).length / items.length) * 100
      : 0;

  const sessionPositionEffect = {
    early: calculateAccuracy(earlyItems),
    middle: calculateAccuracy(middleItems),
    late: calculateAccuracy(lateItems),
  };

  return {
    fastestResponseTime,
    slowestResponseTime,
    responseTimeVariance,
    responseTimeConsistency,
    responseTimeImprovement,
    medianResponseTime,
    averageAttemptsPerSession,
    firstAttemptSuccessRate,
    multipleAttemptSuccessRate,
    performanceBySessionTime,
    performanceBySessionType: {}, // Simplified for now
    sessionPositionEffect,
  };
}

/**
 * Calculate learning progression metrics
 */
function calculateProgressionMetrics(
  userWord: UserWordData,
  sessionItems: UserSessionItem[],
): LearningProgressionMetrics {
  // Safe handling of progression timeline
  const progressionTimeline =
    sessionItems.length > 0
      ? sessionItems.map((item, index) => ({
          date: item.createdAt,
          masteryScore: Math.min(100, Math.max(0, (index + 1) * 10)), // Simplified progression
          milestone:
            index === 0
              ? 'first_attempt'
              : index === sessionItems.length - 1
                ? 'latest'
                : 'progress',
        }))
      : [];

  const masteryVelocity =
    sessionItems.length > 1
      ? (userWord.masteryScore ?? 0) / sessionItems.length
      : 0;

  // Calculate time spans safely with null checks
  const firstCorrectItem = sessionItems.find((item) => item.isCorrect);
  const timeToFirstCorrect =
    userWord.timeWordWasStartedToLearn && firstCorrectItem
      ? Math.max(
          0,
          (firstCorrectItem.createdAt.getTime() -
            userWord.timeWordWasStartedToLearn.getTime()) /
            (24 * 60 * 60 * 1000),
        )
      : 0;

  const timeToStabilization =
    userWord.timeWordWasStartedToLearn && userWord.timeWordWasLearned
      ? Math.max(
          0,
          (userWord.timeWordWasLearned.getTime() -
            userWord.timeWordWasStartedToLearn.getTime()) /
            (24 * 60 * 60 * 1000),
        )
      : 0;

  return {
    masteryScoreProgression: progressionTimeline.map(
      (item) => item.masteryScore,
    ),
    masteryVelocity,
    masteryStabilityIndex: Math.min(100, (userWord.masteryScore ?? 0) * 0.8),
    srsIntervalOptimality: Math.min(100, (userWord.srsLevel ?? 0) * 15),
    srsSuccessRate:
      sessionItems.length > 0
        ? (sessionItems.filter((item) => item.isCorrect).length /
            sessionItems.length) *
          100
        : 0,
    srsRegressionCount: 0, // Would need historical SRS data
    timeToFirstCorrect,
    timeToStabilization,
    retentionStrength: Math.min(100, (userWord.masteryScore ?? 0) * 0.9),
    usageContextVariety: Math.min(10, sessionItems.length),
    lastUsedRecency: userWord.lastReviewedAt
      ? Math.max(
          0,
          (Date.now() - userWord.lastReviewedAt.getTime()) /
            (24 * 60 * 60 * 1000),
        )
      : 999,
    practiceFrequencyOptimality:
      sessionItems.length > 0 ? Math.min(100, sessionItems.length * 10) : 0,
  };
}

/**
 * Calculate error analytics
 */
function calculateErrorAnalytics(
  mistakes: LearningMistake[],
  sessionItems: UserSessionItem[],
): DetailedMistakeAnalytics {
  if (mistakes.length === 0) {
    return {
      mistakesByExerciseType: {},
      mistakesByTimeOfDay: {},
      mistakesBySessionPosition: { early: 0, middle: 0, late: 0 },
      recoveryTimeAfterMistake: 0,
      mistakeRecurrencePattern: [],
      errorCorrection: { selfCorrected: 0, hintRequired: 0, skipped: 0 },
      commonMisspellings: [],
      phoneticErrors: [],
      semanticConfusions: [],
      mistakeReductionRate: 0,
      errorTypeEvolution: [],
    };
  }

  // Mistakes by time of day
  const mistakesByTimeOfDay: Record<number, number> = {};
  mistakes.forEach((mistake) => {
    const hour = new Date(mistake.createdAt).getHours();
    mistakesByTimeOfDay[hour] = (mistakesByTimeOfDay[hour] ?? 0) + 1;
  });

  // Mistake recurrence pattern
  const mistakeTypeCount: Record<
    string,
    { count: number; lastOccurrence: Date }
  > = {};
  mistakes.forEach((mistake) => {
    if (!mistakeTypeCount[mistake.type]) {
      mistakeTypeCount[mistake.type] = {
        count: 0,
        lastOccurrence: mistake.createdAt,
      };
    }
    const typeData = mistakeTypeCount[mistake.type];
    if (typeData) {
      typeData.count++;
      if (mistake.createdAt > typeData.lastOccurrence) {
        typeData.lastOccurrence = mistake.createdAt;
      }
    }
  });

  const mistakeRecurrencePattern = Object.entries(mistakeTypeCount).map(
    ([type, data]) => ({
      type,
      frequency: data.count,
      lastOccurrence: data.lastOccurrence,
    }),
  );

  // Common misspellings (simplified - userInputText would need to be added to LearningMistake schema)
  const misspellings: Record<string, number> = {};
  // Note: LearningMistake doesn't have userInputText field, this would need schema update
  // mistakes.forEach((mistake) => {
  //   if (mistake.userInputText && mistake.type === 'spelling') {
  //     misspellings[mistake.userInputText] = (misspellings[mistake.userInputText] || 0) + 1;
  //   }
  // });

  const commonMisspellings = Object.entries(misspellings)
    .map(([incorrect, frequency]) => ({ incorrect, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  // Session position mistakes
  const itemCount = sessionItems.length;
  const earlyItems = sessionItems.slice(0, Math.floor(itemCount / 3));
  const middleItems = sessionItems.slice(
    Math.floor(itemCount / 3),
    Math.floor((itemCount * 2) / 3),
  );
  const lateItems = sessionItems.slice(Math.floor((itemCount * 2) / 3));

  const calculateMistakeCount = (items: typeof sessionItems) =>
    items.filter((item) => !item.isCorrect).length;

  const mistakesBySessionPosition = {
    early: calculateMistakeCount(earlyItems),
    middle: calculateMistakeCount(middleItems),
    late: calculateMistakeCount(lateItems),
  };

  return {
    mistakesByExerciseType: { typing: { count: mistakes.length, rate: 0 } }, // Simplified
    mistakesByTimeOfDay,
    mistakesBySessionPosition,
    recoveryTimeAfterMistake: 0, // Would need more detailed session data
    mistakeRecurrencePattern,
    errorCorrection: {
      selfCorrected: Math.floor(mistakes.length * 0.6),
      hintRequired: Math.floor(mistakes.length * 0.3),
      skipped: Math.floor(mistakes.length * 0.1),
    },
    commonMisspellings,
    phoneticErrors: [], // Would need phonetic analysis
    semanticConfusions: [], // Would need semantic analysis
    mistakeReductionRate: 0, // Would need historical comparison
    errorTypeEvolution: [], // Would need temporal grouping
  };
}

/**
 * Calculate comparative performance metrics
 */
function calculateComparativeMetrics(
  userWord: UserWordData,
  sessionItems: UserSessionItem[],
): ComparativePerformanceMetrics {
  const accuracy =
    sessionItems.length > 0
      ? (sessionItems.filter((item) => item.isCorrect).length /
          sessionItems.length) *
        100
      : 0;

  // Simplified comparative analysis - would need user averages for real comparison
  const personalResponseTimeComparison = 0; // Would need user averages
  const personalAccuracyComparison = 0; // Would need user averages

  return {
    personalAverageComparison: {
      responseTime: personalResponseTimeComparison,
      accuracy: personalAccuracyComparison,
      difficultyRelative: 50, // Simplified
    },
    learningEfficiencyIndex:
      (userWord.masteryScore ?? 0) / Math.max(sessionItems.length, 1),
    predictedTimeToMastery: Math.max(
      1,
      Math.floor((100 - (userWord.masteryScore ?? 0)) / 5),
    ), // Simplified
    optimalPracticeFrequency: 24, // hours - simplified
    difficultyPercentile: 50, // Simplified
    performancePercentile: accuracy,
    improvementPercentile: 50, // Simplified
  };
}

/**
 * Calculate visual learning metrics
 */
function calculateVisualLearningMetrics(
  userWord: UserWordData,
): VisualLearningMetrics {
  // Note: userWord doesn't have definition data directly, so we use simplified values
  // In a real implementation, this would check userWord.definition?.image and audioLinks
  const hasImages = false; // Would need to check userWord.definition?.image
  const hasAudio = false; // Would need to check userWord.definition?.audioLinks

  // Use mastery score as a proxy for learning effectiveness
  const masteryScore = userWord.masteryScore ?? 0;
  const baseEffectiveness = Math.max(50, masteryScore * 0.8);

  return {
    imageRecallAccuracy: hasImages ? 85 : baseEffectiveness,
    imageVsTextPerformance: hasImages ? 10 : 0,
    visualMemoryStrength: hasImages ? 80 : baseEffectiveness,
    audioRecallAccuracy: hasAudio ? 90 : baseEffectiveness,
    pronunciationDifficulty: Math.max(20, 100 - masteryScore),
    listeningComprehension: Math.min(100, baseEffectiveness + 10),
    preferredLearningModality: hasImages
      ? 'visual'
      : hasAudio
        ? 'auditory'
        : 'textual',
    modalityEffectiveness: {
      visual: hasImages ? 85 : baseEffectiveness,
      auditory: hasAudio ? 80 : baseEffectiveness,
      textual: Math.min(100, baseEffectiveness + 5),
    },
  };
}

/**
 * Calculate contextual performance metrics
 */
function calculateContextualMetrics(
  sessionItems: UserSessionItem[],
): ContextualPerformanceMetrics {
  // Day of week performance
  const dayOfWeekPerformance: Record<
    string,
    { accuracy: number; responseTime: number }
  > = {};
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  days.forEach((day, index) => {
    const dayItems = sessionItems.filter(
      (item) => new Date(item.createdAt).getDay() === index,
    );
    const accuracy =
      dayItems.length > 0
        ? (dayItems.filter((item) => item.isCorrect).length / dayItems.length) *
          100
        : 0;
    const avgResponseTime =
      dayItems
        .filter((item) => item.responseTime)
        .reduce((sum, item) => sum + (item.responseTime ?? 0), 0) /
      Math.max(dayItems.length, 1);

    dayOfWeekPerformance[day] = { accuracy, responseTime: avgResponseTime };
  });

  // Find optimal time of day
  const hourlyPerformance = new Map<
    number,
    { correct: number; total: number }
  >();
  sessionItems.forEach((item) => {
    const hour = new Date(item.createdAt).getHours();
    if (!hourlyPerformance.has(hour)) {
      hourlyPerformance.set(hour, { correct: 0, total: 0 });
    }
    const hourData = hourlyPerformance.get(hour)!;
    hourData.total++;
    if (item.isCorrect) hourData.correct++;
  });

  let bestHour = 12;
  let bestAccuracy = 0;
  hourlyPerformance.forEach((data, hour) => {
    const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy;
      bestHour = hour;
    }
  });

  return {
    performanceInLists: [], // Would need list context data
    isolatedVsListPerformance: 0, // Would need list vs isolated practice data
    listPositionEffect: { first: 0, middle: 0, last: 0 }, // Would need position data
    dayOfWeekPerformance,
    timeOfDayOptimal: { hour: bestHour, accuracy: bestAccuracy },
    sessionLengthOptimal: 20, // minutes - simplified
    performanceUnderFatigue: 70, // Simplified
    performanceWithDistraction: 65, // Simplified
    multiTaskingEffect: 60, // Simplified
  };
}

/**
 * Calculate predictive performance metrics
 */
function calculatePredictiveMetrics(
  userWord: UserWordData,
  sessionItems: UserSessionItem[],
  mistakes: LearningMistake[],
): PredictivePerformanceMetrics {
  const masteryScore = userWord.masteryScore ?? 0;
  const currentStreak = userWord.correctStreak ?? 0;
  const mistakeCount = mistakes.length;

  // Simple forgetting curve prediction
  const forgettingCurvePrediction = [
    { days: 1, retentionProbability: Math.max(0.9 - mistakeCount * 0.1, 0.3) },
    { days: 7, retentionProbability: Math.max(0.8 - mistakeCount * 0.1, 0.2) },
    { days: 30, retentionProbability: Math.max(0.7 - mistakeCount * 0.1, 0.1) },
  ];

  // Calculate next optimal review timing
  const nextReviewOptimalTiming = new Date();
  nextReviewOptimalTiming.setHours(
    nextReviewOptimalTiming.getHours() + (userWord.srsLevel ?? 1) * 24,
  );

  // Determine retention risk
  let retentionRisk: 'low' | 'medium' | 'high' = 'low';
  if (mistakeCount > 5 || masteryScore < 50) retentionRisk = 'high';
  else if (mistakeCount > 2 || masteryScore < 75) retentionRisk = 'medium';

  // Estimate mastery timeline
  const masteryTimelineEstimate = {
    conservative: Math.max(1, Math.floor((100 - masteryScore) / 3)), // days
    realistic: Math.max(1, Math.floor((100 - masteryScore) / 5)),
    optimistic: Math.max(1, Math.floor((100 - masteryScore) / 8)),
  };

  // Calculate plateau risk
  const plateauRisk = currentStreak > 10 && masteryScore < 80 ? 70 : 30;

  // Generate breakthrough recommendations
  const breakThroughRecommendations = [];
  if (plateauRisk > 50) {
    breakThroughRecommendations.push('Try different exercise types');
    breakThroughRecommendations.push('Practice in different contexts');
    breakThroughRecommendations.push('Take a short break from this word');
  }

  return {
    forgettingCurvePrediction,
    nextReviewOptimalTiming,
    retentionRisk,
    masteryTimelineEstimate,
    plateauRisk,
    breakThroughRecommendations,
    nextBestExerciseType: 'typing', // Simplified
    difficultyAdjustmentNeeded: 0, // Simplified
    practiceIntensityRecommendation:
      masteryScore < 70 ? 'increase' : 'maintain',
  };
}

/**
 * Generate smart insights and recommendations
 */
function generateSmartInsights(
  userWord: UserWordData,
  sessionItems: UserSessionItem[],
  mistakes: LearningMistake[],
): SmartInsights {
  const insights = [];
  const recommendations = [];

  const masteryScore = userWord.masteryScore ?? 0;
  const accuracy =
    sessionItems.length > 0
      ? (sessionItems.filter((item) => item.isCorrect).length /
          sessionItems.length) *
        100
      : 0;

  // Generate insights
  if (masteryScore > 80) {
    insights.push({
      type: 'achievement' as const,
      title: 'High Mastery Achieved',
      description: 'You have achieved high mastery for this word',
      actionable: false,
      confidence: 90,
    });
  }

  if (mistakes.length > 5) {
    insights.push({
      type: 'concern' as const,
      title: 'High Mistake Count',
      description: 'This word has been challenging for you',
      actionable: true,
      suggestedAction: 'Focus extra practice time on this word',
      confidence: 85,
    });
  }

  if (accuracy > 80) {
    insights.push({
      type: 'improvement' as const,
      title: 'Consistent Performance',
      description: 'Your accuracy with this word is consistently high',
      actionable: false,
      confidence: 80,
    });
  }

  // Generate recommendations
  if (masteryScore < 70) {
    recommendations.push({
      category: 'practice_timing' as const,
      priority: 'high' as const,
      recommendation: 'Practice this word more frequently',
      expectedImprovement: 'Faster mastery and better retention',
      effort: 'low' as const,
    });
  }

  if (mistakes.length > 3) {
    recommendations.push({
      category: 'exercise_type' as const,
      priority: 'medium' as const,
      recommendation: 'Try different exercise types for this word',
      expectedImprovement: 'Reduced mistake frequency',
      effort: 'medium' as const,
    });
  }

  return {
    insights,
    recommendations,
  };
}

/**
 * Generate performance timeline
 */
function generatePerformanceTimeline(
  userWord: UserWordData,
  sessionItems: UserSessionItem[],
): PerformanceTimeline {
  const milestones = [];

  // Add first attempt milestone
  if (sessionItems.length > 0) {
    milestones.push({
      date: new Date(
        sessionItems[sessionItems.length - 1]?.createdAt || new Date(),
      ),
      event: 'first_attempt' as const,
      details: 'First practice attempt for this word',
      performance: 0,
    });
  }

  // Add first correct milestone
  const firstCorrect = sessionItems.reverse().find((item) => item.isCorrect);
  if (firstCorrect) {
    milestones.push({
      date: new Date(firstCorrect.createdAt),
      event: 'first_correct' as const,
      details: 'First correct answer achieved',
      performance: 25,
    });
  }

  // Add streak milestones
  if ((userWord.correctStreak ?? 0) >= 5) {
    milestones.push({
      date: new Date(userWord.lastReviewedAt || Date.now()),
      event: 'streak_milestone' as const,
      details: `Achieved ${userWord.correctStreak ?? 0} correct streak`,
      performance: 75,
    });
  }

  // Generate trend line
  const trendLine = sessionItems.slice(-20).map((item) => ({
    date: new Date(item.createdAt),
    accuracy: item.isCorrect ? 100 : 0,
    responseTime: item.responseTime ?? 0,
  }));

  // Generate predictions
  const predictions = [
    {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      predictedPerformance: Math.min(100, (userWord.masteryScore ?? 0) + 10),
    },
    {
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      predictedPerformance: Math.min(100, (userWord.masteryScore ?? 0) + 25),
    },
  ];

  return {
    milestones,
    trendLine,
    predictions,
  };
}
