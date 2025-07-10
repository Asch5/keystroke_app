'use server';

import { prisma } from '@/core/shared/database/client';
import { LanguageCode, DifficultyLevel } from '@/core/types';
import { UserListWhereInput } from '@/core/types/prisma-substitutes';
import { revalidatePath } from 'next/cache';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

export interface UserListWithDetails {
  id: string;
  listId: string | null;
  customNameOfList: string | null;
  customDescriptionOfList: string | null;
  customCoverImageUrl: string | null;
  customDifficulty: DifficultyLevel | null;
  progress: number;
  isModified: boolean;
  targetLanguageCode: LanguageCode;
  createdAt: Date;
  updatedAt: Date;

  // Original list details (for inherited lists)
  originalList?:
    | {
        id: string;
        name: string;
        description: string | null;
        categoryName: string;
        difficultyLevel: DifficultyLevel;
        isPublic: boolean;
        tags: string[];
        coverImageUrl: string | null;
        wordCount: number;
      }
    | undefined;

  // Computed properties
  displayName: string;
  displayDescription: string | null;
  displayCoverImageUrl: string | null;
  displayDifficulty: DifficultyLevel;
  wordCount: number;
  learnedWordCount: number;
  sampleWords: string[];
}

export interface PublicListSummary {
  id: string;
  name: string;
  description: string | null;
  categoryName: string;
  targetLanguageCode: LanguageCode;
  difficultyLevel: DifficultyLevel;
  tags: string[];
  coverImageUrl: string | null;
  wordCount: number;
  userCount: number;
  sampleWords: string[];
  isInUserCollection: boolean;
  userListId?: string | undefined;
}

export interface PublicUserListSummary {
  id: string;
  name: string;
  description: string | null;
  targetLanguageCode: LanguageCode;
  difficultyLevel: DifficultyLevel;
  coverImageUrl: string | null;
  wordCount: number;
  createdBy: {
    id: string;
    name: string;
  };
  isInUserCollection: boolean;
  userListId?: string | undefined;
  sampleWords: string[];
  createdAt: Date;
}

export interface UserListFilters {
  search?: string;
  difficulty?: DifficultyLevel;
  language?: LanguageCode;
  isCustom?: boolean; // true for custom lists, false for inherited lists
  sortBy?: 'name' | 'createdAt' | 'progress' | 'wordCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get user's personal lists with full details
 */
export async function getUserLists(
  userId: string,
  filters: UserListFilters = {},
): Promise<{
  userLists: UserListWithDetails[];
  totalCount: number;
}> {
  try {
    const {
      search = '',
      difficulty,
      // language, // TODO: Re-implement with User JOIN
      isCustom,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build where conditions
    const whereConditions: UserListWhereInput = {
      userId,
      deletedAt: null,
    };

    if (isCustom !== undefined) {
      if (isCustom) {
        whereConditions.listId = null; // Custom lists
      } else {
        whereConditions.listId = { not: null }; // Inherited lists
      }
    }

    if (difficulty) {
      whereConditions.OR = [
        { customDifficulty: difficulty },
        {
          AND: [
            { customDifficulty: null },
            { list: { difficultyLevel: difficulty } },
          ],
        },
      ];
    }

    // TODO: Re-implement language filtering with new schema
    // if (language) {
    //   whereConditions.OR = [
    //     { targetLanguageCode: language },
    //     { user: { baseLanguageCode: language } },
    //   ];
    // }

    // Debug logging
    await serverLog(`getUserLists - userId: ${userId}`, 'info');
    await serverLog('getUserLists - whereConditions', 'info', whereConditions);

    // First, let's check how many UserList records exist for this user (without includes)
    const basicUserLists = await prisma.userList.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(isCustom !== undefined && {
          listId: isCustom ? null : { not: null },
        }),
        ...(difficulty && {
          OR: [
            { customDifficulty: difficulty },
            {
              AND: [
                { customDifficulty: null },
                { list: { difficultyLevel: difficulty } },
              ],
            },
          ],
        }),
      },
      select: { id: true, customNameOfList: true, listId: true },
    });
    await serverLog(
      `getUserLists - Basic query found: ${basicUserLists.length} records`,
      'info',
    );

    for (const [index, list] of basicUserLists.entries()) {
      await serverLog(`Basic List ${index + 1}`, 'info', {
        id: list.id,
        customName: list.customNameOfList,
        listId: list.listId,
      });
    }

