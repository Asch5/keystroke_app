'use server';

import { PrismaClient } from '@prisma/client';
import { LanguageCode, LearningStatus } from '@/core/types';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import {
  PracticeType,
  PracticeWord,
  UnifiedPracticeSession,
  SessionConfiguration,
} from './practice-types';
import {
  determineExerciseTypeProgressive,
  getWordsForSRSReview,
} from './practice-progression';
import { createPracticeSession } from './practice-session-management';
const prisma = new PrismaClient();

/**
 * Create unified practice session with dynamic exercise selection
 */
export async function createUnifiedPracticeSession(
  userId: string,
  config: SessionConfiguration,
): Promise<{
  success: boolean;
  session?: UnifiedPracticeSession;
  error?: string;
}> {
  try {
    serverLog(`Creating unified practice session for user ${userId}`, 'info', {
      config,
    });

    // Get user settings and language preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        baseLanguageCode: true,
        settings: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const baseLanguageCode = user.baseLanguageCode as LanguageCode;

    // Extract enabled exercise types from user settings
    const userSettings = user.settings as Record<string, unknown>;
    const vocabularySettings =
      (userSettings?.vocabularyPractice as Record<string, unknown>) || {};
    const enabledExerciseTypes = Array.isArray(
      vocabularySettings.enabledExerciseTypes,
    )
      ? (vocabularySettings.enabledExerciseTypes as string[])
      : [
          'remember-translation',
          'choose-right-word',
          'make-up-word',
          'write-by-definition',
          'write-by-sound',
        ];

    // Create base practice session
    const sessionResult = await createPracticeSession(userId, config);

    if (
      !sessionResult.success ||
      !sessionResult.sessionId ||
      !sessionResult.words
    ) {
      return {
        success: false,
        error: sessionResult.error || 'Failed to create session',
      };
    }

    // Enhance with unified practice logic
    const userPreferences: {
      enabledExerciseTypes?: string[];
      skipRememberTranslation?: boolean;
      forceDifficulty?: number;
    } = {};

    if (enabledExerciseTypes) {
      userPreferences.enabledExerciseTypes = enabledExerciseTypes as string[];
    }

    if (vocabularySettings.skipRememberTranslation !== undefined) {
      userPreferences.skipRememberTranslation =
        vocabularySettings.skipRememberTranslation as boolean;
    }

    if (config.difficulty !== undefined) {
      userPreferences.forceDifficulty = config.difficulty;
    }

    const practiceWords = await enhanceWordsWithExerciseTypes(
      sessionResult.words,
      userPreferences,
    );

    // Create unified session structure
    const unifiedSession: UnifiedPracticeSession = {
      sessionId: sessionResult.sessionId,
      userId,
      practiceType: 'unified-practice',
      words: practiceWords,
      configuration: {
        ...config,
        enabledExerciseTypes: enabledExerciseTypes,
        baseLanguageCode,
      },
      progress: {
        currentWordIndex: 0,
        completedWords: 0,
        correctAnswers: 0,
        totalAttempts: 0,
        sessionScore: 0,
      },
      adaptiveSettings: {
        difficulty: config.difficulty || 2,
        adaptiveDifficulty:
          (vocabularySettings.adaptiveDifficulty as boolean) || false,
        pauseOnIncorrect:
          (vocabularySettings.pauseOnIncorrect as boolean) || false,
        showCorrectAnswer:
          (vocabularySettings.showCorrectAnswer as boolean) !== false,
      },
    };

    serverLog(
      `Unified practice session created: ${sessionResult.sessionId}`,
      'info',
      {
        sessionId: sessionResult.sessionId,
        wordsCount: practiceWords.length,
        exerciseTypes: practiceWords.map((w) => w.exerciseType),
      },
    );

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
 * Determine exercise type for unified practice
 */
export async function determineExerciseType(
  word: PracticeWord,
  userPreferences?: {
    skipRememberTranslation?: boolean;
    forceDifficulty?: number;
    enabledExerciseTypes?: string[];
  },
): Promise<{
  exerciseType: PracticeType;
  reasoning: string;
}> {
  const attempts = word.attempts || 0;
  const correctAttempts = word.correctAttempts || 0;
  const successRate = attempts > 0 ? correctAttempts / attempts : 0;
  const masteryScore = (correctAttempts / Math.max(attempts, 1)) * 100;

  // Use progressive learning system for better structured progression
  const progressiveResult = await determineExerciseTypeProgressive(
    word,
    userPreferences,
  );

  if (progressiveResult.exerciseType) {
    return {
      exerciseType: progressiveResult.exerciseType,
      reasoning: `Progressive learning level ${progressiveResult.currentLevel}`,
    };
  }

  // Fallback to original algorithm if progressive fails
  let exerciseType: PracticeType;
  let reasoning: string;

  // Check enabled exercise types
  const enabledTypes = userPreferences?.enabledExerciseTypes || [
    'remember-translation',
    'choose-right-word',
    'make-up-word',
    'write-by-definition',
    'write-by-sound',
  ];

  const isTypeEnabled = (type: PracticeType): boolean =>
    enabledTypes.includes(type);

  // Force difficulty override
  if (userPreferences?.forceDifficulty) {
    const difficultyMap: Record<number, PracticeType[]> = {
      1: ['remember-translation', 'choose-right-word'],
      2: ['choose-right-word', 'make-up-word'],
      3: ['make-up-word', 'write-by-definition', 'write-by-sound'],
    };

    const typesForDifficulty = difficultyMap[
      userPreferences.forceDifficulty
    ] || ['write-by-definition'];
    const availableType =
      typesForDifficulty.find(isTypeEnabled) || 'remember-translation';

    return {
      exerciseType: availableType,
      reasoning: `Forced difficulty level ${userPreferences.forceDifficulty}`,
    };
  }

  // Determine exercise type based on word familiarity
  if (attempts === 0) {
    // Brand new word - start with recognition
    exerciseType = isTypeEnabled('remember-translation')
      ? 'remember-translation'
      : 'choose-right-word';
    reasoning = 'New word - starting with recognition';
  } else if (attempts < 3 || successRate < 0.5) {
    // Low familiarity - easier exercises
    if (masteryScore < 30) {
      exerciseType = isTypeEnabled('remember-translation')
        ? 'remember-translation'
        : 'choose-right-word';
      reasoning = 'Low mastery - building recognition';
    } else {
      exerciseType = isTypeEnabled('choose-right-word')
        ? 'choose-right-word'
        : 'make-up-word';
      reasoning = 'Building familiarity with multiple choice';
    }
  } else if (successRate >= 0.5 && successRate < 0.8) {
    // Medium familiarity - construction exercises
    exerciseType = isTypeEnabled('make-up-word')
      ? 'make-up-word'
      : 'write-by-definition';
    reasoning = 'Medium familiarity - word construction';
  } else if (successRate >= 0.8) {
    // High familiarity - challenging exercises
    if (word.imageUrl || word.imageDescription) {
      exerciseType = isTypeEnabled('write-by-definition')
        ? 'write-by-definition'
        : 'write-by-sound';
      reasoning = 'High familiarity - definition writing';
    } else {
      exerciseType = isTypeEnabled('write-by-sound')
        ? 'write-by-sound'
        : 'write-by-definition';
      reasoning = 'High familiarity - sound-based writing';
    }
  } else {
    // Default fallback
    exerciseType = isTypeEnabled('choose-right-word')
      ? 'choose-right-word'
      : 'remember-translation';
    reasoning = 'Default selection';
  }

  // Skip remember-translation if user preference is set
  if (
    userPreferences?.skipRememberTranslation &&
    exerciseType === 'remember-translation'
  ) {
    exerciseType = isTypeEnabled('choose-right-word')
      ? 'choose-right-word'
      : 'make-up-word';
    reasoning += ' (skipped remember-translation)';
  }

  // Ensure the selected type is enabled
  if (!isTypeEnabled(exerciseType)) {
    exerciseType = (enabledTypes[0] as PracticeType) || 'remember-translation';
    reasoning += ' (adjusted to enabled types)';
  }

  return { exerciseType, reasoning };
}

/**
 * Get next word for unified practice session
 */
export async function getNextWordForPractice(
  sessionId: string,
  currentWordIndex: number,
): Promise<{
  success: boolean;
  word?: PracticeWord & { exerciseType: PracticeType };
  isLastWord?: boolean;
  error?: string;
}> {
  try {
    // Get session data
    const session = await prisma.userLearningSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: { settings: true },
        },
      },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Get session words from session items
    const sessionItems = await prisma.userSessionItem.findMany({
      where: { sessionId },
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
                image: true,
              },
            },
          },
        },
      },
    });

    const words = sessionItems.map((item) => ({
      userDictionaryId: item.userDictionary.id,
      wordText:
        item.userDictionary.definition.wordDetails[0]?.wordDetails?.word
          ?.word || '',
      definition: item.userDictionary.definition.definition,
      difficulty: item.userDictionary.srsLevel || 0,
      learningStatus: item.userDictionary.learningStatus,
      attempts: item.userDictionary.reviewCount || 0,
      correctAttempts: Math.round(
        ((item.userDictionary.reviewCount || 0) *
          (item.userDictionary.masteryScore || 0)) /
          100,
      ),
      srsLevel: item.userDictionary.srsLevel || 0,
      imageUrl: item.userDictionary.definition.image?.url,
      imageId: item.userDictionary.definition.image?.id,
    }));

    if (currentWordIndex >= words.length) {
      return { success: false, error: 'No more words in session' };
    }

    const word = words[currentWordIndex];
    const isLastWord = currentWordIndex === words.length - 1;

    // Get user preferences
    const userSettings = session.user.settings as Record<string, unknown>;
    const vocabularySettings =
      (userSettings?.vocabularyPractice as Record<string, unknown>) || {};

    // Determine exercise type for this word
    if (!word) {
      return { success: false, error: 'Word not found in session' };
    }

    const userPreferences: {
      enabledExerciseTypes?: string[];
      skipRememberTranslation?: boolean;
      forceDifficulty?: number;
    } = {};

    if (vocabularySettings.enabledExerciseTypes) {
      userPreferences.enabledExerciseTypes =
        vocabularySettings.enabledExerciseTypes as string[];
    }
    if (vocabularySettings.skipRememberTranslation) {
      userPreferences.skipRememberTranslation =
        vocabularySettings.skipRememberTranslation as boolean;
    }
    if (vocabularySettings.forceDifficulty) {
      userPreferences.forceDifficulty =
        vocabularySettings.forceDifficulty as number;
    }

    const { exerciseType } = await determineExerciseType(word, userPreferences);

    return {
      success: true,
      word: {
        ...word,
        exerciseType,
      },
      isLastWord,
    };
  } catch (error) {
    serverLog('Error getting next word for practice', 'error', { error });
    return {
      success: false,
      error: 'Failed to get next word',
    };
  }
}

