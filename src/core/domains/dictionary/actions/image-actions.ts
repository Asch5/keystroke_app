'use server';

import { revalidatePath } from 'next/cache';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { ImageService } from '@/core/lib/services/imageService';
import { prisma } from '@/core/shared/database/client';
import { handlePrismaError } from '@/core/shared/database/error-handler';

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  message: string;
  cached?: boolean;
  wordText?: string;
}

export interface ImageBatchResult {
  success: boolean;
  processed: number;
  failed: number;
  results: GenerateImageResult[];
  message: string;
}

/**
 * Generate images for a word's definitions
 */
export async function generateWordImages(
  wordId: number,
  options?: {
    overwriteExisting?: boolean;
  },
): Promise<GenerateImageResult> {
  try {
    void serverLog(`Starting image generation for word ID: ${wordId}`, 'info');

    // Get word with details and their definitions
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      select: {
        word: true,
        languageCode: true,
        details: {
          select: {
            id: true,
            definitions: {
              select: {
                definitionId: true,
                definition: {
                  select: {
                    id: true,
                    definition: true,
                    imageId: true,
                    image: {
                      select: {
                        id: true,
                        url: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!word) {
      void serverLog(`Word not found for ID: ${wordId}`, 'error');
      return {
        success: false,
        message: 'Word not found',
      };
    }

    void serverLog(
      `Found word: "${word.word}" (${word.languageCode}) with ${word.details.length} details`,
      'info',
    );

    // Get all definitions across all word details
    const allDefinitions = word.details
      .flatMap((detail) => detail.definitions)
      .map((wd) => wd.definition);

    if (allDefinitions.length === 0) {
      void serverLog(`No definitions found for word "${word.word}"`, 'warn');
      return {
        success: false,
        message: 'No definitions found for this word',
      };
    }

    // Check if images already exist
    const definitionsWithoutImages = allDefinitions.filter((def) => !def.image);

    if (definitionsWithoutImages.length === 0 && !options?.overwriteExisting) {
      void serverLog(
        `All definitions already have images for word "${word.word}", skipping`,
        'info',
      );
      return {
        success: false,
        message:
          'All definitions already have images. Use overwriteExisting option to replace.',
      };
    }

    const imageService = new ImageService();
    let processedCount = 0;
    let failedCount = 0;
    let lastImageUrl: string | undefined;

    // Process definitions that need images
    const definitionsToProcess = options?.overwriteExisting
      ? allDefinitions
      : definitionsWithoutImages;

    void serverLog(
      `Processing ${definitionsToProcess.length} definitions for word "${word.word}"`,
      'info',
    );

    for (const definition of definitionsToProcess) {
      try {
        // Delete existing image if overwriting
        if (definition.image && options?.overwriteExisting) {
          void serverLog(
            `Deleting existing image for definition ${definition.id}`,
            'info',
          );
          await prisma.image.delete({
            where: { id: definition.image.id },
          });
        }

        // Generate new image
        void serverLog(
          `Generating image for definition ${definition.id}: "${definition.definition.substring(0, 50)}..."`,
          'info',
        );

        // Use appropriate image generation method based on language
        // For English: use definitions directly
        // For other languages (like Danish): use their translations
        const image =
          word.languageCode === 'en'
            ? await imageService.getOrCreateDefinitionImage(
                word.word,
                definition.id,
              )
            : await imageService.getOrCreateTranslatedDefinitionImage(
                word.word,
                definition.id,
              );

        void serverLog(
          `Using ${word.languageCode === 'en' ? 'direct definition' : 'translated definition'} method for image generation`,
          'info',
        );

        if (image) {
          // Link image to definition
          await prisma.definition.update({
            where: { id: definition.id },
            data: { imageId: image.id },
          });

          processedCount++;
          lastImageUrl = image.url;
          void serverLog(
            `Successfully generated image for definition ${definition.id}`,
            'info',
          );
        } else {
          failedCount++;
          void serverLog(
            `Failed to generate image for definition ${definition.id}`,
            'warn',
          );
        }

        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        failedCount++;
        void serverLog(
          `Error generating image for definition ${definition.id}: ${error}`,
          'error',
        );
      }
    }

    // Only revalidate path if running in Next.js context
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      // Ignore revalidation errors when running outside Next.js context
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }

    const resultMessage =
      processedCount > 0
        ? `Successfully generated images for ${processedCount} definitions of "${word.word}"${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
        : `Failed to generate any images for "${word.word}"`;

    void serverLog(
      `Image generation completed for word "${word.word}": ${processedCount} successful, ${failedCount} failed`,
      processedCount > 0 ? 'info' : 'warn',
    );

    return {
      success: processedCount > 0,
      ...(lastImageUrl && { imageUrl: lastImageUrl }),
      message: resultMessage,
      wordText: word.word,
    };
  } catch (error) {
    void serverLog(
      `Error generating word images for ID ${wordId}: ${error}`,
      'error',
    );
    console.error('Error generating word images:', error);
    const handledError = handlePrismaError(error);

    return {
      success: false,
      message: handledError.message,
    };
  }
}

/**
 * Generate images for multiple words in batch
 */
export async function generateBatchWordImages(
  wordIds: number[],
  options?: {
    overwriteExisting?: boolean;
    maxConcurrent?: number;
  },
): Promise<ImageBatchResult> {
  const maxConcurrent = options?.maxConcurrent ?? 3; // Conservative to respect rate limits
  const results: GenerateImageResult[] = [];
  let processed = 0;
  let failed = 0;

  void serverLog(
    `Starting batch image generation for ${wordIds.length} words: [${wordIds.join(', ')}]`,
    'info',
  );
  void serverLog(`Batch options: ${JSON.stringify(options)}`, 'info');

  try {
    // First, validate that all word IDs exist in the database
    void serverLog('Validating word IDs exist in database...', 'info');
    const existingWords = await prisma.word.findMany({
      where: {
        id: { in: wordIds },
      },
      select: {
        id: true,
        word: true,
      },
    });

    const existingWordIds = new Set(existingWords.map((w) => w.id));
    const validWordIds = wordIds.filter((id) => existingWordIds.has(id));
    const invalidWordIds = wordIds.filter((id) => !existingWordIds.has(id));

    if (invalidWordIds.length > 0) {
      void serverLog(
        `Found ${invalidWordIds.length} invalid word IDs: [${invalidWordIds.join(', ')}]. These will be skipped.`,
        'warn',
      );

      // Add failed results for invalid IDs
      for (const invalidId of invalidWordIds) {
        results.push({
          success: false,
          message: 'Word not found in database',
        });
        failed++;
        void serverLog(
          `Word ${invalidId} result: FAILED - Word not found in database`,
          'error',
        );
      }
    }

    if (validWordIds.length === 0) {
      const errorMsg =
        'No valid word IDs found. All requested words have been deleted or do not exist.';
      void serverLog(errorMsg, 'error');
      return {
        success: false,
        processed: 0,
        failed: wordIds.length,
        results,
        message: errorMsg,
      };
    }

    void serverLog(
      `Processing ${validWordIds.length} valid words out of ${wordIds.length} requested`,
      'info',
    );

    // Process in batches to respect rate limits
    for (let i = 0; i < validWordIds.length; i += maxConcurrent) {
      const batch = validWordIds.slice(i, i + maxConcurrent);
      void serverLog(
        `Processing batch ${Math.floor(i / maxConcurrent) + 1}: words [${batch.join(', ')}]`,
        'info',
      );

      const batchPromises = batch.map((wordId) => {
        void serverLog(`Creating promise for word ID: ${wordId}`, 'info');
        return generateWordImages(wordId, options);
      });

      void serverLog(
        `Waiting for ${batchPromises.length} promises to resolve`,
        'info',
      );
      const batchResults = await Promise.allSettled(batchPromises);
      void serverLog(
        `Batch results received: ${batchResults.length} results`,
        'info',
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const wordId = batch[j];

        if (result?.status === 'fulfilled') {
          void serverLog(
            `Word ${wordId} result: ${result.value.success ? 'SUCCESS' : 'FAILED'} - ${result.value.message}`,
            result.value.success ? 'info' : 'error',
          );
          results.push(result.value);
          if (result.value.success) {
            processed++;
          } else {
            failed++;
            void serverLog(
              `Word ${wordId} failed with message: ${result.value.message}`,
              'error',
            );
          }
        } else if (result?.status === 'rejected') {
          failed++;
          const errorMsg = `Error: ${result.reason}`;
          void serverLog(
            `Word ${wordId} promise rejected: ${errorMsg}`,
            'error',
          );
          results.push({
            success: false,
            message: errorMsg,
          });
        }
      }

      void serverLog(
        `Batch ${Math.floor(i / maxConcurrent) + 1} completed. Processed: ${processed}, Failed: ${failed}`,
        'info',
      );

      // Add delay between batches to respect rate limits
      if (i + maxConcurrent < validWordIds.length) {
        void serverLog(
          `Waiting 2 seconds before next batch to respect rate limits`,
          'info',
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const finalMessage = `Batch image generation completed. ${processed} successful, ${failed} failed.`;
    void serverLog(finalMessage, processed > 0 ? 'info' : 'warn');

    // Only revalidate path if running in Next.js context
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      // Ignore revalidation errors when running outside Next.js context
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }

    return {
      success: processed > 0,
      processed,
      failed,
      results,
      message: finalMessage,
    };
  } catch (error) {
    const errorMsg = `Batch image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    void serverLog(errorMsg, 'error');
    console.error('Error in batch image generation:', error);

    // Only revalidate path if running in Next.js context
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      // Ignore revalidation errors when running outside Next.js context
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }

    return {
      success: false,
      processed,
      failed: wordIds.length - processed,
      results,
      message: errorMsg,
    };
  }
}

/**
 * Delete images for a word's definitions
 */
export async function deleteWordImages(
  wordId: number,
): Promise<GenerateImageResult> {
  try {
    void serverLog(`Deleting images for word ID: ${wordId}`, 'info');

    const word = await prisma.word.findUnique({
      where: { id: wordId },
      select: {
        word: true,
        details: {
          select: {
            definitions: {
              select: {
                definition: {
                  select: {
                    id: true,
                    imageId: true,
                    image: {
                      select: {
                        id: true,
                        url: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!word) {
      return {
        success: false,
        message: 'Word not found',
      };
    }

    const allDefinitions = word.details
      .flatMap((detail) => detail.definitions)
      .map((wd) => wd.definition);
    const definitionsWithImages = allDefinitions.filter((def) => def.image);

    if (definitionsWithImages.length === 0) {
      return {
        success: false,
        message: 'No images found for this word',
      };
    }

    // Delete images
    for (const definition of definitionsWithImages) {
      if (definition.image) {
        await prisma.image.delete({
          where: { id: definition.image.id },
        });
        void serverLog(
          `Deleted image ${definition.image.id} for definition ${definition.id}`,
          'info',
        );
      }
    }

    // Revalidate path
    try {
      revalidatePath('/admin/dictionaries');
    } catch {
      void serverLog('Revalidation skipped (not in Next.js context)', 'info');
    }

    return {
      success: true,
      message: `Successfully deleted ${definitionsWithImages.length} images for "${word.word}"`,
      wordText: word.word,
    };
  } catch (error) {
    void serverLog(
      `Error deleting word images for ID ${wordId}: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    const handledError = handlePrismaError(error);

    return {
      success: false,
      message: handledError.message,
    };
  }
}

/**
 * Get image statistics for the admin dashboard
 */
export async function getImageStats(): Promise<{
  totalImages: number;
  definitionsWithImages: number;
  definitionsWithoutImages: number;
  recentlyGenerated: number;
}> {
  try {
    const [totalImages, definitionsWithImages, totalDefinitions, recentImages] =
      await Promise.all([
        prisma.image.count(),
        prisma.definition.count({
          where: {
            imageId: { not: null },
          },
        }),
        prisma.definition.count(),
        prisma.image.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

    return {
      totalImages,
      definitionsWithImages,
      definitionsWithoutImages: totalDefinitions - definitionsWithImages,
      recentlyGenerated: recentImages,
    };
  } catch (error) {
    void serverLog(
      `Error getting image stats: ${error instanceof Error ? error.message : String(error)}`,
      'error',
    );
    return {
      totalImages: 0,
      definitionsWithImages: 0,
      definitionsWithoutImages: 0,
      recentlyGenerated: 0,
    };
  }
}
