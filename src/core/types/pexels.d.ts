/**
 * Type definitions for pexels library
 * Based on Pexels API v1 bufferfolder and official library interface
 */

declare module 'pexels' {
  /**
   * Photo object from Pexels API
   */
  interface Photo {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: string | number;
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
    liked: boolean;
  }

  /**
   * Video object from Pexels API
   */
  interface Video {
    id: number;
    width: number;
    height: number;
    url: string;
    image: string;
    duration: number;
    user: {
      id: number;
      name: string;
      url: string;
    };
    video_files: Array<{
      id: number;
      quality: string;
      file_type: string;
      width: number | null;
      height: number | null;
      fps: number | null;
      link: string;
    }>;
    video_pictures: Array<{
      id: number;
      picture: string;
      nr: number;
    }>;
  }

  /**
   * Collection object from Pexels API
   */
  interface Collection {
    id: string;
    title: string;
    description: string | null;
    private: boolean;
    media_count: number;
    photos_count: number;
    videos_count: number;
  }

  /**
   * Error response from Pexels API
   */
  interface ErrorResponse {
    error: string;
  }

  /**
   * Search photos response
   */
  interface PhotosSearchResponse {
    total_results: number;
    page: number;
    per_page: number;
    photos: Photo[];
    next_page?: string;
    prev_page?: string;
  }

  /**
   * Search videos response
   */
  interface VideosSearchResponse {
    total_results: number;
    page: number;
    per_page: number;
    videos: Video[];
    next_page?: string;
    prev_page?: string;
  }

  /**
   * Collections list response
   */
  interface CollectionsResponse {
    collections: Collection[];
    page: number;
    per_page: number;
    total_results: number;
    next_page?: string;
    prev_page?: string;
  }

  /**
   * Collection media response
   */
  interface CollectionMediaResponse {
    id: string;
    media: (Photo | Video)[];
    page: number;
    per_page: number;
    total_results: number;
    next_page?: string;
    prev_page?: string;
  }

  /**
   * Search parameters for photos
   */
  interface PhotosSearchParams {
    query: string;
    orientation?: 'landscape' | 'portrait' | 'square';
    size?: 'large' | 'medium' | 'small';
    color?:
      | 'red'
      | 'orange'
      | 'yellow'
      | 'green'
      | 'turquoise'
      | 'blue'
      | 'violet'
      | 'pink'
      | 'brown'
      | 'black'
      | 'gray'
      | 'white';
    locale?: string;
    page?: number;
    per_page?: number;
  }

  /**
   * Search parameters for videos
   */
  interface VideosSearchParams {
    query: string;
    orientation?: 'landscape' | 'portrait' | 'square';
    size?: 'large' | 'medium' | 'small';
    locale?: string;
    page?: number;
    per_page?: number;
  }

  /**
   * Parameters for getting photo by ID
   */
  interface PhotoParams {
    id: number;
  }

  /**
   * Parameters for getting video by ID
   */
  interface VideoParams {
    id: number;
  }

  /**
   * Parameters for curated photos
   */
  interface CuratedParams {
    page?: number;
    per_page?: number;
  }

  /**
   * Parameters for collections
   */
  interface CollectionsParams {
    page?: number;
    per_page?: number;
  }

  /**
   * Parameters for collection media
   */
  interface CollectionMediaParams {
    id: string;
    type?: 'photos' | 'videos';
    page?: number;
    per_page?: number;
  }

  /**
   * Photos API methods
   */
  interface PhotosApi {
    search(
      params: PhotosSearchParams,
    ): Promise<PhotosSearchResponse | ErrorResponse>;
    curated(
      params?: CuratedParams,
    ): Promise<PhotosSearchResponse | ErrorResponse>;
    show(params: PhotoParams): Promise<Photo | ErrorResponse>;
  }

  /**
   * Videos API methods
   */
  interface VideosApi {
    search(
      params: VideosSearchParams,
    ): Promise<VideosSearchResponse | ErrorResponse>;
    popular(
      params?: CuratedParams,
    ): Promise<VideosSearchResponse | ErrorResponse>;
    show(params: VideoParams): Promise<Video | ErrorResponse>;
  }

  /**
   * Collections API methods
   */
  interface CollectionsApi {
    all(
      params?: CollectionsParams,
    ): Promise<CollectionsResponse | ErrorResponse>;
    media(
      params: CollectionMediaParams,
    ): Promise<CollectionMediaResponse | ErrorResponse>;
  }

  /**
   * Main Pexels client interface
   */
  interface PexelsApi {
    photos: PhotosApi;
    videos: VideosApi;
    collections: CollectionsApi;
  }

  /**
   * Create Pexels client
   */
  function createClient(apiKey: string): PexelsApi;

  export {
    Photo,
    Video,
    Collection,
    ErrorResponse,
    PhotosSearchResponse,
    VideosSearchResponse,
    CollectionsResponse,
    CollectionMediaResponse,
    PhotosSearchParams,
    VideosSearchParams,
    PhotoParams,
    VideoParams,
    CuratedParams,
    CollectionsParams,
    CollectionMediaParams,
    PhotosApi,
    VideosApi,
    CollectionsApi,
    PexelsApi,
    createClient,
  };
}