/**
 * Update word progress and select next exercise type
 */
export async function updateWordProgressAndSelectNext(
  userDictionaryId: string,
  isCorrect: boolean,
  responseTime: number,
  enabledExerciseTypes?: string[],
): Promise<{
  success: boolean;
  nextExerciseType?: PracticeType;
  progressUpdated?: boolean;
  error?: string;
}> {
  try {
    // Get current word data
    const userWord = await prisma.userDictionary.findUnique({
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
      },
    });

    if (!userWord) {
      return { success: false, error: 'User word not found' };
    }

    // Update basic metrics
    const newReviewCount = (userWord.reviewCount || 0) + 1;
    const newCorrectAttempts = isCorrect
      ? Math.round(
          ((userWord.reviewCount || 0) * (userWord.masteryScore || 0)) / 100,
        ) + 1
      : Math.round(
          ((userWord.reviewCount || 0) * (userWord.masteryScore || 0)) / 100,
        );

    await prisma.userDictionary.update({
      where: { id: userDictionaryId },
      data: {
        reviewCount: newReviewCount,
        correctStreak: isCorrect ? { increment: 1 } : 0,
        lastReviewedAt: new Date(),
        ...(isCorrect && {
          masteryScore: Math.min(
            100,
            (newCorrectAttempts / newReviewCount) * 100,
          ),
        }),
        ...(!isCorrect && {
          amountOfMistakes: { increment: 1 },
        }),
      },
    });

    // Create practice word for next exercise determination
    const practiceWord: PracticeWord = {
      userDictionaryId: userWord.id,
      wordText:
        userWord.definition.wordDetails[0]?.wordDetails?.word?.word || '',
      definition: userWord.definition.definition,
      difficulty: userWord.srsLevel || 0,
      learningStatus: userWord.learningStatus,
      attempts: newReviewCount,
      correctAttempts: newCorrectAttempts,
      srsLevel: userWord.srsLevel || 0,
      imageUrl: undefined,
      imageId: userWord.definition.imageId || undefined,
    };

    // Determine next exercise type
    const exercisePrefs = enabledExerciseTypes ? { enabledExerciseTypes } : {};
    const { exerciseType: nextExerciseType } = await determineExerciseType(
      practiceWord,
      exercisePrefs,
    );

    return {
      success: true,
      nextExerciseType,
      progressUpdated: true,
    };
  } catch (error) {
    serverLog('Error updating word progress and selecting next', 'error', {
      error,
    });
    return {
      success: false,
      error: 'Failed to update progress and select next exercise',
    };
  }
}

