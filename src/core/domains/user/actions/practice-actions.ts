'use server';

import { revalidateTag } from 'next/cache';
import {
  PrismaClient,
  SessionType,
  LearningStatus,
  LanguageCode,
} from '@prisma/client';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import {
  PRACTICE_SESSION_CONFIG,
  DIFFICULTY_ADJUSTMENT,
  LearningMetricsCalculator,
  type DifficultyConfig,
} from '../utils/learning-metrics';
import { getBestDefinitionForUser } from '@/core/domains/dictionary/utils/translation-utils';

// Export the DifficultyConfig type
export type { DifficultyConfig };

const prisma = new PrismaClient();

/**
 * Types for practice session management
 */
export interface PracticeWord {
  userDictionaryId: string;
  wordText: string;
  definition: string;
  phonetic?: string | undefined;
  partOfSpeech?: string | undefined;
  difficulty: number;
  learningStatus: LearningStatus;
  attempts: number;
  correctAttempts: number;
  audioUrl?: string | undefined; // Audio file URL from database
}

export interface CreatePracticeSessionRequest {
  userId: string;
  userListId?: string | null;
  listId?: string | null;
  difficultyLevel: number;
  wordsCount?: number;
  timeLimit?: number;
  includeWordStatuses?: LearningStatus[];
}

