import { PexelsPhoto } from '@/core/lib/services/pexelsService';
import { PexelsService } from '@/core/lib/services/pexelsService';
import { Definition } from '@/core/types/definition';
import { Image } from '@prisma/client';
import { clientLog } from '@/core/lib/utils/logUtils';
import { normalizeText } from '@/core/lib/utils/commonDictUtils/wordsFormators';
import { prisma } from '@/core/lib/prisma';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

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
      clientLog(
        `Creating image from Pexels photo for definitionId: ${definitionId || 'none'}`,
        'info',
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
        clientLog('Cannot create image with empty URL', 'error');
        return null;
      }

      // Make sure we have a transaction to ensure atomicity
      const result = await prisma.$transaction(
        async (tx) => {
          // Check if the definition exists if definitionId is provided
          let definition = null;
          if (definitionId) {
            clientLog(`Checking if definition ${definitionId} exists`, 'info');
            definition = await tx.definition.findUnique({
              where: { id: definitionId },
            });

            if (!definition) {
              clientLog(
                `Definition with id ${definitionId} not found, skipping image association`,
                'warn',
              );
              return null;
            }
            clientLog(`Definition ${definitionId} found`, 'info');
          }

          // Use upsert to either create a new image or update existing one
          clientLog(`Upserting image with URL: ${imageData.url}`, 'info');
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
          clientLog(`Image upserted with ID: ${image.id}`, 'info');

          // If definitionId is provided and we confirmed it exists, update the definition
          if (definitionId && definition) {
            try {
              clientLog(
                `Updating definition ${definitionId} with imageId: ${image.id}`,
                'info',
              );
              await tx.definition.update({
                where: { id: definitionId },
                data: { imageId: image.id },
              });
              clientLog(
                `Definition ${definitionId} updated with imageId: ${image.id}`,
                'info',
              );
            } catch (error) {
              clientLog(
                `Error updating definition with image: ${error}`,
                'error',
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

      clientLog(
        `Image created successfully with ID: ${result?.id || 'unknown'}`,
        'info',
      );
      return result;
    } catch (error) {
      clientLog(`Error in createFromPexels: ${error}`, 'error');
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
      clientLog(
        `Starting getOrCreateDefinitionImage for word: "${word}", definitionId: ${definitionId}`,
        'info',
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
        clientLog(
          `FROM getOrCreateDefinitionImage: Definition with id ${definitionId} not found`,
          'warn',
        );
        return null;
      }

      // If the definition already has an image, return it
      if (definition.image) {
        clientLog(
          `FROM getOrCreateDefinitionImage: Found existing image for definition ${definitionId}: ${definition.image.id}`,
          'info',
        );
        return this.transformImageToMetadata(definition.image);
      }

      clientLog(
        `FROM getOrCreateDefinitionImage: Found definition ${definitionId}, creating search query for word: "${word}"`,
        'info',
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

        clientLog(
          `Searching Pexels API with query: "${uniqueSearchQuery}", page: ${randomPage} (attempt ${attempt}/${maxRetries})`,
          'info',
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

          clientLog(
            `Pexels search returned ${searchResponse.photos?.length || 0} photos`,
            'info',
          );
        } catch (error) {
          clientLog(
            `Error in Pexels search attempt ${attempt}: ${error}`,
            'error',
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
        clientLog(`Creating image from Pexels photo ID: ${photo.id}`, 'info');
        const image = await this.createFromPexels(photo, definitionId);
        if (image) {
          clientLog(
            `Successfully created image ${image.id} for definition ${definitionId}`,
            'info',
          );
          return image;
        }
      }

      // If no results, try a fallback search with just the word
      if (!photo) {
        clientLog(
          `No photos found with query "${uniqueSearchQuery}", trying fallback search with word: "${word}"`,
          'info',
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

          clientLog(
            `Fallback search with query: "${word}", page: ${fallbackRandomPage} (attempt ${attempt}/${maxRetries})`,
            'info',
          );

          try {
            const pexelsService = new PexelsService();
            searchResponse = await pexelsService.searchImages(word, {
              orientation: 'portrait',
              size: 'medium',
              per_page: 1,
              page: fallbackRandomPage,
            });

            clientLog(
              `Fallback search returned ${searchResponse.photos?.length || 0} photos`,
              'info',
            );
          } catch (error) {
            clientLog(
              `Error in fallback search attempt ${attempt}: ${error}`,
              'error',
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
          clientLog(
            `Creating image from fallback Pexels photo ID: ${fallbackPhoto.id}`,
            'info',
          );
          const image = await this.createFromPexels(
            fallbackPhoto,
            definitionId,
          );
          if (image) {
            clientLog(
              `Successfully created fallback image ${image.id} for definition ${definitionId}`,
              'info',
            );
            return image;
          }
        }
      }

      clientLog(
        `No photos found for definition ${definitionId}, returning null`,
        'warn',
      );
      return null;
    } catch (error) {
      if (error instanceof Error) {
        clientLog(
          `Error in getOrCreateDefinitionImage for definition ${definitionId}: ${error.message}`,
          'error',
          { error },
        );
      } else {
        clientLog(
          `Error in getOrCreateDefinitionImage for definition ${definitionId}: ${error}`,
          'error',
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
    clientLog(
      `FROM createSearchQueryFromDefinition: Search query: ${query}`,
      'info',
      {
        word,
        keyWords,
        partOfSpeech,
      },
    );
    const normalizedQuery = this.normalizeSearchQuery(query);
    clientLog(
      `FROM createSearchQueryFromDefinition: Normalized search query: ${normalizedQuery}`,
      'info',
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

  /**
   * Get or create an image for a definition using its translations for better search results
   * This is particularly useful for non-English definitions
   */
  async getOrCreateTranslatedDefinitionImage(
    word: string,
    definitionId: number,
  ): Promise<ImageMetadata | null> {
    try {
      serverLog(
        `======FROM getOrCreateTranslatedDefinitionImage===========: Starting getOrCreateTranslatedDefinitionImage for word: "${word}", definitionId: ${definitionId}`,
        'info',
      );

      // First check if definition exists and has an image
      const definitionWithImage = await prisma.definition.findUnique({
        where: { id: definitionId },
        include: { image: true },
      });

      if (!definitionWithImage) {
        serverLog(
          `======FROM getOrCreateTranslatedDefinitionImage===========: Definition with id ${definitionId} not found`,
          'warn',
        );
        return null;
      }

      // If the definition already has an image, return it
      if (definitionWithImage.imageId && definitionWithImage.image) {
        serverLog(
          `======FROM getOrCreateTranslatedDefinitionImage===========: Found existing image for definition ${definitionId}: ${definitionWithImage.imageId}`,
          'info',
        );
        return this.transformImageToMetadata(definitionWithImage.image);
      }

      // Try to find word details for this definition
      const wordDefinition = await prisma.wordDefinition.findFirst({
        where: { definitionId },
        include: {
          wordDetails: {
            include: {
              word: true,
            },
          },
        },
      });

      // Get the actual word text
      const wordText = wordDefinition?.wordDetails?.word?.word || word;

      // Find definition translations to English
      const definitionTranslations =
        await prisma.definitionTranslation.findMany({
          where: { definitionId },
          include: {
            translation: true,
          },
        });

      // Extract English translations from the junction table results
      const englishTranslations = definitionTranslations
        .map((dt) => dt.translation)
        .filter(
          (translation) =>
            translation !== null && translation.languageCode === 'en',
        );

      serverLog(
        `======FROM getOrCreateTranslatedDefinitionImage===========: Found ${englishTranslations.length} English translations for definition ${definitionId}`,
        'info',
      );

      // Create search query from the most relevant information
      let searchQuery = wordText;

      if (englishTranslations.length > 0) {
        // Use the first English translation
        const englishTranslation = englishTranslations[0];
        const translatedContent = englishTranslation?.content || '';

        serverLog(
          `======FROM getOrCreateTranslatedDefinitionImage===========: Using English translation for search: "${translatedContent}"`,
          'info',
        );

        // Create search query with translation
        searchQuery = this.createSearchQueryFromText(
          wordText,
          translatedContent,
        );
      } else {
        serverLog(
          `======FROM getOrCreateTranslatedDefinitionImage===========: No English translations found for definition ${definitionId}, using original word: "${wordText}"`,
          'warn',
        );
      }

      serverLog(
        `======FROM getOrCreateTranslatedDefinitionImage===========: Final search query: "${searchQuery}"`,
        'info',
      );

      // Search for images using the query
      const pexelsService = new PexelsService();
      const searchResponse = await pexelsService.searchImages(searchQuery, {
        orientation: 'portrait',
        size: 'medium',
        per_page: 1,
      });

      const photo =
        searchResponse?.photos && searchResponse.photos.length > 0
          ? searchResponse.photos[0]
          : null;

      // If we found a photo, create the image
      if (photo) {
        serverLog(
          `======FROM getOrCreateTranslatedDefinitionImage===========: Creating image from Pexels photo ID: ${photo.id}`,
          'info',
        );
        const image = await this.createFromPexels(photo, definitionId);
        if (image) {
          serverLog(
            `======FROM getOrCreateTranslatedDefinitionImage===========: Successfully created image ${image.id} for definition ${definitionId}`,
            'info',
          );
          return image;
        }
      }

      // Fall back to the standard method if no image was found
      serverLog(
        `======FROM getOrCreateTranslatedDefinitionImage===========: No image found using translations, falling back to standard method`,
        'info',
      );
      return this.getOrCreateDefinitionImage(word, definitionId);
    } catch (error) {
      serverLog(
        `======FROM getOrCreateTranslatedDefinitionImage===========: Error in getOrCreateTranslatedDefinitionImage: ${error}`,
        'error',
      );
      return null;
    }
  }

  /**
   * Create a search query from a word and its definition text
   */
  private createSearchQueryFromText(
    word: string,
    definitionText: string,
  ): string {
    // Extract key concepts from definition
    const keyWords = this.extractKeywords(normalizeText(definitionText));

    // Create a query combining the word and keywords
    const query = `${word} ${keyWords.join(' ')}`;

    // Clean up and normalize the query
    return this.normalizeSearchQuery(query);
  }
}
