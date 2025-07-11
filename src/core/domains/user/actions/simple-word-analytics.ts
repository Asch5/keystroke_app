'use server';

import { PrismaClient } from '@prisma/client';
import { cache } from 'react';
import { handlePrismaError } from '../../../shared/database/error-handler';

const prismaClient = new PrismaClient();

/**
 * Simplified interfaces for demo word analytics
 */
export interface SimpleWordAnalytics {
  // Core Performance Metrics
  basicMetrics: {
    totalAttempts: number;
    correctAttempts: number;
    averageResponseTime: number;
    currentStreak: number;
    masteryScore: number;
    skipCount: number;
    mistakeCount: number;
    srsLevel: number;
  };

  // Session Performance
  sessionPerformance: {
    fastestResponseTime: number;
    slowestResponseTime: number;
    medianResponseTime: number;
    responseTimeConsistency: number;
    firstAttemptSuccessRate: number;
    multipleAttemptSuccessRate: number;
    averageAttemptsPerSession: number;
    performanceBySessionTime: Array<{ hour: number; accuracy: number }>;
    sessionPositionEffect: { early: number; middle: number; late: number };
  };

  // Progression Metrics
  progressionMetrics: {
    masteryVelocity: number;
    masteryStabilityIndex: number;
    retentionStrength: number;
    srsIntervalOptimality: number;
    srsSuccessRate: number;
    srsRegressionCount: number;
    timeToFirstCorrect: number;
    lastUsedRecency: number;
  };

  // Error Analytics
  errorAnalytics: {
    mistakesByTimeOfDay: Record<number, number>;
    mistakesBySessionPosition: { early: number; middle: number; late: number };
    recoveryTimeAfterMistake: number;
    mistakeReductionRate: number;
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
    commonMisspellings: Array<{ incorrect: string; frequency: number }>;
    errorTypeEvolution: Array<{ period: string; dominantErrorTypes: string[] }>;
  };

  // Comparative Metrics
  comparativeMetrics: {
    personalAverageComparison: {
      responseTime: number;
      accuracy: number;
    };
    learningEfficiencyIndex: number;
    predictedTimeToMastery: number;
    difficultyPercentile: number;
  };

  // Visual Learning
  visualLearning: {
    modalityEffectiveness: {
      textual: number;
      visual: number;
      auditory: number;
    };
    preferredLearningModality: 'visual' | 'auditory' | 'textual' | 'mixed';
  };

  // Contextual Metrics
  contextualMetrics: {
    timeOfDayOptimal: { hour: number; accuracy: number };
    sessionLengthOptimal: number;
  };

  // Predictions
  predictions: {
    forgettingCurvePrediction: Array<{
      days: number;
      retentionProbability: number;
    }>;
    nextReviewOptimalTiming: Date;
    retentionRisk: 'low' | 'medium' | 'high';
    masteryTimelineEstimate: {
      conservative: number;
      realistic: number;
      optimistic: number;
    };
    plateauRisk: number;
    breakThroughRecommendations: string[];
    nextBestExerciseType: string;
    practiceIntensityRecommendation: 'increase' | 'maintain' | 'decrease';
    difficultyAdjustmentNeeded: number;
  };

  // Smart Insights
  insights: {
    insights: Array<{
      type: 'improvement' | 'concern' | 'achievement' | 'recommendation';
      title: string;
      description: string;
      actionable: boolean;
      suggestedAction?: string;
      confidence: number;
    }>;
    recommendations: Array<{
      category: 'practice_timing' | 'exercise_type' | 'difficulty' | 'context';
      priority: 'high' | 'medium' | 'low';
      recommendation: string;
      expectedImprovement: string;
      effort: 'low' | 'medium' | 'high';
    }>;
  };

  // Timeline
  timeline: {
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
  };
}

/**
 * Get comprehensive analytics for an individual word (simplified demo version)
 */
export const getSimpleWordAnalytics = cache(
  async (
    userId: string,
    userDictionaryId: string,
  ): Promise<{
    success: boolean;
    analytics?: SimpleWordAnalytics;
    error?: string;
  }> => {
    try {
      // void serverLog('Fetching individual word analytics', { userId, userDictionaryId });

      // Get basic word data
      const userWord = await prismaClient.userDictionary.findFirst({
        where: {
          id: userDictionaryId,
          userId,
        },
      });

      if (!userWord) {
        return {
          success: false,
          error: 'Word not found',
        };
      }

      // Generate demo analytics data based on actual word data
      const analytics: SimpleWordAnalytics = generateDemoAnalytics(userWord);

      return {
        success: true,
        analytics,
      };
    } catch (error) {
      // void serverLog('error', 'Failed to get individual word analytics', { error });
      const handledError = handlePrismaError(error);
      return {
        success: false,
        error: handledError.message,
      };
    }
  },
);

