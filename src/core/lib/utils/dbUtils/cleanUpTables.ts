'use server';

import { prisma } from '@/core/lib/prisma';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

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
        await serverLog('Table cleaned successfully', 'info', { tablename });
      } catch (tableError) {
        await serverLog('Error cleaning table', 'error', {
          tablename,
          error: tableError,
        });
        // Continue with other tables instead of throwing here
      }
    }

    await serverLog('All non-protected tables cleaned successfully', 'info');
    return { success: true };
  } catch (error) {
    await serverLog('Error in cleanTablesExceptUser', 'error', { error });
    throw error;
  }
}
