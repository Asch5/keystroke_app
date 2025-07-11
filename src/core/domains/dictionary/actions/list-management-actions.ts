'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import {
  safeDatabaseOperation,
  getDatabaseErrorMessage,
} from '@/core/lib/database-error-handler';
import { prisma } from '@/core/lib/prisma';
import { LanguageCode, DifficultyLevel } from '@/core/types';
import { WhereInput, OrderByInput } from '@/core/types/prisma-substitutes';

export interface ListWithDetails {
  id: string;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  categoryDescription: string | null;
  targetLanguageCode: LanguageCode;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
  tags: string[];
  coverImageUrl: string | null;
  difficultyLevel: DifficultyLevel;
  wordCount: number;
  learnedWordCount: number;
  deletedAt: Date | null;
  // Creator information
  creatorCount: number;
  userListCount: number;
  // Word details
  sampleWords: string[];
}

export interface ListFilters {
  search?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  language?: LanguageCode;
  isPublic?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'wordCount' | 'category' | 'difficultyLevel';
  sortOrder?: 'asc' | 'desc';
}

export interface ListsResponse {
  lists: ListWithDetails[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Fetch all lists with comprehensive details, filtering, and pagination
 */
export async function fetchAllLists(
  filters: ListFilters = {},
): Promise<ListsResponse> {
  return safeDatabaseOperation(async () => {
    const {
      search = '',
      category,
      difficulty,
      language,
      isPublic,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    void serverLog(
      `Fetching lists with filters: ${JSON.stringify(filters)}`,
      'info',
    );

    // Build where conditions
    const whereConditions: WhereInput = {
      deletedAt: null, // Only non-deleted lists
    };

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (category) {
      whereConditions.categoryId = parseInt(category);
    }

    if (difficulty) {
      whereConditions.difficultyLevel = difficulty;
    }

    if (language) {
      // Filter by target language only (as part of dynamic language system)
      // User's base language comes from User model, lists only have target language
      whereConditions.targetLanguageCode = language;
    }

    if (isPublic !== undefined) {
      whereConditions.isPublic = isPublic;
    }

    // Build order by
    let orderBy: OrderByInput = {};
    if (sortBy === 'category') {
      orderBy = { category: { name: sortOrder } };
    } else if (sortBy === 'difficultyLevel') {
      orderBy = { difficultyLevel: sortOrder };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Get total count
    const totalCount = await prisma.list.count({ where: whereConditions });

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Fetch lists with all related data
    const lists = await prisma.list.findMany({
      where: whereConditions,
      include: {
        category: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        userLists: {
          select: {
            id: true,
            userId: true,
          },
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
          take: 5, // Only get first 5 words for sample
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    });

    // Transform data
    const listsWithDetails: ListWithDetails[] = lists.map((list) => {
      // Get sample words
      const sampleWords = list.listWords
        .slice(0, 3)
        .map((listWord) => {
          const wordDetails = listWord.definition.wordDetails[0]?.wordDetails;
          return wordDetails?.word.word ?? 'Unknown word';
        })
        .filter(Boolean);

      return {
        id: list.id,
        name: list.name,
        description: list.description,
        categoryId: list.categoryId,
        categoryName: list.category.name,
        categoryDescription: list.category.description,
        targetLanguageCode: list.targetLanguageCode,
        isPublic: list.isPublic,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        lastModified: list.lastModified,
        tags: list.tags,
        coverImageUrl: list.coverImageUrl,
        difficultyLevel: list.difficultyLevel,
        wordCount: list.wordCount,
        learnedWordCount: list.learnedWordCount,
        deletedAt: list.deletedAt,
        creatorCount: list.users.length,
        userListCount: list.userLists.length,
        sampleWords,
      };
    });

    return {
      lists: listsWithDetails,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  });
}

/**
 * Get detailed information about a single list
 */
export async function getListDetails(
  listId: string,
): Promise<ListWithDetails | null> {
  return safeDatabaseOperation(async () => {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        category: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        userLists: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
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
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!list) {
      return null;
    }

    // Get all words for this list
    const allWords = list.listWords
      .map((listWord) => {
        const wordDetails = listWord.definition.wordDetails[0]?.wordDetails;
        return wordDetails?.word.word ?? 'Unknown word';
      })
      .filter(Boolean);

    return {
      id: list.id,
      name: list.name,
      description: list.description,
      categoryId: list.categoryId,
      categoryName: list.category.name,
      categoryDescription: list.category.description,
      targetLanguageCode: list.targetLanguageCode,
      isPublic: list.isPublic,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      lastModified: list.lastModified,
      tags: list.tags,
      coverImageUrl: list.coverImageUrl,
      difficultyLevel: list.difficultyLevel,
      wordCount: list.wordCount,
      learnedWordCount: list.learnedWordCount,
      deletedAt: list.deletedAt,
      creatorCount: list.users.length,
      userListCount: list.userLists.length,
      sampleWords: allWords.slice(0, 10), // First 10 words for details view
    };
  });
}

/**
 * Update list information
 */
export async function updateList(
  listId: string,
  data: {
    name?: string;
    description?: string;
    categoryId?: number;
    difficultyLevel?: DifficultyLevel;
    isPublic?: boolean;
    tags?: string[];
    coverImageUrl?: string;
  },
): Promise<{ success: boolean; message: string }> {
  try {
    await safeDatabaseOperation(async () => {
      await prisma.list.update({
        where: { id: listId },
        data: {
          ...data,
          lastModified: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    revalidatePath('/admin/dictionaries/lists');
    void serverLog(`List ${listId} updated successfully`, 'info');

    return {
      success: true,
      message: 'List updated successfully',
    };
  } catch (error) {
    void serverLog(
      `Error updating list ${listId}: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    return {
      success: false,
      message: getDatabaseErrorMessage(error),
    };
  }
}

/**
 * Soft delete a list
 */
export async function deleteList(
  listId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await safeDatabaseOperation(async () => {
      await prisma.list.update({
        where: { id: listId },
        data: {
          deletedAt: new Date(),
          lastModified: new Date(),
        },
      });
    });

    revalidatePath('/admin/dictionaries/lists');
    void serverLog(`List ${listId} deleted successfully`, 'info');

    return {
      success: true,
      message: 'List deleted successfully',
    };
  } catch (error) {
    void serverLog(
      `Error deleting list ${listId}: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    return {
      success: false,
      message: getDatabaseErrorMessage(error),
    };
  }
}

/**
 * Restore a deleted list
 */
export async function restoreList(
  listId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await safeDatabaseOperation(async () => {
      await prisma.list.update({
        where: { id: listId },
        data: {
          deletedAt: null,
          lastModified: new Date(),
        },
      });
    });

    revalidatePath('/admin/dictionaries/lists');
    void serverLog(`List ${listId} restored successfully`, 'info');

    return {
      success: true,
      message: 'List restored successfully',
    };
  } catch (error) {
    void serverLog(
      `Error restoring list ${listId}: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    return {
      success: false,
      message: getDatabaseErrorMessage(error),
    };
  }
}

/**
 * Server action for updating list (form submission)
 */
export async function updateListAction(
  listId: string,
  prevState: { success: boolean; message: string } | null,
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const categoryId = parseInt(formData.get('categoryId') as string);
    const difficultyLevel = formData.get('difficultyLevel') as DifficultyLevel;
    const isPublic = formData.get('isPublic') === 'on';
    const tags =
      (formData.get('tags') as string)?.split(',').filter(Boolean) ?? [];
    const coverImageUrl = formData.get('coverImageUrl') as string;

    if (!name?.trim()) {
      return {
        success: false,
        message: 'List name is required',
      };
    }

    const updateData: {
      name: string;
      description?: string;
      categoryId: number;
      difficultyLevel: DifficultyLevel;
      isPublic: boolean;
      tags: string[];
      coverImageUrl?: string;
    } = {
      name: name.trim(),
      categoryId,
      difficultyLevel,
      isPublic,
      tags,
    };

    if (description?.trim()) {
      updateData.description = description.trim();
    }

    if (coverImageUrl?.trim()) {
      updateData.coverImageUrl = coverImageUrl.trim();
    }

    const result = await updateList(listId, updateData);

    if (result.success) {
      redirect('/admin/dictionaries/lists');
    }

    return result;
  } catch (error) {
    void serverLog(
      `Error in updateListAction: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    return {
      success: false,
      message: getDatabaseErrorMessage(error),
    };
  }
}