/**
 * Generate demo analytics data based on actual word information
 */
interface PrismaUserWordData {
  id: string;
  masteryScore: number | null;
  correctStreak: number | null;
  amountOfMistakes: number | null;
  skipCount: number | null;
  srsLevel: number | null;
  timeWordWasStartedToLearn: Date | null;
  timeWordWasLearned: Date | null;
  lastReviewedAt: Date | null;
  // Prisma includes many more fields, but we only need these for analytics
}

function generateDemoAnalytics(
  userWord: PrismaUserWordData,
): SimpleWordAnalytics {
  const now = new Date();
  const wordLength = 5; // Default word length for demo
  const complexity = Math.min(wordLength / 2, 5);

  // Generate realistic but demo data with null safety
  const mistakes = userWord.amountOfMistakes ?? 0;
  const skips = userWord.skipCount ?? 0;
  const totalAttempts = Math.max(mistakes + skips + 10, 20);
  const correctAttempts = Math.max(totalAttempts - mistakes - skips, 10);

  return {
    basicMetrics: {
      totalAttempts,
      correctAttempts,
      averageResponseTime: 2500, // Default response time for demo
      currentStreak: userWord.correctStreak ?? 3,
      masteryScore: userWord.masteryScore ?? 75,
      skipCount: userWord.skipCount ?? 2,
      mistakeCount: userWord.amountOfMistakes ?? 5,
      srsLevel: userWord.srsLevel ?? 2,
    },

    sessionPerformance: {
      fastestResponseTime: Math.max(2500 * 0.6, 800),
      slowestResponseTime: 2500 * 1.8,
      medianResponseTime: 2500,
      responseTimeConsistency: Math.max(100 - complexity * 5, 60),
      firstAttemptSuccessRate: Math.max(80 - complexity * 3, 50),
      multipleAttemptSuccessRate: Math.min(95, 85 + complexity),
      averageAttemptsPerSession: 1.2 + complexity * 0.1,
      performanceBySessionTime: generateTimeOfDayPerformance(complexity),
      sessionPositionEffect: {
        early: 85 - complexity * 2,
        middle: 90 - complexity,
        late: 80 - complexity * 3,
      },
    },

    progressionMetrics: {
      masteryVelocity: Math.max(0.8 - complexity * 0.1, 0.3),
      masteryStabilityIndex: Math.max(90 - complexity * 5, 60),
      retentionStrength: Math.max(85 - complexity * 3, 55),
      srsIntervalOptimality: Math.max(80 - complexity * 2, 60),
      srsSuccessRate: Math.max(85 - complexity * 4, 55),
      srsRegressionCount: Math.min(complexity, 3),
      timeToFirstCorrect: Math.max(1, complexity - 1),
      lastUsedRecency: userWord.lastReviewedAt
        ? Math.floor(
            (now.getTime() - new Date(userWord.lastReviewedAt).getTime()) /
              (24 * 60 * 60 * 1000),
          )
        : 5,
    },

    errorAnalytics: {
      mistakesByTimeOfDay: generateMistakesByTimeOfDay(
        userWord.amountOfMistakes ?? 5,
      ),
      mistakesBySessionPosition: {
        early: Math.floor((userWord.amountOfMistakes ?? 5) * 0.2),
        middle: Math.floor((userWord.amountOfMistakes ?? 5) * 0.5),
        late: Math.floor((userWord.amountOfMistakes ?? 5) * 0.3),
      },
      recoveryTimeAfterMistake: 3.2 + complexity * 0.5,
      mistakeReductionRate: Math.max(15 - complexity * 2, -5),
      mistakeRecurrencePattern: generateMistakePatterns('word'), // Default word for demo
      errorCorrection: {
        selfCorrected: Math.max((userWord.amountOfMistakes ?? 0) - 2, 0),
        hintRequired: Math.min(2, userWord.amountOfMistakes ?? 0),
        skipped: userWord.skipCount ?? 0,
      },
      commonMisspellings: generateCommonMisspellings('word'), // Default word for demo
      errorTypeEvolution: [
        {
          period: 'Last week',
          dominantErrorTypes: ['typing_speed', 'letter_order'],
        },
        { period: 'Last month', dominantErrorTypes: ['spelling', 'confusion'] },
      ],
    },

    comparativeMetrics: {
      personalAverageComparison: {
        responseTime: complexity > 3 ? 15 : -8,
        accuracy: complexity > 3 ? -5 : 12,
      },
      learningEfficiencyIndex: Math.max(2.5 - complexity * 0.3, 1.2),
      predictedTimeToMastery: Math.max(7 + complexity * 3, 5),
      difficultyPercentile: Math.min(complexity * 18, 85),
    },

    visualLearning: {
      modalityEffectiveness: {
        textual: Math.max(70 + Math.random() * 20, 60),
        visual: Math.max(60 + Math.random() * 30, 50),
        auditory: Math.max(65 + Math.random() * 25, 55),
      },
      preferredLearningModality: complexity > 3 ? 'visual' : 'textual',
    },

    contextualMetrics: {
      timeOfDayOptimal: {
        hour: 14 + Math.floor(Math.random() * 4),
        accuracy: 92,
      },
      sessionLengthOptimal: 15 + complexity * 2,
    },

    predictions: {
      forgettingCurvePrediction: [
        { days: 1, retentionProbability: 0.95 },
        { days: 3, retentionProbability: 0.85 },
        { days: 7, retentionProbability: 0.72 },
        { days: 14, retentionProbability: 0.58 },
        { days: 30, retentionProbability: 0.42 },
      ],
      nextReviewOptimalTiming: new Date(
        now.getTime() + (2 + complexity) * 24 * 60 * 60 * 1000,
      ),
      retentionRisk:
        complexity > 4 ? 'high' : complexity > 2 ? 'medium' : 'low',
      masteryTimelineEstimate: {
        conservative: 14 + complexity * 4,
        realistic: 10 + complexity * 3,
        optimistic: 7 + complexity * 2,
      },
      plateauRisk: complexity * 15,
      breakThroughRecommendations:
        generateBreakthroughRecommendations(complexity),
      nextBestExerciseType:
        complexity > 3 ? 'visual_flashcards' : 'typing_practice',
      practiceIntensityRecommendation: complexity > 4 ? 'increase' : 'maintain',
      difficultyAdjustmentNeeded: complexity > 4 ? 1 : complexity < 2 ? -1 : 0,
    },

    insights: {
      insights: generateSmartInsights(userWord, complexity),
      recommendations: generateRecommendations(userWord, complexity),
    },

    timeline: {
      milestones: generateMilestones(userWord),
      trendLine: generateTrendLine(totalAttempts),
      predictions: generatePredictionLine(),
    },
  };
}

