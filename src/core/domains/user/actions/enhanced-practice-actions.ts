'use server';

import { revalidateTag } from 'next/cache';
import { LearningStatus } from '@prisma/client';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { prisma } from '@/core/shared/database/client';
import {
  PracticeSessionManager,
  PracticeSessionConfig,
  PracticeSessionOptions,
  PracticeAttempt,
  PRACTICE_CONFIGS,
} from '../utils/practice-session-manager';
import {
  DifficultyAssessment,
  LearningUnit,
} from '../utils/difficulty-assessment';

/**
 * Enhanced Practice Actions
 *
 * Server actions that leverage the new difficulty assessment system
 * for intelligent, adaptive learning experiences across all practice types.
 */

export interface CreateIntelligentSessionRequest {
  userId: string;
  practiceType: 'typing' | 'flashcards' | 'pronunciation' | 'quiz' | 'games';
  targetWords?: number;
  userListId?: string;
  listId?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  customConfig?: Partial<PracticeSessionConfig>;
  filters?: {
    learningStatuses?: LearningStatus[];
    difficultyRange?: { min: number; max: number };
    excludeRecentlyPracticed?: boolean;
  };
}

export interface ProcessAttemptRequest {
  sessionId: string;
  learningUnitId: string;
  userInput: string;
  responseTime: number;
  attemptsCount?: number;
  skipRequested?: boolean;
  practiceSpecificData?: Record<string, unknown>;
}

export interface SessionAnalyticsRequest {
  userId: string;
  sessionId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  practiceTypes?: string[];
}

/**
 * Create an intelligent practice session using difficulty assessment
 */
export async function createIntelligentPracticeSession(
  request: CreateIntelligentSessionRequest,
): Promise<{
  success: boolean;
  session?: {
    sessionId: string;
    learningUnits: LearningUnit[];
    config: PracticeSessionConfig;
    analytics: {
      averageDifficulty: number;
      difficultyDistribution: Record<string, number>;
      estimatedDuration: number;
    };
  };
  error?: string;
}> {
  try {
    const {
      userId,
      practiceType,
      targetWords,
      userListId,
      listId,
      difficultyLevel = 'intermediate',
      customConfig,
      filters,
    } = request;

    serverLog(
      `Creating intelligent ${practiceType} session for user ${userId}`,
      'info',
      {
        practiceType,
        targetWords,
        difficultyLevel,
        userListId,
        listId,
      },
    );

    // Get base configuration for practice type
    const baseConfig = PRACTICE_CONFIGS[practiceType];
    if (!baseConfig) {
      return {
        success: false,
        error: `Unsupported practice type: ${practiceType}`,
      };
    }

    // Apply difficulty level adjustments
    const difficultyAdjustments = getDifficultyAdjustments(difficultyLevel);

    // Merge configurations
    const config: PracticeSessionConfig = {
      ...baseConfig,
      ...customConfig,
      targetWords: targetWords || baseConfig.targetWords || 10,
      difficultyDistribution: {
        ...baseConfig.difficultyDistribution,
        ...difficultyAdjustments.difficultyDistribution,
        ...customConfig?.difficultyDistribution,
      },
    } as PracticeSessionConfig;

    // Create session options
    const sessionOptions: PracticeSessionOptions = {
      userId,
      config,
      ...(userListId && { userListId }),
      ...(listId && { listId }),
      excludeRecentlyPracticed: filters?.excludeRecentlyPracticed ?? true,
      customFilters: {
        ...(filters?.learningStatuses && {
          learningStatuses: filters.learningStatuses,
        }),
        ...(filters?.difficultyRange && {
          difficultyRange: filters.difficultyRange,
        }),
      },
    };

    // Create the session using the practice session manager
    const session = await PracticeSessionManager.createSession(sessionOptions);

    // Calculate analytics
    const averageDifficulty = session.analytics.averageDifficulty;
    const difficultyDistribution = session.metadata
      .difficultyDistribution as Record<string, number>;
    const estimatedDuration = estimateSessionDuration(
      session.learningUnits,
      config,
    );

    serverLog(`Created intelligent session ${session.id}`, 'info', {
      wordsCount: session.learningUnits.length,
      averageDifficulty,
      estimatedDuration,
    });

    return {
      success: true,
      session: {
        sessionId: session.id,
        learningUnits: session.learningUnits,
        config: session.config,
        analytics: {
          averageDifficulty,
          difficultyDistribution,
          estimatedDuration,
        },
      },
    };
  } catch (error) {
    serverLog(
      `Error creating intelligent practice session: ${error}`,
      'error',
      {
        userId: request.userId,
        practiceType: request.practiceType,
        error: error instanceof Error ? error.message : String(error),
      },
    );

    const errorMessage = handlePrismaError(error);
    return {
      success: false,
      error:
        typeof errorMessage === 'string'
          ? errorMessage
          : 'Failed to create practice session',
    };
  }
}

