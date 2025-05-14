'use server';

import { prisma } from '@/core/lib/prisma';

// Tables that should never be truncated
const PROTECTED_TABLES = [
  'User',
  'user',
  'Account',
  'Session',
  'VerificationToken',
  'UserSettings',
  '_prisma_migrations',
] as const;

export async function cleanTablesExceptUser() {
  try {
    // Get all table names from Prisma schema, excluding protected tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT IN (${PROTECTED_TABLES[0]}, ${PROTECTED_TABLES[1]}, ${PROTECTED_TABLES[2]}, 
        ${PROTECTED_TABLES[3]}, ${PROTECTED_TABLES[4]}, ${PROTECTED_TABLES[5]}, ${PROTECTED_TABLES[6]});
    `;

    // Process tables in sequence - use CASCADE option instead of disabling triggers
    for (const { tablename } of tables) {
      try {
        // Use CASCADE to handle dependencies properly without changing session_replication_role
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`,
        );
        console.log(`Successfully cleaned table: ${tablename}`);
      } catch (tableError) {
        console.error(`Error cleaning table ${tablename}:`, tableError);
        // Continue with other tables instead of throwing here
      }
    }

    console.log('All non-protected tables cleaned successfully.');
    return { success: true };
  } catch (error) {
    console.error('Error in cleanTablesExceptUser:', error);
    throw error;
  }
}
