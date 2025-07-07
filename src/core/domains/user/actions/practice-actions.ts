'use server';

import { LearningStatus, LanguageCode } from '@/core/types';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import {
  type DifficultyConfig,
  DIFFICULTY_ADJUSTMENT,
} from '../utils/learning-metrics';

// Import from specialized modules
import {
  PracticeType,
  PracticeWord,
  SessionConfiguration,
  ValidateTypingRequest,
  PracticeSessionResult,
  UnifiedPracticeSession,
  getPracticeTypeConfigs,
  getPracticeTypeMultipliers,
} from './practice-types';

import {
  getExerciseLevelMapping,
  getProgressionRequirements,
  determineExerciseTypeProgressive,
  updateWordProgression,
  calculateSRSInterval,
  getWordsForSRSReview,
  updateSRSData,
  getSRSReviewSchedule,
  getSRSStatistics,
  bulkUpdateSRSIntervals,
  createSRSPracticeSession,
} from './practice-progression';

import {
  validateTypingInput,
  validateWordInput,
  calculateAccuracy,
  levenshteinDistance,
  findWordDifferences,
  getMistakeType,
  validateMultipleChoice,
  validateWordConstruction,
  calculateResponseTimeBonus,
} from './practice-validation';

import {
  createPracticeSession,
  completePracticeSession,
  getPracticeSessionStats,
  getRecentPracticeSessions,
  cancelPracticeSession,
  resumePracticeSession,
  updateSessionProgress,
  getSessionAnalytics,
  getEnhancedSessionSummary,
} from './practice-session-management';

import {
  trackCompleteWordProgress,
  getLearningAnalytics,
  analyzeDifficultWords,
  calculateProgressMetrics,
  updateDailyProgress,
  getDailyProgressHistory,
  getWeeklyProgressSummary,
} from './practice-progress-tracking';

import {
  createUnifiedPracticeSession,
  determineExerciseType,
  getNextWordForPractice,
  updateWordProgressAndSelectNext,
  getAdaptivePracticeWords,
} from './practice-unified';

import {
  generateDistractorOptions,
  generateCharacterPool,
  generateSimilarWord,
  isWordSimilarEnough,
} from './practice-game-utils';

// Export the DifficultyConfig type
export type { DifficultyConfig };

// Re-export all types from modules
export type {
  PracticeType,
  PracticeWord,
  SessionConfiguration,
  ValidateTypingRequest,
  PracticeSessionResult,
  UnifiedPracticeSession,
};

// Re-export all functions from modules
export {
  // Types and configs
  getPracticeTypeConfigs,
  getPracticeTypeMultipliers,

  // Progressive learning
  getExerciseLevelMapping,
  getProgressionRequirements,
  determineExerciseTypeProgressive,
  updateWordProgression,
  calculateSRSInterval,
  getWordsForSRSReview,
  updateSRSData,
  getSRSReviewSchedule,
  getSRSStatistics,
  bulkUpdateSRSIntervals,
  createSRSPracticeSession,

  // Validation
  validateTypingInput,
  validateWordInput,
  calculateAccuracy,
  levenshteinDistance,
  findWordDifferences,
  getMistakeType,
  validateMultipleChoice,
  validateWordConstruction,
  calculateResponseTimeBonus,

  // Session management
  createPracticeSession,
  completePracticeSession,
  getPracticeSessionStats,
  getRecentPracticeSessions,
  cancelPracticeSession,
  resumePracticeSession,
  updateSessionProgress,
  getSessionAnalytics,
  getEnhancedSessionSummary,

  // Progress tracking
  trackCompleteWordProgress,
  getLearningAnalytics,
  analyzeDifficultWords,
  calculateProgressMetrics,
  updateDailyProgress,
  getDailyProgressHistory,
  getWeeklyProgressSummary,

  // Unified practice
  createUnifiedPracticeSession,
  determineExerciseType,
  getNextWordForPractice,
  updateWordProgressAndSelectNext,
  getAdaptivePracticeWords,

  // Game utilities
  generateDistractorOptions,
  generateCharacterPool,
  generateSimilarWord,
  isWordSimilarEnough,
};

// Import and re-export word difficulty analysis functions
import {
  analyzeWordDifficulty,
  adjustReviewFrequencyByDifficulty,
  getWordsNeedingAttention,
  type WordDifficultyMetrics,
  type MistakePattern,
  type DifficultyAdjustmentResult,
} from './practice-word-difficulty';

export {
  // Word difficulty analysis
  analyzeWordDifficulty,
  adjustReviewFrequencyByDifficulty,
  getWordsNeedingAttention,
  type WordDifficultyMetrics,
  type MistakePattern,
  type DifficultyAdjustmentResult,
};

/**
 * Legacy interfaces maintained for backward compatibility
 */
export interface CreatePracticeSessionRequest {
  userId: string;
  userListId?: string | null;
  listId?: string | null;
  difficultyLevel: number;
  wordsCount?: number;
  timeLimit?: number;
  includeWordStatuses?: LearningStatus[];
  practiceType?: PracticeType;
}

export interface EnhancedPracticeSession {
  sessionId: string;
  practiceType: PracticeType;
  words: PracticeWord[];
  difficultyLevel: number;
  currentWordIndex: number;
  settings: PracticeSessionSettings;
  config: unknown;
}

