'use server';

import { cache } from 'react';
import { prisma } from '@/core/shared/database/client';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import {
  LearningStatus,
  LanguageCode,
  DifficultyLevel,
  PartOfSpeech,
  Gender,
} from '@/core/types';
import { getUserLanguageConfig } from '../utils/language-helpers';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

/**
 * Interface for user dictionary item with comprehensive learning data
 */
export interface UserDictionaryItem {
  id: string;
  userId: string;
  definitionId: number;
  word: string;
  wordId: number;
  partOfSpeech: PartOfSpeech;
  variant: string | null;
  gender: Gender | null;
  phonetic: string | null;
  forms: string | null;
  definition: string;
  imageUrl: string | null;
  audioUrl: string | null;

  // Learning progress
  learningStatus: LearningStatus;
  progress: number;
  masteryScore: number;
  reviewCount: number;
  correctStreak: number;
  amountOfMistakes: number;

  // Timestamps
  lastReviewedAt: Date | null;
  timeWordWasStartedToLearn: Date | null;
  timeWordWasLearned: Date | null;
  nextReviewDue: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // SRS data
  srsLevel: number;
  srsInterval: number;
  nextSrsReview: Date | null;
  lastSrsSuccess: boolean | null;

  // User customizations
  customDefinitionBase: string | null;
  customDefinitionTarget: string | null;
  customPhonetic: string | null;
  customNotes: string | null;
  customTags: string[];
  customDifficultyLevel: DifficultyLevel | null;
  isFavorite: boolean;
  isModified: boolean;

  // Languages
  baseLanguageCode: LanguageCode;
  targetLanguageCode: LanguageCode;

  // Lists this word belongs to
  lists: string[];

  // Translation data
  translations: Array<{
    id: number;
    languageCode: LanguageCode;
    content: string;
  }>;
  oneWordTranslation?: string | null; // Translation from DefinitionToOneWord
}

/**
 * Filter options for user dictionary
 */
