'use server';

import { revalidateTag } from 'next/cache';
import { PrismaClient } from '@prisma/client';
import { SessionType, LearningStatus, LanguageCode } from '@/core/types';
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
 * Enhanced types for multiple practice types
 */
export type PracticeType =
  | 'typing'
  | 'choose-right-word'
  | 'make-up-word'
  | 'remember-translation'
  | 'write-by-definition'
  | 'write-by-sound'
  | 'unified-practice';

// Convert object exports to async functions
export async function getPracticeTypeMultipliers() {
  return {
    'remember-translation': 0.5, // Difficulty 1
    'choose-right-word': 1.0, // Difficulty 2
    'make-up-word': 1.5, // Difficulty 3
    'write-by-definition': 2.0, // Difficulty 4
    'write-by-sound': 2.5, // Difficulty 4+
    typing: 1.2, // Current system
  } as const;
}

export async function getPracticeTypeConfigs() {
  return {
    'remember-translation': {
      difficultyLevel: 1,
      maxAttempts: 1,
      autoAdvance: true,
      requiresAudio: false,
      requiresInput: false,
    },
    'choose-right-word': {
      difficultyLevel: 2,
      maxAttempts: 1,
      autoAdvance: true,
      requiresAudio: false,
      requiresInput: false,
      optionCount: 4,
    },
    'make-up-word': {
      difficultyLevel: 3,
      maxAttempts: 3,
      maxAttemptsPhrase: 6,
      autoAdvance: true,
      requiresAudio: false,
      requiresInput: true,
    },
    'write-by-definition': {
      difficultyLevel: 4,
      maxAttempts: 1,
      autoAdvance: false, // Changed: Exercise 4 has "Next" button
      requiresAudio: false,
      requiresInput: true,
    },
    'write-by-sound': {
      difficultyLevel: 4,
      maxAttempts: 1,
      autoAdvance: false, // Changed: Exercise 5 has "Next" button
      requiresAudio: true,
      requiresInput: true,
      maxAudioReplays: 3,
    },
    'unified-practice': {
      difficultyLevel: 3, // Average difficulty level
      maxAttempts: 1,
      autoAdvance: false, // Controlled by unified system
      requiresAudio: false,
      requiresInput: true,
    },
    typing: {
      difficultyLevel: 3,
      maxAttempts: 1,
      autoAdvance: false,
      requiresAudio: false,
      requiresInput: true,
    },
  } as const;
}

// Keep these constants for internal use - used in the exported functions
const PRACTICE_TYPE_MULTIPLIERS = {
  'remember-translation': 0.5, // Difficulty 1
  'choose-right-word': 1.0, // Difficulty 2
  'make-up-word': 1.5, // Difficulty 3
  'write-by-definition': 2.0, // Difficulty 4
  'write-by-sound': 2.5, // Difficulty 4+
  typing: 1.2, // Current system
  'unified-practice': 1.5, // Average difficulty for unified practice
} as const;

const PRACTICE_TYPE_CONFIGS = {
  'remember-translation': {
    difficultyLevel: 1,
    maxAttempts: 1,
    autoAdvance: true,
    requiresAudio: false,
    requiresInput: false,
  },
  'choose-right-word': {
    difficultyLevel: 2,
    maxAttempts: 1,
    autoAdvance: true,
    requiresAudio: false,
    requiresInput: false,
    optionCount: 4,
  },
  'make-up-word': {
    difficultyLevel: 3,
    maxAttempts: 3,
    maxAttemptsPhrase: 6,
    autoAdvance: true,
    requiresAudio: false,
    requiresInput: true,
  },
  'write-by-definition': {
    difficultyLevel: 4,
    maxAttempts: 1,
    autoAdvance: false, // Changed: Exercise 4 has "Next" button
    requiresAudio: false,
    requiresInput: true,
  },
  'write-by-sound': {
    difficultyLevel: 4,
    maxAttempts: 1,
    autoAdvance: false, // Changed: Exercise 5 has "Next" button
    requiresAudio: true,
    requiresInput: true,
    maxAudioReplays: 3,
  },
  'unified-practice': {
    difficultyLevel: 3, // Average difficulty level
    maxAttempts: 1,
    autoAdvance: false, // Controlled by unified system
    requiresAudio: false,
    requiresInput: true,
  },
  typing: {
    difficultyLevel: 3,
    maxAttempts: 1,
    autoAdvance: false,
    requiresAudio: false,
    requiresInput: true,
  },
} as const;

