'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/core/lib/prisma';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { LanguageCode, DifficultyLevel, PartOfSpeech } from '@prisma/client';

// Types for list management
export interface CategoryData {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateListData {
  name: string;
  description?: string;
  categoryId: number;
  baseLanguageCode: LanguageCode;
  targetLanguageCode: LanguageCode;
  difficultyLevel: DifficultyLevel;
  isPublic: boolean;
  tags: string[];
  coverImageUrl?: string;
  selectedDefinitionIds: number[];
}

export interface ListWordData {
  listId: string;
  definitionId: number;
  orderIndex: number;
}

// Add new interface for list word with details
export interface AdminListWordWithDetails {
  listId: string;
  definitionId: number;
  orderIndex: number;
  // Word details
  word: string;
  definition: string;
  partOfSpeech: PartOfSpeech | null;
  phoneticTranscription: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  // Metadata
  wordId: number;
  wordDetailId: number;
}

/**
 * Fetch all categories for list creation
 */
export async function fetchCategories(): Promise<{
  success: boolean;
  categories?: CategoryData[];
  error?: string;
}> {
  try {
    serverLog('Fetching categories for list creation', 'info');

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    serverLog(`Fetched ${categories.length} categories`, 'info');

    return {
      success: true,
      categories,
    };
  } catch (error) {
    const errorResponse = handlePrismaError(error);
    serverLog(`Failed to fetch categories: ${errorResponse.message}`, 'error');

    return {
      success: false,
      error: errorResponse.message,
    };
  }
}

/**
 * Create a new list with selected words
 */
export async function createListWithWords(listData: CreateListData): Promise<{
  success: boolean;
  listId?: string;
  error?: string;
}> {
  try {
    serverLog('Creating new list with words', 'info', {
      name: listData.name,
      categoryId: listData.categoryId,
      wordCount: listData.selectedDefinitionIds.length,
    });

    const result = await prisma.$transaction(async (tx) => {
      // Create the list
      const list = await tx.list.create({
        data: {
          name: listData.name,
          description: listData.description || null,
          categoryId: listData.categoryId,
          baseLanguageCode: listData.baseLanguageCode,
          targetLanguageCode: listData.targetLanguageCode,
          difficultyLevel: listData.difficultyLevel,
          isPublic: listData.isPublic,
          tags: listData.tags,
          coverImageUrl: listData.coverImageUrl || null,
          wordCount: listData.selectedDefinitionIds.length,
          learnedWordCount: 0,
        },
      });

      // Create ListWord relationships
      const listWords = listData.selectedDefinitionIds.map(
        (definitionId, index) => ({
          listId: list.id,
          definitionId,
          orderIndex: index + 1,
        }),
      );

      await tx.listWord.createMany({
        data: listWords,
      });

      return list;
    });

    // Revalidate relevant cache tags
    revalidateTag('lists');
    revalidateTag(`category-lists-${listData.categoryId}`);

    serverLog(`List created successfully: ${result.id}`, 'info');

    return {
      success: true,
      listId: result.id,
    };
  } catch (error) {
    const errorResponse = handlePrismaError(error);
    serverLog(`Failed to create list: ${errorResponse.message}`, 'error', {
      listName: listData.name,
      error: errorResponse.message,
    });

    return {
      success: false,
      error: errorResponse.message,
    };
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  description?: string,
): Promise<{
  success: boolean;
  category?: CategoryData;
  error?: string;
}> {
  try {
    serverLog('Creating new category', 'info', { name });

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // Revalidate cache
    revalidateTag('categories');

    serverLog(`Category created successfully: ${category.id}`, 'info');

    return {
      success: true,
      category,
    };
  } catch (error) {
    const errorResponse = handlePrismaError(error);
    serverLog(`Failed to create category: ${errorResponse.message}`, 'error');

    return {
      success: false,
      error: errorResponse.message,
    };
  }
}

/**
 * Server action to handle list creation and redirect
 */
export async function createListAction(
  prevState: { message: string; success: boolean } | null,
  formData: FormData,
): Promise<{ message: string; success: boolean }> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const categoryId = parseInt(formData.get('categoryId') as string);
    const baseLanguageCode = formData.get('baseLanguageCode') as LanguageCode;
    const targetLanguageCode = formData.get(
      'targetLanguageCode',
    ) as LanguageCode;
    const difficultyLevel = formData.get('difficultyLevel') as DifficultyLevel;
    const isPublic = formData.get('isPublic') === 'true';
    const tags =
      (formData.get('tags') as string)
        ?.split(',')
        .map((tag) => tag.trim())
        .filter(Boolean) || [];
    const coverImageUrl = formData.get('coverImageUrl') as string;
    const selectedDefinitionIds =
      (formData.get('selectedDefinitionIds') as string)
        ?.split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id)) || [];

    if (!name?.trim()) {
      return { message: 'List name is required', success: false };
    }

    if (isNaN(categoryId)) {
      return { message: 'Valid category is required', success: false };
    }

    if (selectedDefinitionIds.length === 0) {
      return { message: 'At least one word must be selected', success: false };
    }

    const result = await createListWithWords({
      name: name.trim(),
      description: description?.trim(),
      categoryId,
      baseLanguageCode,
      targetLanguageCode,
      difficultyLevel,
      isPublic,
      tags,
      coverImageUrl: coverImageUrl?.trim(),
      selectedDefinitionIds,
    });

    if (!result.success) {
      return {
        message: result.error || 'Failed to create list',
        success: false,
      };
    }

    serverLog(
      `List creation successful, redirecting to list: ${result.listId}`,
      'info',
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    serverLog(`List creation action failed: ${errorMessage}`, 'error');
    return { message: errorMessage, success: false };
  }

  // If we get here, creation was successful - redirect
  redirect('/admin/dictionaries?created=true');
}

