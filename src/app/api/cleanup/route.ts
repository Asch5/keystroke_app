import { NextRequest, NextResponse } from 'next/server';
import { DbCleanupService } from '@/core/lib/utils/dbCleanupService';

/**
 * API route to trigger database cleanup tasks
 * POST /api/cleanup - Run all cleanup tasks
 * POST /api/cleanup?type=audio - Run only audio cleanup
 *
 * Required headers:
 * - x-api-key: Must match the API_SECRET_KEY environment variable
 */
export async function POST(request: NextRequest) {
  // Security: Validate API key
  const apiKey = request.headers.get('x-api-key');
  const validApiKey =
    process.env.API_SECRET_KEY || 'default-dev-key-do-not-use-in-production';

  if (apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or missing API key.' },
      { status: 403 },
    );
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const cleanupType = searchParams.get('type');

  const cleanupService = DbCleanupService.getInstance();

  try {
    let result;

    if (cleanupType === 'audio') {
      // Run only audio cleanup
      const count = await cleanupService.runAudioCleanup();
      result = {
        success: true,
        message: `Cleaned up ${count} orphaned audio records`,
      };
    } else {
      // Run all cleanup tasks
      await cleanupService.runAllCleanupTasks();
      result = {
        success: true,
        message: 'All cleanup tasks completed successfully',
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json(
      { error: 'Cleanup operation failed', details: (error as Error).message },
      { status: 500 },
    );
  }
}
