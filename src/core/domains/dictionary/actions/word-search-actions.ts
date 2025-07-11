'use server';

import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/shared/database/client';
import { LanguageCode, LearningStatus, PartOfSpeech } from '@/core/types';
import { getBestDefinitionForUser } from '../utils/translation-utils';

/**
 * Interface for search results grouped by word
 */
export interface WordSearchResult {
  wordId: number;
  wordText: string;
  phoneticGeneral: string | null;
  frequencyGeneral: number | null;
  languageCode: LanguageCode;
  definitions: WordDefinitionResult[];
}

export interface WordDefinitionResult {
  id: number;
  definitionId: number;
  definition: string;
  partOfSpeech: PartOfSpeech;
  variant: string | null;
  phonetic: string | null;
  frequency: number | null;
  source: string;
  hasImage: boolean;
  imageUrl: string | null;
  hasAudio: boolean;
  audioUrl: string | null;
  exampleCount: number;
  isInUserDictionary?: boolean;
  userDictionaryId?: string | null;
  userLearningStatus?: LearningStatus | null;
  // Translation-related fields
  translations?: Array<{
    id: number;
    languageCode: LanguageCode;
    content: string;
  }>;
  displayDefinition?: string; // The definition to display (could be translation)
  isTranslation?: boolean; // Whether displayDefinition is a translation
  originalDefinition?: string | undefined; // Original definition when showing translation
}

/**
 * Search words in the database
 */
