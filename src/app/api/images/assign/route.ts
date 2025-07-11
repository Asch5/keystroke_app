import { NextResponse } from 'next/server';
import { prisma } from '@/core/lib/prisma';
import { ImageService } from '@/core/lib/services/imageService';
import { PexelsService } from '@/core/lib/services/pexelsService';

export async function POST(request: Request) {
  // Ensure proper JSON content type in response
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    // Parse request body, handling potential syntax errors
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers },
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
        console.error('Error updating definition:', dbError);
        return NextResponse.json(
          { error: 'Failed to update definition with image' },
          { status: 500, headers },
        );
      }

      return NextResponse.json({ success: true, image }, { headers });
    } catch (apiError) {
      console.error('API integration error:', apiError);
      return NextResponse.json(
        { error: 'Service integration failed' },
        { status: 502, headers },
      );
    }
  } catch (error) {
    console.error('Error assigning image:', error);
    return NextResponse.json(
      { error: 'Failed to assign image' },
      { status: 500, headers },
    );
  }
}