/**
 * Add words to existing list with language validation
 */
export async function addWordsToList(
  listId: string,
  definitionIds: number[],
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    serverLog('Adding words to existing list', 'info', {
      listId,
      wordCount: definitionIds.length,
    });

    await prisma.$transaction(async (tx) => {
      // First, get the list details to check its languages
      const list = await tx.list.findUnique({
        where: { id: listId },
        select: {
          id: true,
          name: true,
          baseLanguageCode: true,
          targetLanguageCode: true,
        },
      });

      if (!list) {
        throw new Error('List not found');
      }

      // Validate that all words being added match the list's languages
      const wordsToValidate = await tx.definition.findMany({
        where: {
          id: { in: definitionIds },
        },
        include: {
          wordDetails: {
            include: {
              wordDetails: {
                include: {
                  word: {
                    select: {
                      languageCode: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Check language compatibility
      const incompatibleWords = wordsToValidate.filter((definition) => {
        const word = definition.wordDetails[0]?.wordDetails?.word;
        if (!word) return true; // Skip if word data is missing

        // Check if the word's language matches either of the list's languages
        const wordMatchesListLanguages =
          word.languageCode === list.baseLanguageCode ||
          word.languageCode === list.targetLanguageCode;

        return !wordMatchesListLanguages;
      });

      if (incompatibleWords.length > 0) {
        const listLanguages = `${list.baseLanguageCode}-${list.targetLanguageCode}`;
        throw new Error(
          `Cannot add words to list "${list.name}". ${incompatibleWords.length} word(s) have incompatible languages. List supports: ${listLanguages}`,
        );
      }

      // Get current max order index
      const maxOrder = await tx.listWord.findFirst({
        where: { listId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });

      const startIndex = (maxOrder?.orderIndex || 0) + 1;

      // Create new ListWord relationships
      const listWords = definitionIds.map((definitionId, index) => ({
        listId,
        definitionId,
        orderIndex: startIndex + index,
      }));

      await tx.listWord.createMany({
        data: listWords,
        skipDuplicates: true, // Skip if word already exists in list
      });

      // Update word count
      await tx.list.update({
        where: { id: listId },
        data: {
          wordCount: {
            increment: definitionIds.length,
          },
          lastModified: new Date(),
        },
      });
    });

    // Revalidate cache
    revalidateTag(`list-${listId}`);
    revalidateTag('lists');

    serverLog(`Words added to list successfully: ${listId}`, 'info');

    return { success: true };
  } catch (error) {
    const errorResponse = handlePrismaError(error);
    serverLog(`Failed to add words to list: ${errorResponse.message}`, 'error');

    return {
      success: false,
      error: errorResponse.message,
    };
  }
}

/**
 * Get all words in a list with full details for admin management
 */
export async function getListWords(
  listId: string,
  options: {
    search?: string;
    sortBy?: 'word' | 'orderIndex' | 'partOfSpeech';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {},
): Promise<{
  words: AdminListWordWithDetails[];
  totalCount: number;
  listDetails: {
    id: string;
    name: string;
    description: string | null;
    wordCount: number;
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

    // First check if the list exists
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: {
        id: true,
        name: true,
        description: true,
        wordCount: true,
      },
    });

    if (!list) {
      return {
        words: [],
        totalCount: 0,
        listDetails: null,
      };
    }

    // Build where conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {
      listId,
    };

    // Add search condition if provided
    if (search) {
      whereConditions.definition = {
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
      };
    }

    // Build orderBy conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = {};

    switch (sortBy) {
      case 'word':
        orderBy = {
          definition: {
            wordDetails: {
              wordDetails: {
                word: {
                  word: sortOrder,
                },
              },
            },
          },
        };
        break;
      case 'partOfSpeech':
        orderBy = {
          definition: {
            wordDetails: {
              wordDetails: {
                partOfSpeech: sortOrder,
              },
            },
          },
        };
        break;
      case 'orderIndex':
      default:
        orderBy = { orderIndex: sortOrder };
        break;
    }

    // Get total count
    const totalCount = await prisma.listWord.count({
      where: whereConditions,
    });

    // Fetch list words with all related data
    const listWords = await prisma.listWord.findMany({
      where: whereConditions,
      include: {
        definition: {
          include: {
            wordDetails: {
              include: {
                wordDetails: {
                  include: {
                    word: true,
                    // Include audio from WordDetailsAudio
                    audioLinks: {
                      include: {
                        audio: true,
                      },
                      where: {
                        isPrimary: true, // Only get primary audio
                      },
                    },
                  },
                },
              },
            },
            image: true,
          },
        },
      },
      orderBy,
      ...(limit && { take: limit }),
      ...(offset && { skip: offset }),
    });

    // Transform data
    const words: AdminListWordWithDetails[] = listWords.map((listWord) => {
      const definition = listWord.definition;
      const wordDetails = definition.wordDetails[0]?.wordDetails;
      const word = wordDetails?.word;

      // Get primary audio URL from database
      const primaryAudio = wordDetails?.audioLinks?.[0]?.audio;
      const audioUrl = primaryAudio?.url || null;
      const imageUrl = definition.image?.url || null;

      return {
        listId: listWord.listId,
        definitionId: listWord.definitionId,
        orderIndex: listWord.orderIndex,

        // Word details
        word: word?.word || 'Unknown word',
        definition: definition.definition,
        partOfSpeech: wordDetails?.partOfSpeech || null,
        phoneticTranscription: wordDetails?.phonetic || null,
        audioUrl,
        imageUrl,

        // Metadata
        wordId: word?.id || 0,
        wordDetailId: wordDetails?.id || 0,
      };
    });

    return {
      words,
      totalCount,
      listDetails: list,
    };
  } catch (error) {
    console.error('Error fetching list words:', error);
    throw new Error('Failed to fetch list words');
  }
}

/**
 * Remove words from a list
 */
export async function removeWordsFromList(
  listId: string,
  definitionIds: number[],
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Remove the words from the list
      await tx.listWord.deleteMany({
        where: {
          listId,
          definitionId: {
            in: definitionIds,
          },
        },
      });

      // Update word count
      await tx.list.update({
        where: { id: listId },
        data: {
          wordCount: {
            decrement: definitionIds.length,
          },
          lastModified: new Date(),
        },
      });
    });

    // Revalidate cache
    revalidateTag(`list-${listId}`);
    revalidateTag('lists');

    return { success: true, message: 'Words removed from list successfully' };
  } catch (error) {
    console.error('Error removing words from list:', error);
    return { success: false, message: 'Failed to remove words from list' };
  }
}
