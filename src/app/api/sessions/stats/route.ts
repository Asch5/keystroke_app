import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSessionStats } from '@/core/domains/user/actions/session-actions';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

/**
 * GET /api/sessions/stats - Get session statistics for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get userId from query params (for admin) or use authenticated user
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    // Use provided userId only if it matches the authenticated user
    // (Admin functionality could be added later with role checks)
    const userId =
      queryUserId === session.user.id ? queryUserId : session.user.id;

    void serverLog(`Fetching session stats for user ${userId}`, 'info', {
      requestedUserId: queryUserId,
      authenticatedUserId: session.user.id,
      finalUserId: userId,
    });

    // Get session statistics
    const result = await getSessionStats(userId);

    if (!result.success) {
      void serverLog(`Failed to fetch session stats: ${result.error}`, 'error');
      return NextResponse.json(
        { error: result.error ?? 'Failed to fetch session statistics' },
        { status: 500 },
      );
    }

    return NextResponse.json(result.stats, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'Cache-Tags': `session-stats-${userId}`,
      },
    });
  } catch (error) {
    void serverLog(
      `API error in GET /api/sessions/stats: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
