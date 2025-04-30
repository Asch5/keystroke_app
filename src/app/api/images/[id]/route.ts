import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const image = await prisma.image.findUnique({
      where: { id: parsedId },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Fetch the image and proxy it
    const imageResponse = await fetch(image.url);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch external image' },
        { status: 502 },
      );
    }

    // Return the image with appropriate headers
    const imageData = await imageResponse.blob();
    const contentType =
      imageResponse.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 },
    );
  }
}
