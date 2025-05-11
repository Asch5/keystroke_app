import { NextResponse } from 'next/server';
import { PexelsService } from '@/core/lib/services/pexelsService';
//import { ImageService } from '@/lib/services/imageService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required', images: [] },
        { status: 400 },
      );
    }

    // Ensure headers are set correctly for JSON response
    const headers = {
      'Content-Type': 'application/json',
    };

    try {
      const pexelsService = new PexelsService();
      const searchResponse = await pexelsService.searchImages(query);

      // Check if searchResponse is valid and has photos property
      if (
        !searchResponse ||
        typeof searchResponse !== 'object' ||
        !Array.isArray(searchResponse.photos)
      ) {
        console.error(
          'Invalid search response from Pexels:',
          JSON.stringify(searchResponse),
        );
        return NextResponse.json(
          { error: 'Invalid response from image service', images: [] },
          { status: 500, headers },
        );
      }

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
        alt: photo.alt || 'Image',
        mimeType: 'image/jpeg',
        fileSize: 0,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
      }));

      return NextResponse.json({ images }, { headers });
    } catch (pexelsError) {
      console.error('Error from Pexels API:', pexelsError);
      return NextResponse.json(
        { error: 'Failed to fetch images from provider', images: [] },
        { status: 502, headers },
      );
    }
  } catch (error) {
    console.error('Error searching images:', error);
    return NextResponse.json(
      { error: 'Failed to search images', images: [] },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
