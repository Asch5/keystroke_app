'use server';

import { prisma } from '@/lib/prisma';
import { Word } from '@/types/word';
import { LanguageCode, Prisma } from '@prisma/client';

/**
 * Server action to fetch dictionary words
 * This provides a secure way to access the database from the client
 */
export async function fetchDictionaryWords(
    targetLanguageId: string,
): Promise<Word[]> {
    try {
        const entries = await prisma.word.findMany({
            where: {
                languageCode: targetLanguageId as LanguageCode,
            },
            include: {
                wordDefinitions: {
                    include: {
                        definition: {
                            include: {
                                examples: true,
                            },
                        },
                    },
                },
            },
        });

        // Define a type for the Word with relations, ensuring all nested includes are typed
        type WordWithRelations = Prisma.WordGetPayload<{
            include: {
                wordDefinitions: {
                    include: {
                        definition: {
                            include: { examples: true };
                        };
                    };
                };
            };
        }>;

        // Transform to match Word type
        return (entries as WordWithRelations[]).map((entry) => ({
            id: String(entry.id),
            text: entry.word || '',
            translation:
                entry.wordDefinitions?.[0]?.definition?.definition || '',
            languageId: entry.languageCode,
            category:
                entry.wordDefinitions?.[0]?.definition?.partOfSpeech || '',
            difficulty: mapDifficultyLevel(entry.difficultyLevel.toString()),
            audioUrl: entry.audio || '',
            exampleSentence:
                entry.wordDefinitions?.[0]?.definition?.examples?.[0]
                    ?.example || '',
        }));
    } catch (error) {
        console.error('Error fetching dictionary words:', error);
        throw new Error('Failed to fetch dictionary words');
    }
}

// Helper function to map difficulty levels (assuming input might be enum name)
function mapDifficultyLevel(level?: string): 'easy' | 'medium' | 'hard' {
    if (!level) return 'medium';

    // Map CEFR levels to our difficulty scale
    if (['A1', 'A2'].includes(level)) return 'easy';
    if (['B1', 'B2'].includes(level)) return 'medium';
    return 'hard'; // C1, C2 or unknown
}

/**
 * Server action to add a word to user's dictionary
 */
export async function addWordToUserDictionary(
    userId: string,
    mainDictionaryId: string,
    baseLanguageId: string,
    targetLanguageId: string,
) {
    try {
        const userDictionary = await prisma.userDictionary.upsert({
            where: {
                userId_definitionId: {
                    userId,
                    definitionId: parseInt(mainDictionaryId),
                },
            },
            update: {},
            create: {
                userId,
                definitionId: parseInt(mainDictionaryId),
                baseLanguageCode: baseLanguageId as LanguageCode,
                targetLanguageCode: targetLanguageId as LanguageCode,
                learningStatus: 'notStarted',
                progress: 0,
                isModified: false,
                reviewCount: 0,
                timeWordWasStartedToLearn: new Date(),
                jsonbData: {},
                customDifficultyLevel: null,
            },
        });

        return userDictionary;
    } catch (error) {
        console.error('Error adding word to user dictionary:', error);
        throw new Error('Failed to add word to user dictionary');
    }
}