export interface PracticeSessionSettings {
  autoPlayAudio: boolean;
  enableGameSounds: boolean;
  showHints: boolean;
  allowSkipping: boolean;
  timeLimit?: number;
}

export interface PracticeSessionProgress {
  sessionId: string;
  currentWordIndex: number;
  totalWords: number;
  correctAnswers: number;
  incorrectAnswers: number;
  currentScore: number;
  timeRemaining: number;
  wordsRemaining: PracticeWord[];
}

export interface UnifiedPracticeWord extends PracticeWord {
  dynamicExerciseType: PracticeType;
  exerciseHistory: PracticeType[];
  nextExerciseType?: PracticeType;
}

/**
 * Legacy typing practice session creation (maintained for backward compatibility)
 */
export async function createTypingPracticeSession(
  request: CreatePracticeSessionRequest,
): Promise<{
  success: boolean;
  session?: {
    sessionId: string;
    words: PracticeWord[];
    timeLimit: number;
    difficultyConfig: DifficultyConfig;
  };
  error?: string;
}> {
  try {
    // Convert legacy request to new session configuration
    const config: SessionConfiguration = {
      practiceType: 'typing',
      wordsToStudy: request.wordsCount || 20,
      difficulty: request.difficultyLevel,
      targetLanguageCode: 'da' as LanguageCode, // Default to Danish
      timeLimit: request.timeLimit,
      listId: request.listId,
      userListId: request.userListId,
      settings: {
        autoPlayAudio: true,
        enableGameSounds: true,
        showHints: true,
        allowSkipping: true,
      },
    };

    // Create session using new system
    const result = await createPracticeSession(request.userId, config);

    if (!result.success || !result.sessionId || !result.words) {
      return {
        success: false,
        error: result.error || 'Failed to create session',
      };
    }

    // Calculate difficulty config for legacy compatibility
    const difficultyLevel = request.difficultyLevel || 3;
    const difficultyConfig: DifficultyConfig =
      DIFFICULTY_ADJUSTMENT.DIFFICULTY_LEVELS[
        difficultyLevel as keyof typeof DIFFICULTY_ADJUSTMENT.DIFFICULTY_LEVELS
      ] || DIFFICULTY_ADJUSTMENT.DIFFICULTY_LEVELS[3];

    return {
      success: true,
      session: {
        sessionId: result.sessionId,
        words: result.words,
        timeLimit: config.timeLimit || 0,
        difficultyConfig,
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(
      `Failed to create typing practice session: ${errorMessage}`,
      'error',
      {
        request,
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
 * Legacy enhanced practice session creation (maintained for backward compatibility)
 */
export async function createEnhancedPracticeSession(
  request: CreatePracticeSessionRequest & { practiceType: PracticeType },
): Promise<{
  success: boolean;
  session?: EnhancedPracticeSession;
  error?: string;
}> {
  try {
    // Convert to unified practice session
    const config: SessionConfiguration = {
      practiceType: request.practiceType,
      wordsToStudy: request.wordsCount || 20,
      difficulty: request.difficultyLevel,
      targetLanguageCode: 'da' as LanguageCode,
      timeLimit: request.timeLimit,
      listId: request.listId,
      userListId: request.userListId,
      settings: {
        autoPlayAudio: true,
        enableGameSounds: true,
        showHints: true,
        allowSkipping: true,
      },
    };

    const result = await createUnifiedPracticeSession(request.userId, config);

    if (!result.success || !result.session) {
      return {
        success: false,
        error: result.error || 'Failed to create enhanced session',
      };
    }

    const practiceConfigs = await getPracticeTypeConfigs();

    // Convert to legacy format
    const enhancedSession: EnhancedPracticeSession = {
      sessionId: result.session.sessionId,
      practiceType: result.session.practiceType,
      words: result.session.words,
      difficultyLevel: config.difficulty || 2,
      currentWordIndex: 0,
      settings: config.settings,
      config: practiceConfigs[request.practiceType],
    };

    return {
      success: true,
      session: enhancedSession,
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(
      `Failed to create enhanced practice session: ${errorMessage}`,
      'error',
      {
        request,
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
 * Get practice session progress (legacy compatibility)
 */
export async function getPracticeSessionProgress(sessionId: string): Promise<{
  success: boolean;
  progress?: PracticeSessionProgress;
  error?: string;
}> {
  try {
    const statsResult = await getPracticeSessionStats(sessionId);

    if (!statsResult.success || !statsResult.stats) {
      return {
        success: false,
        error: statsResult.error || 'Failed to get session stats',
      };
    }

    const stats = statsResult.stats;

    // Create legacy progress format
    const progress: PracticeSessionProgress = {
      sessionId,
      currentWordIndex: stats.wordsStudied,
      totalWords: stats.wordsStudied + 10, // Approximate total
      correctAnswers: stats.correctAnswers,
      incorrectAnswers: stats.incorrectAnswers,
      currentScore: stats.currentScore,
      timeRemaining: 0, // Would need session time limit info
      wordsRemaining: [], // Would need word list info
    };

    return {
      success: true,
      progress,
    };
  } catch (error) {
    serverLog('Error getting practice session progress', 'error', { error });
    return {
      success: false,
      error: 'Failed to get session progress',
    };
  }
}
