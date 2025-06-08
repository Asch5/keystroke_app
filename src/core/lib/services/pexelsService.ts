import { env } from '@/env.mjs';
import { createClient } from 'pexels';

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
      console.log(`Searching Pexels for: "${query}" with options:`, options);

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
        console.error(`Pexels API error: ${response.error}`);
        throw new Error(`Pexels API error: ${response.error}`);
      }

      // Validate the response structure
      if (!response || !Array.isArray(response.photos)) {
        console.error('Invalid response structure from Pexels:', response);
        return { photos: [] };
      }

      console.log(
        `Pexels search completed for: "${query}". Found photos: ${response.photos.length}`,
      );

      // Return the response directly - our interface is compatible
      return response as PexelsSearchResponse;
    } catch (error) {
      console.error('Error searching Pexels images:', error);
      // Return empty response in case of error to avoid breaking the application
      return { photos: [] };
    }
  }

  /**
   * Get a single photo by ID
   */
  async getPhoto(id: number): Promise<PexelsPhoto | null> {
    try {
      console.log(`Fetching Pexels photo with ID: ${id}`);

      const response = await this.client.photos.show({ id });

      // Check if there's an error
      if ('error' in response) {
        throw new Error(`Pexels API error: ${response.error}`);
      }

      console.log(`Successfully fetched Pexels photo ID: ${id}`);

      return response as unknown as PexelsPhoto;
    } catch (error) {
      console.error('Error fetching Pexels photo:', error);
      return null;
    }
  }
}
