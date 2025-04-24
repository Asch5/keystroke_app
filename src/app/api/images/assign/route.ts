import { NextResponse } from 'next/server';
import { PexelsService } from '@/lib/services/pexelsService';
import { ImageService } from '@/lib/services/imageService';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { imageId, definitionId } = await request.json();

    if (!imageId || !definitionId) {
      return NextResponse.json(
        { error: 'Image ID and Definition ID are required' },
        { status: 400 },
      );
    }

    const pexelsService = new PexelsService();
    const imageService = new ImageService();

    // Get the photo details from Pexels
    const photo = await pexelsService.getPhoto(imageId);

    // Create or update the image in our database
    const image = await imageService.createFromPexels(photo, definitionId);

    // Update the definition with the new image
    await prisma.definition.update({
      where: { id: definitionId },
      data: { imageId: image.id },
    });

    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error('Error assigning image:', error);
    return NextResponse.json(
      { error: 'Failed to assign image' },
      { status: 500 },
    );
  }
}
