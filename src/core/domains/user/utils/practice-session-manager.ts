/**
 * Practice Session Manager
 *
 * Orchestrates intelligent practice sessions across different modes using
 * the difficulty assessment system. Provides extensible architecture for
 * supporting multiple practice types (typing, flashcards, pronunciation, etc.)
 */

import { PrismaClient, SessionType, LearningStatus } from '@prisma/client';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import {
  DifficultyAssessment,
  LearningProgressTracker,
  LearningUnit,
} from './difficulty-assessment';

const prisma = new PrismaClient();

/**
 * Practice session configuration and types
 */
export interface PracticeSessionConfig {
  sessionType: 'typing' | 'flashcards' | 'pronunciation' | 'quiz' | 'games';
  targetWords: number;
  timeLimit?: number; // in seconds
  difficultyDistribution: {
    hard: number; // 0-1 percentage
    medium: number; // 0-1 percentage
    easy: number; // 0-1 percentage
  };
  adaptiveDifficulty: boolean;
  enableSkipping: boolean;
  minConfidenceThreshold: number; // Minimum confidence for word selection
}

export interface PracticeSessionOptions {
  userId: string;
  userListId?: string;
  listId?: string;
  config: PracticeSessionConfig;
  excludeRecentlyPracticed?: boolean;
  customFilters?: {
    learningStatuses?: LearningStatus[];
    srsLevels?: number[];
    difficultyRange?: { min: number; max: number };
  };
}

export interface PracticeSession {
  id: string;
  userId: string;
  sessionType: SessionType;
  config: PracticeSessionConfig;
  learningUnits: LearningUnit[];
  currentIndex: number;
  progress: {
    completed: number;
    total: number;
    correct: number;
    incorrect: number;
    skipped: number;
    timeElapsed: number; // in seconds
  };
  analytics: {
    averageDifficulty: number;
    averageResponseTime: number;
    difficultyProgression: number[]; // Track how difficulty changes through session
    mistakePatterns: Record<string, number>; // Track common mistake types
  };
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  startTime: Date;
  endTime?: Date;
  metadata: Record<string, unknown>;
}

export interface PracticeAttempt {
  learningUnitId: string;
  isCorrect: boolean;
  responseTime: number;
  attemptsCount: number;
  skipRequested: boolean;
  userInput?: string;
  expectedOutput?: string;
  metadata: Record<string, unknown>;
}

export interface SessionSummary {
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
    masteryProgression: number; // Overall mastery improvement
  };
  difficulty: {
    averageDifficulty: number;
    difficultyProgression: number[];
    adaptiveAdjustments: number; // How many times difficulty was adjusted
  };
  recommendations: {
    suggestedNextSession: string;
    focusAreas: string[];
    reviewWords: string[];
  };
  achievements: string[];
}

/**
 * Main Practice Session Manager Class
 */
export class PracticeSessionManager {
  private static activeSessions = new Map<string, PracticeSession>();

