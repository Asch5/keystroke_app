'use server';

import { prisma } from '@/lib/prisma';
import { Word } from '@/types/word';

/**
 * Server action to fetch dictionary words
 * This provides a secure way to access the database from the client
 */
export async function fetchDictionaryWords(
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

        // Transform to match Word type
        return entries.map((entry) => ({
            id: entry.id || '',
            text: entry.word?.word || '', // Access word through relation
            translation: entry.descriptionBase || '',
            languageId: entry.targetLanguageId || '',
            category: entry.partOfSpeech || '',
            difficulty: mapDifficultyLevel(entry.difficultyLevel),
            audioUrl: entry.audioId ? `/api/audio/${entry.audioId}` : '',
            exampleSentence: entry.descriptionTarget || '',
        }));
    } catch (error) {
        console.error('Error fetching dictionary words:', error);
        throw new Error('Failed to fetch dictionary words');
    }
}

// Helper function to map difficulty levels
function mapDifficultyLevel(level?: string): 'easy' | 'medium' | 'hard' {
    if (!level) return 'medium';

    // Map CEFR levels to our difficulty scale
    if (['A1', 'A2'].includes(level)) return 'easy';
    if (['B1', 'B2'].includes(level)) return 'medium';
    return 'hard'; // C1, C2 or unknown
}
