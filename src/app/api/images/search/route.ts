import { NextResponse } from 'next/server';
import { PexelsService } from '@/lib/services/pexelsService';
//import { ImageService } from '@/lib/services/imageService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 },
      );
    }

    const pexelsService = new PexelsService();
    // const imageService = new ImageService();

    const searchResponse = await pexelsService.searchImages(query);

    // Transform Pexels photos into our ImageMetadata format
    const images = searchResponse.photos.map((photo) => ({
      id: photo.id,
      url: photo.src.original,
      description: photo.alt,
      sizes: {
        thumbnail: photo.src.small,
        medium: photo.src.medium,
        large: photo.src.large,
      },
      alt: photo.alt,
      mimeType: 'image/jpeg',
      fileSize: 0,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error searching images:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 },
    );
  }
}