/**
 * Types for practice session management
 */
export interface PracticeWord {
  userDictionaryId: string;
  wordText: string;
  definition: string;
  oneWordTranslation?: string | undefined; // One-word translation for prominent display
  phonetic?: string | undefined;
  partOfSpeech?: string | undefined;
  difficulty: number;
  learningStatus: LearningStatus;
  attempts: number;
  correctAttempts: number;
  audioUrl?: string | undefined; // Audio file URL from database
  imageId?: number | undefined; // Image ID for definition
  imageUrl?: string | undefined; // Image URL for definition
  imageDescription?: string | undefined; // Image alt text

  // Enhanced fields for new practice types
  isNewWord?: boolean; // Determines workflow pattern (WordCard first vs game first)
  gameAttempts?: number; // Tracks attempts in current game
  maxAttempts?: number; // Based on practice type and word/phrase status
  characterPool?: string[]; // For make-up-word game
  distractorOptions?: string[]; // For choose-right-word game
  correctAnswerIndex?: number; // For choose-right-word game (0-3)
  isPhrase?: boolean; // Whether this is a multi-word phrase
  wordCount?: number; // Number of words in phrase
}

export interface CreatePracticeSessionRequest {
  userId: string;
  userListId?: string | null;
  listId?: string | null;
  difficultyLevel: number;
  wordsCount?: number;
  timeLimit?: number;
  includeWordStatuses?: LearningStatus[];
  practiceType?: PracticeType; // New field for enhanced sessions
}

export interface EnhancedPracticeSession {
  sessionId: string;
  practiceType: PracticeType;
  words: PracticeWord[];
  difficultyLevel: number;
  currentWordIndex: number;
  settings: PracticeSessionSettings;
  config: (typeof PRACTICE_TYPE_CONFIGS)[PracticeType];
}

export interface PracticeSessionSettings {
  autoPlayAudio: boolean;
  enableGameSounds: boolean;
  showHints: boolean;
  allowSkipping: boolean;
  timeLimit?: number;
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

