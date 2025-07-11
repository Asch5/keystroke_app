'use server';

import { PrismaClient } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { LanguageCode, LearningStatus } from '@/core/types';
import {
  getBestDefinitionForUser,
  TranslationData,
} from '../../dictionary/utils/translation-utils';
import { LearningMetricsCalculator } from '../utils/learning-metrics';
import {
  SessionConfiguration,
  PracticeSessionResult,
  PracticeWord,
} from './practice-types';

const prisma = new PrismaClient();

/**
 * Create a new practice session
 */
export async function createPracticeSession(
  userId: string,
  config: SessionConfiguration,
): Promise<{
  success: boolean;
  sessionId?: string;
  words?: PracticeWord[];
  error?: string;
}> {
  try {
    void serverLog(`Creating practice session for user ${userId}`, 'info', {
      config,
    });

    // Get user's base language for translations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { baseLanguageCode: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const baseLanguageCode = user.baseLanguageCode as LanguageCode;

    // Get practice words based on configuration
    const words = await selectPracticeWords(userId, config, baseLanguageCode);

    if (words.length === 0) {
      return {
        success: false,
        error: 'No words available for practice with current settings',
      };
    }

    // Create the session
    const session = await prisma.userLearningSession.create({
      data: {
        userId,
        sessionType: 'practice',
        startTime: new Date(),
        ...(config.listId && { listId: config.listId }),
        ...(config.userListId && { userListId: config.userListId }),
      },
    });

    void serverLog(`Practice session created: ${session.id}`, 'info', {
      sessionId: session.id,
      wordsCount: words.length,
      targetWords: Math.min(config.wordsToStudy, words.length),
    });

    return {
      success: true,
      sessionId: session.id,
      words: words.slice(0, config.wordsToStudy),
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    void serverLog(
      `Failed to create practice session: ${errorMessage}`,
      'error',
      {
        userId,
        config,
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
 * Complete a practice session
 */
export async function completePracticeSession(sessionId: string): Promise<{
  success: boolean;
  sessionResult?: PracticeSessionResult;
  error?: string;
}> {
  try {
    void serverLog(`Completing practice session: ${sessionId}`, 'info');

    // Get session with items
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
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

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Calculate session statistics
    const totalWords = session.sessionItems.length;
    const correctAnswers = session.sessionItems.filter(
      (item) => item.isCorrect,
    ).length;
    const totalTime = session.sessionItems.reduce(
      (sum, item) => sum + (item.responseTime || 0),
      0,
    );
    const averageTime = totalWords > 0 ? totalTime / totalWords : 0;
    const accuracy = totalWords > 0 ? (correctAnswers / totalWords) * 100 : 0;

    // Calculate difficulty score
    const difficultyScore =
      session.sessionItems.reduce((sum, item) => {
        const userWord = item.userDictionary;
        if (!userWord) return sum;

        // Simple difficulty calculation since the method doesn't exist
        const wordDifficulty = Math.min(
          100,
          (userWord.amountOfMistakes || 0) * 10 +
            (100 - (userWord.masteryScore || 0)) +
            (userWord.srsLevel || 0) * 5,
        );

        return sum + wordDifficulty;
      }, 0) / Math.max(totalWords, 1);

    // Calculate session score
    const sessionScore = LearningMetricsCalculator.calculateMasteryScore(
      accuracy,
      correctAnswers,
      averageTime / 1000, // Convert to seconds
      totalWords,
    );

    // Calculate session duration
    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - session.startTime.getTime()) / 1000,
    );

    // Update session with completion data
    const completedSession = await prisma.userLearningSession.update({
      where: { id: sessionId },
      data: {
        endTime,
        duration,
        score: sessionScore,
        completionPercentage: 100, // Session is complete
      },
    });

    // Create session summary data
    const sessionResult: PracticeSessionResult = {
      sessionId,
      totalWords,
      correctAnswers,
      incorrectAnswers: totalWords - correctAnswers,
      accuracy,
      totalTime,
      averageTime,
      sessionScore,
      wordsLearned: session.wordsLearned || 0,
      difficultyScore,
      practiceType: session.sessionType,
      startTime: session.startTime,
      endTime: completedSession.endTime!,
      words: session.sessionItems.map((item) => ({
        userDictionaryId: item.userDictionaryId,
        wordText:
          item.userDictionary?.definition.wordDetails[0]?.wordDetails?.word
            ?.word || '',
        isCorrect: item.isCorrect,
        responseTime: item.responseTime || 0,
        attempts: item.attemptsCount || 1,
      })),
    };

    // Update user's daily progress
    await updateDailyProgress(
      session.userId,
      totalTime,
      session.wordsLearned || 0,
    );

    revalidateTag(`user-sessions-${session.userId}`);
    revalidateTag(`user-dictionary-${session.userId}`);

    void serverLog(`Practice session completed: ${sessionId}`, 'info', {
      sessionResult,
    });

    return {
      success: true,
      sessionResult,
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    void serverLog(
      `Failed to complete practice session: ${errorMessage}`,
      'error',
      {
        sessionId,
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
 * Get practice session statistics
 */
export async function getPracticeSessionStats(sessionId: string): Promise<{
  success: boolean;
  stats?: {
    wordsStudied: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    wordsLearned: number;
    timeElapsed: number;
    currentScore: number;
  };
  error?: string;
}> {
  try {
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
      include: {
        sessionItems: true,
      },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const wordsStudied = session.sessionItems.length;
    const correctAnswers = session.sessionItems.filter(
      (item) => item.isCorrect,
    ).length;
    const incorrectAnswers = wordsStudied - correctAnswers;
    const accuracy =
      wordsStudied > 0 ? (correctAnswers / wordsStudied) * 100 : 0;
    const timeElapsed = session.endTime
      ? new Date(session.endTime).getTime() -
        new Date(session.startTime).getTime()
      : new Date().getTime() - new Date(session.startTime).getTime();

    // Calculate current score using simple formula
    const currentScore = correctAnswers * 10 - incorrectAnswers * 2;

    return {
      success: true,
      stats: {
        wordsStudied,
        correctAnswers,
        incorrectAnswers,
        accuracy,
        wordsLearned: session.wordsLearned || 0,
        timeElapsed,
        currentScore: Math.max(0, currentScore),
      },
    };
  } catch (error) {
    void serverLog('Error getting session stats', 'error', { error });
    return {
      success: false,
      error: 'Failed to get session statistics',
    };
  }
}

/**
 * Select practice words based on configuration
 */
async function selectPracticeWords(
  userId: string,
  config: SessionConfiguration,
  baseLanguageCode: LanguageCode,
): Promise<PracticeWord[]> {
  const whereClause: {
    userId: string;
    deletedAt: null;
    definitionId?: { in: number[] };
    id?: { in: string[] };
    learningStatus?: { in: LearningStatus[] } | LearningStatus;
    masteryScore?: { lt: number; gte?: number };
    OR?: Array<{
      learningStatus?: LearningStatus;
    }>;
  } = {
    userId,
    deletedAt: null,
  };

  // Filter by list if specified
  if (config.listId) {
    const listWords = await prisma.listWord.findMany({
      where: { listId: config.listId },
      select: { definitionId: true },
    });
    const definitionIds = listWords.map((lw) => lw.definitionId);
    whereClause.definitionId = { in: definitionIds };
  } else if (config.userListId) {
    const userListWords = await prisma.userListWord.findMany({
      where: { userListId: config.userListId },
      select: { userDictionaryId: true },
    });
    const userDictionaryIds = userListWords.map((ulw) => ulw.userDictionaryId);
    whereClause.id = { in: userDictionaryIds };
  }

  // Filter by difficulty
  if (config.difficulty) {
    if (config.difficulty === 1) {
      whereClause.learningStatus = {
        in: [LearningStatus.notStarted, LearningStatus.inProgress],
      };
      whereClause.masteryScore = { lt: 50 };
    } else if (config.difficulty === 2) {
      whereClause.learningStatus = LearningStatus.inProgress;
      whereClause.masteryScore = { gte: 30, lt: 70 };
    } else if (config.difficulty === 3) {
      whereClause.OR = [
        { learningStatus: LearningStatus.needsReview },
        { learningStatus: LearningStatus.difficult },
      ];
    }
  }

  // Get words with all necessary data including audio
  const userWords = await prisma.userDictionary.findMany({
    where: whereClause,
    include: {
      definition: {
        include: {
          wordDetails: {
            include: {
              wordDetails: {
                include: {
                  word: true,
                  // Include audio from WordDetailsAudio junction table
                  audioLinks: {
                    include: {
                      audio: true,
                    },
                    take: 1, // Get the first audio file
                  },
                },
              },
            },
          },
          image: true,
          // Include audio from DefinitionAudio junction table
          audioLinks: {
            include: {
              audio: true,
            },
            take: 1, // Get the first audio file
          },
          translationLinks: {
            where: {
              translation: {
                languageCode: baseLanguageCode,
              },
            },
            include: {
              translation: true,
            },
          },
          oneWordLinks: {
            include: {
              word: true,
            },
          },
        },
      },
    },
    orderBy: [
      { nextReviewDue: 'asc' },
      { srsLevel: 'asc' },
      { lastReviewedAt: 'asc' },
    ],
  });

  // Convert to PracticeWord format
  const words: PracticeWord[] = userWords.map((userWord) => {
    const wordDetail = userWord.definition.wordDetails[0]?.wordDetails;
    const word = wordDetail?.word;

    // Prepare translation data for getBestDefinitionForUser
    const translations: TranslationData[] =
      userWord.definition.translationLinks.map((link) => ({
        id: link.translation.id,
        languageCode: link.translation.languageCode as LanguageCode,
        content: link.translation.content,
      }));

    // Get the best definition content (prioritize user's base language)
    const definitionData = getBestDefinitionForUser(
      userWord.definition.definition,
      config.targetLanguageCode,
      translations,
      baseLanguageCode,
    );

    // Get one-word translation from DefinitionToOneWord table
    const oneWordLink = userWord.definition.oneWordLinks?.[0];
    const oneWordTranslation = oneWordLink?.word?.word || '';

    // Get audio URL from definition audio or word details audio
    let audioUrl = '';
    const definitionAudio = userWord.definition.audioLinks?.[0]?.audio;
    const wordDetailsAudio = wordDetail?.audioLinks?.[0]?.audio;

    if (definitionAudio?.url) {
      audioUrl = definitionAudio.url;
    } else if (wordDetailsAudio?.url) {
      audioUrl = wordDetailsAudio.url;
    }

    return {
      userDictionaryId: userWord.id,
      wordText: word?.word || '',
      definition: definitionData.content,
      oneWordTranslation,
      difficulty: userWord.srsLevel || 0,
      learningStatus: userWord.learningStatus,
      attempts: userWord.reviewCount || 0,
      correctAttempts: Math.round(
        ((userWord.reviewCount || 0) * (userWord.masteryScore || 0)) / 100,
      ),
      srsLevel: userWord.srsLevel || 0,
      imageUrl: userWord.definition.image?.url,
      imageId: userWord.definition.image?.id,
      imageDescription: userWord.definition.image?.description || undefined,
      partOfSpeech: wordDetail?.partOfSpeech || undefined,
      phonetic: wordDetail?.word?.phoneticGeneral || undefined,
      audioUrl: audioUrl || undefined, // Now properly populated from database
    };
  });

  // Limit results
  return words.slice(0, config.wordsToStudy * 2); // Get extra words for selection
}

/**
 * Update daily progress tracking
 */
async function updateDailyProgress(
  userId: string,
  timeSpentMs: number,
  wordsLearned: number,
): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minutesStudied = Math.round(timeSpentMs / 60000);

    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        date: today,
      },
    });

    if (existingProgress) {
      await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          minutesStudied: { increment: minutesStudied },
          wordsLearned: { increment: wordsLearned },
        },
      });
    } else {
      await prisma.userProgress.create({
        data: {
          userId,
          date: today,
          minutesStudied,
          wordsLearned,
          streakDays: 1, // Will be calculated properly in streak calculation
        },
      });
    }
  } catch (error) {
    void serverLog('Error updating daily progress', 'error', { error });
  }
}