    // Get user lists with related data
    // First get all UserList records (this ensures we get ALL lists for the user)
    const userLists = await prisma.userList.findMany({
      where: whereConditions,
      include: {
        userListWords: {
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
                  },
                },
              },
            },
          },
          take: 5,
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy:
        sortBy === 'name'
          ? [{ customNameOfList: sortOrder }]
          : { [sortBy]: sortOrder },
    });

    // Separately fetch the referenced Lists to avoid losing UserList records
    const referencedListIds = userLists
      .map((ul) => ul.listId)
      .filter(Boolean) as string[];

    const referencedLists =
      referencedListIds.length > 0
        ? await prisma.list.findMany({
            where: { id: { in: referencedListIds } },
            include: {
              category: true,
            },
          })
        : [];

    // Create a map for quick lookup
    const listMap = new Map(referencedLists.map((list) => [list.id, list]));

    // Check if referenced Lists exist (using basicUserLists to avoid conflict)
    const basicReferencedListIds = basicUserLists
      .map((ul) => ul.listId)
      .filter(Boolean) as string[];

    if (basicReferencedListIds.length > 0) {
      const existingLists = await prisma.list.findMany({
        where: { id: { in: basicReferencedListIds } },
        select: { id: true, name: true },
      });
      await serverLog(
        'getUserLists - Referenced List IDs',
        'info',
        basicReferencedListIds,
      );
      await serverLog(
        `getUserLists - Existing Lists found: ${existingLists.length}`,
        'info',
      );

      for (const list of existingLists) {
        await serverLog(`Existing List: ${list.id} - ${list.name}`, 'info');
      }

      const missingListIds = basicReferencedListIds.filter(
        (id) => !existingLists.some((existing) => existing.id === id),
      );
      if (missingListIds.length > 0) {
        await serverLog(
          'getUserLists - MISSING List IDs',
          'warn',
          missingListIds,
        );
      }
    }

    // Debug logging
    await serverLog(
      `getUserLists - Found ${userLists.length} raw user lists`,
      'info',
    );

    for (const [index, list] of userLists.entries()) {
      const referencedList = list.listId ? listMap.get(list.listId) : null;
      await serverLog(`List ${index + 1}`, 'info', {
        id: list.id,
        customName: list.customNameOfList,
        listId: list.listId,
        hasOriginalList: !!referencedList,
        originalListName: referencedList?.name,
        userListWordsCount: list.userListWords.length,
      });
    }

    // Filter by search if provided
    let filteredLists = userLists;
    if (search) {
      filteredLists = userLists.filter((userList) => {
        const referencedList = userList.listId
          ? listMap.get(userList.listId)
          : null;
        const displayName =
          userList.customNameOfList || referencedList?.name || '';
        const displayDescription =
          userList.customDescriptionOfList || referencedList?.description || '';
        const searchLower = search.toLowerCase();

        return (
          displayName.toLowerCase().includes(searchLower) ||
          displayDescription.toLowerCase().includes(searchLower) ||
          referencedList?.tags.some((tag) =>
            tag.toLowerCase().includes(searchLower),
          )
        );
      });
    }

    // Transform data
    const userListsWithDetails: UserListWithDetails[] = filteredLists.map(
      (userList) => {
        // Get sample words
        const sampleWords = userList.userListWords
          .slice(0, 3)
          .map((userListWord) => {
            const wordDetails =
              userListWord.userDictionary.definition.wordDetails[0]
                ?.wordDetails;
            return wordDetails?.word.word || 'Unknown word';
          })
          .filter(Boolean);

        // Count learned words
        const learnedWordCount = userList.userListWords.filter(
          (userListWord) =>
            userListWord.userDictionary.learningStatus === 'learned',
        ).length;

        // Get the referenced List (if it exists)
        const referencedList = userList.listId
          ? listMap.get(userList.listId)
          : null;

        const displayName =
          userList.customNameOfList || referencedList?.name || 'Untitled List';
        const displayDescription =
          userList.customDescriptionOfList ||
          referencedList?.description ||
          null;
        const displayDifficulty =
          userList.customDifficulty ||
          referencedList?.difficultyLevel ||
          'beginner';
        const displayCoverImageUrl =
          userList.customCoverImageUrl || referencedList?.coverImageUrl || null;

        return {
          id: userList.id,
          listId: userList.listId,
          customNameOfList: userList.customNameOfList,
          customDescriptionOfList: userList.customDescriptionOfList,
          customCoverImageUrl: userList.customCoverImageUrl,
          customDifficulty: userList.customDifficulty,
          progress: userList.progress,
          isModified: userList.isModified,
          targetLanguageCode: userList.targetLanguageCode,
          createdAt: userList.createdAt,
          updatedAt: userList.updatedAt,

          originalList: referencedList
            ? {
                id: referencedList.id,
                name: referencedList.name,
                description: referencedList.description,
                categoryName: referencedList.category.name,
                difficultyLevel: referencedList.difficultyLevel,
                isPublic: referencedList.isPublic,
                tags: referencedList.tags,
                coverImageUrl: referencedList.coverImageUrl,
                wordCount: referencedList.wordCount,
              }
            : undefined,

          displayName,
          displayDescription,
          displayCoverImageUrl,
          displayDifficulty,
          wordCount: userList.userListWords.length,
          learnedWordCount,
          sampleWords,
        };
      },
    );

    // Final debug logging
    await serverLog(
      `getUserLists - Returning ${userListsWithDetails.length} processed user lists`,
      'info',
    );

    for (const [index, list] of userListsWithDetails.entries()) {
      await serverLog(`Processed List ${index + 1}`, 'info', {
        id: list.id,
        displayName: list.displayName,
        wordCount: list.wordCount,
        hasOriginalList: !!list.originalList,
      });
    }

    return {
      userLists: userListsWithDetails,
      totalCount: filteredLists.length,
    };
  } catch (error) {
    console.error('Error fetching user lists:', error);
    throw new Error('Failed to fetch user lists');
  }
}

/**
 * Get available public lists that user can add to their collection
 */
