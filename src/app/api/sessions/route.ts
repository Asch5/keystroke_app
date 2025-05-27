import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createLearningSession } from '@/core/domains/user/actions/session-actions';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import type { CreateSessionRequest } from '@/core/domains/user/types/session';

/**
 * POST /api/sessions - Create a new learning session
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: CreateSessionRequest = await request.json();

    // Validate required fields
    if (!body.sessionType) {
      return NextResponse.json(
        { error: 'Session type is required' },
        { status: 400 },
      );
    }

    serverLog('Creating new learning session', 'info', {
      userId: session.user.id,
      sessionType: body.sessionType,
      userListId: body.userListId,
      listId: body.listId,
    });

    // Create session
    const result = await createLearningSession(session.user.id, body);

    if (!result.success) {
      serverLog(`Failed to create session: ${result.error}`, 'error');
      return NextResponse.json(
        { error: result.error || 'Failed to create session' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        session: result.session,
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    serverLog(`API error in POST /api/sessions: ${error}`, 'error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/sessions - Get current active session
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { getCurrentSession } = await import(
      '@/core/domains/user/actions/session-actions'
    );

    // Get current session
    const result = await getCurrentSession(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get current session' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        session: result.session,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        },
      },
    );
  } catch (error) {
    serverLog(`API error in GET /api/sessions: ${error}`, 'error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