/**
 * Get user's recent practice sessions
 */
export async function getRecentPracticeSessions(
  userId: string,
  limit: number = 10,
): Promise<{
  success: boolean;
  sessions?: Array<{
    id: string;
    practiceType: string;
    startTime: Date;
    endTime: Date | null;
    accuracy: number | null;
    wordsStudied: number;
    wordsLearned: number | null;
    isCompleted: boolean;
  }>;
  error?: string;
}> {
  try {
    const sessions = await prisma.userLearningSession.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: limit,
      include: {
        sessionItems: true,
      },
    });

    return {
      success: true,
      sessions: sessions.map((session) => {
        const correctItems = session.sessionItems.filter(
          (item) => item.isCorrect,
        ).length;
        const totalItems = session.sessionItems.length;
        const accuracy =
          totalItems > 0 ? (correctItems / totalItems) * 100 : null;

        return {
          id: session.id,
          practiceType: session.sessionType,
          startTime: session.startTime,
          endTime: session.endTime,
          accuracy,
          wordsStudied: session.wordsStudied,
          wordsLearned: session.wordsLearned,
          isCompleted: session.endTime !== null,
        };
      }),
    };
  } catch (error) {
    void serverLog('Error getting recent sessions', 'error', { error });
    return {
      success: false,
      error: 'Failed to get recent sessions',
    };
  }
}

