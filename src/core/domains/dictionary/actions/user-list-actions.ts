'use server';

import { prisma } from '@/core/shared/database/client';
import { LanguageCode, DifficultyLevel } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface UserListWithDetails {
  id: string;
  listId: string | null;
  customNameOfList: string | null;
  customDescriptionOfList: string | null;
  customCoverImageUrl: string | null;
  customDifficulty: DifficultyLevel | null;
  progress: number;
  isModified: boolean;
  baseLanguageCode: LanguageCode;
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
  baseLanguageCode: LanguageCode;
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
      language,
      isCustom,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build where conditions
    const whereConditions: {
      userId: string;
      deletedAt: null;
      listId?: { not: null } | null;
      OR?: Array<
        | { customDifficulty: DifficultyLevel }
        | {
            AND: Array<
              | { customDifficulty: null }
              | { list: { difficultyLevel: DifficultyLevel } }
            >;
          }
        | { baseLanguageCode: LanguageCode }
        | { targetLanguageCode: LanguageCode }
      >;
    } = {
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

    if (language) {
      whereConditions.OR = [
        { baseLanguageCode: language },
        { targetLanguageCode: language },
      ];
    }

    // Get user lists with related data
    const userLists = await prisma.userList.findMany({
      where: whereConditions,
      include: {
        list: {
          include: {
            category: true,
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
      },
      orderBy:
        sortBy === 'name'
          ? [{ customNameOfList: sortOrder }, { list: { name: sortOrder } }]
          : { [sortBy]: sortOrder },
    });

    // Filter by search if provided
    let filteredLists = userLists;
    if (search) {
      filteredLists = userLists.filter((userList) => {
        const displayName =
          userList.customNameOfList || userList.list?.name || '';
        const displayDescription =
          userList.customDescriptionOfList || userList.list?.description || '';
        const searchLower = search.toLowerCase();

        return (
          displayName.toLowerCase().includes(searchLower) ||
          displayDescription.toLowerCase().includes(searchLower) ||
          userList.list?.tags.some((tag) =>
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

        const displayName =
          userList.customNameOfList || userList.list?.name || 'Untitled List';
        const displayDescription =
          userList.customDescriptionOfList ||
          userList.list?.description ||
          null;
        const displayDifficulty =
          userList.customDifficulty ||
          userList.list?.difficultyLevel ||
          'beginner';
        const displayCoverImageUrl =
          userList.customCoverImageUrl || userList.list?.coverImageUrl || null;

        return {
          id: userList.id,
          listId: userList.listId,
          customNameOfList: userList.customNameOfList,
          customDescriptionOfList: userList.customDescriptionOfList,
          customCoverImageUrl: userList.customCoverImageUrl,
          customDifficulty: userList.customDifficulty,
          progress: userList.progress,
          isModified: userList.isModified,
          baseLanguageCode: userList.baseLanguageCode,
          targetLanguageCode: userList.targetLanguageCode,
          createdAt: userList.createdAt,
          updatedAt: userList.updatedAt,

          originalList: userList.list
            ? {
                id: userList.list.id,
                name: userList.list.name,
                description: userList.list.description,
                categoryName: userList.list.category.name,
                difficultyLevel: userList.list.difficultyLevel,
                isPublic: userList.list.isPublic,
                tags: userList.list.tags,
                coverImageUrl: userList.list.coverImageUrl,
                wordCount: userList.list.wordCount,
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
    const whereConditions: {
      isPublic: boolean;
      deletedAt: null;
      difficultyLevel?: DifficultyLevel;
      OR?: Array<
        | { baseLanguageCode: LanguageCode; targetLanguageCode: LanguageCode }
        | { name: { contains: string; mode: 'insensitive' } }
        | { description: { contains: string; mode: 'insensitive' } }
        | { tags: { hasSome: string[] } }
      >;
    } = {
      isPublic: true,
      deletedAt: null,
      OR: [
        {
          baseLanguageCode: userLanguages.base,
          targetLanguageCode: userLanguages.target,
        },
        {
          baseLanguageCode: userLanguages.target,
          targetLanguageCode: userLanguages.base,
        },
      ],
    };

    if (difficulty) {
      whereConditions.difficultyLevel = difficulty;
    }

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
          where: { userId },
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
        baseLanguageCode: list.baseLanguageCode,
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
      select: { id: true, isPublic: true, name: true },
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

    // Create user list
    const userList = await prisma.userList.create({
      data: {
        userId,
        listId,
        baseLanguageCode: userLanguages.base,
        targetLanguageCode: userLanguages.target,
        progress: 0,
      },
    });

    revalidatePath('/dashboard/dictionary/lists');

    return {
      success: true,
      message: `"${list.name}" added to your collection`,
      userListId: userList.id,
    };
  } catch (error) {
    console.error('Error adding list to user collection:', error);
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
    baseLanguageCode: LanguageCode;
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
        baseLanguageCode: data.baseLanguageCode,
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
}

/**
 * Get all words in a user list with full details
 */
export async function getUserListWords(
  userId: string,
  userListId: string,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {
      userListId,
      userDictionary: {
        deletedAt: null,
      },
    };

    // Add search condition if provided
    if (search) {
      whereConditions.userDictionary = {
        ...whereConditions.userDictionary,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = {};
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
                      },
                    },
                  },
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

        // Audio and image URLs would be available through separate relations if needed
        const audioUrl = null; // Would need to implement through WordDetailsAudio if needed
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