function generateTimeOfDayPerformance(
  complexity: number,
): Array<{ hour: number; accuracy: number }> {
  const hours = [9, 11, 14, 16, 19, 21];
  return hours.map((hour) => ({
    hour,
    accuracy: Math.max(70 + Math.random() * 20 - complexity * 2, 50),
  }));
}

function generateMistakesByTimeOfDay(
  mistakeCount: number,
): Record<number, number> {
  const mistakes: Record<number, number> = {};
  const hours = [9, 11, 14, 16, 19, 21];
  let remaining = mistakeCount;

  hours.forEach((hour, index) => {
    if (index === hours.length - 1) {
      mistakes[hour] = remaining;
    } else {
      const count = Math.floor(Math.random() * Math.min(remaining + 1, 3));
      mistakes[hour] = count;
      remaining -= count;
    }
  });

  return mistakes;
}

function generateMistakePatterns(
  word: string,
): Array<{ type: string; frequency: number; lastOccurrence: Date }> {
  const patterns = [
    'typing_speed',
    'letter_order',
    'similar_letters',
    'memory_lapse',
  ];
  return patterns.slice(0, 2 + Math.floor(word.length / 3)).map((type) => ({
    type,
    frequency: 1 + Math.floor(Math.random() * 3),
    lastOccurrence: new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
    ),
  }));
}

function generateCommonMisspellings(
  word: string,
): Array<{ incorrect: string; frequency: number }> {
  if (word.length < 4) return [];

  const misspellings = [];
  // Generate common letter swaps
  if (word.length > 4) {
    const swapped = word.slice(0, -2) + word.slice(-1) + word.slice(-2, -1);
    misspellings.push({ incorrect: swapped, frequency: 2 });
  }

  // Generate missing letter
  if (word.length > 3) {
    const missing = word.slice(0, -1);
    misspellings.push({ incorrect: missing, frequency: 1 });
  }

  return misspellings;
}

