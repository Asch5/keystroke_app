/**
 * Learning Metrics Configuration
 *
 * This file contains all the metrics and thresholds used to determine
 * learning progress, word mastery, and session success criteria.
 */

import { LearningStatus } from '@/core/types';

/**
 * Core learning metrics for word mastery
 */
export const LEARNING_METRICS = {
  // Minimum correct attempts needed to consider a word "learned"
  MIN_CORRECT_ATTEMPTS_TO_LEARN: 3,

  // Minimum consecutive correct attempts for mastery
  MIN_CONSECUTIVE_CORRECT_FOR_MASTERY: 2,

  // Maximum wrong attempts before marking as "difficult"
  MAX_WRONG_ATTEMPTS_BEFORE_DIFFICULT: 3,

  // Minimum accuracy percentage to consider word "learned"
  MIN_ACCURACY_FOR_LEARNED: 80, // 80%

  // Minimum mastery score to consider word fully mastered
  MIN_MASTERY_SCORE: 85, // 85%

  // Time intervals for spaced repetition (in days)
  SPACED_REPETITION_INTERVALS: [1, 3, 7, 14, 30, 60],

  // Session success thresholds
  SESSION_SUCCESS_THRESHOLD: 70, // 70% accuracy
  SESSION_EXCELLENT_THRESHOLD: 90, // 90% accuracy
} as const;

/**
 * Practice session configuration
 */
export const PRACTICE_SESSION_CONFIG = {
  // Default number of words per practice session
  DEFAULT_WORDS_PER_SESSION: 10,

  // Minimum words required to start a session
  MIN_WORDS_FOR_SESSION: 3,

  // Maximum words allowed in a single session
  MAX_WORDS_PER_SESSION: 50,

  // Time limits (in seconds)
  TYPING_TIME_LIMIT: 30, // 30 seconds per word
  DEFAULT_SESSION_TIME_LIMIT: 900, // 15 minutes

  // Scoring system
  POINTS_PER_CORRECT_ANSWER: 10,
  POINTS_PENALTY_PER_WRONG_ATTEMPT: 2,
  BONUS_POINTS_FOR_SPEED: 5, // If answered quickly
  SPEED_BONUS_THRESHOLD: 10, // seconds
} as const;

/**
 * Learning status transition rules
 */
export const LEARNING_STATUS_RULES = {
  // Rules for transitioning from 'not_started' to 'in_progress'
  START_LEARNING: {
    minAttempts: 1,
  },

  // Rules for transitioning from 'in_progress' to 'learned'
  MARK_AS_LEARNED: {
    minCorrectAttempts: LEARNING_METRICS.MIN_CORRECT_ATTEMPTS_TO_LEARN,
    minAccuracy: LEARNING_METRICS.MIN_ACCURACY_FOR_LEARNED,
    minConsecutiveCorrect: LEARNING_METRICS.MIN_CONSECUTIVE_CORRECT_FOR_MASTERY,
  },

  // Rules for marking as 'difficult'
  MARK_AS_DIFFICULT: {
    maxWrongAttempts: LEARNING_METRICS.MAX_WRONG_ATTEMPTS_BEFORE_DIFFICULT,
    maxAccuracy: 40, // Below 40% accuracy
  },

  // Rules for marking as 'learned' (highest level in our enum)
  MARK_AS_MASTERED: {
    minMasteryScore: LEARNING_METRICS.MIN_MASTERY_SCORE,
    minDaysSinceLastReview: 7,
    minConsecutiveCorrect: 5,
  },
} as const;

/**
 * Typing practice specific metrics
 */
export const TYPING_PRACTICE_METRICS = {
  // Character tolerance for minor typos
  TYPO_TOLERANCE_PERCENTAGE: 10, // Allow 10% character differences

  // Speed thresholds (characters per minute)
  SLOW_TYPING_THRESHOLD: 20,
  AVERAGE_TYPING_THRESHOLD: 40,
  FAST_TYPING_THRESHOLD: 60,

  // Accuracy requirements for different attempts
  FIRST_ATTEMPT_MIN_ACCURACY: 90,
  SECOND_ATTEMPT_MIN_ACCURACY: 80,
  THIRD_ATTEMPT_MIN_ACCURACY: 70,

  // Partial credit system
  PARTIAL_CREDIT_ENABLED: true,
  MIN_CHARACTERS_FOR_PARTIAL_CREDIT: 3,
} as const;

/**
 * Helper functions for learning progress calculation
 */
export class LearningMetricsCalculator {
  /**
   * Calculate accuracy percentage
   */
  static calculateAccuracy(
    correctAttempts: number,
    totalAttempts: number,
  ): number {
    if (totalAttempts === 0) return 0;
    return Math.round((correctAttempts / totalAttempts) * 100);
  }

