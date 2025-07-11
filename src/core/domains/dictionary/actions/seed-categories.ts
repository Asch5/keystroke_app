'use server';

import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/lib/prisma';

// Default categories to seed
const defaultCategories = [
  {
    name: 'General Vocabulary',
    description: 'Common words for everyday use',
  },
  {
    name: 'Business & Work',
    description: 'Professional and workplace vocabulary',
  },
  {
    name: 'Travel & Tourism',
    description: 'Words related to travel and tourism',
  },
  {
    name: 'Food & Cooking',
    description: 'Culinary vocabulary and cooking terms',
  },
  {
    name: 'Science & Technology',
    description: 'Technical and scientific terminology',
  },
  {
    name: 'Arts & Culture',
    description: 'Words related to arts, culture, and entertainment',
  },
  {
    name: 'Sports & Health',
    description: 'Sports, fitness, and health-related vocabulary',
  },
  {
    name: 'Academic',
    description: 'Educational and academic vocabulary',
  },
];

/**
 * Seed default categories if they don't exist
 */
export async function seedDefaultCategories(): Promise<{
  success: boolean;
  message: string;
  categoriesCreated: number;
}> {
  try {
    void serverLog('Starting to seed default categories', 'info');

    let categoriesCreated = 0;

    for (const category of defaultCategories) {
      // Check if category already exists
      const existingCategory = await prisma.category.findUnique({
        where: { name: category.name },
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: category,
        });
        categoriesCreated++;
        void serverLog(`Created category: ${category.name}`, 'info');
      }
    }

    const message =
      categoriesCreated > 0
        ? `Successfully created ${categoriesCreated} new categories`
        : 'All default categories already exist';

    void serverLog(message, 'info');

    return {
      success: true,
      message,
      categoriesCreated,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    void serverLog(`Failed to seed categories: ${errorMessage}`, 'error');

    return {
      success: false,
      message: `Failed to seed categories: ${errorMessage}`,
      categoriesCreated: 0,
    };
  }
}

/**
 * Server action to trigger category seeding
 */
export async function seedCategoriesAction(): Promise<{
  success: boolean;
  message: string;
}> {
  const result = await seedDefaultCategories();
  return {
    success: result.success,
    message: result.message,
  };
}
