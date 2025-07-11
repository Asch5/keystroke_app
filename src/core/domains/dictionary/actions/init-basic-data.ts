'use server';

import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/lib/prisma';

/**
 * Initialize basic categories if none exist
 */
export async function initializeBasicCategories(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Check if categories already exist
    const existingCategories = await prisma.category.findMany();
    if (existingCategories.length > 0) {
      return {
        success: true,
        message: `Categories already exist (${existingCategories.length} found)`,
      };
    }

    // Create basic categories
    const basicCategories = [
      {
        name: 'General Vocabulary',
        description: 'Common words and everyday vocabulary',
      },
      {
        name: 'Business & Professional',
        description: 'Workplace and business terminology',
      },
      {
        name: 'Travel & Tourism',
        description: 'Travel-related vocabulary and phrases',
      },
    ];

    const createdCategories = await prisma.category.createMany({
      data: basicCategories,
      skipDuplicates: true,
    });

    void serverLog(
      `Created ${createdCategories.count} basic categories`,
      'info',
    );

    return {
      success: true,
      message: `Successfully created ${createdCategories.count} basic categories`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    void serverLog(
      `Failed to create basic categories: ${errorMessage}`,
      'error',
    );

    return {
      success: false,
      message: `Failed to create categories: ${errorMessage}`,
    };
  }
}
