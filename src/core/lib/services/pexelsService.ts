import { env } from '@/env.mjs';
import { createClient } from 'pexels';
import {
  debugLog,
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: string | number; // Accept either string or number to handle Pexels API inconsistency
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsSearchResponse {
  total_results?: number;
  page?: number;
  per_page?: number;
  photos: PexelsPhoto[];
  next_page?: string | number;
}

export interface PexelsSearchOptions {
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  locale?: string;
  page?: number;
  per_page?: number;
}

/**
 * Service for interacting with the Pexels API using the official library
 */
export class PexelsService {
  private readonly client: ReturnType<typeof createClient>;

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

      const searchParams = {
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
        await errorLog('Pexels API error occurred', {
          error: response.error,
          query,
          options,
        });
        throw new Error(`Pexels API error: ${response.error}`);
      }

      // Validate the response structure
      if (!response || !Array.isArray(response.photos)) {
        await errorLog('Invalid response structure from Pexels', { response });
        return { photos: [] };
      }

      await infoLog('Pexels search completed successfully', {
        query,
        photosFound: response.photos.length,
      });

      // Return the response directly - our interface is compatible
      return response as PexelsSearchResponse;
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

      return response as unknown as PexelsPhoto;
    } catch (error) {
      await errorLog('Error fetching Pexels photo', { error, photoId: id });
      return null;
    }
  }
}
