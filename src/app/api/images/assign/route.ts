import { NextResponse } from 'next/server';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/lib/prisma';
import { ImageService } from '@/core/lib/services/imageService';
import { PexelsService } from '@/core/lib/services/pexelsService';

interface AssignImageRequest {
  imageId: number;
  definitionId: number;
}

export async function POST(request: Request) {
  // Ensure proper JSON content type in response
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    // Parse request body, handling potential syntax errors
    let body: AssignImageRequest;
    try {
      body = (await request.json()) as AssignImageRequest;
    } catch (parseError) {
      await serverLog('Error parsing request body', 'error', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { imageId, definitionId } = body;

    if (!imageId || !definitionId) {
      return NextResponse.json(
        { error: 'Image ID and Definition ID are required' },
        { status: 400, headers },
      );
    }

    try {
      const pexelsService = new PexelsService();
      const imageService = new ImageService();

      // Get the photo details from Pexels
      const photo = await pexelsService.getPhoto(imageId);

      if (!photo) {
        return NextResponse.json(
          { error: 'Failed to fetch image from provider' },
          { status: 502, headers },
        );
      }

      // Create or update the image in our database
      const image = await imageService.createFromPexels(photo, definitionId);

      if (!image) {
        return NextResponse.json(
          { error: 'Failed to create image in database' },
          { status: 500, headers },
        );
      }

      try {
        // Update the definition with the new image
        await prisma.definition.update({
          where: { id: definitionId },
          data: { imageId: image.id },
        });
      } catch (dbError) {
        await serverLog('Error updating definition', 'error', dbError);
        return NextResponse.json(
          { error: 'Failed to update definition with image' },
          { status: 500, headers },
        );
      }

      return NextResponse.json({ success: true, image }, { headers });
    } catch (apiError) {
      await serverLog('API integration error', 'error', apiError);
      return NextResponse.json(
        { error: 'Service integration failed' },
        { status: 502, headers },
      );
    }
  } catch (error) {
    await serverLog('Error assigning image', 'error', error);
    return NextResponse.json(
      { error: 'Failed to assign image' },
      { status: 500, headers },
    );
  }
}
