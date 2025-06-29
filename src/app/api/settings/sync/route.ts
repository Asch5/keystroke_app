import { NextRequest, NextResponse } from 'next/server';
import { syncUserSettings } from '@/core/domains/user/actions/settings-sync-actions';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const result = await syncUserSettings(data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Settings sync API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