export interface UserDictionaryFilters {
  learningStatus?: LearningStatus[];
  searchQuery?: string;
  partOfSpeech?: PartOfSpeech[];
  difficultyLevel?: DifficultyLevel[];
  isFavorite?: boolean;
  isModified?: boolean;
  needsReview?: boolean;
  sortBy?:
    | 'word'
    | 'progress'
    | 'lastReviewedAt'
    | 'masteryScore'
    | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Response type for paginated user dictionary
 */
export interface UserDictionaryResponse {
  items: UserDictionaryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Get user's dictionary words with filtering and pagination
 */
export const getUserDictionary = cache(
  async (
    userId: string,
    filters: UserDictionaryFilters = {},
  ): Promise<UserDictionaryResponse> => {
    try {
      const {
        learningStatus,
        searchQuery,
        isFavorite,
        isModified,
        needsReview,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        pageSize = 20,
      } = filters;

      // Get user's language configuration
      const userLanguageConfig = await getUserLanguageConfig(userId);

      // Build basic where conditions
      const whereConditions = {
        userId,
        deletedAt: null,
        ...(learningStatus &&
          learningStatus.length > 0 && {
            learningStatus: { in: learningStatus },
          }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(isModified !== undefined && { isModified }),
        ...(needsReview && { nextReviewDue: { lte: new Date() } }),
        ...(searchQuery && {
          OR: [
            // Primary search: exact word text match (highest priority)
            {
              definition: {
                wordDetails: {
                  some: {
                    wordDetails: {
                      word: {
                        word: {
                          startsWith: searchQuery,
                          mode: 'insensitive' as const,
                        },
                      },
                    },
                  },
                },
              },
            },
            // Secondary search: partial word text match
            {
              definition: {
                wordDetails: {
                  some: {
                    wordDetails: {
                      word: {
                        word: {
                          contains: searchQuery,
                          mode: 'insensitive' as const,
                        },
                      },
                    },
                  },
                },
              },
            },
            // Search in word variant/forms
            {
              definition: {
                wordDetails: {
                  some: {
                    wordDetails: {
                      OR: [
                        {
                          variant: {
                            contains: searchQuery,
                            mode: 'insensitive' as const,
                          },
                        },
                        {
                          forms: {
                            contains: searchQuery,
                            mode: 'insensitive' as const,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
            // Search in custom user fields (user-specific content only)
            {
              customDefinitionBase: {
                contains: searchQuery,
                mode: 'insensitive' as const,
              },
            },
            {
              customDefinitionTarget: {
                contains: searchQuery,
                mode: 'insensitive' as const,
              },
            },
            {
              customNotes: {
                contains: searchQuery,
                mode: 'insensitive' as const,
              },
            },
          ],
        }),
      };

      // Build order by
      let orderBy;
      if (sortBy === 'word') {
        // For word sorting, we need to sort by the actual word text from the related Definition
        // Since we can't easily sort by nested relations in Prisma, we'll sort after fetching
        orderBy = { createdAt: sortOrder }; // Default sort for now, will sort by word after fetching
      } else {
        orderBy = { [sortBy]: sortOrder };
      }

      // Calculate offset
      const offset = (page - 1) * pageSize;

      // Get total count
      const totalCount = await prisma.userDictionary.count({
        where: whereConditions,
      });

      // Get paginated results with lists included
      const userDictionaryEntries = await prisma.userDictionary.findMany({
        where: whereConditions,
        include: {
          definition: {
            include: {
              image: true,
              translationLinks: {
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
          userListWords: {
            include: {
              userList: {
                include: {
                  list: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy,
        skip: offset,
        take: pageSize,
      });

      // Get word data for all definitions in a separate query
      const definitionIds = userDictionaryEntries.map(
        (entry) => entry.definitionId,
      );
      const wordDataMap = new Map<
        number,
        {
          word: string;
          partOfSpeech: PartOfSpeech;
          variant: string | null;
          wordId: number;
          audioUrl: string | null;
        }
      >();

      if (definitionIds.length > 0) {
        const wordDefinitions = await prisma.wordDefinition.findMany({
          where: {
            definitionId: { in: definitionIds },
          },
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
        });

        // Build a map of definitionId -> word data
        wordDefinitions.forEach((wd) => {
          if (!wordDataMap.has(wd.definitionId)) {
            // Get primary audio URL if available
            const primaryAudio =
              wd.wordDetails.audioLinks.find((link) => link.isPrimary)?.audio
                ?.url || null;

            wordDataMap.set(wd.definitionId, {
              word: wd.wordDetails.word.word,
              partOfSpeech: wd.wordDetails.partOfSpeech,
              variant: wd.wordDetails.variant,
              wordId: wd.wordDetails.word.id,
              audioUrl: primaryAudio,
            });
          }
        });
      }

      // Transform to UserDictionaryItem with complete data
      let items: UserDictionaryItem[] = userDictionaryEntries.map((entry) => {
        const wordData = wordDataMap.get(entry.definitionId);

        // Extract lists this word belongs to
        const lists: string[] =
          entry.userListWords?.map((userListWord) => {
            // Use custom list name if available, otherwise use the original list name
            const listName =
              userListWord.userList?.customNameOfList ||
              userListWord.userList?.list?.name;
            return listName || 'Unnamed List';
          }) || [];

        return {
          id: entry.id,
          userId: entry.userId,
          definitionId: entry.definitionId,
          word: wordData?.word || 'Unknown Word',
          wordId: wordData?.wordId || 0,
          partOfSpeech: wordData?.partOfSpeech || PartOfSpeech.undefined,
          variant: wordData?.variant || null,
          gender: null, // TODO: Get from actual word data
          phonetic: null, // TODO: Get from actual word data
          forms: null, // TODO: Get from actual word data
          definition: entry.definition.definition,
          imageUrl: entry.definition.image?.url || null,
          audioUrl: wordData?.audioUrl || null, // Now properly getting audio URL from database

          // Learning progress
          learningStatus: entry.learningStatus,
          progress: entry.progress,
          masteryScore: entry.masteryScore,
          reviewCount: entry.reviewCount,
          correctStreak: entry.correctStreak,
          amountOfMistakes: entry.amountOfMistakes,

          // Timestamps
          lastReviewedAt: entry.lastReviewedAt,
          timeWordWasStartedToLearn: entry.timeWordWasStartedToLearn,
          timeWordWasLearned: entry.timeWordWasLearned,
          nextReviewDue: entry.nextReviewDue,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,

          // SRS data
          srsLevel: entry.srsLevel,
          srsInterval: entry.srsInterval,
          nextSrsReview: entry.nextSrsReview,
          lastSrsSuccess: entry.lastSrsSuccess,

          // User customizations
          customDefinitionBase: entry.customDefinitionBase,
          customDefinitionTarget: entry.customDefinitionTarget,
          customPhonetic: entry.customPhonetic,
          customNotes: entry.customNotes,
          customTags: entry.customTags,
          customDifficultyLevel: entry.customDifficultyLevel,
          isFavorite: entry.isFavorite,
          isModified: entry.isModified,

          // Languages (both come from User now)
          baseLanguageCode: userLanguageConfig.baseLanguageCode,
          targetLanguageCode: userLanguageConfig.targetLanguageCode,

          // Lists this word belongs to
          lists,

          // Translation data
          translations:
            entry.definition.translationLinks?.map((tl) => ({
              id: tl.translation.id,
              languageCode: tl.translation.languageCode,
              content: tl.translation.content,
            })) || [],
          oneWordTranslation: (() => {
            // Find DefinitionToOneWord translation that matches user's base language
            const matchingOneWordLink = entry.definition.oneWordLinks?.find(
              (link) =>
                link.word.languageCode === userLanguageConfig.baseLanguageCode,
            );

            // Only return DefinitionToOneWord match, never fall back to DefinitionTranslation
            return matchingOneWordLink?.word?.word || null;
          })(),
        };
      });

      // Apply word sorting if needed (since we can't sort by nested relations in Prisma directly)
      if (sortBy === 'word') {
        items = items.sort((a, b) => {
          const comparison = a.word.localeCompare(b.word);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }

      // Calculate pagination data
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        totalCount,
        page,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    } catch (error) {
      await serverLog('Error fetching user dictionary', 'error', error);
      return {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
  },
);

/**
 * Update learning status for a word in user's dictionary
 */
export async function updateWordLearningStatus(
  userId: string,
  userDictionaryId: string,
  learningStatus: LearningStatus,
  additionalData?: {
    progress?: number;
    masteryScore?: number;
    nextReviewDue?: Date;
  },
) {
  try {
    const updateData = {
      learningStatus,
      lastReviewedAt: new Date(),
      reviewCount: { increment: 1 },
      updatedAt: new Date(),
      ...(additionalData?.progress !== undefined && {
        progress: additionalData.progress,
      }),
      ...(additionalData?.masteryScore !== undefined && {
        masteryScore: additionalData.masteryScore,
      }),
      ...(additionalData?.nextReviewDue && {
        nextReviewDue: additionalData.nextReviewDue,
      }),
      ...(learningStatus === LearningStatus.learned && {
        timeWordWasLearned: new Date(),
      }),
    };

    // Check if we need to set start time for inProgress status
    if (learningStatus === LearningStatus.inProgress) {
      const existingEntry = await prisma.userDictionary.findUnique({
        where: { id: userDictionaryId },
      });

      if (existingEntry && !existingEntry.timeWordWasStartedToLearn) {
        Object.assign(updateData, { timeWordWasStartedToLearn: new Date() });
      }
    }

    const updatedEntry = await prisma.userDictionary.update({
      where: {
        id: userDictionaryId,
        userId: userId,
      },
      data: updateData,
    });

    return { success: true, data: updatedEntry };
  } catch (error) {
    await serverLog('Error updating word learning status', 'error', error);
    throw new Error(
      handlePrismaError(error).message || 'Failed to update learning status',
    );
  }
}

/**
 * Add word to favorites
 */
export async function toggleWordFavorite(
  userId: string,
  userDictionaryId: string,
) {
  try {
    const currentEntry = await prisma.userDictionary.findUnique({
      where: { id: userDictionaryId, userId },
    });

    if (!currentEntry) {
      throw new Error('Word not found in user dictionary');
    }

    const updatedEntry = await prisma.userDictionary.update({
      where: { id: userDictionaryId, userId },
      data: {
        isFavorite: !currentEntry.isFavorite,
        updatedAt: new Date(),
      },
    });

    return { success: true, data: updatedEntry };
  } catch (error) {
    await serverLog('Error toggling word favorite', 'error', error);
    throw new Error(
      handlePrismaError(error).message || 'Failed to toggle favorite',
    );
  }
}

/**
 * Update user's custom word data
 */
export async function updateUserWordCustomData(
  userId: string,
  userDictionaryId: string,
  customData: {
    customDefinitionBase?: string;
    customDefinitionTarget?: string;
    customPhonetic?: string;
    customNotes?: string;
    customTags?: string[];
    customDifficultyLevel?: DifficultyLevel;
  },
) {
  try {
    const updatedEntry = await prisma.userDictionary.update({
      where: {
        id: userDictionaryId,
        userId: userId,
      },
      data: {
        ...customData,
        isModified: true,
        updatedAt: new Date(),
      },
    });

    return { success: true, data: updatedEntry };
  } catch (error) {
    await serverLog('Error updating user word custom data', 'error', error);
    throw new Error(
      handlePrismaError(error).message || 'Failed to update custom data',
    );
  }
}

/**
 * Remove word from user's dictionary (soft delete)
 */
export async function removeWordFromUserDictionary(
  userId: string,
  userDictionaryId: string,
) {
  try {
    const deletedEntry = await prisma.userDictionary.update({
      where: {
        id: userDictionaryId,
        userId: userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return { success: true, data: deletedEntry };
  } catch (error) {
    await serverLog('Error removing word from user dictionary', 'error', error);
    throw new Error(
      handlePrismaError(error).message ||
        'Failed to remove word from dictionary',
    );
  }
}

/**
 * Get user dictionary statistics
 */
export const getUserDictionaryStats = cache(async (userId: string) => {
  try {
    const stats = await prisma.userDictionary.groupBy({
      by: ['learningStatus'],
      where: {
        userId,
        deletedAt: null,
      },
      _count: {
        learningStatus: true,
      },
    });

    const totalWords = await prisma.userDictionary.count({
      where: { userId, deletedAt: null },
    });

    const favoriteWords = await prisma.userDictionary.count({
      where: { userId, isFavorite: true, deletedAt: null },
    });

    const wordsNeedingReview = await prisma.userDictionary.count({
      where: {
        userId,
        nextReviewDue: { lte: new Date() },
        deletedAt: null,
      },
    });

    // Calculate average mastery score
    const masteryStats = await prisma.userDictionary.aggregate({
      where: { userId, deletedAt: null },
      _avg: { masteryScore: true },
    });

    return {
      totalWords,
      favoriteWords,
      wordsNeedingReview,
      averageMasteryScore: masteryStats._avg.masteryScore || 0,
      statusBreakdown: stats.reduce(
        (acc, stat) => {
          acc[stat.learningStatus] = stat._count.learningStatus;
          return acc;
        },
        {} as Record<LearningStatus, number>,
      ),
    };
  } catch (error) {
    console.error('Error fetching user dictionary stats:', error);
    return handlePrismaError(error);
  }
});