export interface ValidateTypingRequest {
  sessionId: string;
  userDictionaryId: string;
  userInput: string;
  responseTime: number; // in milliseconds
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

/**
 * Create a new typing practice session
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
    const {
      userId,
      userListId,
      listId,
      difficultyLevel,
      wordsCount,
      includeWordStatuses,
    } = request;

    serverLog(`Creating typing practice session for user ${userId}`, 'info', {
      userId,
      difficultyLevel,
      wordsCount,
      userListId,
      listId,
    });

    // Get difficulty configuration
    const difficultyConfig =
      DIFFICULTY_ADJUSTMENT.DIFFICULTY_LEVELS[
        difficultyLevel as keyof typeof DIFFICULTY_ADJUSTMENT.DIFFICULTY_LEVELS
      ] || DIFFICULTY_ADJUSTMENT.DIFFICULTY_LEVELS[3]; // Default to medium

    const targetWordsCount = wordsCount || difficultyConfig.wordsPerSession;

    // Get user settings to determine language configuration
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        baseLanguageCode: true,
        targetLanguageCode: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Build query to get user dictionary words
    const whereClause: {
      userId: string;
      learningStatus?: { in: LearningStatus[] };
      id?: { in: string[] };
    } = {
      userId,
      ...(includeWordStatuses?.length && {
        learningStatus: { in: includeWordStatuses },
      }),
    };

    // If userListId is provided, filter by words in that specific user list
    if (userListId) {
      const userListWords = await prisma.userListWord.findMany({
        where: {
          userListId,
        },
        select: {
          userDictionaryId: true,
        },
      });

      const userDictionaryIds = userListWords.map(
        (ulw) => ulw.userDictionaryId,
      );

      if (userDictionaryIds.length === 0) {
        return {
          success: false,
          error: 'No words found in the selected list',
        };
      }

      whereClause.id = { in: userDictionaryIds };
    }
    // If listId is provided, filter by words from that public list that are in user's dictionary
    else if (listId) {
      // First get definitions from the public list
      const listWords = await prisma.listWord.findMany({
        where: {
          listId,
        },
        select: {
          definitionId: true,
        },
      });

      const definitionIds = listWords.map((lw) => lw.definitionId);

      if (definitionIds.length === 0) {
        return {
          success: false,
          error: 'No words found in the selected list',
        };
      }

      // Then filter user dictionary by those definitions
      const userWordsInList = await prisma.userDictionary.findMany({
        where: {
          userId,
          definitionId: { in: definitionIds },
        },
        select: {
          id: true,
        },
      });

      const userDictionaryIds = userWordsInList.map((uw) => uw.id);

      if (userDictionaryIds.length === 0) {
        return {
          success: false,
          error:
            "You haven't added any words from this list to your dictionary yet",
        };
      }

      whereClause.id = { in: userDictionaryIds };
    }

    // Get words from user dictionary with word details and translations
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
                    audioLinks: {
                      include: {
                        audio: true,
                      },
                      where: {
                        isPrimary: true,
                      },
                    },
                  },
                },
              },
            },
            translationLinks: {
              include: {
                translation: true,
              },
            },
          },
        },
      },
      orderBy: [
        { lastReviewedAt: 'asc' },
        { progress: 'asc' },
        { correctStreak: 'asc' },
      ],
      take: targetWordsCount * 2,
    });

    if (userWords.length < PRACTICE_SESSION_CONFIG.MIN_WORDS_FOR_SESSION) {
      return {
        success: false,
        error: `Insufficient words for practice. Need at least ${PRACTICE_SESSION_CONFIG.MIN_WORDS_FOR_SESSION} words, found ${userWords.length}.`,
      };
    }

    // Create the learning session
    const session = await prisma.userLearningSession.create({
      data: {
        userId,
        userListId: userListId || null,
        listId: listId || null,
        sessionType: SessionType.practice,
        startTime: new Date(),
        wordsStudied: 0,
        wordsLearned: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        completionPercentage: 0,
      },
    });

    // Select and create practice words
    const selectedWords = userWords.slice(0, targetWordsCount);
    const practiceWords: PracticeWord[] = selectedWords.map((word) => {
      // Get the actual word text from the Word table (target language word to type)
      const wordDetails = word.definition.wordDetails[0]?.wordDetails;
      const actualWord = wordDetails?.word;

      // Get audio URL from WordDetails
      const audioUrl = wordDetails?.audioLinks?.[0]?.audio?.url || undefined;

      // Get translations for the definition
      const translations = word.definition.translationLinks.map(
        (link: {
          translation: {
            id: number;
            languageCode: LanguageCode;
            content: string;
          };
        }) => ({
          id: link.translation.id,
          languageCode: link.translation.languageCode,
          content: link.translation.content,
        }),
      );

      // Get the best definition to show (in user's base language)
      const definitionDisplay = getBestDefinitionForUser(
        word.definition.definition,
        user.targetLanguageCode, // Original definition is in target language
        translations,
        user.baseLanguageCode, // Show definition in user's base language
      );

      return {
        userDictionaryId: word.id,
        wordText:
          actualWord?.word || extractWordText(word.definition.definition), // Target language word to type
        definition: definitionDisplay.content, // Definition in base language to show
        phonetic: word.customPhonetic || wordDetails?.phonetic || undefined,
        partOfSpeech: wordDetails?.partOfSpeech || undefined,
        difficulty:
          getDifficultyLevel(word.customDifficultyLevel) || difficultyLevel,
        learningStatus: word.learningStatus,
        attempts: word.reviewCount || 0,
        correctAttempts: word.correctStreak || 0,
        audioUrl, // Include audio URL from database
      };
    });

    revalidateTag(`user-sessions-${userId}`);

    serverLog(`Typing practice session created: ${session.id}`, 'info', {
      sessionId: session.id,
      wordsCount: practiceWords.length,
    });

    return {
      success: true,
      session: {
        sessionId: session.id,
        words: practiceWords,
        timeLimit: difficultyConfig.timeLimit,
        difficultyConfig,
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(
      `Failed to create typing practice session: ${errorMessage}`,
      'error',
      {
        userId: request.userId,
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
 * Validate user's typing input for a word
 */
export async function validateTypingInput(
  request: ValidateTypingRequest,
): Promise<{
  success: boolean;
  result?: {
    isCorrect: boolean;
    accuracy: number;
    partialCredit: boolean;
    pointsEarned: number;
    feedback: string;
    updatedProgress?: {
      newLearningStatus: LearningStatus;
      newProgress: number;
      newMasteryScore: number;
    };
  };
  error?: string;
}> {
  try {
    const { sessionId, userDictionaryId, userInput, responseTime } = request;

    // Get the current session and word details
    const [session, userWord] = await Promise.all([
      prisma.userLearningSession.findUnique({
        where: { id: sessionId },
        include: { user: true },
      }),
      prisma.userDictionary.findUnique({
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
              translationLinks: {
                include: {
                  translation: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (!session || !userWord) {
      return {
        success: false,
        error: 'Session or word not found',
      };
    }

    // Get the actual word text from the Word table
    const wordDetails = userWord.definition.wordDetails[0]?.wordDetails;
    const actualWord = wordDetails?.word;
    const correctWord =
      actualWord?.word || extractWordText(userWord.definition.definition);

    // Validate the typing using our metrics calculator
    const validationResult =
      LearningMetricsCalculator.isTypingApproximatelyCorrect(
        userInput,
        correctWord,
      );

    // Calculate points earned
    let pointsEarned = 0;
    if (validationResult.isCorrect) {
      pointsEarned = PRACTICE_SESSION_CONFIG.POINTS_PER_CORRECT_ANSWER;

      // Speed bonus
      if (
        responseTime <=
        PRACTICE_SESSION_CONFIG.SPEED_BONUS_THRESHOLD * 1000
      ) {
        pointsEarned += PRACTICE_SESSION_CONFIG.BONUS_POINTS_FOR_SPEED;
      }
    } else if (validationResult.partialCredit) {
      pointsEarned = Math.round(
        PRACTICE_SESSION_CONFIG.POINTS_PER_CORRECT_ANSWER * 0.5,
      );
    } else {
      pointsEarned = -PRACTICE_SESSION_CONFIG.POINTS_PENALTY_PER_WRONG_ATTEMPT;
    }

    // Update user dictionary progress
    const newReviewCount = (userWord.reviewCount || 0) + 1;
    const newCorrectStreak = validationResult.isCorrect
      ? (userWord.correctStreak || 0) + 1
      : 0;

    // Calculate new learning metrics
    const accuracy = validationResult.accuracy;
    const newMasteryScore = LearningMetricsCalculator.calculateMasteryScore(
      accuracy,
      newCorrectStreak,
      responseTime / 1000,
      newReviewCount,
    );
    const newLearningStatus = LearningMetricsCalculator.determineLearningStatus(
      newCorrectStreak,
      newReviewCount,
      newCorrectStreak,
      newMasteryScore,
    );

    // Update user dictionary entry
    const updatedUserWord = await prisma.userDictionary.update({
      where: { id: userDictionaryId },
      data: {
        reviewCount: newReviewCount,
        correctStreak: newCorrectStreak,
        learningStatus: newLearningStatus,
        masteryScore: newMasteryScore,
        progress: Math.min(accuracy, 100),
        lastReviewedAt: new Date(),
        ...(newLearningStatus === LearningStatus.learned &&
          !userWord.timeWordWasLearned && {
            timeWordWasLearned: new Date(),
          }),
        ...(newLearningStatus === LearningStatus.inProgress &&
          !userWord.timeWordWasStartedToLearn && {
            timeWordWasStartedToLearn: new Date(),
          }),
      },
    });

    // Create session item record
    await prisma.userSessionItem.create({
      data: {
        sessionId,
        userDictionaryId,
        isCorrect: validationResult.isCorrect,
        responseTime: responseTime,
        attemptsCount: 1,
      },
    });

    // Update session counters
    await prisma.userLearningSession.update({
      where: { id: sessionId },
      data: {
        wordsStudied: { increment: 1 },
        ...(validationResult.isCorrect && {
          correctAnswers: { increment: 1 },
          ...(newLearningStatus === LearningStatus.learned && {
            wordsLearned: { increment: 1 },
          }),
        }),
        ...(!validationResult.isCorrect && {
          incorrectAnswers: { increment: 1 },
        }),
      },
    });

    // Generate feedback message
    let feedback = '';
    if (validationResult.isCorrect) {
      if (
        responseTime <=
        PRACTICE_SESSION_CONFIG.SPEED_BONUS_THRESHOLD * 1000
      ) {
        feedback = '🎉 Perfect! Great speed!';
      } else {
        feedback = '✅ Correct!';
      }
    } else if (validationResult.partialCredit) {
      feedback = `⚠️ Close! (${validationResult.accuracy}% accuracy)`;
    } else {
      feedback = `❌ Incorrect. The correct spelling is: "${correctWord}"`;
    }

    revalidateTag(`user-dictionary-${session.userId}`);
    revalidateTag(`user-sessions-${session.userId}`);

    return {
      success: true,
      result: {
        isCorrect: validationResult.isCorrect,
        accuracy: validationResult.accuracy,
        partialCredit: validationResult.partialCredit,
        pointsEarned,
        feedback,
        updatedProgress: {
          newLearningStatus,
          newProgress: updatedUserWord.progress,
          newMasteryScore: newMasteryScore,
        },
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to validate typing input: ${errorMessage}`, 'error', {
      sessionId: request.sessionId,
      error,
    });

    return {
      success: false,
      error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
    };
  }
}

/**
 * Complete a typing practice session
 */
export async function completePracticeSession(sessionId: string): Promise<{
  success: boolean;
  sessionSummary?: {
    totalWords: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    score: number;
    timeSpent: number;
    wordsLearned: number;
    achievements: string[];
  };
  error?: string;
}> {
  try {
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
      },
    });

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    if (session.endTime) {
      return {
        success: false,
        error: 'Session already completed',
      };
    }

    const endTime = new Date();
    const timeSpent = Math.round(
      (endTime.getTime() - session.startTime.getTime()) / 1000,
    );
    const totalAnswers = session.correctAnswers + session.incorrectAnswers;
    const accuracy =
      totalAnswers > 0
        ? Math.round((session.correctAnswers / totalAnswers) * 100)
        : 0;
    const completionPercentage = Math.round(
      (session.wordsStudied / Math.max(session.wordsStudied, 1)) * 100,
    );

    // Calculate final score
    const baseScore = accuracy;
    const timeBonus =
      timeSpent < PRACTICE_SESSION_CONFIG.DEFAULT_SESSION_TIME_LIMIT ? 10 : 0;
    const finalScore = Math.min(baseScore + timeBonus, 100);

    // Update session
    await prisma.userLearningSession.update({
      where: { id: sessionId },
      data: {
        endTime,
        duration: timeSpent,
        score: finalScore,
        completionPercentage,
      },
    });

    // Check for achievements
    const achievements: string[] = [];
    if (accuracy >= 100) achievements.push('Perfect Score!');
    if (accuracy >= 90) achievements.push('Excellence!');
    if (session.wordsLearned >= 5) achievements.push('Quick Learner!');
    if (timeSpent < 300) achievements.push('Speed Demon!');

    revalidateTag(`user-sessions-${session.userId}`);
    revalidateTag(`session-stats-${session.userId}`);

    serverLog(`Practice session completed: ${sessionId}`, 'info', {
      sessionId,
      accuracy,
      wordsLearned: session.wordsLearned,
      timeSpent,
    });

    return {
      success: true,
      sessionSummary: {
        totalWords: session.wordsStudied,
        correctAnswers: session.correctAnswers,
        incorrectAnswers: session.incorrectAnswers,
        accuracy,
        score: finalScore,
        timeSpent,
        wordsLearned: session.wordsLearned,
        achievements,
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to complete practice session: ${errorMessage}`, 'error', {
      sessionId,
      error,
    });

    return {
      success: false,
      error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
    };
  }
}

/**
 * Get practice session progress
 */
export async function getPracticeSessionProgress(sessionId: string): Promise<{
  success: boolean;
  progress?: PracticeSessionProgress;
  error?: string;
}> {
  try {
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    // Calculate time remaining
    const timeElapsed =
      (new Date().getTime() - session.startTime.getTime()) / 1000;
    const timeRemaining = Math.max(
      0,
      PRACTICE_SESSION_CONFIG.DEFAULT_SESSION_TIME_LIMIT - timeElapsed,
    );

    return {
      success: true,
      progress: {
        sessionId,
        currentWordIndex: session.wordsStudied,
        totalWords: session.wordsStudied,
        correctAnswers: session.correctAnswers,
        incorrectAnswers: session.incorrectAnswers,
        currentScore: session.score || 0,
        timeRemaining,
        wordsRemaining: [],
      },
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    return {
      success: false,
      error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
    };
  }
}

/**
 * Helper functions
 */

/**
 * Extract word text from definition (simplified approach)
 */
function extractWordText(definition: string): string {
  // For now, we'll use a simple approach - extract the first word in quotes or parentheses
  // This is a placeholder - in a real implementation, you'd have proper word text storage
  const quotedMatch = definition.match(/"([^"]+)"/);
  if (quotedMatch && quotedMatch[1]) return quotedMatch[1];

  const parenMatch = definition.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) return parenMatch[1];

  // Fallback: use first word of definition
  const firstWord = definition.split(' ')[0];
  return firstWord?.replace(/[^\w]/g, '') || 'word';
}

/**
 * Get difficulty level as number
 */
function getDifficultyLevel(customDifficulty: unknown): number | null {
  if (typeof customDifficulty === 'number') return customDifficulty;
  if (typeof customDifficulty === 'string') {
    const parsed = parseInt(customDifficulty, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}