/**
 * Cancel a practice session
 */
export async function cancelPracticeSession(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.userLearningSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        // Note: we can't set isCompleted as it doesn't exist in schema
      },
    });

    void serverLog(`Practice session cancelled: ${sessionId}`, 'info');

    return { success: true };
  } catch (error) {
    void serverLog('Error cancelling session', 'error', { error });
    return {
      success: false,
      error: 'Failed to cancel session',
    };
  }
}

/**
 * Resume a practice session
 */
export async function resumePracticeSession(sessionId: string): Promise<{
  success: boolean;
  session?: {
    id: string;
    wordsStudied: number;
    targetWords: number;
    practiceType: string;
    settings: Record<string, unknown>;
  };
  error?: string;
}> {
  try {
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.endTime !== null) {
      return { success: false, error: 'Session already completed' };
    }

    return {
      success: true,
      session: {
        id: session.id,
        wordsStudied: session.wordsStudied,
        targetWords: 20, // Default value since not stored in schema
        practiceType: session.sessionType,
        settings: {}, // Default empty settings since not stored in schema
      },
    };
  } catch (error) {
    void serverLog('Error resuming session', 'error', { error });
    return {
      success: false,
      error: 'Failed to resume session',
    };
  }
}

/**
 * Update session progress in real-time
 */