  /**
   * Calculate mastery score based on various factors
   */
  static calculateMasteryScore(
    accuracy: number,
    consecutiveCorrect: number,
    avgResponseTime: number,
    reviewCount: number,
  ): number {
    let score = accuracy;

    // Bonus for consecutive correct answers
    const consecutiveBonus = Math.min(consecutiveCorrect * 2, 10);
    score += consecutiveBonus;

    // Speed bonus (faster response = higher score)
    const speedBonus =
      avgResponseTime <= PRACTICE_SESSION_CONFIG.SPEED_BONUS_THRESHOLD ? 5 : 0;
    score += speedBonus;

    // Review frequency bonus (more reviews = higher confidence)
    const reviewBonus = Math.min(reviewCount * 0.5, 5);
    score += reviewBonus;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Determine learning status based on metrics
   */
  static determineLearningStatus(
    correctAttempts: number,
    totalAttempts: number,
    consecutiveCorrect: number,
    masteryScore: number,
  ): LearningStatus {
    const accuracy = this.calculateAccuracy(correctAttempts, totalAttempts);

    // Check for learned status (highest level we can achieve)
    if (
      masteryScore >= LEARNING_STATUS_RULES.MARK_AS_MASTERED.minMasteryScore &&
      consecutiveCorrect >=
        LEARNING_STATUS_RULES.MARK_AS_MASTERED.minConsecutiveCorrect
    ) {
      return LearningStatus.learned;
    }

    // Check for learned status
    if (
      correctAttempts >=
        LEARNING_STATUS_RULES.MARK_AS_LEARNED.minCorrectAttempts &&
      accuracy >= LEARNING_STATUS_RULES.MARK_AS_LEARNED.minAccuracy &&
      consecutiveCorrect >=
        LEARNING_STATUS_RULES.MARK_AS_LEARNED.minConsecutiveCorrect
    ) {
      return LearningStatus.learned;
    }

    // Check for difficult status
    const wrongAttempts = totalAttempts - correctAttempts;
    if (
      wrongAttempts >=
        LEARNING_STATUS_RULES.MARK_AS_DIFFICULT.maxWrongAttempts ||
      accuracy <= LEARNING_STATUS_RULES.MARK_AS_DIFFICULT.maxAccuracy
    ) {
      return LearningStatus.difficult;
    }

    // Default to in progress if any attempts made
    if (totalAttempts > 0) {
      return LearningStatus.inProgress;
    }

    return LearningStatus.notStarted;
  }

  /**
   * Calculate next review date based on spaced repetition
   */
  static calculateNextReviewDate(
    reviewCount: number,
    accuracy: number,
    lastReviewDate: Date = new Date(),
  ): Date {
    let intervalIndex = Math.min(
      reviewCount,
      LEARNING_METRICS.SPACED_REPETITION_INTERVALS.length - 1,
    );

    // Adjust interval based on accuracy
    if (accuracy < 70) {
      intervalIndex = Math.max(0, intervalIndex - 1); // Review sooner if struggling
    } else if (accuracy >= 90) {
      intervalIndex = Math.min(
        LEARNING_METRICS.SPACED_REPETITION_INTERVALS.length - 1,
        intervalIndex + 1,
      ); // Review later if doing well
    }

    const daysToAdd =
      LEARNING_METRICS.SPACED_REPETITION_INTERVALS[intervalIndex] ?? 1; // Fallback to 1 day if undefined
    const nextReviewDate = new Date(lastReviewDate);
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

    return nextReviewDate;
  }

  /**
   * Check if word typing is approximately correct (with typo tolerance)
   */
  static isTypingApproximatelyCorrect(
    userInput: string,
    correctWord: string,
    tolerancePercentage: number = TYPING_PRACTICE_METRICS.TYPO_TOLERANCE_PERCENTAGE,
  ): { isCorrect: boolean; accuracy: number; partialCredit: boolean } {
    const normalizedInput = userInput.toLowerCase().trim();
    const normalizedWord = correctWord.toLowerCase().trim();

    // Exact match
    if (normalizedInput === normalizedWord) {
      return { isCorrect: true, accuracy: 100, partialCredit: false };
    }

    // Calculate character-level accuracy
    const maxLength = Math.max(normalizedInput.length, normalizedWord.length);
    let matchingChars = 0;

    for (let i = 0; i < maxLength; i++) {
      if (normalizedInput[i] === normalizedWord[i]) {
        matchingChars++;
      }
    }

    const accuracy = (matchingChars / maxLength) * 100;
    const toleranceThreshold = 100 - tolerancePercentage;

    const isCorrect = accuracy >= toleranceThreshold;
    const partialCredit =
      TYPING_PRACTICE_METRICS.PARTIAL_CREDIT_ENABLED &&
      accuracy >= 50 &&
      normalizedInput.length >=
        TYPING_PRACTICE_METRICS.MIN_CHARACTERS_FOR_PARTIAL_CREDIT;

    return { isCorrect, accuracy: Math.round(accuracy), partialCredit };
  }
}

/**
 * Session difficulty adjustment
 */
export const DIFFICULTY_ADJUSTMENT = {
  // Factors that increase difficulty
  INCREASE_DIFFICULTY_TRIGGERS: {
    highAccuracy: 95, // If user accuracy is above 95%
    fastCompletion: 0.7, // If session completed in less than 70% of time limit
    consecutiveExcellentSessions: 3,
  },

  // Factors that decrease difficulty
  DECREASE_DIFFICULTY_TRIGGERS: {
    lowAccuracy: 50, // If user accuracy is below 50%
    timeouts: 3, // If user times out 3 times
    consecutivePoorSessions: 2,
  },

  // Difficulty levels and their characteristics
  DIFFICULTY_LEVELS: {
    1: {
      // Beginner
      wordsPerSession: 5,
      timeLimit: 45, // seconds per word
      allowPartialCredit: true,
      showHints: true,
    },
    2: {
      // Easy
      wordsPerSession: 8,
      timeLimit: 35,
      allowPartialCredit: true,
      showHints: true,
    },
    3: {
      // Medium
      wordsPerSession: 10,
      timeLimit: 30,
      allowPartialCredit: true,
      showHints: false,
    },
    4: {
      // Hard
      wordsPerSession: 15,
      timeLimit: 25,
      allowPartialCredit: false,
      showHints: false,
    },
    5: {
      // Expert
      wordsPerSession: 20,
      timeLimit: 20,
      allowPartialCredit: false,
      showHints: false,
    },
  },
} as const;

export type DifficultyConfig =
  (typeof DIFFICULTY_ADJUSTMENT.DIFFICULTY_LEVELS)[keyof typeof DIFFICULTY_ADJUSTMENT.DIFFICULTY_LEVELS];