/**
 * Process a practice attempt with intelligent feedback and adaptation
 */
export async function processIntelligentAttempt(
  request: ProcessAttemptRequest,
): Promise<{
  success: boolean;
  result?: {
    isCorrect: boolean;
    accuracy: number;
    feedback: {
      message: string;
      explanation?: string;
      encouragement: string;
      nextAction: 'continue' | 'review' | 'complete';
    };
    progress: {
      currentIndex: number;
      totalWords: number;
      correct: number;
      incorrect: number;
      skipped: number;
      sessionProgress: number; // 0-100
    };
    adaptiveAdjustment?: {
      difficultyChanged: boolean;
      newDifficulty: number;
      reason: string;
    };
    nextWord?: LearningUnit;
  };
  error?: string;
}> {
  try {
    const {
      sessionId,
      learningUnitId,
      userInput,
      responseTime,
      attemptsCount = 1,
      skipRequested = false,
      practiceSpecificData = {},
    } = request;

    // Get current session
    const session = PracticeSessionManager.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        error: `Session not found: ${sessionId}`,
      };
    }

    const currentUnit = session.learningUnits[session.currentIndex];
    if (!currentUnit) {
      return {
        success: false,
        error: 'No current learning unit available',
      };
    }

    // Determine correctness based on practice type
    const { isCorrect, accuracy } = evaluateAttempt(
      userInput,
      currentUnit,
      session.config.sessionType,
      practiceSpecificData,
    );

    // Create practice attempt
    const attempt: PracticeAttempt = {
      learningUnitId,
      isCorrect,
      responseTime,
      attemptsCount,
      skipRequested,
      userInput,
      expectedOutput: currentUnit.content.primary,
      metadata: {
        accuracy,
        practiceType: session.config.sessionType,
        difficulty: currentUnit.difficulty.composite,
        ...practiceSpecificData,
      },
    };

    // Process the attempt through the session manager
    const result = await PracticeSessionManager.processAttempt(
      sessionId,
      attempt,
    );

    // Get next word if session isn't complete
    const nextWord =
      result.session.status === 'active' &&
      result.session.currentIndex < result.session.learningUnits.length
        ? result.session.learningUnits[result.session.currentIndex]
        : undefined;

    serverLog(`Processed attempt for session ${sessionId}`, 'info', {
      isCorrect,
      accuracy,
      responseTime,
      currentProgress: result.session.progress.completed,
    });

    return {
      success: true,
      result: {
        isCorrect,
        accuracy,
        feedback: {
          message: result.feedback.isCorrect ? 'Correct!' : 'Incorrect',
          ...(result.feedback.explanation && {
            explanation: result.feedback.explanation,
          }),
          encouragement: result.feedback.encouragement,
          nextAction: result.feedback.nextAction,
        },
        progress: {
          currentIndex: result.session.currentIndex,
          totalWords: result.session.progress.total,
          correct: result.session.progress.correct,
          incorrect: result.session.progress.incorrect,
          skipped: result.session.progress.skipped,
          sessionProgress: Math.round(
            (result.session.progress.completed /
              result.session.progress.total) *
              100,
          ),
        },
        ...(result.adaptiveAdjustment && {
          adaptiveAdjustment: result.adaptiveAdjustment,
        }),
        ...(nextWord && { nextWord }),
      },
    };
  } catch (error) {
    serverLog(`Error processing attempt: ${error}`, 'error', {
      sessionId: request.sessionId,
      error: error instanceof Error ? error.message : String(error),
    });

    const errorMessage = handlePrismaError(error);
    return {
      success: false,
      error:
        typeof errorMessage === 'string'
          ? errorMessage
          : 'Failed to process attempt',
    };
  }
}