export async function updateSessionProgress(
  sessionId: string,
  wordCompleted: boolean,
  isCorrect: boolean,
): Promise<{
  success: boolean;
  progress?: {
    wordsStudied: number;
    correctAnswers: number;
    incorrectAnswers: number;
    completionPercentage: number;
    currentAccuracy: number;
  };
  error?: string;
}> {
  try {
    // Get current session stats
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
      include: {
        sessionItems: true,
      },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Calculate new values
    const newWordsStudied = wordCompleted
      ? session.wordsStudied + 1
      : session.wordsStudied;

    const newCorrectAnswers =
      wordCompleted && isCorrect
        ? session.correctAnswers + 1
        : session.correctAnswers;

    const newIncorrectAnswers =
      wordCompleted && !isCorrect
        ? session.incorrectAnswers + 1
        : session.incorrectAnswers;

    // Calculate completion percentage (assuming target of 20 words or session items length)
    const targetWords = Math.max(session.sessionItems.length, 20);
    const completionPercentage = Math.min(
      (newWordsStudied / targetWords) * 100,
      100,
    );

    // Calculate current accuracy
    const totalAnswers = newCorrectAnswers + newIncorrectAnswers;
    const currentAccuracy =
      totalAnswers > 0 ? (newCorrectAnswers / totalAnswers) * 100 : 0;

    // Update session
    await prisma.userLearningSession.update({
      where: { id: sessionId },
      data: {
        wordsStudied: newWordsStudied,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers,
        completionPercentage,
      },
    });

    void serverLog('Session progress updated', 'info', {
      sessionId,
      wordsStudied: newWordsStudied,
      completionPercentage,
      currentAccuracy,
    });

    return {
      success: true,
      progress: {
        wordsStudied: newWordsStudied,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers,
        completionPercentage,
        currentAccuracy,
      },
    };
  } catch (error) {
    void serverLog('Error updating session progress', 'error', { error });
    return { success: false, error: 'Failed to update session progress' };
  }
}

