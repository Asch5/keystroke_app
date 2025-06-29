import { NextRequest, NextResponse } from 'next/server';
import { loadUserSettings } from '@/core/domains/user/actions/settings-sync-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const result = await loadUserSettings(userId || undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Settings load API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        data: null,
      },
      { status: 500 },
    );
  }
}
