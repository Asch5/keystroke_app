import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addSessionItem } from '@/core/domains/user/actions/session-actions';
import type { AddSessionItemRequest } from '@/core/domains/user/types/session';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

/**
 * POST /api/sessions/[sessionId]/items - Add a session item
 */
export async function POST(
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
    const body: AddSessionItemRequest = await request.json();

    // Validate required fields
    if (!body.userDictionaryId) {
      return NextResponse.json(
        { error: 'User dictionary ID is required' },
        { status: 400 },
      );
    }

    if (typeof body.isCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'isCorrect field is required and must be boolean' },
        { status: 400 },
      );
    }

    void serverLog(`Adding session item to session ${sessionId}`, 'info', {
      userId: session.user.id,
      sessionId,
      userDictionaryId: body.userDictionaryId,
      isCorrect: body.isCorrect,
    });

    // Add session item
    const result = await addSessionItem(sessionId, body);

    if (!result.success) {
      void serverLog(`Failed to add session item: ${result.error}`, 'error');
      return NextResponse.json(
        { error: result.error || 'Failed to add session item' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        item: result.item,
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error) {
    void serverLog(
      `API error in POST /api/sessions/[sessionId]/items: ${error}`,
      'error',
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
