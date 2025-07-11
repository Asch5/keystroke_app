'use server';

import { PrismaClient } from '@prisma/client';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { LanguageCode, LearningStatus } from '@/core/types';
import {
  getBestDefinitionForUser,
  TranslationData,
} from '../../dictionary/utils/translation-utils';
import { determineExerciseTypeProgressive } from './practice-progression';
import {
  PracticeType,
  PracticeWord,
  UnifiedPracticeSession,
  SessionConfiguration,
} from './practice-types';

const prisma = new PrismaClient();

/**
 * Create vocabulary practice session with mode-specific word filtering
 */
export async function createVocabularyPracticeSession(
  userId: string,
  config: SessionConfiguration,
  practiceMode: string,
): Promise<{
  success: boolean;
  session?: UnifiedPracticeSession;
  error?: string;
}> {
  try {
    void serverLog(
      `Creating vocabulary practice session for user ${userId}`,
      'info',
      {
        config,
        practiceMode,
      },
    );

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

    // Get learning statuses based on practice mode
    const learningStatuses = getPracticeModeStatuses(practiceMode);

    // Get practice words with mode-specific filtering
    const words = await selectVocabularyPracticeWords(
      userId,
      config,
      baseLanguageCode,
      learningStatuses,
    );

    if (words.length === 0) {
      return {
        success: false,
        error: `No words available for ${getPracticeModeName(practiceMode)} practice`,
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

    // Enhance words with exercise types
    const userPreferences: {
      enabledExerciseTypes?: string[];
      skipRememberTranslation?: boolean;
      forceDifficulty?: number;
    } = {
      enabledExerciseTypes: enabledExerciseTypes,
    };

    const practiceWords = await enhanceWordsWithExerciseTypes(
      words.slice(0, config.wordsToStudy),
      userPreferences,
    );

    // Create unified session structure
    const unifiedSession: UnifiedPracticeSession = {
      sessionId: session.id,
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
        difficulty: config.difficulty ?? 2,
        adaptiveDifficulty:
          (vocabularySettings.adaptiveDifficulty as boolean) || false,
        pauseOnIncorrect:
          (vocabularySettings.pauseOnIncorrect as boolean) || false,
        showCorrectAnswer:
          (vocabularySettings.showCorrectAnswer as boolean) !== false,
      },
    };

    void serverLog(
      `Vocabulary practice session created: ${session.id}`,
      'info',
      {
        sessionId: session.id,
        practiceMode,
        learningStatuses,
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
    void serverLog(
      `Failed to create vocabulary practice session: ${errorMessage}`,
      'error',
      {
        userId,
        config,
        practiceMode,
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
 * Convert practice mode to learning statuses
 */
function getPracticeModeStatuses(mode: string): LearningStatus[] {
  switch (mode) {
    case 'learn-new':
      return [LearningStatus.notStarted];
    case 'continue-learning':
      return [LearningStatus.inProgress, LearningStatus.difficult];
    case 'refresh-vocabulary':
      return [LearningStatus.needsReview, LearningStatus.learned];
    case 'mix-mode':
      return [
        LearningStatus.notStarted,
        LearningStatus.inProgress,
        LearningStatus.difficult,
        LearningStatus.needsReview,
        LearningStatus.learned,
      ];
    default:
      // Default to mix mode if no mode specified
      return [
        LearningStatus.notStarted,
        LearningStatus.inProgress,
        LearningStatus.difficult,
        LearningStatus.needsReview,
        LearningStatus.learned,
      ];
  }
}

/**
 * Get practice mode display name
 */
function getPracticeModeName(mode: string): string {
  switch (mode) {
    case 'learn-new':
      return 'Learn New Words';
    case 'continue-learning':
      return 'Continue Learning';
    case 'refresh-vocabulary':
      return 'Refresh Vocabulary';
    case 'mix-mode':
      return 'Mix Mode';
    default:
      return 'Mixed Practice';
  }
}

/**
 * Select practice words based on mode and learning statuses
 */
async function selectVocabularyPracticeWords(
  userId: string,
  config: SessionConfiguration,
  baseLanguageCode: LanguageCode,
  learningStatuses: LearningStatus[],
): Promise<PracticeWord[]> {
  const whereClause: {
    userId: string;
    deletedAt: null;
    definitionId?: { in: number[] };
    id?: { in: string[] };
    learningStatus: { in: LearningStatus[] };
  } = {
    userId,
    deletedAt: null,
    learningStatus: { in: learningStatuses },
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
    const oneWordTranslation = oneWordLink?.word?.word ?? '';

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
      wordText: word?.word ?? '',
      definition: definitionData.content,
      oneWordTranslation,
      difficulty: userWord.srsLevel ?? 0,
      learningStatus: userWord.learningStatus,
      attempts: userWord.reviewCount ?? 0,
      correctAttempts: Math.round(
        ((userWord.reviewCount ?? 0) * (userWord.masteryScore ?? 0)) / 100,
      ),
      srsLevel: userWord.srsLevel ?? 0,
      imageUrl: userWord.definition.image?.url,
      imageId: userWord.definition.image?.id,
      imageDescription: userWord.definition.image?.description ?? undefined,
      partOfSpeech: wordDetail?.partOfSpeech ?? undefined,
      phonetic: wordDetail?.word?.phoneticGeneral ?? undefined,
      audioUrl: audioUrl ?? undefined, // Now properly populated from database
    };
  });

  return words;
}

/**
 * Enhance words with exercise types for vocabulary practice
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
  const enhancedWords = [];

  for (const word of words) {
    try {
      // Use progressive learning system for exercise type determination
      const progressiveResult = await determineExerciseTypeProgressive(
        word,
        userPreferences,
      );

      const exerciseType =
        progressiveResult.exerciseType ?? 'remember-translation';
      const reasoning = `Progressive learning level ${progressiveResult.currentLevel ?? 0}`;

      enhancedWords.push({
        ...word,
        exerciseType,
        reasoning,
      });
    } catch (error) {
      void serverLog(
        `Error determining exercise type for word ${word.wordText}`,
        'error',
        {
          error,
          wordId: word.userDictionaryId,
        },
      );

      // Fallback to remember-translation
      enhancedWords.push({
        ...word,
        exerciseType: 'remember-translation' as PracticeType,
        reasoning: 'Fallback due to error',
      });
    }
  }

  return enhancedWords;
}