/**
 * Enhance words with exercise types for unified practice
 */
async function enhanceWordsWithExerciseTypes(
  words: PracticeWord[],
  userPreferences: {
    enabledExerciseTypes?: string[];
    skipRememberTranslation?: boolean;
    forceDifficulty?: number;
  },
): Promise<
  Array<PracticeWord & { exerciseType: PracticeType; reasoning: string }>
> {
  const enhancedWords: Array<
    PracticeWord & { exerciseType: PracticeType; reasoning: string }
  > = [];

  for (const word of words) {
    const { exerciseType, reasoning } = await determineExerciseType(
      word,
      userPreferences,
    );

    enhancedWords.push({
      ...word,
      exerciseType,
      reasoning,
    });
  }

  return enhancedWords;
}

/**
 * Get adaptive practice words based on SRS and difficulty
 */
export async function getAdaptivePracticeWords(
  userId: string,
  config: SessionConfiguration,
): Promise<{
  success: boolean;
  words?: PracticeWord[];
  adaptedDifficulty?: number;
  error?: string;
}> {
  try {
    // Get words due for SRS review first
    const srsWords = await getWordsForSRSReview(
      userId,
      Math.floor(config.wordsToStudy * 0.7),
    );

    // If we don't have enough SRS words, get additional words by difficulty
    const remainingCount = config.wordsToStudy - srsWords.length;
    let additionalWords: PracticeWord[] = [];

    if (remainingCount > 0) {
      // Get words based on original difficulty logic
      const whereClause = {
        userId,
        deletedAt: null,
        ...(config.listId && {
          definitionId: {
            in: (
              await prisma.listWord.findMany({
                where: { listId: config.listId },
                select: { definitionId: true },
              })
            ).map((lw) => lw.definitionId),
          },
        }),
        ...(config.userListId && {
          id: {
            in: (
              await prisma.userListWord.findMany({
                where: { userListId: config.userListId },
                select: { userDictionaryId: true },
              })
            ).map((ulw) => ulw.userDictionaryId),
          },
        }),
        ...(srsWords.length > 0 && {
          id: {
            notIn: srsWords.map((w) => w.userDictionaryId),
          },
        }),
        ...(config.difficulty === 1 && {
          learningStatus: {
            in: [LearningStatus.notStarted, LearningStatus.inProgress],
          },
          masteryScore: { lt: 50 },
        }),
        ...(config.difficulty === 2 && {
          learningStatus: LearningStatus.inProgress,
          masteryScore: { gte: 30, lt: 70 },
        }),
        ...(config.difficulty === 3 && {
          OR: [
            { learningStatus: LearningStatus.needsReview },
            { learningStatus: LearningStatus.difficult },
          ],
        }),
      };

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
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ lastReviewedAt: 'asc' }, { masteryScore: 'asc' }],
        take: remainingCount,
      });

      additionalWords = userWords.map((userWord) => ({
        userDictionaryId: userWord.id,
        wordText:
          userWord.definition.wordDetails[0]?.wordDetails?.word?.word || '',
        definition: userWord.definition.definition,
        difficulty: userWord.srsLevel || 0,
        learningStatus: userWord.learningStatus,
        attempts: userWord.reviewCount || 0,
        correctAttempts: Math.round(
          ((userWord.reviewCount || 0) * (userWord.masteryScore || 0)) / 100,
        ),
        srsLevel: userWord.srsLevel || 0,
        imageUrl: undefined,
        imageId: userWord.definition.imageId || undefined,
      }));
    }

    const allWords = [...srsWords, ...additionalWords];

    // Calculate adapted difficulty based on word selection
    const avgDifficulty =
      allWords.reduce((sum, w) => sum + w.difficulty, 0) /
      Math.max(allWords.length, 1);
    const adaptedDifficulty =
      Math.round(avgDifficulty) || config.difficulty || 2;

    return {
      success: true,
      words: allWords,
      adaptedDifficulty,
    };
  } catch (error) {
    serverLog('Error getting adaptive practice words', 'error', { error });
    return {
      success: false,
      error: 'Failed to get adaptive practice words',
    };
  }
}
