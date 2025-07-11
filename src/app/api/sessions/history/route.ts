import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSessionHistory } from '@/core/domains/user/actions/session-actions';
import type { SessionFilterOptions } from '@/core/domains/user/types/session';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { SessionType } from '@/core/types';

/**
 * GET /api/sessions/history - Get paginated session history with filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') ?? '20', 10),
      100, // Maximum page size
    );

    // Parse filter parameters
    const filters: SessionFilterOptions = {};

    const sessionType = searchParams.get('sessionType');
    if (
      sessionType &&
      Object.values(SessionType).includes(sessionType as SessionType)
    ) {
      filters.sessionType = sessionType as SessionType;
    }

    const userListId = searchParams.get('userListId');
    if (userListId) {
      filters.userListId = userListId;
    }

    const listId = searchParams.get('listId');
    if (listId) {
      filters.listId = listId;
    }

    const startDate = searchParams.get('startDate');
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        filters.startDate = parsedStartDate;
      }
    }

    const endDate = searchParams.get('endDate');
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        filters.endDate = parsedEndDate;
      }
    }

    // Get userId from query params (for admin) or use authenticated user
    const queryUserId = searchParams.get('userId');
    const userId =
      queryUserId === session.user.id ? queryUserId : session.user.id;

    void serverLog(`Fetching session history for user ${userId}`, 'info', {
      userId,
      page,
      pageSize,
      filters,
    });

    // Validate pagination
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be greater than 0' },
        { status: 400 },
      );
    }

    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Page size must be between 1 and 100' },
        { status: 400 },
      );
    }

    // Get session history
    const result = await getSessionHistory(userId, page, pageSize, filters);

    if (!result.success) {
      void serverLog(
        `Failed to fetch session history: ${result.error}`,
        'error',
      );
      return NextResponse.json(
        { error: result.error ?? 'Failed to fetch session history' },
        { status: 500 },
      );
    }

    // Calculate cache duration based on page (recent data cached less)
    const cacheMaxAge = page === 1 ? 60 : 300; // 1 min for recent, 5 min for older

    return NextResponse.json(result.data, {
      headers: {
        'Cache-Control': `private, max-age=${cacheMaxAge}`,
        'Cache-Tags': `user-sessions-${userId}`,
      },
    });
  } catch (error) {
    void serverLog(
      `API error in GET /api/sessions/history: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