/**
 * Complete a practice session and get comprehensive summary
 */
export async function completeIntelligentSession(sessionId: string): Promise<{
  success: boolean;
  summary?: {
    sessionId: string;
    performance: {
      totalWords: number;
      correctAnswers: number;
      incorrectAnswers: number;
      skippedWords: number;
      accuracy: number;
      averageResponseTime: number;
      totalTimeSpent: number;
    };
    learning: {
      wordsLearned: number;
      wordsImproved: number;
      difficultWordsIdentified: number;
      masteryProgression: number;
    };
    difficulty: {
      averageDifficulty: number;
      difficultyProgression: number[];
      adaptiveAdjustments: number;
    };
    recommendations: {
      suggestedNextSession: string;
      focusAreas: string[];
      reviewWords: string[];
    };
    achievements: string[];
  };
  error?: string;
}> {
  try {
    const session = PracticeSessionManager.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        error: `Session not found: ${sessionId}`,
      };
    }

    // Complete the session
    const summary = await PracticeSessionManager.completeSession(session);

    serverLog(`Completed session ${sessionId}`, 'info', {
      accuracy: summary.performance.accuracy,
      wordsLearned: summary.learning.wordsLearned,
      timeSpent: summary.performance.totalTimeSpent,
    });

    // Revalidate relevant caches
    revalidateTag(`user-progress-${session.userId}`);
    revalidateTag(`user-sessions-${session.userId}`);

    return {
      success: true,
      summary,
    };
  } catch (error) {
    serverLog(`Error completing session: ${error}`, 'error', {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });

    const errorMessage = handlePrismaError(error);
    return {
      success: false,
      error:
        typeof errorMessage === 'string'
          ? errorMessage
          : 'Failed to complete session',
    };
  }
}

/**
 * Get word difficulty assessment for a user
 */
export async function getWordDifficultyAssessment(
  userId: string,
  userDictionaryId: string,
): Promise<{
  success: boolean;
  assessment?: {
    composite: number;
    performance: number;
    linguistic: number;
    classification: string;
    confidence: number;
    factors: {
      performance: {
        mistakeRate: number;
        correctStreak: number;
        srsLevel: number;
        averageResponseTime: number;
        skipRate: number;
        recencyFrequency: number;
      };
      linguistic: {
        definitionComplexity: number;
        semanticAbstraction: number;
        wordFrequency: number;
        phoneticIrregularity: number;
        definitionAmbiguity: number;
        relationalComplexity: number;
      };
    };
  };
  error?: string;
}> {
  try {
    const assessment = await DifficultyAssessment.calculateDifficultyScore(
      userId,
      userDictionaryId,
    );

    return {
      success: true,
      assessment: {
        ...assessment,
        factors: {
          ...assessment.factors,
          performance: {
            ...assessment.factors.performance,
            recencyFrequency: assessment.factors.performance.recencyScore,
          },
        },
      },
    };
  } catch (error) {
    serverLog(`Error getting difficulty assessment: ${error}`, 'error', {
      userId,
      userDictionaryId,
      error: error instanceof Error ? error.message : String(error),
    });

    const errorMessage = handlePrismaError(error);
    return {
      success: false,
      error:
        typeof errorMessage === 'string'
          ? errorMessage
          : 'Failed to get difficulty assessment',
    };
  }
}

/**
 * Get comprehensive word difficulty analysis for the dictionary UI
 */
export async function getWordDifficultyAnalysis(
  userId: string,
  userDictionaryId: string,
): Promise<
  | {
      userDictionaryId: string;
      word: string;
      difficultyScore: number;
      classification: 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';
      confidence: number;
      performanceMetrics: {
        mistakeRate: number;
        correctStreak: number;
        srsLevel: number;
        learningStatus: LearningStatus;
        responseTime: number;
        skipRate: number;
        recencyFrequency: number;
        weightedScore: number;
      };
      linguisticMetrics: {
        wordRarity: number;
        phoneticIrregularity: number;
        polysemy: number;
        wordLength: number;
        semanticAbstraction: number;
        relationalComplexity: number;
        weightedScore: number;
      };
      recommendations: string[];
      nextRecommendedPracticeType: string;
      estimatedTimeToMastery: string;
    }
  | string
