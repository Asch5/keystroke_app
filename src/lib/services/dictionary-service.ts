import { Word } from '@/types/word';
import { prisma } from '@/lib/prisma';

/**
 * Fetches dictionary words based on target language ID
 *
 * @param targetLanguageId - The ID of the target language
 * @param baseLanguageId - The ID of the base language for translations
 * @returns An array of Word objects
 */
//list of services for dictionary-related operations using Prisma:
//1. Get dictionary words
//2. Map difficulty level

export async function getDictionaryWords(
  targetLanguageId: string,
  baseLanguageId: string | null,
): Promise<Word[]> {
  try {
    // Query mainDictionary table instead
    const entries = await prisma.mainDictionary.findMany({
      where: {
        targetLanguageId: targetLanguageId || '',
        baseLanguageId: baseLanguageId || '',
      },
      include: {
        word: true,
      },
    });

    // Transform data to match Word type
    return entries.map((entry) => ({
      id: entry.id || '',
      text: entry.word?.word || '',
      translation: entry.descriptionBase || '',
      languageId: entry.targetLanguageId || '',
      category: entry.partOfSpeech || '',
      difficulty: mapDifficultyLevel(entry.difficultyLevel),
      audioUrl: entry.word?.audio || '',
      exampleSentence: entry.descriptionTarget || '',
    }));
  } catch (error) {
    console.error('Error fetching dictionary words:', error);
    throw new Error('Failed to fetch dictionary words');
  }
}

// Add helper function
function mapDifficultyLevel(level?: string): 'easy' | 'medium' | 'hard' {
  if (!level) return 'medium';
  if (['A1', 'A2'].includes(level)) return 'easy';
  if (['B1', 'B2'].includes(level)) return 'medium';
  return 'hard';
}
