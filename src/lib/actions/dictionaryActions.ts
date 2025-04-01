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
            audioUrl: entry.word?.audio || '',
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
                userId_mainDictionaryId: {
                    userId,
                    mainDictionaryId,
                },
            },
            update: {}, // If it exists, do nothing
            create: {
                userId,
                mainDictionaryId,
                baseLanguageId,
                targetLanguageId,
                isLearned: false,
                isNeedsReview: false,
                isDifficultToLearn: false,
                isModified: false,
                reviewCount: 0,
                progress: 0,
                timeWordWasStartedToLearn: new Date(),
                jsonbData: {},
                customOneWordDefinition: '',
                customDifficultyLevel: null,
            },
        });

        return userDictionary;
    } catch (error) {
        console.error('Error adding word to user dictionary:', error);
        throw new Error('Failed to add word to user dictionary');
    }
}

export interface MerriamWebsterResponse {
    meta: {
        id: string;
        uuid: string;
        src: string;
        section: string;
        stems: string[];
        offensive: boolean;
    };
    hwi: {
        hw: string;
        prs?: Array<{
            mw: string;
            sound: {
                audio: string;
            };
        }>;
    };
    fl?: string;
    def?: Array<{
        sseq: Array<
            Array<
                [
                    string,
                    {
                        dt: Array<[string, string]>;
                        sls?: string[];
                    },
                ]
            >
        >;
    }>;
    et?: Array<[string, string]>;
}

export type StateMerriamWebster =
    | {
          message: string;
          errors: Record<string, never>;
          data: MerriamWebsterResponse;
      }
    | {
          message: null;
          errors: {
              word: string[];
          };
          data?: never;
      };

export async function getWordFromMerriamWebster(
    _prevState: StateMerriamWebster,
    formData: FormData,
): Promise<StateMerriamWebster> {
    const word = formData.get('word');
    const dictionaryType = formData.get('dictionaryType');

    if (!word || typeof word !== 'string') {
        return {
            message: null,
            errors: {
                word: ['Word is required'],
            },
        };
    }

    try {
        const API_KEY =
            dictionaryType === 'intermediate'
                ? process.env.DICTIONARY_INTERMEDIATE_API_KEY
                : process.env.DICTIONARY_LEARNERS_API_KEY;

        if (!API_KEY) {
            return {
                message: null,
                errors: {
                    word: ['API key is not configured'],
                },
            };
        }

        const dictionaryPath =
            dictionaryType === 'intermediate' ? 'sd3' : 'learners';
        const response = await fetch(
            `https://www.dictionaryapi.com/api/v3/references/${dictionaryPath}/json/${encodeURIComponent(word)}?key=${API_KEY}`,
        );

        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
            const errorText = await response.text();
            return {
                message: null,
                errors: {
                    word: [`API request failed: ${errorText}`],
                },
            };
        }

        const data = await response.json();

        // Handle case where API returns suggestions instead of definitions
        if (
            Array.isArray(data) &&
            data.length > 0 &&
            typeof data[0] === 'string'
        ) {
            return {
                message: null,
                errors: {
                    word: [
                        'Word not found. Did you mean: ' +
                            data.slice(0, 3).join(', '),
                    ],
                },
            };
        }

        // Handle case where no results are found
        if (!data || data.length === 0) {
            return {
                message: null,
                errors: {
                    word: ['No results found for this word'],
                },
            };
        }

        // Return the first definition
        return {
            message: 'Success',
            data: data[0],
            errors: {},
        };
    } catch (error) {
        console.error('Error fetching word:', error);
        return {
            message: null,
            errors: {
                word: ['Failed to fetch word definition'],
            },
        };
    }
}
