import {
  createClient,
  type PexelsApi,
  type Photo as PexelsPhoto,
  type PhotosSearchResponse,
  type PhotosSearchParams,
  type ErrorResponse,
} from 'pexels';
import {
  debugLog,
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';
import { env } from '@/env.mjs';

// Export types for backward compatibility
export type { PexelsPhoto };

/**
 * Extended search options that match our current API
 */
export interface PexelsSearchOptions {
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  locale?: string;
  page?: number;
  per_page?: number;
}

/**
 * Extended search response that matches our current API
 */
export interface PexelsSearchResponse {
  total_results?: number;
  page?: number;
  per_page?: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

/**
 * Service for interacting with the Pexels API using the official library
 */
export class PexelsService {
  private readonly client: PexelsApi;

  constructor() {
    const apiKey = env.PEXELS_API_KEY;
    if (!apiKey) {
      throw new Error('Pexels API key is not configured');
    }
    this.client = createClient(apiKey);
  }

  /**
   * Search for images using the Pexels API
   */
  async searchImages(
    query: string,
    options: PexelsSearchOptions = {},
  ): Promise<PexelsSearchResponse> {
    try {
      await debugLog('Searching Pexels for images', { query, options });

      const searchParams: PhotosSearchParams = {
        query,
        orientation: options.orientation || 'portrait',
        size: options.size || 'small',
        locale: options.locale || 'en-US',
        page: options.page || 1,
        per_page: options.per_page || 15,
      };

      const response = await this.client.photos.search(searchParams);

      // Check if there's an error in the response
      if ('error' in response) {
        const errorResponse = response;
        await errorLog('Pexels API error occurred', {
          error: errorResponse.error,
          query,
          options,
        });
        throw new Error(`Pexels API error: ${errorResponse.error}`);
      }

      // Validate the response structure
      const searchResponse = response;
      if (!searchResponse || !Array.isArray(searchResponse.photos)) {
        await errorLog('Invalid response structure from Pexels', { response });
        return { photos: [] };
      }

      await infoLog('Pexels search completed successfully', {
        query,
        photosFound: searchResponse.photos.length,
      });

      // Return the response with our interface structure
      return {
        total_results: searchResponse.total_results,
        page: searchResponse.page,
        per_page: searchResponse.per_page,
        photos: searchResponse.photos,
        ...(searchResponse.next_page && {
          next_page: searchResponse.next_page,
        }),
      };
    } catch (error) {
      await errorLog('Error searching Pexels images', {
        error,
        query,
        options,
      });
      // Return empty response in case of error to avoid breaking the application
      return { photos: [] };
    }
  }

  /**
   * Get a single photo by ID
   */
  async getPhoto(id: number): Promise<PexelsPhoto | null> {
    try {
      await debugLog('Fetching Pexels photo by ID', { photoId: id });

      const response = await this.client.photos.show({ id });

      // Check if there's an error
      if ('error' in response) {
        throw new Error(`Pexels API error: ${response.error}`);
      }

      await infoLog('Pexels photo fetched successfully', { photoId: id });

      return response;
    } catch (error) {
      await errorLog('Error fetching Pexels photo', { error, photoId: id });
      return null;
    }
  }
}
