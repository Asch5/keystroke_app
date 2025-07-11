'use server';

import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { processAndSaveDanishWord } from '@/core/lib/db/processOrdnetApi';
import { processEnglishTranslationsForDanishWord } from '@/core/lib/db/wordTranslationProcessor';
import { prisma } from '@/core/lib/prisma';
import { ImageService } from '@/core/lib/services/imageService';
import type { WordVariant } from '@/core/types/translationDanishTypes';

interface ProcessDanishVariantResult {
  wordDisplay: string;
  status: 'added' | 'error';
  language: 'da';
  error?: string;
}

/**
 * Processes a single Danish word variant on the server:
 * 1. Saves the Danish word and its details.
 * 2. Processes and saves its English translations.
 * @param variant The Danish word variant data.
 * @param originalWord The original word string submitted by the user (for display purposes).
 * @returns An object indicating the result of the processing.
 */
export async function processDanishVariantOnServer(
  variant: WordVariant,
  originalWord: string,
): Promise<ProcessDanishVariantResult> {
  try {
    const processedWordData = await processAndSaveDanishWord(variant, prisma);

    if (!processedWordData?.word?.id) {
      void serverLog(
        `Failed to process or save Danish word variant for "${originalWord}". processedWordData was insufficient.`,
        'error',
        { variant },
      );
      return {
        wordDisplay: `word: ${variant.word.word} variant: ${variant.word.variant} partOfSpeech: ${variant.word.partOfSpeech} forms: ${variant.word.forms}`,
        status: 'error',
        language: 'da',
        error: 'Failed to save Danish word variant.',
      };
    }

    // Process English translations
    await processEnglishTranslationsForDanishWord(
      processedWordData,
      variant,
      prisma,
    );

    // Get the definitions for image processing
    if (
      processedWordData.definitions &&
      Array.isArray(processedWordData.definitions) &&
      processedWordData.definitions.length > 0
    ) {
      // Map to a simple array of definition IDs for image processing
      const definitionIds = processedWordData.definitions
        .filter((def) => def?.id != null)
        .map((def) => ({ id: def.id as number }));

      if (definitionIds.length > 0) {
        // Process images for the definitions
        await processImagesForTranslatedDefinitions(
          definitionIds,
          variant.word.word,
        );
      }
    } else {
      void serverLog(
        `No valid definitions found for image processing. processedWordData.definitions: ${processedWordData.definitions ? `Array(${Array.isArray(processedWordData.definitions) ? processedWordData.definitions.length : 'not array'})` : 'null/undefined'}`,
        'warn',
        { variant },
      );
    }

    return {
      wordDisplay: `word: ${variant.word.word} variant: ${variant.word.variant} partOfSpeech: ${variant.word.partOfSpeech} forms: ${variant.word.forms}`,
      status: 'added',
      language: 'da',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    void serverLog(
      `Error in server action processDanishVariantOnServer for "${originalWord}" (variant: ${variant.word.word}): ${errorMessage}`,
      'error',
      { error, variant },
    );
    console.error('Error in processDanishVariantOnServer:', error);
    return {
      wordDisplay: `word: ${variant.word.word} variant: ${variant.word.variant} partOfSpeech: ${variant.word.partOfSpeech} forms: ${variant.word.forms}`,
      status: 'error',
      language: 'da',
      error: `Server error: ${errorMessage}`,
    };
  }
}

/**
 * Process images for translated definitions using their English translations
 * to find better images.
 * @param definitions Array of definition objects with IDs
 * @param wordText The original word text
 */
export async function processImagesForTranslatedDefinitions(
  definitions: Array<{ id: number }>,
  wordText: string,
): Promise<void> {
  if (!definitions.length) return;

  const imageService = new ImageService();

  // Process in batches of 5 to limit concurrent requests
  const batchSize = 5;
  const batches = [];

  for (let i = 0; i < definitions.length; i += batchSize) {
    batches.push(definitions.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (definition) => {
        try {
          // Use the translated definition image method for Danish words
          const image = await imageService.getOrCreateTranslatedDefinitionImage(
            wordText,
            definition.id,
          );

          if (image) {
            await prisma.definition.update({
              where: { id: definition.id },
              data: { imageId: image.id },
            });
            void serverLog(
              `Successfully assigned image ${image.id} to definition ${definition.id}`,
              'info',
            );
          } else {
            void serverLog(
              `No image found for Danish definition ${definition.id} (word: "${wordText}")`,
              'warn',
            );
          }
        } catch (error) {
          void serverLog(
            `Error processing image for definition ${definition.id}: ${error instanceof Error ? error.message : String(error)}`,
            'error',
          );
        }
      }),
    );

    // Small delay between batches to avoid rate limiting
    if (batches.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