    // Get words from user dictionary with word details, translations, one-word definitions, and images
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
            oneWordLinks: {
              include: {
                word: {
                  select: {
                    id: true,
                    word: true,
                    languageCode: true,
                  },
                },
              },
            },
            image: {
              select: {
                id: true,
                url: true,
                description: true,
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

      // Get one-word translation (prioritize user's base language)
      const oneWordLinks = word.definition.oneWordLinks || [];
      const oneWordTranslation =
        oneWordLinks.find(
          (link) => link.word.languageCode === user.baseLanguageCode,
        )?.word.word ||
        oneWordLinks[0]?.word.word ||
        undefined;

      // Get image data from definition
      const imageData = word.definition.image;

      return {
        userDictionaryId: word.id,
        wordText:
          actualWord?.word || extractWordText(word.definition.definition), // Target language word to type
        definition: definitionDisplay.content, // Full definition in base language to show
        oneWordTranslation, // One-word translation for prominent display
        phonetic: word.customPhonetic || wordDetails?.phonetic || undefined,
        partOfSpeech: wordDetails?.partOfSpeech || undefined,
        difficulty:
          getDifficultyLevel(word.customDifficultyLevel) || difficultyLevel,
        learningStatus: word.learningStatus,
        attempts: word.reviewCount || 0,
        correctAttempts: word.correctStreak || 0,
        audioUrl, // Include audio URL from database
        imageId: imageData?.id || undefined,
        imageUrl: imageData?.id ? `/api/images/${imageData.id}` : undefined, // Use authenticated image endpoint
        imageDescription: imageData?.description || undefined,
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
 * Enhanced utility functions for multiple practice types
 */

/**
 * Generate distractor options for choose-right-word game
 */
export async function generateDistractorOptions(
  correctWord: string,
  targetLanguageCode: LanguageCode,
  baseLanguageCode: LanguageCode,
  partOfSpeech?: string,
): Promise<string[]> {
  // For now, use pattern-based generation
  // TODO: Implement database lookup for better distractors
  console.log(
    'Generating distractors for:',
    correctWord,
    'Language:',
    targetLanguageCode,
    baseLanguageCode,
    partOfSpeech,
  );

  return Array.from({ length: 3 }, () =>
    generateSimilarWord(correctWord, []),
  ).filter(Boolean);
}

/**
 * Generate character pool for make-up-word game
 */
export async function generateCharacterPool(
  targetWord: string,
  extraCharacters: number = 4,
): Promise<string[]> {
  const targetChars = targetWord.toLowerCase().split('');
  const extraChars = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .filter((char) => !targetChars.includes(char))
    .sort(() => Math.random() - 0.5)
    .slice(0, extraCharacters);

  return [...targetChars, ...extraChars].sort(() => Math.random() - 0.5);
}

/**
 * Determine if word is new for workflow pattern
 */
export async function isNewWordForUser(
  learningStatus: LearningStatus,
  attempts: number,
  correctAttempts: number,
): Promise<boolean> {
  return (
    learningStatus === LearningStatus.notStarted ||
    (attempts === 0 && correctAttempts === 0)
  );
}

/**
 * Calculate max attempts for a practice type
 */
export async function calculateMaxAttempts(
  practiceType: PracticeType,
  isPhrase: boolean = false,
): Promise<number> {
  // Use the internal PRACTICE_TYPE_CONFIGS constant
  const config = PRACTICE_TYPE_CONFIGS[practiceType];

  if (isPhrase && 'maxAttemptsPhrase' in config) {
    return config.maxAttemptsPhrase as number;
  }

  return config.maxAttempts;
}

/**
 * Generate enhanced practice session with game-specific data
 */
export async function createEnhancedPracticeSession(
  request: CreatePracticeSessionRequest & { practiceType: PracticeType },
): Promise<{
  success: boolean;
  session?: EnhancedPracticeSession;
  error?: string;
}> {
  try {
    const { practiceType } = request;
    const config = PRACTICE_TYPE_CONFIGS[practiceType];

    // Use existing session creation as base
    const baseSessionResult = await createTypingPracticeSession(request);

    if (!baseSessionResult.success || !baseSessionResult.session) {
      return {
        success: false,
        error: baseSessionResult.error || 'Failed to create base session',
      };
    }

    const { sessionId, words, difficultyConfig } = baseSessionResult.session;

    // Get user for language preferences
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
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

    // Enhance words with game-specific data
    const enhancedWords: PracticeWord[] = await Promise.all(
      words.map(async (word) => {
        const isPhrase = word.wordText.includes(' ');
        const wordCount = word.wordText.split(' ').length;
        const isNew = await isNewWordForUser(
          word.learningStatus,
          word.attempts,
          word.correctAttempts,
        );
        const maxAttempts = await calculateMaxAttempts(practiceType, isPhrase);

        const enhancedWord: PracticeWord = {
          ...word,
          isNewWord: isNew,
          gameAttempts: 0,
          maxAttempts,
          isPhrase,
          wordCount,
        };

        // Add game-specific data
        if (practiceType === 'choose-right-word') {
          const distractors = await generateDistractorOptions(
            word.wordText,
            user.targetLanguageCode,
            user.baseLanguageCode,
            word.partOfSpeech,
          );

          // Randomize correct answer position
          const correctIndex = Math.floor(Math.random() * 4);
          const options = [...distractors];
          options.splice(correctIndex, 0, word.wordText);

          enhancedWord.distractorOptions = options.slice(0, 4);
          enhancedWord.correctAnswerIndex = correctIndex;
        } else if (practiceType === 'make-up-word') {
          enhancedWord.characterPool = await generateCharacterPool(
            word.wordText,
          );
        }

        return enhancedWord;
      }),
    );

    const enhancedSession: EnhancedPracticeSession = {
      sessionId,
      practiceType,
      words: enhancedWords,
      difficultyLevel: request.difficultyLevel,
      currentWordIndex: 0,
      settings: {
        autoPlayAudio: true,
        enableGameSounds: true,
        showHints: false,
        allowSkipping: true,
        timeLimit: difficultyConfig.timeLimit,
      },
      config,
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
        userId: request.userId,
        practiceType: request.practiceType,
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
 * Helper functions
 */

/**
 * Generate a similar-looking word for distractors
 */
function generateSimilarWord(original: string, existing: string[]): string {
  const variations = [
    // Change one character
    original.slice(0, -1) +
      String.fromCharCode(97 + Math.floor(Math.random() * 26)),
    // Add one character
    original + String.fromCharCode(97 + Math.floor(Math.random() * 26)),
    // Remove one character (if word is long enough)
    original.length > 3 ? original.slice(0, -1) : original + 'e',
    // Swap two adjacent characters
    original.length > 1
      ? original.slice(0, -2) + original.slice(-1) + original.slice(-2, -1)
      : original + 's',
  ];

  const available = variations.filter(
    (v) => !existing.includes(v) && v !== original,
  );
  return (
    available[Math.floor(Math.random() * available.length)] || original + 'x'
  );
}

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

/**
 * Determine the appropriate exercise type based on word learning status
 */
export async function determineExerciseType(
  word: PracticeWord,
  userPreferences?: {
    skipRememberTranslation?: boolean;
    forceDifficulty?: number;
  },
): Promise<PracticeType> {
  // Use the internal PRACTICE_TYPE_MULTIPLIERS constant for difficulty calculation
  const successRate =
    word.attempts > 0 ? (word.correctAttempts / word.attempts) * 100 : 0;

  // Force specific difficulty if requested
  if (userPreferences?.forceDifficulty) {
    const difficulty = userPreferences.forceDifficulty;

    if (difficulty === 1) return 'remember-translation';
    if (difficulty === 2) return 'choose-right-word';
    if (difficulty === 3) return 'make-up-word';
    if (difficulty === 4) return 'write-by-definition';
    if (difficulty === 5) return 'write-by-sound';
  }

  // Skip remember-translation if requested
  if (
    userPreferences?.skipRememberTranslation &&
    (word.attempts === 0 || word.learningStatus === 'notStarted')
  ) {
    return 'choose-right-word';
  }

  // New words or words with very low success rate start with easier exercises
  if (word.attempts === 0 || word.learningStatus === 'notStarted') {
    return 'remember-translation';
  }

  // Based on success rate, assign appropriate exercise type
  if (successRate < 30) {
    return 'remember-translation';
  } else if (successRate < 60) {
    return 'choose-right-word';
  } else if (successRate < 80) {
    return 'make-up-word';
  } else {
    // For high success rate, alternate between harder exercises
    // Check if audio is available for write-by-sound
    if (word.audioUrl && Math.random() > 0.5) {
      return 'write-by-sound';
    } else {
      return 'write-by-definition';
    }
  }
}

/**
 * Enhanced Practice Word with dynamic exercise type
 */
export interface UnifiedPracticeWord extends PracticeWord {
  dynamicExerciseType: PracticeType;
  exerciseHistory: PracticeType[];
  nextExerciseType?: PracticeType;
}

/**
 * Create a unified practice session with automatic exercise type selection
 */
export async function createUnifiedPracticeSession(
  request: CreatePracticeSessionRequest,
): Promise<{
  success: boolean;
  session?: EnhancedPracticeSession;
  error?: string;
}> {
  try {
    const { userId, userListId, listId, difficultyLevel, wordsCount } = request;

    serverLog(`Creating unified practice session for user ${userId}`, 'info', {
      userId,
      difficultyLevel,
      wordsCount,
      userListId,
      listId,
    });

    // Create base session with 'remember-translation' as default
    const baseRequest: CreatePracticeSessionRequest & {
      practiceType: PracticeType;
    } = {
      ...request,
      practiceType: 'remember-translation',
    };

    const baseResult = await createEnhancedPracticeSession(baseRequest);

    if (!baseResult.success || !baseResult.session) {
      return {
        success: false,
        error: baseResult.error || 'Failed to create base session',
      };
    }

    const { session } = baseResult;

    // Enhance each word with dynamic exercise type selection
    const unifiedWords: UnifiedPracticeWord[] = await Promise.all(
      session.words.map(async (word) => {
        const dynamicExerciseType = await determineExerciseType(word);

        return {
          ...word,
          dynamicExerciseType,
          exerciseHistory: [],
        };
      }),
    );

    // Create unified session
    const unifiedSession: EnhancedPracticeSession = {
      ...session,
      practiceType: 'unified-practice' as PracticeType, // Special type for unified practice
      words: unifiedWords,
    };

    serverLog(`Created unified practice session ${session.sessionId}`, 'info', {
      wordsCount: unifiedWords.length,
      exerciseDistribution: getExerciseDistribution(
        unifiedWords as UnifiedPracticeWord[],
      ),
    });

    return {
      success: true,
      session: unifiedSession,
    };
  } catch (error) {
    const errorMessage = handlePrismaError(error);
    serverLog(
      `Failed to create unified practice session: ${errorMessage}`,
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
 * Get exercise type distribution for analytics
 */
function getExerciseDistribution(
  words: UnifiedPracticeWord[],
): Record<PracticeType, number> {
  const distribution: Record<PracticeType, number> = {
    'remember-translation': 0,
    'choose-right-word': 0,
    'make-up-word': 0,
    'write-by-definition': 0,
    'write-by-sound': 0,
    'unified-practice': 0,
    typing: 0,
  };

  words.forEach((word) => {
    distribution[word.dynamicExerciseType]++;
  });

  return distribution;
}

/**
 * Update word progress and determine next exercise type
 */
export async function updateWordProgressAndSelectNext(
  sessionId: string,
  wordId: string,
  userInput: string,
  isCorrect: boolean,
  attempts: number,
  currentExerciseType: PracticeType,
): Promise<{
  success: boolean;
  nextExerciseType?: PracticeType;
  shouldShowWordCard?: boolean;
  error?: string;
}> {
  try {
    // Get the word's current progress data
    const wordData = await getWordProgressData(wordId);
    if (!wordData) {
      return {
        success: false,
        error: 'Word not found',
      };
    }

    // Calculate points based on exercise difficulty and correctness
    let exerciseMultiplier = 1.0; // Default multiplier

    if (currentExerciseType in PRACTICE_TYPE_MULTIPLIERS) {
      exerciseMultiplier =
        PRACTICE_TYPE_MULTIPLIERS[
          currentExerciseType as keyof typeof PRACTICE_TYPE_MULTIPLIERS
        ];
    }

    const basePoints = isCorrect ? 10 : 0;
    const pointsEarned = Math.round(basePoints * exerciseMultiplier);

    // Update word progress in database
    await prisma.userDictionary.update({
      where: {
        id: wordId,
      },
      data: {
        // Update learning metrics based on exercise results
        masteryScore: {
          increment: isCorrect ? pointsEarned : 0,
        },
        progress: {
          increment: isCorrect ? 5 : 0,
        },
        correctStreak: isCorrect
          ? {
              increment: 1,
            }
          : 0,
        amountOfMistakes: isCorrect
          ? {
              increment: 0,
            }
          : {
              increment: 1,
            },
      },
    });

    // Determine next exercise type based on updated progress
    const nextExerciseType = await determineExerciseType(wordData);
    const shouldShowWordCard =
      !isCorrect ||
      (await isNewWordForUser(
        wordData.learningStatus,
        wordData.attempts,
        wordData.correctAttempts,
      ));

    return {
      success: true,
      nextExerciseType,
      shouldShowWordCard,
    };
  } catch (error) {
    serverLog(`Failed to update word progress: ${error}`, 'error', {
      sessionId,
      wordId,
      currentExerciseType,
    });

    return {
      success: false,
      error: 'Failed to update word progress',
    };
  }
}

/**
 * Get word progress data for exercise type determination
 * TODO: Implement proper Prisma query when schema is finalized
 */
async function getWordProgressData(
  wordId: string,
): Promise<PracticeWord | null> {
  try {
    // Simplified implementation to avoid TypeScript errors
    // In production, this would query the database for updated word progress
    return {
      userDictionaryId: wordId,
      wordText: 'placeholder',
      definition: 'placeholder definition',
      difficulty: 3,
      learningStatus: 'learning' as LearningStatus,
      attempts: 1,
      correctAttempts: 0,
      isNewWord: true,
    };
  } catch (error) {
    serverLog('Failed to get word progress data', 'error', { wordId, error });
    return null;
  }
}