function generateBreakthroughRecommendations(complexity: number): string[] {
  const recommendations = [
    'Practice with visual memory techniques',
    'Focus on letter-by-letter spelling',
    'Use audio repetition exercises',
    'Practice in shorter, frequent sessions',
    'Create mnemonic devices for this word',
  ];

  return recommendations.slice(0, Math.min(complexity, 3));
}

interface InsightData {
  correctStreak: number | null;
  amountOfMistakes: number | null;
  masteryScore: number | null;
}

function generateSmartInsights(
  userWord: InsightData,
  complexity: number,
): Array<{
  type: 'improvement' | 'concern' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  actionable: boolean;
  suggestedAction?: string;
  confidence: number;
}> {
  const insights: Array<{
    type: 'improvement' | 'concern' | 'achievement' | 'recommendation';
    title: string;
    description: string;
    actionable: boolean;
    suggestedAction?: string;
    confidence: number;
  }> = [];

  if ((userWord.correctStreak ?? 0) > 5) {
    insights.push({
      type: 'achievement' as const,
      title: 'Great Progress!',
      description: `You've maintained a ${userWord.correctStreak ?? 0}-day streak with this word.`,
      actionable: false,
      confidence: 95,
    });
  }

  if (complexity > 4) {
    insights.push({
      type: 'concern' as const,
      title: 'Challenging Word Detected',
      description:
        'This word shows higher difficulty patterns in your learning data.',
      actionable: true,
      suggestedAction:
        'Consider increasing practice frequency or using visual aids.',
      confidence: 87,
    });
  }

  return insights;
}

function generateRecommendations(
  userWord: PrismaUserWordData,
  complexity: number,
): Array<{
  category: 'practice_timing' | 'exercise_type' | 'difficulty' | 'context';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  expectedImprovement: string;
  effort: 'low' | 'medium' | 'high';
}> {
  const recommendations: Array<{
    category: 'practice_timing' | 'exercise_type' | 'difficulty' | 'context';
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    expectedImprovement: string;
    effort: 'low' | 'medium' | 'high';
  }> = [];

  if (complexity > 3) {
    recommendations.push({
      category: 'practice_timing' as const,
      priority: 'high' as const,
      recommendation:
        'Increase practice frequency to 2x daily for better retention',
      expectedImprovement: '15-20% improvement in retention',
      effort: 'medium' as const,
    });
  }

  recommendations.push({
    category: 'exercise_type' as const,
    priority: 'medium' as const,
    recommendation: 'Try visual flashcard exercises for this word',
    expectedImprovement: '10% faster recognition',
    effort: 'low' as const,
  });

  return recommendations;
}

interface MilestoneType {
  date: Date;
  event:
    | 'first_attempt'
    | 'first_correct'
    | 'streak_milestone'
    | 'mastery_level';
  details: string;
  performance: number;
}

function generateMilestones(
  userWord: PrismaUserWordData,
): Array<MilestoneType> {
  const milestones: Array<MilestoneType> = [];
  const now = new Date();

  milestones.push({
    date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    event: 'first_attempt' as const,
    details: 'First time encountering this word',
    performance: 20,
  });

  if ((userWord.correctStreak ?? 0) > 0) {
    milestones.push({
      date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      event: 'first_correct' as const,
      details: 'Successfully answered correctly for the first time',
      performance: 60,
    });
  }

  if ((userWord.correctStreak ?? 0) > 3) {
    milestones.push({
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      event: 'streak_milestone' as const,
      details: 'Achieved 3-day correct streak',
      performance: 80,
    });
  }

  return milestones;
}

interface TrendLineType {
  date: Date;
  accuracy: number;
  responseTime: number;
}

function generateTrendLine(totalAttempts: number): Array<TrendLineType> {
  const trendLine: Array<TrendLineType> = [];
  const now = new Date();

  for (let i = Math.min(totalAttempts, 10); i >= 0; i--) {
    trendLine.push({
      date: new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000),
      accuracy: 60 + Math.random() * 40 - i * 2,
      responseTime: 2000 + Math.random() * 1000 + i * 100,
    });
  }

  return trendLine;
}

interface PredictionLineType {
  date: Date;
  predictedPerformance: number;
}

function generatePredictionLine(): Array<PredictionLineType> {
  const predictions: Array<PredictionLineType> = [];
  const now = new Date();

  for (let i = 1; i <= 7; i++) {
    predictions.push({
      date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000),
      predictedPerformance: Math.max(75 + Math.random() * 20 - i, 60),
    });
  }

  return predictions;
}
