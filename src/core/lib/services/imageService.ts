import { PexelsPhoto } from '@/core/lib/services/pexelsService';
import { PexelsService } from '@/core/lib/services/pexelsService';
import { Definition } from '@/core/types/definition';
import { Image } from '@prisma/client';
import { serverLog, LogLevel } from '@/core/lib/utils/logUtils';
import { normalizeText } from '@/core/lib/utils/commonDictUtils/wordsFormators';
import { prisma } from '@/core/lib/prisma';

export interface ImageMetadata {
  id: number;
  url: string;
  description?: string | null;
  sizes: {
    thumbnail: string; // 150x150
    medium: string; // 300x300
    large: string; // 800x800
  };
  alt: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageUploadMetadata {
  description?: string;
  alt: string;
  definitionId?: number;
}

/**
 * Service for handling image operations
 */
export class ImageService {
  /**
   * Create a new image record from a Pexels photo
   */
  async createFromPexels(
    photo: PexelsPhoto,
    definitionId?: number,
  ): Promise<ImageMetadata | null> {
    try {
      serverLog(
        `Creating image from Pexels photo for definitionId: ${definitionId || 'none'}`,
        LogLevel.INFO,
        { photoId: photo.id },
      );

      // Create image data object with proper fallbacks
      const imageData = {
        url: photo.src.original || '',
        description: photo.alt || photo.photographer || '',
        alt: photo.alt || photo.photographer || '',
        sizes: {
          thumbnail: photo.src.small || photo.src.tiny || photo.src.original,
          medium: photo.src.medium || photo.src.original,
          large: photo.src.large || photo.src.large2x || photo.src.original,
        },
        mimeType: 'image/jpeg',
        fileSize: 0,
      };

      // Skip if URL is empty
      if (!imageData.url) {
        serverLog('Cannot create image with empty URL', LogLevel.ERROR);
        return null;
      }

      // Make sure we have a transaction to ensure atomicity
      const result = await prisma.$transaction(
        async (tx) => {
          // Check if the definition exists if definitionId is provided
          let definition = null;
          if (definitionId) {
            serverLog(
              `Checking if definition ${definitionId} exists`,
              LogLevel.INFO,
            );
            definition = await tx.definition.findUnique({
              where: { id: definitionId },
            });

            if (!definition) {
              serverLog(
                `Definition with id ${definitionId} not found, skipping image association`,
                LogLevel.WARN,
              );
              return null;
            }
            serverLog(`Definition ${definitionId} found`, LogLevel.INFO);
          }

          // Use upsert to either create a new image or update existing one
          serverLog(
            `Upserting image with URL: ${imageData.url}`,
            LogLevel.INFO,
          );
          const image = await tx.image.upsert({
            where: {
              url: imageData.url,
            },
            update: {
              description: imageData.description,
            },
            create: {
              url: imageData.url,
              description: imageData.description,
            },
          });
          serverLog(`Image upserted with ID: ${image.id}`, LogLevel.INFO);

          // If definitionId is provided and we confirmed it exists, update the definition
          if (definitionId && definition) {
            try {
              serverLog(
                `Updating definition ${definitionId} with imageId: ${image.id}`,
                LogLevel.INFO,
              );
              await tx.definition.update({
                where: { id: definitionId },
                data: { imageId: image.id },
              });
              serverLog(
                `Definition ${definitionId} updated with imageId: ${image.id}`,
                LogLevel.INFO,
              );
            } catch (error) {
              serverLog(
                `Error updating definition with image: ${error}`,
                LogLevel.ERROR,
              );
              throw error; // Re-throw to trigger transaction rollback
            }
          }

          return {
            ...imageData,
            id: image.id,
            createdAt: image.createdAt,
            updatedAt: image.updatedAt,
          };
        },
        {
          maxWait: 10000, // 10 seconds
          timeout: 20000, // 20 seconds
        },
      );

      serverLog(
        `Image created successfully with ID: ${result?.id || 'unknown'}`,
        LogLevel.INFO,
      );
      return result;
    } catch (error) {
      serverLog(`Error in createFromPexels: ${error}`, LogLevel.ERROR);
      return null;
    }
  }

  /**
   * Get images associated with a definition
   */
  async getImagesByDefinition(definitionId: number): Promise<ImageMetadata[]> {
    const images = await prisma.image.findMany({
      where: {
        definitions: {
          some: {
            id: definitionId,
          },
        },
      },
    });

    return images.map((image) => ({
      id: image.id,
      url: image.url,
      description: image.description,
      sizes: {
        thumbnail: image.url, // In this case, we're using the same URL for all sizes
        medium: image.url,
        large: image.url,
      },
      alt: image.description || '',
      mimeType: 'image/jpeg',
      fileSize: 0,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    }));
  }

