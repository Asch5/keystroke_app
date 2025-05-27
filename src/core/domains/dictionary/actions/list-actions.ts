'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/core/lib/prisma';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { handlePrismaError } from '@/core/shared/database/error-handler';
import { LanguageCode, DifficultyLevel } from '@prisma/client';

// Types for list management
export interface CategoryData {
  id: number;
  name: string;
  description?: string;
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
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to fetch categories: ${errorMessage}`, 'error');

    return {
      success: false,
      error: errorMessage,
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
          description: listData.description,
          categoryId: listData.categoryId,
          baseLanguageCode: listData.baseLanguageCode,
          targetLanguageCode: listData.targetLanguageCode,
          difficultyLevel: listData.difficultyLevel,
          isPublic: listData.isPublic,
          tags: listData.tags,
          coverImageUrl: listData.coverImageUrl,
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
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to create list: ${errorMessage}`, 'error', {
      listName: listData.name,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
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
        description: description?.trim(),
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
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to create category: ${errorMessage}`, 'error');

    return {
      success: false,
      error: errorMessage,
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
 * Add words to existing list
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
    const errorMessage = handlePrismaError(error);
    serverLog(`Failed to add words to list: ${errorMessage}`, 'error');

    return {
      success: false,
      error: errorMessage,
    };
  }
}
