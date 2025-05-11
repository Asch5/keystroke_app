'use server';

import { cleanTablesExceptUser } from '@/core/lib/utils/dbUtils/cleanUpTables';

export async function cleanupDatabase() {
  try {
    await cleanTablesExceptUser();
    return { success: true, error: null };
  } catch (error) {
    console.error('Error cleaning database:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