> {
  try {
    const result = await DifficultyAssessment.calculateDifficultyScore(
      userId,
      userDictionaryId,
    );

    if (!result) {
      throw new Error('Could not calculate difficulty score');
    }

    // Get basic word information
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
                  },
                },
              },
            },
          },
        },
        sessionItems: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        mistakes: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!userDictionaryEntry) {
      throw new Error('User dictionary entry not found');
    }

    const wordData = userDictionaryEntry.definition.wordDetails[0]?.wordDetails;
    if (!wordData) {
      throw new Error('Word data not found');
    }

    // Calculate performance metrics
    const totalReviews = userDictionaryEntry.reviewCount;
    const mistakeRate =
      totalReviews > 0
        ? userDictionaryEntry.amountOfMistakes / totalReviews
        : 0;
    const skipRate =
      totalReviews > 0 ? userDictionaryEntry.skipCount / totalReviews : 0;

    // Calculate average response time from recent session items
    const recentResponseTimes = userDictionaryEntry.sessionItems
      .filter((item) => item.responseTime !== null)
      .map((item) => item.responseTime!)
      .map(Number);
    const averageResponseTime =
      recentResponseTimes.length > 0
        ? recentResponseTimes.reduce(
            (sum: number, time: number) => sum + time,
            0,
          ) /
          recentResponseTimes.length /
          1000 // Convert to seconds
        : 2.5; // Default reasonable response time

    // Calculate recency/frequency score
    const daysSinceLastReview = userDictionaryEntry.lastReviewedAt
      ? Math.floor(
          (Date.now() - userDictionaryEntry.lastReviewedAt.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 365; // Default to a year if never reviewed
    const recencyFrequency = Math.max(0, 1 - daysSinceLastReview / 30); // Scale based on 30-day window

    // Calculate linguistic metrics from the new definition-centric structure
    const wordLength = wordData.word.word.length;

    // Map the new definition-centric metrics to the old interface for backward compatibility
    const wordRarity = result.factors.linguistic.wordFrequency; // wordFrequency replaces wordRarity
    const phoneticIrregularity = result.factors.linguistic.phoneticIrregularity;
    const polysemy = result.factors.linguistic.definitionAmbiguity; // definitionAmbiguity replaces polysemy concept
    const semanticAbstraction = result.factors.linguistic.semanticAbstraction;
    const relationalComplexity = result.factors.linguistic.relationalComplexity;

    // Build performance metrics
    const performanceMetrics = {
      mistakeRate,
      correctStreak: userDictionaryEntry.correctStreak,
      srsLevel: userDictionaryEntry.srsLevel,
      learningStatus: userDictionaryEntry.learningStatus,
      responseTime: averageResponseTime,
      skipRate,
      recencyFrequency,
      weightedScore: result.performance,
    };

    // Build linguistic metrics
    const linguisticMetrics = {
      wordRarity,
      phoneticIrregularity,
      polysemy,
      wordLength: Math.min(1, wordLength / 20), // Normalize to 0-1
      semanticAbstraction,
      relationalComplexity,
      weightedScore: result.linguistic,
    };

    // Generate recommendations
    const recommendations = generateRecommendations(
      userDictionaryEntry.learningStatus,
      result.classification,
      mistakeRate,
      userDictionaryEntry.correctStreak,
      skipRate,
      userDictionaryEntry.srsLevel,
    );

    // Determine next practice type
    const nextPracticeType = determineNextPracticeType(
      userDictionaryEntry.learningStatus,
      result.classification,
      mistakeRate,
      userDictionaryEntry.correctStreak,
    );

    // Estimate time to mastery
    const timeToMastery = estimateTimeToMastery(
      userDictionaryEntry.learningStatus,
      result.composite,
      userDictionaryEntry.correctStreak,
      userDictionaryEntry.reviewCount,
    );

    return {
      userDictionaryId,
      word: wordData.word.word,
      difficultyScore: result.composite,
      classification: result.classification as
        | 'very_easy'
        | 'easy'
        | 'medium'
        | 'hard'
        | 'very_hard',
      confidence: result.confidence,
      performanceMetrics,
      linguisticMetrics,
      recommendations,
      nextRecommendedPracticeType: nextPracticeType,
      estimatedTimeToMastery: timeToMastery,
    };
  } catch (error) {
    serverLog(`Error getting word difficulty analysis: ${error}`, 'error', {
      userId,
      userDictionaryId,
      error: error instanceof Error ? error.message : String(error),
    });

    return `Failed to analyze word difficulty: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Helper functions for difficulty analysis

function generateRecommendations(
  learningStatus: LearningStatus,
  classification: string,
  mistakeRate: number,
  correctStreak: number,
  skipRate: number,
  srsLevel: number,
): string[] {
  const recommendations: string[] = [];

  // Status-based recommendations
  switch (learningStatus) {
    case LearningStatus.notStarted:
      recommendations.push(
        'Start with basic recognition exercises to familiarize yourself with this word',
      );
      recommendations.push(
        'Use flashcard mode to build initial word association',
      );
      break;
    case LearningStatus.inProgress:
      if (mistakeRate > 0.3) {
        recommendations.push(
          'Focus on understanding the definition before attempting typing practice',
        );
        recommendations.push(
          'Use the word in context through example sentences',
        );
      }
      if (correctStreak < 3) {
        recommendations.push(
          'Practice this word more frequently until you achieve a stable correct streak',
        );
      }
      break;
    case LearningStatus.needsReview:
      recommendations.push(
        'This word needs immediate attention - review the definition and practice regularly',
      );
      recommendations.push(
        'Consider creating custom notes or mnemonics to help remember this word',
      );
      break;
    case LearningStatus.difficult:
      recommendations.push(
        'Break down the word into smaller parts or syllables for easier memorization',
      );
      recommendations.push(
        'Practice this word daily until it becomes more familiar',
      );
      recommendations.push(
        'Create personal associations or memory hooks for this challenging word',
      );
      break;
    case LearningStatus.learned:
      recommendations.push(
        'Maintain your knowledge with periodic reviews to prevent forgetting',
      );
      recommendations.push(
        'Try using this word in writing exercises to reinforce mastery',
      );
      break;
  }

  // Difficulty-based recommendations
  if (classification === 'very_hard' || classification === 'hard') {
    recommendations.push(
      'Consider studying this word alongside simpler words to balance difficulty',
    );
    recommendations.push(
      'Use multiple practice modes (typing, flashcards, pronunciation) for comprehensive learning',
    );
  }

  // Behavior-based recommendations
  if (skipRate > 0.2) {
    recommendations.push(
      'You often skip this word - try shorter, more frequent practice sessions',
    );
    recommendations.push(
      'Consider reviewing the definition again to build confidence',
    );
  }

  if (srsLevel < 3) {
    recommendations.push(
      'Continue regular practice to advance through the spaced repetition levels',
    );
  }

  return recommendations;
}

function determineNextPracticeType(
  learningStatus: LearningStatus,
  classification: string,
  mistakeRate: number,
  correctStreak: number,
): string {
  // Early learning stages - start with recognition
  if (learningStatus === LearningStatus.notStarted) {
    return 'Flashcards';
  }

  // High mistake rate - focus on understanding
  if (mistakeRate > 0.4) {
    return 'Definition Review';
  }

  // Difficult words - use multiple modes
  if (classification === 'very_hard' || classification === 'hard') {
    if (correctStreak < 2) {
      return 'Flashcards';
    } else {
      return 'Typing Practice';
    }
  }

  // Standard progression
  if (correctStreak < 3) {
    return 'Typing Practice';
  } else if (correctStreak < 6) {
    return 'Mixed Practice';
  } else {
    return 'Spaced Review';
  }
}

function estimateTimeToMastery(
  learningStatus: LearningStatus,
  difficultyScore: number,
  correctStreak: number,
  reviewCount: number,
): string {
  // Base time calculation
  let baseDays = 7; // Minimum days for mastery

  // Adjust for current status
  switch (learningStatus) {
    case LearningStatus.notStarted:
      baseDays = 14;
      break;
    case LearningStatus.inProgress:
      baseDays = 10;
      break;
    case LearningStatus.needsReview:
      baseDays = 12;
      break;
    case LearningStatus.difficult:
      baseDays = 21;
      break;
    case LearningStatus.learned:
      baseDays = 3; // Just maintenance
      break;
  }

  // Adjust for difficulty
  const difficultyMultiplier = 1 + difficultyScore * 0.5;
  baseDays = Math.ceil(baseDays * difficultyMultiplier);

  // Adjust for progress
  if (correctStreak > 5) {
    baseDays = Math.ceil(baseDays * 0.7);
  } else if (correctStreak > 10) {
    baseDays = Math.ceil(baseDays * 0.5);
  }

  // Adjust for experience
  if (reviewCount > 20) {
    baseDays = Math.ceil(baseDays * 0.8);
  }

  // Format output
  if (baseDays <= 7) {
    return `${baseDays} days`;
  } else if (baseDays <= 21) {
    const weeks = Math.ceil(baseDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.ceil(baseDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
}

/**
 * Get batch difficulty assessments for multiple words
 */
export async function getBatchDifficultyAssessments(
  userId: string,
  userDictionaryIds: string[],
): Promise<{
  success: boolean;
  assessments?: Map<
    string,
    {
      composite: number;
      classification: string;
      confidence: number;
    }
  >;
  error?: string;
}> {
  try {
    const fullAssessments =
      await DifficultyAssessment.calculateBatchDifficultyScores(
        userId,
        userDictionaryIds,
      );

    // Simplify the response for batch operations
    const simplifiedAssessments = new Map();
    fullAssessments.forEach((assessment, id) => {
      simplifiedAssessments.set(id, {
        composite: assessment.composite,
        classification: assessment.classification,
        confidence: assessment.confidence,
      });
    });

    return {
      success: true,
      assessments: simplifiedAssessments,
    };
  } catch (error) {
    serverLog(`Error getting batch assessments: ${error}`, 'error', {
      userId,
      wordCount: userDictionaryIds.length,
      error: error instanceof Error ? error.message : String(error),
    });

    const errorMessage = handlePrismaError(error);
    return {
      success: false,
      error:
        typeof errorMessage === 'string'
          ? errorMessage
          : 'Failed to get batch assessments',
    };
  }
}

/**
 * Pause an active session
 */
export async function pausePracticeSession(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await PracticeSessionManager.pauseSession(sessionId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Resume a paused session
 */
export async function resumePracticeSession(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await PracticeSessionManager.resumeSession(sessionId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Abandon a session
 */
export async function abandonPracticeSession(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await PracticeSessionManager.abandonSession(sessionId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Helper functions

function getDifficultyAdjustments(level: string): {
  difficultyDistribution: { hard: number; medium: number; easy: number };
  timeMultiplier: number;
} {
  const adjustments: Record<
    string,
    {
      difficultyDistribution: { hard: number; medium: number; easy: number };
      timeMultiplier: number;
    }
  > = {
    beginner: {
      difficultyDistribution: { hard: 0.1, medium: 0.3, easy: 0.6 },
      timeMultiplier: 1.5,
    },
    intermediate: {
      difficultyDistribution: { hard: 0.2, medium: 0.5, easy: 0.3 },
      timeMultiplier: 1.0,
    },
    advanced: {
      difficultyDistribution: { hard: 0.4, medium: 0.4, easy: 0.2 },
      timeMultiplier: 0.8,
    },
    expert: {
      difficultyDistribution: { hard: 0.6, medium: 0.3, easy: 0.1 },
      timeMultiplier: 0.6,
    },
  };

  const defaultAdjustment = {
    difficultyDistribution: { hard: 0.2, medium: 0.5, easy: 0.3 },
    timeMultiplier: 1.0,
  };

  return adjustments[level] || defaultAdjustment;
}

function evaluateAttempt(
  userInput: string,
  unit: LearningUnit,
  practiceType: string,
  practiceData: Record<string, unknown>,
): { isCorrect: boolean; accuracy: number } {
  const expectedOutput = unit.content.primary.toLowerCase().trim();
  const userAnswer = userInput.toLowerCase().trim();

  switch (practiceType) {
    case 'typing':
      return evaluateTypingAttempt(userAnswer, expectedOutput);

    case 'flashcards':
      return evaluateFlashcardAttempt(userAnswer, expectedOutput, practiceData);

    case 'pronunciation':
      return evaluatePronunciationAttempt(
        userAnswer,
        expectedOutput,
        practiceData,
      );

    case 'quiz':
      return evaluateQuizAttempt(userAnswer, expectedOutput, practiceData);

    default:
      // Default exact match
      return {
        isCorrect: userAnswer === expectedOutput,
        accuracy: userAnswer === expectedOutput ? 1.0 : 0.0,
      };
  }
}

function evaluateTypingAttempt(
  userInput: string,
  expected: string,
): { isCorrect: boolean; accuracy: number } {
  if (userInput === expected) {
    return { isCorrect: true, accuracy: 1.0 };
  }

  // Calculate character-level accuracy for partial credit
  const accuracy = calculateStringAccuracy(userInput, expected);
  const isCorrect = accuracy >= 0.9; // 90% accuracy required for "correct"

  return { isCorrect, accuracy };
}

function evaluateFlashcardAttempt(
  userInput: string,
  expected: string,
  practiceData: Record<string, unknown>,
): { isCorrect: boolean; accuracy: number } {
  // For flashcards, we might check against multiple acceptable answers
  const acceptableAnswers = (practiceData.acceptableAnswers as string[]) || [
    expected,
  ];

  const isCorrect = acceptableAnswers.some(
    (answer) => userInput === answer.toLowerCase().trim(),
  );

  return {
    isCorrect,
    accuracy: isCorrect ? 1.0 : 0.0,
  };
}

function evaluatePronunciationAttempt(
  userInput: string,
  expected: string,
  practiceData: Record<string, unknown>,
): { isCorrect: boolean; accuracy: number } {
  // For pronunciation, userInput might be a confidence score from speech recognition
  const confidenceScore = (practiceData.confidenceScore as number) || 0;
  const recognizedText = (practiceData.recognizedText as string) || userInput;

  const textAccuracy = calculateStringAccuracy(
    recognizedText.toLowerCase(),
    expected,
  );
  const combinedScore = (textAccuracy + confidenceScore) / 2;

  return {
    isCorrect: combinedScore >= 0.7,
    accuracy: combinedScore,
  };
}

function evaluateQuizAttempt(
  userInput: string,
  expected: string,
  practiceData: Record<string, unknown>,
): { isCorrect: boolean; accuracy: number } {
  const isMultipleChoice = (practiceData.isMultipleChoice as boolean) || false;

  if (isMultipleChoice) {
    // For multiple choice, exact match required
    return {
      isCorrect: userInput === expected,
      accuracy: userInput === expected ? 1.0 : 0.0,
    };
  } else {
    // For text input, allow some flexibility
    const accuracy = calculateStringAccuracy(userInput, expected);
    return {
      isCorrect: accuracy >= 0.8,
      accuracy,
    };
  }
}

function calculateStringAccuracy(input: string, expected: string): number {
  if (input === expected) return 1.0;
  if (input.length === 0 && expected.length === 0) return 1.0;
  if (input.length === 0 || expected.length === 0) return 0.0;

  // Calculate Levenshtein distance
  const inputLen = input.length;
  const expectedLen = expected.length;

  // Initialize matrix with proper dimensions
  const matrix: number[][] = Array(expectedLen + 1)
    .fill(null)
    .map(() => Array(inputLen + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= expectedLen; i++) {
    matrix[i]![0] = i;
  }

  for (let j = 0; j <= inputLen; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= expectedLen; i++) {
    for (let j = 1; j <= inputLen; j++) {
      if (expected[i - 1] === input[j - 1]) {
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

  const distance = matrix[expectedLen]![inputLen]!;
  const maxLength = Math.max(inputLen, expectedLen);

  return (maxLength - distance) / maxLength;
}

function estimateSessionDuration(
  units: LearningUnit[],
  config: PracticeSessionConfig,
): number {
  // Base time per word in seconds
  const baseTimePerWord: Record<string, number> = {
    typing: 30,
    flashcards: 20,
    pronunciation: 45,
    quiz: 25,
    games: 35,
  };

  const baseTime = baseTimePerWord[config.sessionType] || 30;

  // Adjust for difficulty
  const avgDifficulty =
    units.reduce((sum, unit) => sum + unit.difficulty.composite, 0) /
    units.length;
  const difficultyMultiplier = 0.5 + avgDifficulty * 1.5; // 0.5x to 2.0x based on difficulty

  return Math.round(units.length * baseTime * difficultyMultiplier);
}
