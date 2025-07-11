import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateLearningSession } from '@/core/domains/user/actions/session-actions';
import type { UpdateSessionRequest } from '@/core/domains/user/types/session';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

/**
 * PATCH /api/sessions/[sessionId] - Update a learning session
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;

    // Parse request body
    const body: UpdateSessionRequest = await request.json();

    void serverLog(`Updating learning session ${sessionId}`, 'info', {
      userId: session.user.id,
      sessionId,
      updates: body,
    });

    // Update session
    const result = await updateLearningSession(sessionId, body);

    if (!result.success) {
      void serverLog(`Failed to update session: ${result.error}`, 'error');
      return NextResponse.json(
        { error: result.error || 'Failed to update session' },
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
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    void serverLog(
      `API error in PATCH /api/sessions/[sessionId]: ${error}`,
      'error',
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