export async function getAvailablePublicLists(
  userId: string,
  userLanguages: { base: LanguageCode; target: LanguageCode },
  filters: { search?: string; difficulty?: DifficultyLevel } = {},
): Promise<{
  publicLists: PublicListSummary[];
  totalCount: number;
}> {
  try {
    const { search = '', difficulty } = filters;

    // Build where conditions for public lists
    const whereConditions: Record<string, unknown> = {
      isPublic: true,
      deletedAt: null,
    };

    if (difficulty) {
      whereConditions.difficultyLevel = difficulty;
    }

    // For now, let's disable language filtering to see all lists
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Get public lists
    const publicLists = await prisma.list.findMany({
      where: whereConditions,
      include: {
        category: true,
        userLists: {
          where: {
            userId,
            deletedAt: null,
          },
          select: { id: true },
        },
        listWords: {
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
          take: 5,
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: [
        { userLists: { _count: 'desc' } }, // Most popular first
        { createdAt: 'desc' },
      ],
      take: 50, // Limit to reasonable number
    });

    // Transform data
    const publicListsSummary: PublicListSummary[] = publicLists.map((list) => {
      const sampleWords = list.listWords
        .slice(0, 3)
        .map((listWord) => {
          const wordDetails = listWord.definition.wordDetails[0]?.wordDetails;
          return wordDetails?.word.word || 'Unknown word';
        })
        .filter(Boolean);

      const isInUserCollection = list.userLists.length > 0;
      const userListId = list.userLists[0]?.id;

      return {
        id: list.id,
        name: list.name,
        description: list.description,
        categoryName: list.category.name,
        targetLanguageCode: list.targetLanguageCode,
        difficultyLevel: list.difficultyLevel,
        tags: list.tags,
        coverImageUrl: list.coverImageUrl,
        wordCount: list.wordCount,
        userCount: list.userLists.length,
        sampleWords,
        isInUserCollection,
        userListId,
      };
    });

    return {
      publicLists: publicListsSummary,
      totalCount: publicListsSummary.length,
    };
  } catch (error) {
    console.error('Error fetching public lists:', error);
    throw new Error('Failed to fetch public lists');
  }
}

/**
 * Get public user lists that other users have shared
 */
export async function getPublicUserLists(
  userId: string,
  userLanguages: { base: LanguageCode; target: LanguageCode },
  filters: { search?: string; difficulty?: DifficultyLevel } = {},
): Promise<{
  publicUserLists: PublicUserListSummary[];
  totalCount: number;
}> {
  try {
    const { search = '', difficulty } = filters;

    // Build where conditions for public user lists
    const whereConditions: Record<string, unknown> = {
      isPublic: true,
      deletedAt: null,
      userId: { not: userId }, // Exclude current user's lists
    };

    if (difficulty) {
      whereConditions.customDifficulty = difficulty;
    }

    // For now, let's disable language filtering to see all lists
    if (search) {
      whereConditions.OR = [
        { customNameOfList: { contains: search, mode: 'insensitive' } },
        {
          customDescriptionOfList: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get public user lists
    const publicUserLists = await prisma.userList.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        list: {
          select: {
            name: true,
            description: true,
            difficultyLevel: true,
            coverImageUrl: true,
          },
        },
        userListWords: {
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
                  },
                },
              },
            },
          },
          take: 5,
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: {
            userListWords: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 50, // Limit to reasonable number
    });

    // Check which lists are already in user's collection
    // Since community lists get copied as new UserList records, we need to check
    // if the user has any UserList that was copied from these public lists

    // We need to find UserLists where the user has copied the content
    // This is complex because copied lists become new records
    // For now, let's check if any of the user's lists have matching content/source
    const userCollectionLists = await prisma.userList.findMany({
      where: {
        userId,
        deletedAt: null,
        // This is a simplified check - in practice, we might need to add
        // a sourceUserListId field to track the original community list
      },
      select: { id: true, customNameOfList: true, listId: true },
    });

    // For now, we'll check by name matching as a temporary solution
    const userListNames = new Set(
      userCollectionLists
        .map((ul) => ul.customNameOfList?.toLowerCase())
        .filter(Boolean),
    );

    // Transform data
    const publicUserListsSummary: PublicUserListSummary[] = publicUserLists.map(
      (list) => {
        const sampleWords = list.userListWords
          .slice(0, 3)
          .map((userListWord) => {
            const wordDetails =
              userListWord.userDictionary.definition.wordDetails[0]
                ?.wordDetails;
            return wordDetails?.word.word || 'Unknown word';
          })
          .filter(Boolean);

        const displayName =
          list.customNameOfList || list.list?.name || 'Untitled List';
        const displayDescription =
          list.customDescriptionOfList || list.list?.description || null;
        const displayDifficulty =
          list.customDifficulty || list.list?.difficultyLevel || 'beginner';
        const displayCoverImageUrl =
          list.customCoverImageUrl || list.list?.coverImageUrl || null;

        // Check if user has a list with matching name (temporary solution)
        const isInCollection = userListNames.has(displayName.toLowerCase());
        const userListRecord = userCollectionLists.find(
          (ul) =>
            ul.customNameOfList?.toLowerCase() === displayName.toLowerCase(),
        );

        return {
          id: list.id,
          name: displayName,
          description: displayDescription,
          targetLanguageCode: list.targetLanguageCode,
          difficultyLevel: displayDifficulty,
          coverImageUrl: displayCoverImageUrl,
          wordCount: list._count.userListWords,
          createdBy: {
            id: list.user.id,
            name: list.user.name,
          },
          isInUserCollection: isInCollection,
          userListId: isInCollection ? userListRecord?.id : undefined,
          sampleWords,
          createdAt: list.createdAt,
        };
      },
    );

    return {
      publicUserLists: publicUserListsSummary,
      totalCount: publicUserListsSummary.length,
    };
  } catch (error) {
    console.error('Error fetching public user lists:', error);
    throw new Error('Failed to fetch public user lists');
  }
}

