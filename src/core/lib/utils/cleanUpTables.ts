'use server';

import { prisma } from '@/core/lib/prisma';

// Tables that should never be truncated
const PROTECTED_TABLES = [
  'User',
  'user',
  'Account',
  'Session',
  'VerificationToken',
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
        ${PROTECTED_TABLES[3]}, ${PROTECTED_TABLES[4]}, ${PROTECTED_TABLES[5]});
    `;

    // First disable triggers to avoid cascade issues
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;');

    // Process tables in sequence
    for (const { tablename } of tables) {
      try {
        // Use RESTRICT instead of CASCADE to prevent affecting protected tables
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${tablename}" RESTART IDENTITY;`,
        );
        console.log(`Successfully cleaned table: ${tablename}`);
      } catch (tableError) {
        console.error(`Error cleaning table ${tablename}:`, tableError);
        throw tableError;
      }
    }

    // Re-enable triggers
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');

    console.log('All non-protected tables cleaned successfully.');
    return { success: true };
  } catch (error) {
    // Make sure triggers are re-enabled even if there's an error
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
    console.error('Error in cleanTablesExceptUser:', error);
    throw error;
  }
}