export async function searchWords(
  searchQuery: string,
  languageCode: LanguageCode,
  userId?: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<{
  results: WordSearchResult[];
  totalCount: number;
  totalPages: number;
}> {
  try {
    if (!searchQuery.trim()) {
      return { results: [], totalCount: 0, totalPages: 0 };
    }

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // First, find matching words
    const whereConditions = {
      languageCode,
      word: {
        contains: searchQuery.trim(),
        mode: 'insensitive' as const,
      },
    };

    // Get total count for pagination
    const totalCount = await prisma.word.count({
      where: whereConditions,
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    // Find words with their details and definitions
    const words = await prisma.word.findMany({
      where: whereConditions,
      include: {
        details: {
          include: {
            definitions: {
              include: {
                definition: {
                  include: {
                    image: true,
                    examples: {
                      select: { id: true },
                    },
                    translationLinks: {
                      include: {
                        translation: true,
                      },
                    },
                  },
                },
              },
            },
            audioLinks: {
              where: { isPrimary: true },
              include: { audio: true },
              take: 1,
            },
          },
          orderBy: [{ partOfSpeech: 'asc' }, { variant: 'asc' }],
        },
      },
      orderBy: [{ frequencyGeneral: 'asc' }, { word: 'asc' }],
      skip: offset,
      take: pageSize,
    });

    // Get user dictionary entries if userId provided
    const userDictEntries = userId
      ? await prisma.userDictionary.findMany({
          where: {
            userId,
            definitionId: {
              in: words.flatMap((word) =>
                word.details.flatMap((detail) =>
                  detail.definitions.map((def) => def.definition.id),
                ),
              ),
            },
            deletedAt: null,
          },
          select: {
            id: true,
            definitionId: true,
            learningStatus: true,
          },
        })
      : [];

    // Transform the results
    const results: WordSearchResult[] = words.map((word) => {
      const definitions: WordDefinitionResult[] = word.details.flatMap(
        (detail) =>
          detail.definitions.map((defJunction) => {
            const definition = defJunction.definition;
            const audio = detail.audioLinks[0]?.audio;

            // Find if this definition is in user's dictionary
            const userDictEntry = userDictEntries.find(
              (entry) => entry.definitionId === definition.id,
            );

            return {
              id: detail.id,
              definitionId: definition.id,
              definition: definition.definition,
              partOfSpeech: detail.partOfSpeech,
              variant: detail.variant,
              phonetic: detail.phonetic,
              frequency: detail.frequency,
              source: detail.source,
              hasImage: !!definition.image,
              imageUrl: definition.image?.url ?? null,
              hasAudio: !!audio,
              audioUrl: audio?.url ?? null,
              exampleCount: definition.examples.length,
              isInUserDictionary: !!userDictEntry,
              userDictionaryId: userDictEntry?.id ?? null,
              userLearningStatus: userDictEntry?.learningStatus ?? null,
              translations: definition.translationLinks.map((tl) => ({
                id: tl.translation.id,
                languageCode: tl.translation.languageCode,
                content: tl.translation.content,
              })),
            };
          }),
      );

      return {
        wordId: word.id,
        wordText: word.word,
        phoneticGeneral: word.phoneticGeneral,
        frequencyGeneral: word.frequencyGeneral,
        languageCode: word.languageCode,
        definitions,
      };
    });

    return {
      results,
      totalCount,
      totalPages,
    };
  } catch (error) {
    await serverLog('Error searching words', 'error', error);
    throw new Error('Failed to search words');
  }
}

/**
 * Add a specific definition to user's dictionary
 */
export async function addDefinitionToUserDictionary(
  userId: string,
  definitionId: number,
  targetLanguageCode: LanguageCode,
) {
  try {
    // Check if definition already exists in user's dictionary
    const existingEntry = await prisma.userDictionary.findUnique({
      where: {
        userId_definitionId: {
          userId,
          definitionId,
        },
      },
    });

    if (existingEntry) {
      // If soft deleted, restore it
      if (existingEntry.deletedAt) {
        const restoredEntry = await prisma.userDictionary.update({
          where: {
            userId_definitionId: {
              userId,
              definitionId,
            },
          },
          data: {
            deletedAt: null,
            updatedAt: new Date(),
          },
        });
        return { success: true, data: restoredEntry, isRestored: true };
      }

      // Already exists and not deleted
      return {
        success: false,
        error: 'Definition already exists in your dictionary',
      };
    }

    // Create new entry
    const newEntry = await prisma.userDictionary.create({
      data: {
        userId,
        definitionId,
        targetLanguageCode,
        learningStatus: LearningStatus.notStarted,
        progress: 0,
        reviewCount: 0,
        timeWordWasStartedToLearn: new Date(),
      },
    });

    return { success: true, data: newEntry, isNew: true };
  } catch (error) {
    await serverLog(
      'Error adding definition to user dictionary',
      'error',
      error,
    );
    throw new Error('Failed to add definition to user dictionary');
  }
}

/**
 * Remove definition from user's dictionary (soft delete)
 */
export async function removeDefinitionFromUserDictionary(
  userId: string,
  userDictionaryId: string,
) {
  try {
    const deletedEntry = await prisma.userDictionary.update({
      where: {
        id: userDictionaryId,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return { success: true, data: deletedEntry };
  } catch (error) {
    console.error('Error removing definition from user dictionary:', error);
    throw new Error('Failed to remove word from dictionary');
  }
}

/**
 * Search words with user-specific display preferences (using native language translations when available)
 */
export async function searchWordsForUser(
  searchQuery: string,
  languageCode: LanguageCode,
  userId: string,
  userNativeLanguage: LanguageCode,
  page: number = 1,
  pageSize: number = 10,
): Promise<{
  results: WordSearchResult[];
  totalCount: number;
  totalPages: number;
}> {
  try {
    // First get the basic search results with translations
    const searchResults = await searchWords(
      searchQuery,
      languageCode,
      userId,
      page,
      pageSize,
    );

    // Apply translation logic to each definition
    const processedResults: WordSearchResult[] = searchResults.results.map(
      (word) => ({
        ...word,
        definitions: word.definitions.map((definition) => {
          const bestDefinition = getBestDefinitionForUser(
            definition.definition,
            languageCode,
            definition.translations ?? [],
            userNativeLanguage,
          );

          return {
            ...definition,
            displayDefinition: bestDefinition.content,
            isTranslation: bestDefinition.isTranslation,
            originalDefinition: bestDefinition.originalDefinition,
          };
        }),
      }),
    );

    return {
      results: processedResults,
      totalCount: searchResults.totalCount,
      totalPages: searchResults.totalPages,
    };
  } catch (error) {
    console.error('Error searching words for user:', error);
    throw new Error('Failed to search words with user preferences');
  }
}

/**
 * Check if definitions are already in user's dictionary
 */
export async function checkDefinitionsInUserDictionary(
  userId: string,
  definitionIds: number[],
): Promise<Record<number, { exists: boolean; userDictionaryId?: string }>> {
  try {
    const userDictEntries = await prisma.userDictionary.findMany({
      where: {
        userId,
        definitionId: { in: definitionIds },
        deletedAt: null,
      },
      select: {
        id: true,
        definitionId: true,
      },
    });

    const result: Record<
      number,
      { exists: boolean; userDictionaryId?: string }
    > = {};

    // Initialize all definitions as not existing
    definitionIds.forEach((id) => {
      result[id] = { exists: false };
    });

    // Mark existing ones
    userDictEntries.forEach((entry) => {
      result[entry.definitionId] = {
        exists: true,
        userDictionaryId: entry.id,
      };
    });

    return result;
  } catch (error) {
    console.error('Error checking definitions in user dictionary:', error);
    // Return all as non-existing if there's an error
    const result: Record<
      number,
      { exists: boolean; userDictionaryId?: string }
    > = {};
    definitionIds.forEach((id) => {
      result[id] = { exists: false };
    });
    return result;
  }
}
