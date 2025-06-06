import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get('url');

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 },
      );
    }

    // Validate that the URL is from allowed domains (security measure)
    const allowedDomains = [
      'static.ordnet.dk',
      'static.ordbog.com',
      // Add other trusted audio domains here
    ];

    const url = new URL(audioUrl);
    if (!allowedDomains.includes(url.hostname)) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 },
      );
    }

    // Fetch the audio file
    const response = await fetch(audioUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'audio/*,*/*;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch audio from ${audioUrl}: ${response.status} ${response.statusText}`,
      );
      return NextResponse.json(
        { error: `Failed to fetch audio: ${response.status}` },
        { status: response.status },
      );
    }

    // Get the audio content
    const audioBuffer = await response.arrayBuffer();

    // Return the audio with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Audio proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy audio file' },
      { status: 500 },
    );
  }
}
