'use server';

import { prisma } from '@/core/lib/prisma';
import { processAndSaveDanishWord } from '@/core/lib/db/processOrdnetApi';
import { processEnglishTranslationsForDanishWord } from '@/core/lib/db/wordTranslationProcessor';
import type { WordVariant } from '@/core/types/translationDanishTypes';
import { logToFile } from '@/core/lib/server/serverLogger';
import { LogLevel, serverLog } from '@/core/lib/utils/logUtils';
import { ImageService } from '../../services/imageService';

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
    logToFile(
      `Server action processDanishVariantOnServer called for variant of "${originalWord}"`,
      LogLevel.INFO,
      {
        originalWord,
        variantWord: variant.word.word,
        variantDetails: variant.word.variant,
        partOfSpeech: variant.word.partOfSpeech,
        form: variant.word.forms,
      },
    );

    const processedWordData = await processAndSaveDanishWord(variant, prisma);

    if (
      !processedWordData ||
      !processedWordData.word ||
      !processedWordData.word.id
    ) {
      logToFile(
        `Failed to process or save Danish word variant for "${originalWord}". processedWordData was insufficient.`,
        LogLevel.ERROR,
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
      processedWordData.definitions.length > 0
    ) {
      // Map to a simple array of definition IDs for image processing
      const definitionIds = processedWordData.definitions
        .filter((def) => def.id != null)
        .map((def) => ({ id: def.id as number }));

      if (definitionIds.length > 0) {
        // Process images for the definitions
        await processImagesForTranslatedDefinitions(
          definitionIds,
          variant.word.word,
        );
      }
    }

    logToFile(
      `Successfully processed Danish variant and its translations for original word "${originalWord}" on server.`,
      LogLevel.INFO,
      { variantWord: variant.word.word },
    );

    return {
      wordDisplay: `word: ${variant.word.word} variant: ${variant.word.variant} partOfSpeech: ${variant.word.partOfSpeech} forms: ${variant.word.forms}`,
      status: 'added',
      language: 'da',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToFile(
      `Error in server action processDanishVariantOnServer for "${originalWord}" (variant: ${variant.word.word}): ${errorMessage}`,
      LogLevel.ERROR,
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
          serverLog(
            `Processing image for translation of definition ${definition.id} of word "${wordText}"`,
            LogLevel.INFO,
          );

          // Get or create an image for the definition
          const image = await imageService.getOrCreateDefinitionImage(
            wordText,
            definition.id,
          );

          if (image) {
            await prisma.definition.update({
              where: { id: definition.id },
              data: { imageId: image.id },
            });

            serverLog(
              `Updated definition ${definition.id} with image ${image.id}`,
              LogLevel.INFO,
            );
          } else {
            serverLog(
              `No image found for definition ${definition.id}`,
              LogLevel.WARN,
            );
          }
        } catch (error) {
          serverLog(
            `Error processing image for definition ${definition.id}: ${error instanceof Error ? error.message : String(error)}`,
            LogLevel.ERROR,
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