/**
 * Calculate comprehensive session analytics
 */
export async function getSessionAnalytics(sessionId: string): Promise<{
  success: boolean;
  analytics?: {
    duration: number; // in seconds
    averageResponseTime: number;
    accuracyTrend: number[];
    difficultyProgression: number[];
    timeSpentPerWord: number;
    learningEfficiency: number;
    mistakePatterns: Record<string, number>;
    strongestAreas: string[];
    areasForImprovement: string[];
  };
  error?: string;
}> {
  try {
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Calculate duration
    const startTime = new Date(session.startTime);
    const endTime = session.endTime ? new Date(session.endTime) : new Date();
    const duration = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000,
    );

    // Calculate response times
    const responseTimes = session.sessionItems
      .map((item) => item.responseTime)
      .filter((time): time is number => time !== null);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Calculate accuracy trend (accuracy over time in chunks)
    const chunkSize = Math.max(1, Math.floor(session.sessionItems.length / 5));
    const accuracyTrend: number[] = [];

    for (let i = 0; i < session.sessionItems.length; i += chunkSize) {
      const chunk = session.sessionItems.slice(i, i + chunkSize);
      const correctInChunk = chunk.filter((item) => item.isCorrect).length;
      const accuracyInChunk =
        chunk.length > 0 ? (correctInChunk / chunk.length) * 100 : 0;
      accuracyTrend.push(accuracyInChunk);
    }

    // Calculate difficulty progression
    const difficultyProgression = session.sessionItems.map((item) => {
      const userWord = item.userDictionary;
      if (!userWord) return 50; // Default difficulty

      // Calculate difficulty based on mastery score and mistake count
      const masteryComponent = 100 - (userWord.masteryScore || 0);
      const mistakeComponent = Math.min(
        (userWord.amountOfMistakes || 0) * 5,
        50,
      );
      const srsComponent = (userWord.srsLevel || 0) * 10;

      return Math.min(masteryComponent + mistakeComponent - srsComponent, 100);
    });

    // Calculate learning efficiency (correct answers per minute)
    const totalCorrect = session.sessionItems.filter(
      (item) => item.isCorrect,
    ).length;
    const durationMinutes = duration / 60;
    const learningEfficiency =
      durationMinutes > 0 ? totalCorrect / durationMinutes : 0;

    // Analyze mistake patterns
    const mistakePatterns: Record<string, number> = {};
    session.sessionItems.forEach((item) => {
      if (!item.isCorrect && item.userDictionary) {
        const word =
          item.userDictionary.definition.wordDetails[0]?.wordDetails?.word
            ?.word;
        const partOfSpeech =
          item.userDictionary.definition.wordDetails[0]?.wordDetails
            ?.partOfSpeech;

        if (partOfSpeech) {
          mistakePatterns[partOfSpeech] =
            (mistakePatterns[partOfSpeech] || 0) + 1;
        }

        // Analyze word length patterns
        if (word) {
          const lengthCategory =
            word.length <= 4 ? 'short' : word.length <= 8 ? 'medium' : 'long';
          const lengthKey = `${lengthCategory}_words`;
          mistakePatterns[lengthKey] = (mistakePatterns[lengthKey] || 0) + 1;
        }
      }
    });

    // Identify strongest areas (highest accuracy by category)
    const categoryAccuracy: Record<string, { correct: number; total: number }> =
      {};

    session.sessionItems.forEach((item) => {
      if (item.userDictionary) {
        const partOfSpeech =
          item.userDictionary.definition.wordDetails[0]?.wordDetails
            ?.partOfSpeech || 'unknown';

        if (!categoryAccuracy[partOfSpeech]) {
          categoryAccuracy[partOfSpeech] = { correct: 0, total: 0 };
        }

        categoryAccuracy[partOfSpeech].total++;
        if (item.isCorrect) {
          categoryAccuracy[partOfSpeech].correct++;
        }
      }
    });

    const strongestAreas = Object.entries(categoryAccuracy)
      .map(([category, stats]) => ({
        category,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      }))
      .filter((item) => item.accuracy >= 80)
      .sort((a, b) => b.accuracy - a.accuracy)
      .map((item) => item.category)
      .slice(0, 3);

    const areasForImprovement = Object.entries(categoryAccuracy)
      .map(([category, stats]) => ({
        category,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      }))
      .filter((item) => item.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .map((item) => item.category)
      .slice(0, 3);

    const timeSpentPerWord =
      session.sessionItems.length > 0
        ? duration / session.sessionItems.length
        : 0;

    return {
      success: true,
      analytics: {
        duration,
        averageResponseTime,
        accuracyTrend,
        difficultyProgression,
        timeSpentPerWord,
        learningEfficiency,
        mistakePatterns,
        strongestAreas,
        areasForImprovement,
      },
    };
  } catch (error) {
    void serverLog('Error getting session analytics', 'error', { error });
    return { success: false, error: 'Failed to get session analytics' };
  }
}

