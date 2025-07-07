'use server';

import { PrismaClient } from '@prisma/client';
import { LanguageCode, LearningStatus } from '@/core/types';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { PracticeType, getPracticeTypeConfigs } from './practice-types';
import {
  generateSimilarWord,
  isWordSimilarEnough,
} from '../utils/practice-game-utils';

// Re-export for other modules
export { generateSimilarWord, isWordSimilarEnough };

const prisma = new PrismaClient();

/**
 * Generate distractor options for multiple choice exercises
 */
export async function generateDistractorOptions(
  correctWord: string,
  targetLanguageCode: LanguageCode,
  baseLanguageCode: LanguageCode,
  partOfSpeech?: string,
): Promise<string[]> {
  try {
    // Get 3 distractor words from database
    const distractors = await prisma.word.findMany({
      where: {
        languageCode: targetLanguageCode,
        word: { not: correctWord },
        ...(partOfSpeech && {
          details: {
            some: {
              partOfSpeech:
                partOfSpeech as import('@prisma/client').PartOfSpeech,
            },
          },
        }),
      },
      take: 15, // Get more to have variety
      orderBy: { frequencyGeneral: 'desc' },
    });

    const distractorWords = distractors
      .map((w) => w.word)
      .filter((word) => word !== correctWord)
      .slice(0, 3);

    // Fill with generated similar words if not enough
    while (distractorWords.length < 3) {
      const generated = generateSimilarWord(correctWord, [
        ...distractorWords,
        correctWord,
      ]);
      if (!distractorWords.includes(generated)) {
        distractorWords.push(generated);
      }
    }

    return distractorWords;
  } catch (error) {
    serverLog('Error generating distractor options', 'error', { error });
    // Fallback to generated similar words
    return [
      generateSimilarWord(correctWord, [correctWord]),
      generateSimilarWord(correctWord, [correctWord]),
      generateSimilarWord(correctWord, [correctWord]),
    ];
  }
}

/**
 * Generate character pool for make-up-word game
 */
export async function generateCharacterPool(
  targetWord: string,
  extraCharacters: number = 4,
): Promise<string[]> {
  const wordChars = targetWord.toLowerCase().split('');
  const extraChars = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .filter((char) => !wordChars.includes(char))
    .sort(() => Math.random() - 0.5)
    .slice(0, extraCharacters);

  return [...wordChars, ...extraChars].sort(() => Math.random() - 0.5);
}

/**
 * Determine if a word is new for the user
 */
export async function isNewWordForUser(
  learningStatus: LearningStatus,
  attempts: number,
  correctAttempts: number,
): Promise<boolean> {
  // A word is considered "new" if:
  // 1. Learning status is notStarted
  // 2. Has very few attempts (less than 3)
  // 3. Low success rate (less than 50%)
  return (
    learningStatus === LearningStatus.notStarted ||
    attempts < 3 ||
    (attempts > 0 && correctAttempts / attempts < 0.5)
  );
}

/**
 * Calculate maximum attempts based on practice type and word complexity
 */
export async function calculateMaxAttempts(
  practiceType: PracticeType,
  isPhrase: boolean = false,
): Promise<number> {
  const configs = await getPracticeTypeConfigs();
  const config = configs[practiceType];

  if (isPhrase && 'maxAttemptsPhrase' in config && config.maxAttemptsPhrase) {
    return config.maxAttemptsPhrase;
  }

  return config.maxAttempts;
}