/**
 * Get detailed preview of a public list with word definitions and translations
 */
export async function getPublicListPreview(
  listId: string,
  userLanguages: { base: LanguageCode; target: LanguageCode },
): Promise<{
  words: Array<{
    id: string;
    word: string;
    pronunciation?: string | null;
    audioUrl?: string | null;
    definition: string;
    translatedDefinition?: string | null;
    examples: Array<{
      text: string;
      translation?: string | null;
    }>;
    tags: string[];
    difficultyLevel: string;
  }>;
}> {
  try {
    // Get list words with comprehensive data
    const listWords = await prisma.listWord.findMany({
      where: {
        list: {
          id: listId,
          isPublic: true,
        },
      },
      include: {
        definition: {
          include: {
            wordDetails: {
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
            },
            examples: {
              include: {
                translationLinks: {
                  include: {
                    translation: true,
                  },
                },
              },
              take: 3,
            },
            translationLinks: {
              include: {
                translation: true,
              },
            },
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
      take: 10, // Limit preview to first 10 words
    });

    // Transform the data
    const words = listWords
      .map((listWord) => {
        const definition = listWord.definition;
        const wordDetail = definition.wordDetails[0]?.wordDetails;

        if (!wordDetail) {
          return null;
        }

        const word = wordDetail.word;

        // Get translated definition if available (filter for base language)
        const translatedDefinition =
          definition.translationLinks.find(
            (link) => link.translation.languageCode === userLanguages.base,
          )?.translation?.content || null;

        // Get audio URL
        const audioUrl = wordDetail.audioLinks[0]?.audio?.url || null;

        // Process examples with translations
        const examples = definition.examples.map((example) => ({
          text: example.example,
          translation:
            example.translationLinks.find(
              (link) => link.translation.languageCode === userLanguages.base,
            )?.translation?.content || null,
        }));

        return {
          id: definition.id.toString(),
          word: word.word,
          pronunciation: wordDetail.phonetic,
          audioUrl,
          definition: definition.definition,
          translatedDefinition,
          examples,
          tags: definition.subjectStatusLabels
            ? definition.subjectStatusLabels.split(',').map((tag) => tag.trim())
            : [],
          difficultyLevel: 'beginner', // Default since Definition model doesn't have difficulty
        };
      })
      .filter((word): word is NonNullable<typeof word> => word !== null);

    return { words };
  } catch (error) {
    console.error('Error fetching public list preview:', error);
    throw new Error('Failed to fetch list preview');
  }
}

/**
 * Get detailed preview of a public user list with word definitions and translations
 */
export async function getPublicUserListPreview(
  publicUserListId: string,
): Promise<{
  words: Array<{
    id: string;
    word: string;
    pronunciation?: string | null;
    audioUrl?: string | null;
    definition: string;
    translatedDefinition?: string | null;
    examples: Array<{
      text: string;
      translation?: string | null;
    }>;
    tags: string[];
    difficultyLevel: string;
  }>;
}> {
  try {
    // Check if user list exists and is public
    const userList = await prisma.userList.findUnique({
      where: { id: publicUserListId },
      include: {
        userListWords: {
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
                  },
                },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
          take: 10, // Limit preview to first 10 words
        },
      },
    });

    if (!userList || !userList.isPublic) {
      throw new Error('List not found or not public');
    }

    // Transform the data - simplified approach
    const words = userList.userListWords
      .map((userListWord) => {
        const definition = userListWord.userDictionary.definition;
        const wordDetail = definition.wordDetails[0]?.wordDetails;

        if (!wordDetail) {
          return null;
        }

        const word = wordDetail.word;

        return {
          id: definition.id.toString(),
          word: word.word,
          pronunciation: wordDetail.phonetic,
          audioUrl: null, // No direct audio in this simplified version
          definition: definition.definition,
          translatedDefinition: null, // Simplified - no translations for preview
          examples: [] as Array<{
            text: string;
            translation?: string | null;
          }>, // Simplified - no examples for preview
          tags:
            definition.subjectStatusLabels
              ?.split(',')
              .map((tag) => tag.trim()) || [],
          difficultyLevel: 'beginner', // Default since not in schema
        };
      })
      .filter((word): word is NonNullable<typeof word> => word !== null);

    return { words };
  } catch (error) {
    console.error('Error fetching public user list preview:', error);
    throw new Error('Failed to fetch user list preview');
  }
}

/**
 * Add a public list to user's collection
 */
export async function addListToUserCollection(
  userId: string,
  listId: string,
  userLanguages: { base: LanguageCode; target: LanguageCode },
): Promise<{ success: boolean; message: string; userListId?: string }> {
  try {
    // Check if list exists and is public
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: {
        id: true,
        isPublic: true,
        name: true,
        listWords: {
          include: {
            definition: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!list || !list.isPublic) {
      return {
        success: false,
        message: 'List not found or not public',
      };
    }

    // Check if user already has this list
    const existingUserList = await prisma.userList.findFirst({
      where: {
        userId,
        listId,
        deletedAt: null,
      },
    });

    if (existingUserList) {
      return {
        success: false,
        message: 'List already in your collection',
      };
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Double-check if user already has this list (to handle race conditions)
      const existingInTransaction = await tx.userList.findFirst({
        where: {
          userId,
          listId,
          deletedAt: null,
        },
      });

      if (existingInTransaction) {
        throw new Error('LIST_ALREADY_EXISTS');
      }

      // Create user list (baseLanguageCode comes from User model)
      const userList = await tx.userList.create({
        data: {
          userId,
          listId,
          targetLanguageCode: userLanguages.target,
          progress: 0,
        },
      });

      // For each word in the public list, add it to user's dictionary if not already there,
      // then add it to the user's list
      const userListWordData = [];

      for (const listWord of list.listWords) {
        // Check if user already has this definition in their dictionary
        let userDictionary = await tx.userDictionary.findFirst({
          where: {
            userId,
            definitionId: listWord.definitionId,
            deletedAt: null,
          },
        });

        // If not in user dictionary, add it (baseLanguageCode comes from User model)
        if (!userDictionary) {
          userDictionary = await tx.userDictionary.create({
            data: {
              userId,
              definitionId: listWord.definitionId,
              targetLanguageCode: userLanguages.target,
              learningStatus: 'notStarted',
              progress: 0,
              isModified: false,
              reviewCount: 0,
              timeWordWasStartedToLearn: new Date(),
              jsonbData: {},
              customDifficultyLevel: null,
            },
          });
        }

        // Add to user list words
        userListWordData.push({
          userListId: userList.id,
          userDictionaryId: userDictionary.id,
          orderIndex: listWord.orderIndex,
        });
      }

      // Create all UserListWord entries
      if (userListWordData.length > 0) {
        await tx.userListWord.createMany({
          data: userListWordData,
          skipDuplicates: true,
        });
      }

      return userList;
    });

    revalidatePath('/dashboard/dictionary/lists');

    return {
      success: true,
      message: `"${list.name}" added to your collection with ${list.listWords.length} words`,
      userListId: result.id,
    };
  } catch (error) {
    console.error('Error adding list to user collection:', error);

    // Handle specific error cases
    if (error instanceof Error && error.message === 'LIST_ALREADY_EXISTS') {
      return {
        success: false,
        message: 'List already in your collection',
      };
    }

    // Handle Prisma unique constraint violation
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return {
        success: false,
        message: 'List already in your collection',
      };
    }

    return {
      success: false,
      message: 'Failed to add list to collection',
    };
  }
}

/**
 * Add a public user list to user's collection (clone it)
 */
export async function addPublicUserListToCollection(
  userId: string,
  publicUserListId: string,
  userLanguages: { base: LanguageCode; target: LanguageCode },
): Promise<{ success: boolean; message: string; userListId?: string }> {
  try {
    // Check if the source list exists and is public
    const sourceList = await prisma.userList.findUnique({
      where: { id: publicUserListId },
      include: {
        userListWords: {
          include: {
            userDictionary: {
              include: {
                definition: true,
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!sourceList || !sourceList.isPublic || sourceList.userId === userId) {
      return {
        success: false,
        message: 'List not found, not public, or you cannot copy your own list',
      };
    }

    // Check if user already has this list
    const existingUserList = await prisma.userList.findFirst({
      where: {
        userId,
        id: publicUserListId,
        deletedAt: null,
      },
    });

    if (existingUserList) {
      return {
        success: false,
        message: 'List already in your collection',
      };
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create a copy of the user list
      const newUserList = await tx.userList.create({
        data: {
          userId,
          listId: sourceList.listId, // Keep the original list reference if it exists
          targetLanguageCode: userLanguages.target,
          customNameOfList: sourceList.customNameOfList,
          customDescriptionOfList: sourceList.customDescriptionOfList,
          customDifficulty: sourceList.customDifficulty,
          customCoverImageUrl: sourceList.customCoverImageUrl,
          progress: 0,
          isModified: false,
        },
      });

      // For each word in the source list, add it to user's dictionary if not already there,
      // then add it to the user's list
      const userListWordData = [];

      for (const sourceListWord of sourceList.userListWords) {
        // Check if user already has this definition in their dictionary
        let userDictionary = await tx.userDictionary.findFirst({
          where: {
            userId,
            definitionId: sourceListWord.userDictionary.definitionId,
            deletedAt: null,
          },
        });

        // If user doesn't have this word, add it to their dictionary
        if (!userDictionary) {
          userDictionary = await tx.userDictionary.create({
            data: {
              userId,
              definitionId: sourceListWord.userDictionary.definitionId,
              targetLanguageCode: userLanguages.target,
              learningStatus: 'notStarted',
              masteryScore: 0,
              reviewCount: 0,
              isFavorite: false,
            },
          });
        }

        // Add to user list words
        userListWordData.push({
          userListId: newUserList.id,
          userDictionaryId: userDictionary.id,
          orderIndex: sourceListWord.orderIndex,
        });
      }

      // Batch create user list words
      if (userListWordData.length > 0) {
        await tx.userListWord.createMany({
          data: userListWordData,
        });
      }

      return newUserList;
    });

    return {
      success: true,
      message: `Successfully added "${sourceList.customNameOfList || 'list'}" to your collection with ${sourceList.userListWords.length} words`,
      userListId: result.id,
    };
  } catch (error) {
    console.error('Error adding public user list to collection:', error);
    return {
      success: false,
      message: 'Failed to add list to collection',
    };
  }
}

/**
 * Remove a list from user's collection
 */
export async function removeListFromUserCollection(
  userId: string,
  userListId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Soft delete the user list
    await prisma.userList.update({
      where: {
        id: userListId,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath('/dashboard/dictionary/lists');

    return {
      success: true,
      message: 'List removed from your collection',
    };
  } catch (error) {
    console.error('Error removing list from user collection:', error);
    return {
      success: false,
      message: 'Failed to remove list from collection',
    };
  }
}

/**
 * Create a custom user list
 */
export async function createCustomUserList(
  userId: string,
  data: {
    name: string;
    description?: string;
    targetLanguageCode: LanguageCode;
    difficulty?: DifficultyLevel;
    coverImageUrl?: string;
  },
): Promise<{ success: boolean; message: string; userListId?: string }> {
  try {
    const userList = await prisma.userList.create({
      data: {
        userId,
        listId: null, // Custom list
        customNameOfList: data.name,
        customDescriptionOfList: data.description || null,
        customDifficulty: data.difficulty || null,
        customCoverImageUrl: data.coverImageUrl || null,
        targetLanguageCode: data.targetLanguageCode,
        progress: 0,
        isModified: true,
      },
    });

    revalidatePath('/dashboard/dictionary/lists');

    return {
      success: true,
      message: `Custom list "${data.name}" created successfully`,
      userListId: userList.id,
    };
  } catch (error) {
    console.error('Error creating custom user list:', error);
    return {
      success: false,
      message: 'Failed to create custom list',
    };
  }
}

/**
 * Update user list (both custom and inherited lists)
 */
export async function updateUserList(
  userId: string,
  userListId: string,
  data: {
    customName?: string;
    customDescription?: string;
    customDifficulty?: DifficultyLevel;
    customCoverImageUrl?: string;
  },
): Promise<{ success: boolean; message: string }> {
  try {
    const updateData: {
      updatedAt: Date;
      isModified: boolean;
      customNameOfList?: string | null;
      customDescriptionOfList?: string | null;
      customDifficulty?: DifficultyLevel | null;
      customCoverImageUrl?: string | null;
    } = {
      updatedAt: new Date(),
      isModified: true,
    };

    if (data.customName !== undefined) {
      updateData.customNameOfList = data.customName || null;
    }
    if (data.customDescription !== undefined) {
      updateData.customDescriptionOfList = data.customDescription || null;
    }
    if (data.customDifficulty !== undefined) {
      updateData.customDifficulty = data.customDifficulty || null;
    }
    if (data.customCoverImageUrl !== undefined) {
      updateData.customCoverImageUrl = data.customCoverImageUrl || null;
    }

    await prisma.userList.update({
      where: {
        id: userListId,
        userId,
      },
      data: updateData,
    });

    revalidatePath('/dashboard/dictionary/lists');

    return {
      success: true,
      message: 'List updated successfully',
    };
  } catch (error) {
    console.error('Error updating user list:', error);
    return {
      success: false,
      message: 'Failed to update list',
    };
  }
}

/**
 * Add a word (via UserDictionary) to a user list
 */
export async function addWordToUserList(
  userId: string,
  userListId: string,
  userDictionaryId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // First check if the user owns this list
    const userList = await prisma.userList.findFirst({
      where: {
        id: userListId,
        userId,
        deletedAt: null,
      },
    });

    if (!userList) {
      return { success: false, message: 'List not found or access denied' };
    }

    // Check if the user owns the dictionary entry
    const userDictionary = await prisma.userDictionary.findFirst({
      where: {
        id: userDictionaryId,
        userId,
        deletedAt: null,
      },
    });

    if (!userDictionary) {
      return { success: false, message: 'Word not found in your dictionary' };
    }

    // Check if the word is already in the list
    const existingEntry = await prisma.userListWord.findFirst({
      where: {
        userListId,
        userDictionaryId,
      },
    });

    if (existingEntry) {
      return { success: false, message: 'Word is already in this list' };
    }

    // Get the next order index
    const lastEntry = await prisma.userListWord.findFirst({
      where: { userListId },
      orderBy: { orderIndex: 'desc' },
    });

    const nextOrderIndex = (lastEntry?.orderIndex || 0) + 1;

    // Add the word to the list
    await prisma.userListWord.create({
      data: {
        userListId,
        userDictionaryId,
        orderIndex: nextOrderIndex,
      },
    });

    return { success: true, message: 'Word added to list successfully' };
  } catch (error) {
    console.error('Error adding word to user list:', error);
    return { success: false, message: 'Failed to add word to list' };
  }
}

/**
 * Remove a word from a user list
 */
export async function removeWordFromUserList(
  userId: string,
  userListId: string,
  userDictionaryId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // First check if the user owns this list
    const userList = await prisma.userList.findFirst({
      where: {
        id: userListId,
        userId,
        deletedAt: null,
      },
    });

    if (!userList) {
      return { success: false, message: 'List not found or access denied' };
    }

    // Check if the word exists in this list
    const userListWord = await prisma.userListWord.findUnique({
      where: {
        userListId_userDictionaryId: {
          userListId,
          userDictionaryId,
        },
      },
    });

    if (!userListWord) {
      return { success: false, message: 'Word not found in this list' };
    }

    // Remove the word from the list
    await prisma.userListWord.delete({
      where: {
        userListId_userDictionaryId: {
          userListId,
          userDictionaryId,
        },
      },
    });

    return { success: true, message: 'Word removed from list successfully' };
  } catch (error) {
    console.error('Error removing word from user list:', error);
    return { success: false, message: 'Failed to remove word from list' };
  }
}

/**
 * Interface for user list word with full details
 */
export interface UserListWordWithDetails {
  userListId: string;
  userDictionaryId: string;
  orderIndex: number;

  // Word details
  word: string;
  definition: string;
  partOfSpeech: string | null;
  phoneticTranscription: string | null;
  audioUrl: string | null;
  imageUrl: string | null;

  // Learning details
  learningStatus: string;
  masteryScore: number;
  reviewCount: number;
  lastReviewedAt: Date | null;
  isFavorite: boolean;

  // Translation details
  translations: Array<{
    id: number;
    languageCode: LanguageCode;
    translatedText: string;
  }>;
  oneWordTranslation?: string | null; // Translation from DefinitionToOneWord
}

/**
 * Get all words in a user list with full details
 */
export async function getUserListWords(
  userId: string,
  userListId: string,
  userLanguages: { base: LanguageCode; target: LanguageCode },
  options: {
    search?: string;
    sortBy?: 'word' | 'progress' | 'lastReviewed' | 'orderIndex';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {},
): Promise<{
  words: UserListWordWithDetails[];
  totalCount: number;
  listDetails: {
    id: string;
    displayName: string;
    displayDescription: string | null;
    wordCount: number;
    learnedWordCount: number;
  } | null;
}> {
  try {
    const {
      search,
      sortBy = 'orderIndex',
      sortOrder = 'asc',
      limit,
      offset,
    } = options;

    // First check if the user owns this list
    const userList = await prisma.userList.findFirst({
      where: {
        id: userListId,
        userId,
        deletedAt: null,
      },
      include: {
        list: true,
      },
    });

    if (!userList) {
      return {
        words: [],
        totalCount: 0,
        listDetails: null,
      };
    }

    // Build where conditions
    const whereConditions: Record<string, unknown> = {
      userListId,
      userDictionary: {
        deletedAt: null,
      },
    };

    // Add search condition if provided
    if (search) {
      whereConditions.userDictionary = {
        deletedAt: null,
        definition: {
          wordDetails: {
            some: {
              wordDetails: {
                word: {
                  word: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        },
      };
    }

    // Build orderBy conditions
    let orderBy: Record<string, unknown> = {};
    switch (sortBy) {
      case 'word':
        orderBy = {
          userDictionary: {
            definition: {
              wordDetails: {
                wordDetails: {
                  word: {
                    word: sortOrder,
                  },
                },
              },
            },
          },
        };
        break;
      case 'progress':
        orderBy = {
          userDictionary: {
            masteryScore: sortOrder,
          },
        };
        break;
      case 'lastReviewed':
        orderBy = {
          userDictionary: {
            lastReviewedAt: sortOrder,
          },
        };
        break;
      default:
        orderBy = { orderIndex: sortOrder };
    }

    // Get total count
    const totalCount = await prisma.userListWord.count({
      where: whereConditions,
    });

    // Get words with full details
    const userListWords = await prisma.userListWord.findMany({
      where: whereConditions,
      include: {
        userDictionary: {
          include: {
            definition: {
              include: {
                image: true,
                wordDetails: {
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
                },
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
          },
        },
      },
      orderBy,
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
    });

    // Transform data
    const words: UserListWordWithDetails[] = userListWords.map(
      (userListWord) => {
        const userDictionary = userListWord.userDictionary;
        const definition = userDictionary.definition;
        const wordDetails = definition.wordDetails[0]?.wordDetails;
        const word = wordDetails?.word;

        // Audio and image URLs
        const audioUrl = wordDetails?.audioLinks?.[0]?.audio?.url || null;
        const imageUrl = definition.image?.url || null;

        // Get translations with proper typing
        const translations = definition.translationLinks.map(
          (link: {
            translation: {
              id: number;
              languageCode: LanguageCode;
              content: string;
            };
          }) => ({
            id: link.translation.id,
            languageCode: link.translation.languageCode,
            translatedText: link.translation.content, // Correct field name
          }),
        );

        return {
          userListId: userListWord.userListId,
          userDictionaryId: userListWord.userDictionaryId,
          orderIndex: userListWord.orderIndex,

          // Word details
          word: word?.word || 'Unknown word',
          definition: definition.definition,
          partOfSpeech: wordDetails?.partOfSpeech || null,
          phoneticTranscription: wordDetails?.phonetic || null,
          audioUrl,
          imageUrl,

          // Learning details
          learningStatus: userDictionary.learningStatus,
          masteryScore: userDictionary.masteryScore,
          reviewCount: userDictionary.reviewCount,
          lastReviewedAt: userDictionary.lastReviewedAt,
          isFavorite: userDictionary.isFavorite,

          // Translation details
          translations,
          oneWordTranslation: (() => {
            // Find DefinitionToOneWord translation that matches user's base language
            const matchingOneWordLink = definition.oneWordLinks?.find(
              (link) => link.word.languageCode === userLanguages.base,
            );

            // Only return DefinitionToOneWord match, never fall back to DefinitionTranslation
            return matchingOneWordLink?.word?.word || null;
          })(),
        };
      },
    );

    // Get list details
    const displayName =
      userList.customNameOfList || userList.list?.name || 'Untitled List';
    const displayDescription =
      userList.customDescriptionOfList || userList.list?.description || null;

    const listDetails = {
      id: userList.id,
      displayName,
      displayDescription,
      wordCount: totalCount,
      learnedWordCount: words.filter((w) => w.learningStatus === 'learned')
        .length,
    };

    return {
      words,
      totalCount,
      listDetails,
    };
  } catch (error) {
    console.error('Error fetching user list words:', error);
    throw new Error('Failed to fetch user list words');
  }
}

/**
 * Update the order of words in a user list
 */
export async function reorderUserListWords(
  userId: string,
  userListId: string,
  wordOrderUpdates: Array<{ userDictionaryId: string; newOrderIndex: number }>,
): Promise<{ success: boolean; message: string }> {
  try {
    // First check if the user owns this list
    const userList = await prisma.userList.findFirst({
      where: {
        id: userListId,
        userId,
        deletedAt: null,
      },
    });

    if (!userList) {
      return { success: false, message: 'List not found or access denied' };
    }

    // Update order indices in a transaction
    // Note: Since UserListWord uses composite key, we need userDictionaryId for each update
    // This function signature needs to be updated to include userDictionaryId
    // For now, we'll implement a workaround by finding the records first

    await prisma.$transaction(
      wordOrderUpdates.map(({ userDictionaryId, newOrderIndex }) =>
        prisma.userListWord.update({
          where: {
            userListId_userDictionaryId: {
              userListId,
              userDictionaryId,
            },
          },
          data: {
            orderIndex: newOrderIndex,
          },
        }),
      ),
    );

    return { success: true, message: 'Word order updated successfully' };
  } catch (error) {
    console.error('Error reordering user list words:', error);
    return { success: false, message: 'Failed to update word order' };
  }
}

/**
 * Populate an empty inherited list with words from its original public list
 * This is useful for lists that were added before the fix was implemented
 */
export async function populateInheritedListWithWords(
  userId: string,
  userListId: string,
): Promise<{ success: boolean; message: string; wordsAdded?: number }> {
  try {
    // Get the user list and check if it's inherited (has a listId)
    const userList = await prisma.userList.findFirst({
      where: {
        id: userListId,
        userId,
        deletedAt: null,
      },
      include: {
        list: {
          include: {
            listWords: {
              include: {
                definition: true,
              },
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
        userListWords: true,
      },
    });

    if (!userList) {
      return {
        success: false,
        message: 'List not found or access denied',
      };
    }

    if (!userList.listId || !userList.list) {
      return {
        success: false,
        message: 'This is not an inherited list',
      };
    }

    if (userList.userListWords.length > 0) {
      return {
        success: false,
        message: 'List already contains words',
      };
    }

    // Use transaction to ensure data consistency
    const wordsAdded = await prisma.$transaction(async (tx) => {
      const userListWordData = [];

      for (const listWord of userList.list!.listWords) {
        // Check if user already has this definition in their dictionary
        let userDictionary = await tx.userDictionary.findFirst({
          where: {
            userId,
            definitionId: listWord.definitionId,
            deletedAt: null,
          },
        });

        // If not in user dictionary, add it
        if (!userDictionary) {
          userDictionary = await tx.userDictionary.create({
            data: {
              userId,
              definitionId: listWord.definitionId,
              targetLanguageCode: userList.targetLanguageCode,
              learningStatus: 'notStarted',
              progress: 0,
              isModified: false,
              reviewCount: 0,
              timeWordWasStartedToLearn: new Date(),
              jsonbData: {},
              customDifficultyLevel: null,
            },
          });
        }

        // Add to user list words
        userListWordData.push({
          userListId: userList.id,
          userDictionaryId: userDictionary.id,
          orderIndex: listWord.orderIndex,
        });
      }

      // Create all UserListWord entries
      if (userListWordData.length > 0) {
        await tx.userListWord.createMany({
          data: userListWordData,
          skipDuplicates: true,
        });
      }

      return userListWordData.length;
    });

    revalidatePath('/dashboard/dictionary/lists');
    revalidatePath(`/dashboard/dictionary/lists/${userListId}`);

    return {
      success: true,
      message: `Successfully added ${wordsAdded} words to your list`,
      wordsAdded,
    };
  } catch (error) {
    console.error('Error populating inherited list:', error);
    return {
      success: false,
      message: 'Failed to populate list with words',
    };
  }
}