/**
 * Get comprehensive session summary with enhanced metrics
 */
export async function getEnhancedSessionSummary(sessionId: string): Promise<{
  success: boolean;
  summary?: {
    basicStats: {
      duration: number;
      totalWords: number;
      correctAnswers: number;
      accuracy: number;
      score: number;
    };
    performance: {
      averageResponseTime: number;
      fastestResponse: number;
      slowestResponse: number;
      consistencyScore: number;
    };
    learning: {
      wordsLearned: number;
      newWordsMastered: number;
      reviewWordsImproved: number;
      masteryProgression: number;
    };
    insights: {
      strongestCategories: string[];
      challengingCategories: string[];
      timeEfficiency: string;
      accuracyTrend: string;
    };
  };
  error?: string;
}> {
  try {
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Basic stats
    const duration = session.endTime
      ? Math.round(
          (new Date(session.endTime).getTime() -
            new Date(session.startTime).getTime()) /
            1000,
        )
      : 0;

    const totalWords = session.sessionItems.length;
    const correctAnswers = session.sessionItems.filter(
      (item) => item.isCorrect,
    ).length;
    const accuracy = totalWords > 0 ? (correctAnswers / totalWords) * 100 : 0;

    // Performance metrics
    const responseTimes = session.sessionItems
      .map((item) => item.responseTime)
      .filter((time): time is number => time !== null);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    const fastestResponse =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const slowestResponse =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    // Calculate consistency (low variance in response times = high consistency)
    const variance =
      responseTimes.length > 1
        ? responseTimes.reduce(
            (sum, time) => sum + Math.pow(time - averageResponseTime, 2),
            0,
          ) / responseTimes.length
        : 0;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance) / 100);

    // Learning metrics
    const wordsLearned = session.wordsLearned || 0;

    // Count new words that were mastered (first time getting them right)
    const newWordsMastered = session.sessionItems.filter(
      (item) => item.isCorrect && (item.userDictionary?.reviewCount || 0) <= 1,
    ).length;

    // Count review words that were improved
    const reviewWordsImproved = session.sessionItems.filter(
      (item) => item.isCorrect && (item.userDictionary?.reviewCount || 0) > 1,
    ).length;

    // Calculate mastery progression (improvement in overall mastery)
    const totalMasteryGain = session.sessionItems.reduce((sum, item) => {
      if (item.isCorrect && item.userDictionary) {
        // Estimate mastery gain based on word difficulty and current mastery
        const currentMastery = item.userDictionary.masteryScore || 0;
        const masteryGain = Math.max(0, (100 - currentMastery) * 0.1); // 10% of remaining mastery
        return sum + masteryGain;
      }
      return sum;
    }, 0);

    const masteryProgression =
      totalWords > 0 ? totalMasteryGain / totalWords : 0;

    // Generate insights
    const categoryStats = new Map<string, { correct: number; total: number }>();

    session.sessionItems.forEach((item) => {
      if (item.userDictionary) {
        const category =
          item.userDictionary.definition.wordDetails[0]?.wordDetails
            ?.partOfSpeech || 'unknown';
        const stats = categoryStats.get(category) || { correct: 0, total: 0 };
        stats.total++;
        if (item.isCorrect) stats.correct++;
        categoryStats.set(category, stats);
      }
    });

    const strongestCategories = Array.from(categoryStats.entries())
      .map(([cat, stats]) => ({
        category: cat,
        accuracy: (stats.correct / stats.total) * 100,
      }))
      .filter((item) => item.accuracy >= 80)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 2)
      .map((item) => item.category);

    const challengingCategories = Array.from(categoryStats.entries())
      .map(([cat, stats]) => ({
        category: cat,
        accuracy: (stats.correct / stats.total) * 100,
      }))
      .filter((item) => item.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 2)
      .map((item) => item.category);

    // Generate time efficiency insight
    const avgTimePerWord = totalWords > 0 ? duration / totalWords : 0;
    let timeEfficiency = 'Good pace';
    if (avgTimePerWord < 15) timeEfficiency = 'Very fast - great fluency!';
    else if (avgTimePerWord < 30) timeEfficiency = 'Good pace';
    else if (avgTimePerWord < 60) timeEfficiency = 'Thoughtful pace';
    else timeEfficiency = 'Take your time to build confidence';

    // Generate accuracy trend insight
    const firstHalfCorrect = session.sessionItems
      .slice(0, Math.floor(totalWords / 2))
      .filter((item) => item.isCorrect).length;
    const secondHalfCorrect = correctAnswers - firstHalfCorrect;
    const firstHalfTotal = Math.floor(totalWords / 2);
    const secondHalfTotal = totalWords - firstHalfTotal;

    const firstHalfAccuracy =
      firstHalfTotal > 0 ? (firstHalfCorrect / firstHalfTotal) * 100 : 0;
    const secondHalfAccuracy =
      secondHalfTotal > 0 ? (secondHalfCorrect / secondHalfTotal) * 100 : 0;

    let accuracyTrend = 'Consistent performance';
    if (secondHalfAccuracy > firstHalfAccuracy + 10)
      accuracyTrend = 'Strong improvement during session!';
    else if (firstHalfAccuracy > secondHalfAccuracy + 10)
      accuracyTrend = 'Started strong, consider shorter sessions';
    else accuracyTrend = 'Consistent performance throughout';

    return {
      success: true,
      summary: {
        basicStats: {
          duration,
          totalWords,
          correctAnswers,
          accuracy,
          score: session.score || 0,
        },
        performance: {
          averageResponseTime,
          fastestResponse,
          slowestResponse,
          consistencyScore,
        },
        learning: {
          wordsLearned,
          newWordsMastered,
          reviewWordsImproved,
          masteryProgression,
        },
        insights: {
          strongestCategories,
          challengingCategories,
          timeEfficiency,
          accuracyTrend,
        },
      },
    };
  } catch (error) {
    void serverLog('Error getting enhanced session summary', 'error', {
      error,
    });
    return { success: false, error: 'Failed to get session summary' };
  }
}
