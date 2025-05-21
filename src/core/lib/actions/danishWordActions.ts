'use server';

import { prisma } from '@/core/lib/prisma';
import { processAndSaveDanishWord } from '@/core/lib/db/processOrdnetApi';
import { processEnglishTranslationsForDanishWord } from '@/core/lib/db/wordTranslationProcessor';
import type { WordVariant } from '@/core/types/translationDanishTypes';
import { logToFile } from '@/core/lib/server/serverLogger';
import { LogLevel } from '@/core/lib/utils/logUtils';

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
      { variantWord: variant.word.word, variantDetails: variant.word.variant },
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
        wordDisplay: `${originalWord}${variant.word.variant ? ` (${variant.word.variant})` : ''}`,
        status: 'error',
        language: 'da',
        error: 'Failed to save Danish word variant.',
      };
    }

    await processEnglishTranslationsForDanishWord(
      processedWordData,
      variant,
      prisma,
    );

    logToFile(
      `Successfully processed Danish variant and its translations for original word "${originalWord}" on server.`,
      LogLevel.INFO,
      { variantWord: variant.word.word },
    );

    return {
      wordDisplay: `${originalWord}${variant.word.variant ? ` (${variant.word.variant})` : ''}`,
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
      wordDisplay: `${originalWord}${variant.word.variant ? ` (${variant.word.variant})` : ''}`,
      status: 'error',
      language: 'da',
      error: `Server error: ${errorMessage}`,
    };
  }
}