  /**
   * Create a new practice session with intelligent word selection
   */
  static async createSession(
    options: PracticeSessionOptions,
  ): Promise<PracticeSession> {
    try {
      const { userId, config } = options;

      serverLog(`Creating practice session for user ${userId}`, 'info', {
        sessionType: config.sessionType,
        targetWords: config.targetWords,
        userListId: options.userListId,
        listId: options.listId,
      });

      // Get intelligent word selection using difficulty assessment
      const learningUnits =
        await DifficultyAssessment.getIntelligentWordSelection(
          userId,
          config.targetWords,
          {
            ...(options.userListId && { userListId: options.userListId }),
            ...(options.listId && { listId: options.listId }),
            difficultyDistribution: config.difficultyDistribution,
            excludeRecentlyPracticed: options.excludeRecentlyPracticed ?? true,
          },
        );

      if (learningUnits.length === 0) {
        throw new Error('No suitable words found for practice session');
      }

      // Apply custom filters if provided
      const filteredUnits = this.applyCustomFilters(
        learningUnits,
        options.customFilters,
      );

      if (filteredUnits.length === 0) {
        throw new Error('No words match the specified filters');
      }

      // Create session record in database
      const dbSession = await prisma.userLearningSession.create({
        data: {
          userId,
          sessionType: this.mapSessionType(config.sessionType),
          userListId: options.userListId || null,
          listId: options.listId || null,
          startTime: new Date(),
          wordsStudied: filteredUnits.length,
        },
      });

      // Create practice session object
      const session: PracticeSession = {
        id: dbSession.id,
        userId,
        sessionType: this.mapSessionType(config.sessionType),
        config,
        learningUnits: filteredUnits,
        currentIndex: 0,
        progress: {
          completed: 0,
          total: filteredUnits.length,
          correct: 0,
          incorrect: 0,
          skipped: 0,
          timeElapsed: 0,
        },
        analytics: {
          averageDifficulty: this.calculateAverageDifficulty(filteredUnits),
          averageResponseTime: 0,
          difficultyProgression: [],
          mistakePatterns: {},
        },
        status: 'active',
        startTime: new Date(),
        metadata: {
          originalWordCount: learningUnits.length,
          filteredWordCount: filteredUnits.length,
          difficultyDistribution:
            this.analyzeDifficultyDistribution(filteredUnits),
        },
      };

      // Store active session
      this.activeSessions.set(session.id, session);

      serverLog(`Created practice session ${session.id}`, 'info', {
        wordsCount: filteredUnits.length,
        averageDifficulty: session.analytics.averageDifficulty,
      });

      return session;
    } catch (error) {
      serverLog(`Error creating practice session: ${error}`, 'error', {
        userId: options.userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Process a practice attempt and update session state
   */
  static async processAttempt(
    sessionId: string,
    attempt: PracticeAttempt,
  ): Promise<{
    session: PracticeSession;
    feedback: {
      isCorrect: boolean;
      explanation?: string;
      encouragement: string;
      nextAction: 'continue' | 'review' | 'complete';
    };
    adaptiveAdjustment?: {
      difficultyChanged: boolean;
      newDifficulty: number;
      reason: string;
    };
  }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const currentUnit = session.learningUnits[session.currentIndex];
      if (!currentUnit) {
        throw new Error('No current learning unit available');
      }

      // Handle skip request
      if (attempt.skipRequested) {
        await LearningProgressTracker.trackSkip(
          session.userId,
          attempt.learningUnitId,
          session.config.sessionType,
        );

        session.progress.skipped++;
        session.analytics.mistakePatterns['skipped'] =
          (session.analytics.mistakePatterns['skipped'] || 0) + 1;
      } else {
        // Update learning progress
        await LearningProgressTracker.updateLearningProgress(
          session.userId,
          attempt.learningUnitId,
          session.config.sessionType,
          {
            isCorrect: attempt.isCorrect,
            responseTime: attempt.responseTime,
            attempts: attempt.attemptsCount,
            metadata: attempt.metadata,
          },
        );

        // Update session progress
        if (attempt.isCorrect) {
          session.progress.correct++;
        } else {
          session.progress.incorrect++;

          // Track mistake patterns
          const mistakeType = this.categorizemistake(attempt, currentUnit);
          session.analytics.mistakePatterns[mistakeType] =
            (session.analytics.mistakePatterns[mistakeType] || 0) + 1;
        }

        // Update analytics
        session.analytics.averageResponseTime = this.updateAverageResponseTime(
          session.analytics.averageResponseTime,
          attempt.responseTime,
          session.progress.completed,
        );
      }

      // Update session tracking
      session.currentIndex++;
      session.progress.completed++;
      session.analytics.difficultyProgression.push(
        currentUnit.difficulty.composite,
      );

      // Create session item record
      await prisma.userSessionItem.create({
        data: {
          sessionId,
          userDictionaryId: attempt.learningUnitId,
          isCorrect: attempt.isCorrect && !attempt.skipRequested,
          responseTime: attempt.responseTime,
          attemptsCount: attempt.attemptsCount,
        },
      });

      // Generate feedback
      const feedback = this.generateFeedback(attempt, currentUnit, session);

      // Check for adaptive difficulty adjustment
      let adaptiveAdjustment;
      if (
        session.config.adaptiveDifficulty &&
        session.progress.completed % 3 === 0
      ) {
        adaptiveAdjustment = await this.checkAdaptiveDifficulty(session);
      }

      // Check if session is complete
      if (session.currentIndex >= session.learningUnits.length) {
        session.status = 'completed';
        session.endTime = new Date();
        await this.completeSession(session);
      }

      // Update session in memory
      this.activeSessions.set(sessionId, session);

      return {
        session,
        feedback,
        ...(adaptiveAdjustment && { adaptiveAdjustment }),
      };
    } catch (error) {
      serverLog(`Error processing attempt: ${error}`, 'error', {
        sessionId,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get current session state
   */
  static getSession(sessionId: string): PracticeSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Complete a practice session and generate summary
   */
  static async completeSession(
    session: PracticeSession,
  ): Promise<SessionSummary> {
    try {
      // Update database session record
      await prisma.userLearningSession.update({
        where: { id: session.id },
        data: {
          endTime: new Date(),
          duration: Math.floor(
            (session.endTime!.getTime() - session.startTime.getTime()) / 1000,
          ),
          correctAnswers: session.progress.correct,
          incorrectAnswers: session.progress.incorrect,
          score: this.calculateSessionScore(session),
          completionPercentage:
            (session.progress.completed / session.progress.total) * 100,
        },
      });

      // Generate comprehensive summary
      const summary = await this.generateSessionSummary(session);

      // Clean up active session
      this.activeSessions.delete(session.id);

      serverLog(`Completed practice session ${session.id}`, 'info', {
        duration: summary.performance.totalTimeSpent,
        accuracy: summary.performance.accuracy,
        wordsLearned: summary.learning.wordsLearned,
      });

      return summary;
    } catch (error) {
      serverLog(`Error completing session: ${error}`, 'error', {
        sessionId: session.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Pause a session (for resuming later)
   */
  static async pauseSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      session.progress.timeElapsed += Math.floor(
        (Date.now() - session.startTime.getTime()) / 1000,
      );

      serverLog(`Paused session ${sessionId}`, 'info');
    }
  }

  /**
   * Resume a paused session
   */
  static async resumeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'active';
      session.startTime = new Date(); // Reset start time for elapsed calculation

      serverLog(`Resumed session ${sessionId}`, 'info');
    }
  }

  /**
   * Abandon a session (user quit early)
   */
  static async abandonSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'abandoned';
      session.endTime = new Date();

      await prisma.userLearningSession.update({
        where: { id: sessionId },
        data: {
          endTime: new Date(),
          duration: Math.floor(
            (session.endTime.getTime() - session.startTime.getTime()) / 1000,
          ),
          correctAnswers: session.progress.correct,
          incorrectAnswers: session.progress.incorrect,
          completionPercentage:
            (session.progress.completed / session.progress.total) * 100,
        },
      });

      this.activeSessions.delete(sessionId);

      serverLog(`Abandoned session ${sessionId}`, 'info', {
        completionPercentage:
          (session.progress.completed / session.progress.total) * 100,
      });
    }
  }

  // Helper methods

  private static applyCustomFilters(
    units: LearningUnit[],
    filters?: PracticeSessionOptions['customFilters'],
  ): LearningUnit[] {
    if (!filters) return units;

    return units.filter((unit) => {
      // Filter by learning status
      if (filters.learningStatuses) {
        // This would need to be added to LearningUnit interface or fetched separately
        // For now, we'll skip this filter
      }

      // Filter by SRS levels
      if (filters.srsLevels) {
        // This would need to be added to LearningUnit interface or fetched separately
        // For now, we'll skip this filter
      }

      // Filter by difficulty range
      if (filters.difficultyRange) {
        const difficulty = unit.difficulty.composite;
        if (
          difficulty < filters.difficultyRange.min ||
          difficulty > filters.difficultyRange.max
        ) {
          return false;
        }
      }

      return true;
    });
  }

  private static mapSessionType(sessionType: string): SessionType {
    const mapping: Record<string, SessionType> = {
      typing: SessionType.practice,
      flashcards: SessionType.review,
      pronunciation: SessionType.practice,
      quiz: SessionType.test,
      games: SessionType.practice,
    };
    return mapping[sessionType] || SessionType.practice;
  }

  private static calculateAverageDifficulty(units: LearningUnit[]): number {
    if (units.length === 0) return 0;
    const sum = units.reduce((acc, unit) => acc + unit.difficulty.composite, 0);
    return sum / units.length;
  }

  private static analyzeDifficultyDistribution(
    units: LearningUnit[],
  ): Record<string, number> {
    const distribution = {
      very_easy: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      very_hard: 0,
    };

    units.forEach((unit) => {
      distribution[unit.difficulty.classification]++;
    });

    // Convert to percentages
    const total = units.length;
    (Object.keys(distribution) as Array<keyof typeof distribution>).forEach(
      (key) => {
        distribution[key] = distribution[key] / total;
      },
    );

    return distribution;
  }

  private static updateAverageResponseTime(
    currentAverage: number,
    newTime: number,
    count: number,
  ): number {
    return (currentAverage * count + newTime) / (count + 1);
  }

  private static categorizemistake(
    attempt: PracticeAttempt,
    unit: LearningUnit,
  ): string {
    // Simple mistake categorization - can be enhanced based on practice type
    if (attempt.attemptsCount > 1) return 'multiple_attempts';
    if (attempt.responseTime > 15000) return 'slow_response';
    if (unit.difficulty.classification === 'very_hard')
      return 'high_difficulty';
    return 'general_mistake';
  }

  private static generateFeedback(
    attempt: PracticeAttempt,
    unit: LearningUnit,
    session: PracticeSession,
  ): {
    isCorrect: boolean;
    explanation?: string;
    encouragement: string;
    nextAction: 'continue' | 'review' | 'complete';
  } {
    const isCorrect = attempt.isCorrect && !attempt.skipRequested;
    const isLastWord = session.currentIndex >= session.learningUnits.length - 1;

    let encouragement: string;
    let explanation: string | undefined;

    if (attempt.skipRequested) {
      encouragement = "No worries! We'll come back to this word later.";
      explanation = `The word "${unit.content.primary}" means: ${unit.content.secondary}`;
    } else if (isCorrect) {
      const responses = [
        'Great job! 🎉',
        'Perfect! 👏',
        'Excellent work! ⭐',
        "You're doing fantastic! 🚀",
        'Well done! 💪',
      ];
      encouragement =
        responses[Math.floor(Math.random() * responses.length)] || 'Great job!';

      if (unit.difficulty.classification === 'very_hard') {
        encouragement += ' That was a challenging word!';
      }
    } else {
      encouragement = 'Keep going! Every mistake is a step toward mastery. 💪';
      explanation = `The correct answer is "${unit.content.primary}" which means: ${unit.content.secondary}`;
    }

    return {
      isCorrect,
      ...(explanation && { explanation }),
      encouragement,
      nextAction: isLastWord ? 'complete' : 'continue',
    };
  }

  private static async checkAdaptiveDifficulty(
    session: PracticeSession,
  ): Promise<
    | {
        difficultyChanged: boolean;
        newDifficulty: number;
        reason: string;
      }
    | undefined
  > {
    const recentAttempts = session.analytics.difficultyProgression.slice(-3);
    const recentAccuracy =
      session.progress.correct / Math.max(session.progress.completed, 1);

    // Check if we need to adjust difficulty
    if (recentAccuracy > 0.9 && recentAttempts.every((d) => d < 0.6)) {
      // User is doing very well with medium/easy words - increase difficulty
      return {
        difficultyChanged: true,
        newDifficulty: Math.min(0.8, Math.max(...recentAttempts) + 0.2),
        reason: 'High accuracy detected, increasing difficulty',
      };
    } else if (recentAccuracy < 0.4 && recentAttempts.every((d) => d > 0.6)) {
      // User is struggling with hard words - decrease difficulty
      return {
        difficultyChanged: true,
        newDifficulty: Math.max(0.2, Math.min(...recentAttempts) - 0.2),
        reason: 'Low accuracy detected, decreasing difficulty',
      };
    }

    return undefined;
  }

  private static calculateSessionScore(session: PracticeSession): number {
    const accuracy =
      session.progress.correct / Math.max(session.progress.completed, 1);
    const difficultyBonus = session.analytics.averageDifficulty * 0.2;
    const completionBonus =
      (session.progress.completed / session.progress.total) * 0.1;

    return (
      Math.round(
        (accuracy * 70 + difficultyBonus * 100 + completionBonus * 100) * 100,
      ) / 100
    );
  }

  private static async generateSessionSummary(
    session: PracticeSession,
  ): Promise<SessionSummary> {
    const timeSpent = Math.floor(
      (session.endTime!.getTime() - session.startTime.getTime()) / 1000,
    );
    const accuracy =
      session.progress.correct / Math.max(session.progress.completed, 1);

    // Calculate learning metrics
    const wordsLearned = await this.calculateWordsLearned(session);
    const wordsImproved = await this.calculateWordsImproved(session);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(session);

    return {
      sessionId: session.id,
      performance: {
        totalWords: session.progress.total,
        correctAnswers: session.progress.correct,
        incorrectAnswers: session.progress.incorrect,
        skippedWords: session.progress.skipped,
        accuracy: Math.round(accuracy * 100) / 100,
        averageResponseTime: Math.round(session.analytics.averageResponseTime),
        totalTimeSpent: timeSpent,
      },
      learning: {
        wordsLearned,
        wordsImproved,
        difficultWordsIdentified: Object.values(
          session.analytics.mistakePatterns,
        ).reduce((sum, count) => sum + count, 0),
        masteryProgression: this.calculateMasteryProgression(session),
      },
      difficulty: {
        averageDifficulty:
          Math.round(session.analytics.averageDifficulty * 100) / 100,
        difficultyProgression: session.analytics.difficultyProgression,
        adaptiveAdjustments: 0, // This would be tracked during the session
      },
      recommendations,
      achievements: await this.checkAchievements(session),
    };
  }

  private static async calculateWordsLearned(
    session: PracticeSession,
  ): Promise<number> {
    // This would check how many words had their learning status improved
    // For now, return a simple calculation
    return Math.floor(session.progress.correct * 0.3);
  }

  private static async calculateWordsImproved(
    session: PracticeSession,
  ): Promise<number> {
    // This would check for improvements in individual word performance
    // For now, return a simple calculation
    return Math.floor(session.progress.correct * 0.6);
  }

  private static calculateMasteryProgression(session: PracticeSession): number {
    // Calculate overall mastery improvement during the session
    const accuracyScore =
      (session.progress.correct / Math.max(session.progress.completed, 1)) * 50;
    const difficultyScore = session.analytics.averageDifficulty * 30;
    const completionScore =
      (session.progress.completed / session.progress.total) * 20;

    return Math.round(accuracyScore + difficultyScore + completionScore);
  }

  private static async generateRecommendations(
    session: PracticeSession,
  ): Promise<{
    suggestedNextSession: string;
    focusAreas: string[];
    reviewWords: string[];
  }> {
    const accuracy =
      session.progress.correct / Math.max(session.progress.completed, 1);
    const mostCommonMistake = Object.keys(
      session.analytics.mistakePatterns,
    ).reduce(
      (a, b) =>
        (session.analytics.mistakePatterns[a] || 0) >
        (session.analytics.mistakePatterns[b] || 0)
          ? a
          : b,
      '',
    );

    const focusAreas: string[] = [];
    if (accuracy < 0.7) focusAreas.push('Review fundamentals');
    if (mostCommonMistake === 'slow_response')
      focusAreas.push('Improve response speed');
    if (session.analytics.averageDifficulty < 0.5)
      focusAreas.push('Challenge yourself with harder words');

    return {
      suggestedNextSession:
        accuracy > 0.8
          ? 'Try a more challenging session'
          : 'Review difficult words',
      focusAreas,
      reviewWords: [], // This would be populated with actual problematic words
    };
  }

  private static async checkAchievements(
    session: PracticeSession,
  ): Promise<string[]> {
    const achievements: string[] = [];
    const accuracy =
      session.progress.correct / Math.max(session.progress.completed, 1);

    if (accuracy === 1.0) achievements.push('Perfect Score!');
    if (session.progress.completed >= 20) achievements.push('Marathon Learner');
    if (session.analytics.averageResponseTime < 5000)
      achievements.push('Speed Demon');
    if (session.analytics.averageDifficulty > 0.8)
      achievements.push('Challenge Accepted');

    return achievements;
  }
}

/**
 * Practice type specific configurations
 */
export const PRACTICE_CONFIGS: Record<
  string,
  Partial<PracticeSessionConfig>
> = {
  typing: {
    sessionType: 'typing',
    targetWords: 10,
    timeLimit: 600, // 10 minutes
    difficultyDistribution: { hard: 0.2, medium: 0.5, easy: 0.3 },
    adaptiveDifficulty: true,
    enableSkipping: true,
    minConfidenceThreshold: 0.3,
  },
  flashcards: {
    sessionType: 'flashcards',
    targetWords: 15,
    timeLimit: 900, // 15 minutes
    difficultyDistribution: { hard: 0.3, medium: 0.4, easy: 0.3 },
    adaptiveDifficulty: true,
    enableSkipping: false,
    minConfidenceThreshold: 0.4,
  },
  pronunciation: {
    sessionType: 'pronunciation',
    targetWords: 8,
    timeLimit: 480, // 8 minutes
    difficultyDistribution: { hard: 0.4, medium: 0.4, easy: 0.2 },
    adaptiveDifficulty: false,
    enableSkipping: true,
    minConfidenceThreshold: 0.5,
  },
  quiz: {
    sessionType: 'quiz',
    targetWords: 20,
    timeLimit: 1200, // 20 minutes
    difficultyDistribution: { hard: 0.25, medium: 0.5, easy: 0.25 },
    adaptiveDifficulty: false,
    enableSkipping: false,
    minConfidenceThreshold: 0.6,
  },
};
