'use server';

import { LanguageCode, LearningStatus, PartOfSpeech } from '@prisma/client';
import { prisma } from '@/core/shared/database/client';

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
              imageUrl: definition.image?.url || null,
              hasAudio: !!audio,
              audioUrl: audio?.url || null,
              exampleCount: definition.examples.length,
              isInUserDictionary: !!userDictEntry,
              userDictionaryId: userDictEntry?.id || null,
              userLearningStatus: userDictEntry?.learningStatus || null,
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
    console.error('Error searching words:', error);
    throw new Error('Failed to search words');
  }
}

/**
 * Add a specific definition to user's dictionary
 */
export async function addDefinitionToUserDictionary(
  userId: string,
  definitionId: number,
  baseLanguageCode: LanguageCode,
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
        baseLanguageCode,
        targetLanguageCode,
        learningStatus: LearningStatus.notStarted,
        progress: 0,
        reviewCount: 0,
        timeWordWasStartedToLearn: new Date(),
      },
    });

    return { success: true, data: newEntry, isNew: true };
  } catch (error) {
    console.error('Error adding definition to user dictionary:', error);
    throw new Error('Failed to add word to dictionary');
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