  /**
   * Delete an image and its associations
   */
  async deleteImage(imageId: number): Promise<boolean> {
    try {
      await prisma.image.delete({
        where: { id: imageId },
      });
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Update image metadata
   */
  async updateImageMetadata(
    imageId: number,
    metadata: Partial<ImageMetadata>,
  ): Promise<ImageMetadata> {
    const image = await prisma.image.update({
      where: { id: imageId },
      data: {
        ...(metadata.description !== undefined && {
          description: metadata.description,
        }),
        ...(metadata.url !== undefined && { url: metadata.url }),
      },
    });

    return {
      id: image.id,
      url: image.url,
      description: image.description,
      sizes: {
        thumbnail: image.url,
        medium: image.url,
        large: image.url,
      },
      alt: image.description || '',
      mimeType: 'image/jpeg',
      fileSize: 0,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }

  /**
   * Search for word-related images and create image records
   */
  async searchAndCreateWordImages(
    word: string,
    definitionId?: number,
  ): Promise<ImageMetadata[]> {
    try {
      const pexelsService = new PexelsService();
      const searchResponse = await pexelsService.searchImages(word, {
        orientation: 'portrait',
        size: 'medium',
        per_page: 5, // Limit to 5 images per word
      });

      const images: ImageMetadata[] = [];

      for (const photo of searchResponse.photos) {
        const image = await this.createFromPexels(photo, definitionId);
        if (image) {
          images.push(image);
        }
      }

      return images;
    } catch (error) {
      console.error('Error searching and creating word images:', error);
      return [];
    }
  }

  /**
   * Get or create an image for a definition based on the word
   */
  async getOrCreateDefinitionImage(
    word: string,
    definitionId: number,
  ): Promise<ImageMetadata | null> {
    try {
      serverLog(
        `Starting getOrCreateDefinitionImage for word: "${word}", definitionId: ${definitionId}`,
        LogLevel.INFO,
      );

      // Get the definition with all its metadata
      const definition = await prisma.definition.findUnique({
        where: { id: definitionId },
        include: {
          image: true, // Include the image if it exists
          wordDetails: {
            include: {
              wordDetails: true,
            },
          },
        },
      });

      if (!definition) {
        serverLog(
          `FROM getOrCreateDefinitionImage: Definition with id ${definitionId} not found`,
          LogLevel.WARN,
        );
        return null;
      }

      // If the definition already has an image, return it
      if (definition.image) {
        serverLog(
          `FROM getOrCreateDefinitionImage: Found existing image for definition ${definitionId}: ${definition.image.id}`,
          LogLevel.INFO,
        );
        return this.transformImageToMetadata(definition.image);
      }

      serverLog(
        `FROM getOrCreateDefinitionImage: Found definition ${definitionId}, creating search query for word: "${word}"`,
        LogLevel.INFO,
      );

      // Get the first associated WordDetails (if any)
      const wordDetailsEntry = definition.wordDetails?.[0];
      const partOfSpeech = wordDetailsEntry?.wordDetails?.partOfSpeech;
      const isPlural = wordDetailsEntry?.wordDetails?.isPlural || false;

      // Create a unique search query for each definition by adding a fragment of the definition text
      // This ensures different definitions get different images
      const combinedDefinition = {
        ...definition,
        word: word,
        partOfSpeech: partOfSpeech || 'undefined',
        isPlural: isPlural,
      } as unknown as Definition;

      const uniqueSearchQuery =
        this.createSearchQueryFromDefinition(combinedDefinition);

      // Maximum number of retries
      const maxRetries = 3;
      let attempt = 0;
      let searchResponse = null;

      // Try multiple pages and retry on failure
      while (
        attempt < maxRetries &&
        (!searchResponse ||
          !searchResponse.photos ||
          searchResponse.photos.length === 0)
      ) {
        attempt++;

        // Generate a random page number between 1 and 5 to get different images for similar search terms
        const randomPage = Math.floor(Math.random() * 5) + 1;

        serverLog(
          `Searching Pexels API with query: "${uniqueSearchQuery}", page: ${randomPage} (attempt ${attempt}/${maxRetries})`,
          LogLevel.INFO,
        );

        // Try with the unique search query first
        try {
          const pexelsService = new PexelsService();
          searchResponse = await pexelsService.searchImages(uniqueSearchQuery, {
            orientation: 'portrait',
            size: 'medium',
            per_page: 1,
            page: randomPage,
          });

          serverLog(
            `Pexels search returned ${searchResponse.photos?.length || 0} photos`,
            LogLevel.INFO,
          );
        } catch (error) {
          serverLog(
            `Error in Pexels search attempt ${attempt}: ${error}`,
            LogLevel.ERROR,
          );

          // Wait a short time before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }

      const photo =
        searchResponse?.photos && searchResponse.photos.length > 0
          ? searchResponse.photos[0]
          : null;

      // If we found a photo, create the image
      if (photo) {
        serverLog(
          `Creating image from Pexels photo ID: ${photo.id}`,
          LogLevel.INFO,
        );
        const image = await this.createFromPexels(photo, definitionId);
        if (image) {
          serverLog(
            `Successfully created image ${image.id} for definition ${definitionId}`,
            LogLevel.INFO,
          );
          return image;
        }
      }

      // If no results, try a fallback search with just the word
      if (!photo) {
        serverLog(
          `No photos found with query "${uniqueSearchQuery}", trying fallback search with word: "${word}"`,
          LogLevel.INFO,
        );

        // Reset retry attempts
        attempt = 0;
        searchResponse = null;

        // Try multiple pages for the fallback search
        while (
          attempt < maxRetries &&
          (!searchResponse ||
            !searchResponse.photos ||
            searchResponse.photos.length === 0)
        ) {
          attempt++;

          // Use a different random page for the fallback
          const fallbackRandomPage = Math.floor(Math.random() * 5) + 1;

          serverLog(
            `Fallback search with query: "${word}", page: ${fallbackRandomPage} (attempt ${attempt}/${maxRetries})`,
            LogLevel.INFO,
          );

          try {
            const pexelsService = new PexelsService();
            searchResponse = await pexelsService.searchImages(word, {
              orientation: 'portrait',
              size: 'medium',
              per_page: 1,
              page: fallbackRandomPage,
            });

            serverLog(
              `Fallback search returned ${searchResponse.photos?.length || 0} photos`,
              LogLevel.INFO,
            );
          } catch (error) {
            serverLog(
              `Error in fallback search attempt ${attempt}: ${error}`,
              LogLevel.ERROR,
            );

            // Wait a short time before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
        }

        const fallbackPhoto =
          searchResponse?.photos && searchResponse.photos.length > 0
            ? searchResponse.photos[0]
            : null;

        if (fallbackPhoto) {
          serverLog(
            `Creating image from fallback Pexels photo ID: ${fallbackPhoto.id}`,
            LogLevel.INFO,
          );
          const image = await this.createFromPexels(
            fallbackPhoto,
            definitionId,
          );
          if (image) {
            serverLog(
              `Successfully created fallback image ${image.id} for definition ${definitionId}`,
              LogLevel.INFO,
            );
            return image;
          }
        }
      }

      serverLog(
        `No photos found for definition ${definitionId}, returning null`,
        LogLevel.WARN,
      );
      return null;
    } catch (error) {
      if (error instanceof Error) {
        serverLog(
          `Error in getOrCreateDefinitionImage for definition ${definitionId}: ${error.message}`,
          LogLevel.ERROR,
          { error },
        );
      } else {
        serverLog(
          `Error in getOrCreateDefinitionImage for definition ${definitionId}: ${error}`,
          LogLevel.ERROR,
        );
      }
      return null;
    }
  }

  private transformImageToMetadata(image: Image): ImageMetadata {
    return {
      id: image.id,
      url: image.url,
      description: image.description,
      sizes: {
        thumbnail: image.url,
        medium: image.url,
        large: image.url,
      },
      alt: image.description || '',
      mimeType: 'image/jpeg',
      fileSize: 0,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }

  private createSearchQueryFromDefinition(definition: Definition): string {
    // Get the main word from the definition object or use its first few words
    const word = definition.word || definition.definition.split(' ')[0] || '';

    // Extract key concepts from definition
    const keyWords = this.extractKeywords(normalizeText(definition.definition));
    const partOfSpeech = definition.partOfSpeech || 'undefined'; // Use the backward compatibility field

    // Create base query based on part of speech
    const query = `${word} ${partOfSpeech} ${keyWords.join(' ')}`;
    serverLog(
      `FROM createSearchQueryFromDefinition: Search query: ${query}`,
      LogLevel.INFO,
      {
        word,
        keyWords,
        partOfSpeech,
      },
    );
    const normalizedQuery = this.normalizeSearchQuery(query);
    serverLog(
      `FROM createSearchQueryFromDefinition: Normalized search query: ${normalizedQuery}`,
      LogLevel.INFO,
      {
        normalizedQuery,
      },
    );

    // Clean up and normalize the query
    return normalizedQuery;
  }

  private extractKeywords(text: string): string[] {
    // Enhanced stop words list
    const stopWords = new Set([
      'a',
      'an',
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'about',
      'into',
      'over',
      'after',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'shall',
      'should',
      'may',
      'might',
      'must',
      'can',
      'could',
      'that',
      'which',
      'who',
      'whom',
      'whose',
      'when',
      'where',
      'why',
      'how',
      'all',
      'any',
      'both',
      'each',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'no',
      'nor',
      'not',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
      'just',
      'should',
      'now',
    ]);

    return text
      .toLowerCase()
      .split(/[,.\s]+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !stopWords.has(word) &&
          !word.match(/^[0-9]+$/) &&
          !word.match(/^(eg|ie|etc)$/), // Filter common abbreviations
      )
      .slice(0, 5); // Take top 5 most relevant keywords
  }

  private createNounSearchQuery(
    word: string,
    keywords: string[],
    definition: Definition,
    labels: string,
  ): string {
    // Determine if it's an abstract or concrete noun
    const isAbstract =
      labels.toLowerCase().includes('abstract') ||
      definition.definition.toLowerCase().includes('quality') ||
      definition.definition.toLowerCase().includes('state of') ||
      definition.definition.toLowerCase().includes('feeling') ||
      definition.definition.toLowerCase().includes('emotion') ||
      definition.definition.toLowerCase().includes('concept');

    // Filter context words based on noun type
    const contextWords = keywords
      .filter(
        (k) =>
          !k.endsWith('ing') && // Avoid gerunds
          !k.endsWith('ed') && // Avoid past participles
          !k.endsWith('ly'), // Avoid adverbs
      )
      .slice(0, 3);

    if (isAbstract) {
      // For abstract nouns, focus on symbolic or metaphorical representations
      return `${word} ${contextWords.join(' ')} symbol metaphor concept`;
    } else {
      // For concrete nouns, focus on physical objects
      return `${word} ${contextWords.join(' ')}`;
    }
  }

  private createVerbSearchQuery(word: string, keywords: string[]): string {
    // Focus on action and movement
    const actionWords = keywords.filter((k) => k.endsWith('ing')).slice(0, 2);

    return `${word} ${actionWords.join(' ')}`;
  }

  private createAdjectiveSearchQuery(word: string, keywords: string[]): string {
    // Focus on visual qualities and characteristics
    const visualWords = keywords
      .filter(
        (k) =>
          !k.endsWith('ly') && // Avoid adverbs
          k.length > 4, // Prefer descriptive words
      )
      .slice(0, 2);

    return `${word} ${visualWords.join(' ')}`;
  }

  private createPhrasalVerbSearchQuery(
    word: string,
    keywords: string[],
  ): string {
    // Focus on the result or state of the action
    const actionResult = keywords.slice(0, 2);
    return `${word} ${actionResult.join(' ')}`;
  }

  private createPhraseSearchQuery(word: string, keywords: string[]): string {
    // Focus on the overall meaning or situation
    const meaningWords = keywords.slice(0, 3);
    return `${meaningWords.join(' ')}`;
  }

  private createDefaultSearchQuery(word: string, keywords: string[]): string {
    return `${word} ${keywords.slice(0, 2).join(' ')} photo`;
  }

  private getSpecificContext(definition: Definition, labels: string): string {
    // Extract specific context based on definition content and labels
    if (labels.toLowerCase().includes('animal'))
      return 'animal wildlife nature';
    if (labels.toLowerCase().includes('food')) return 'food cuisine culinary';
    if (labels.toLowerCase().includes('plant')) return 'plant nature botanical';
    if (labels.toLowerCase().includes('person'))
      return 'person people portrait';
    if (labels.toLowerCase().includes('place'))
      return 'place location landscape';
    if (labels.toLowerCase().includes('tool')) return 'tool equipment device';
    if (labels.toLowerCase().includes('vehicle'))
      return 'vehicle transportation';
    if (labels.toLowerCase().includes('building'))
      return 'building architecture';
    if (labels.toLowerCase().includes('clothing'))
      return 'clothing fashion apparel';
    return 'object item';
  }

  private normalizeSearchQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .toLowerCase();
  }
}
