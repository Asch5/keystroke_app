import { env } from '@/env.mjs';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
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
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page: string;
}

export interface PexelsSearchOptions {
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  locale?: string;
  page?: number;
  per_page?: number;
}

/**
 * Service for interacting with the Pexels API
 */
export class PexelsService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.pexels.com/v1';

  constructor() {
    const apiKey = env.PEXELS_API_KEY;
    if (!apiKey) {
      throw new Error('Pexels API key is not configured');
    }
    this.apiKey = apiKey;
  }

  /**
   * Search for images using the Pexels API
   */
  async searchImages(
    query: string,
    options: PexelsSearchOptions = {},
  ): Promise<PexelsSearchResponse> {
    try {
      const searchParams = new URLSearchParams({
        query,
        orientation: options.orientation || 'portrait',
        size: options.size || 'small',
        locale: options.locale || 'en-US',
        page: options.page?.toString() || '1',
        per_page: options.per_page?.toString() || '15',
      });

      const response = await fetch(
        `${this.baseUrl}/search?${searchParams.toString()}`,
        {
          headers: {
            Authorization: this.apiKey,
          },
          next: { revalidate: 3600 }, // Cache for 1 hour
        },
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as PexelsSearchResponse;
    } catch (error) {
      console.error('Error searching Pexels images:', error);
      throw error;
    }
  }

  /**
   * Get a single photo by ID
   */
  async getPhoto(id: number): Promise<PexelsPhoto> {
    try {
      const response = await fetch(`${this.baseUrl}/photos/${id}`, {
        headers: {
          Authorization: this.apiKey,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as PexelsPhoto;
    } catch (error) {
      console.error('Error fetching Pexels photo:', error);
      throw error;
    }
  }
}
