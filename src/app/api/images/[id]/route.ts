import { NextResponse } from 'next/server';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const startTime = Date.now();
  let imageId: string | undefined;

  try {
    const { id } = await params;
    imageId = id;
    const parsedId = parseInt(id);

    void serverLog(`🖼️ Image API: Requesting image ID ${id}`, 'info', {
      imageId: id,
      parsedId,
    });

    if (isNaN(parsedId)) {
      void serverLog(`❌ Image API: Invalid image ID format: ${id}`, 'error', {
        imageId: id,
      });
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const image = await prisma.image.findUnique({
      where: { id: parsedId },
    });

    if (!image) {
      void serverLog(
        `❌ Image API: Image not found in database: ${parsedId}`,
        'error',
        { imageId: parsedId },
      );
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    void serverLog(
      `📍 Image API: Found image in database, fetching from: ${image.url}`,
      'info',
      { imageId: parsedId, imageUrl: image.url },
    );

    // Fetch the image and proxy it
    const imageResponse = await fetch(image.url);

    if (!imageResponse.ok) {
      void serverLog(
        `❌ Image API: Failed to fetch external image: ${image.url} - Status: ${imageResponse.status} ${imageResponse.statusText}`,
        'error',
        {
          imageId: parsedId,
          imageUrl: image.url,
          status: imageResponse.status,
          statusText: imageResponse.statusText,
        },
      );
      return NextResponse.json(
        { error: 'Failed to fetch external image' },
        { status: 502 },
      );
    }

    // Return the image with appropriate headers
    const imageData = await imageResponse.blob();
    const contentType =
      imageResponse.headers.get('content-type') ?? 'image/jpeg';

    const duration = Date.now() - startTime;

    void serverLog(
      `✅ Image API: Successfully served image ${parsedId} in ${duration}ms`,
      'info',
      {
        imageId: parsedId,
        contentType,
        size: imageData.size,
        duration,
      },
    );

    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    void serverLog(
      `💥 Image API: Error fetching image ${imageId ?? 'unknown'}: ${errorMessage}`,
      'error',
      {
        imageId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        duration,
      },
    );

    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 },
    );
  }
}
