'use server';

import {
  getWordFrequencyEnum,
  getFrequencyPartOfSpeechEnum,
  WordFrequency,
  FrequencyPartOfSpeech,
} from '@/core/lib/utils/commonDictUtils/frequencyUtils';
import { prisma } from '@/core/lib/prisma';
import { LanguageCode, PartOfSpeech } from '@prisma/client';

/**
 * Determines the WordFrequency enum value based on the word's position in the frequency list
 * This is an async wrapper for the utility function to meet Server Action requirements
 * @param wordPosition The position of the word in the frequency list (1-based index)
 * @returns The appropriate WordFrequency enum value
 */
export async function mapWordFrequency(
  wordPosition: number,
): Promise<WordFrequency> {
  return getWordFrequencyEnum(wordPosition);
}

/**
 * Determines the FrequencyPartOfSpeech enum value based on the part of speech position
 * This is an async wrapper for the utility function to meet Server Action requirements
 * @param positionInPartOfSpeech The position of the word among words with the same part of speech
 * @returns The appropriate FrequencyPartOfSpeech enum value
 */
export async function mapFrequencyPartOfSpeech(
  positionInPartOfSpeech: number,
): Promise<FrequencyPartOfSpeech> {
  return getFrequencyPartOfSpeechEnum(positionInPartOfSpeech);
}

/**
 * Server action to import frequency data from JSON file
 * @param jsonData Array of frequency word data from JSON file
 * @param languageCode The language code for the words
 * @returns Import results with statistics
 */
export async function importFrequencyJson(
  jsonData: Array<{
    word: string;
    orderIndexGeneralWord: number;
    freauencyGeneral?: number | null;
    isPartOfSpeech: boolean;
    partOfSpeech?: Record<
      string,
      {
        orderIndexPartOfspeech: number;
        freauencyGeneral: number;
      }
    >;
  }>,
  languageCode: LanguageCode,
): Promise<{
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
  total: number;
  progress: number;
}> {
  const results = {
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    total: jsonData.length,
    progress: 0,
  };

  try {
    // Process in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);

      await prisma.$transaction(async (tx) => {
        for (const item of batch) {
          try {
            if (!item.word || typeof item.word !== 'string') {
              results.errors.push(
                `Invalid word data at index ${i}: missing or invalid word`,
              );
              results.skipped++;
              continue;
            }

            // Check if word already exists
            const existingWord = await tx.word.findFirst({
              where: {
                word: item.word,
                languageCode: languageCode,
              },
              include: {
                details: true,
              },
            });

            if (existingWord) {
              // Update existing word with frequency data
              await tx.word.update({
                where: { id: existingWord.id },
                data: {
                  frequencyGeneral: item.orderIndexGeneralWord,
                },
              });

              // Update word details if they exist
              if (existingWord.details && existingWord.details.length > 0) {
                for (const detail of existingWord.details) {
                  // Try to find matching part of speech frequency
                  let posFrequency: number | null = null;
                  if (
                    item.isPartOfSpeech &&
                    item.partOfSpeech &&
                    detail.partOfSpeech
                  ) {
                    const posData = item.partOfSpeech[detail.partOfSpeech];
                    if (posData) {
                      posFrequency = posData.orderIndexPartOfspeech;
                    }
                  }

                  await tx.wordDetails.update({
                    where: { id: detail.id },
                    data: {
                      frequency: posFrequency,
                    },
                  });
                }
              }

              results.updated++;
            } else {
              // Create new word with frequency data
              const newWord = await tx.word.create({
                data: {
                  word: item.word,
                  languageCode: languageCode,
                  frequencyGeneral: item.orderIndexGeneralWord,
                },
              });

              // Create basic word details if we have part of speech data
              if (item.isPartOfSpeech && item.partOfSpeech) {
                for (const [posKey, posData] of Object.entries(
                  item.partOfSpeech,
                )) {
                  // Map string part of speech to enum
                  let partOfSpeech: PartOfSpeech | null = null;
                  try {
                    partOfSpeech = posKey as PartOfSpeech;
                  } catch {
                    console.warn(`Unknown part of speech: ${posKey}`);
                    continue;
                  }

                  await tx.wordDetails.create({
                    data: {
                      wordId: newWord.id,
                      partOfSpeech: partOfSpeech,
                      source: 'frequency_import',
                      frequency: posData.orderIndexPartOfspeech,
                    },
                  });
                }
              }

              results.added++;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            results.errors.push(
              `Error processing word "${item.word}": ${errorMessage}`,
            );
            results.skipped++;
          }
        }
      });

      // Update progress
      results.progress = Math.round(
        ((i + batch.length) / jsonData.length) * 100,
      );
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.errors.push(`Fatal error during import: ${errorMessage}`);
    return results;
  }
}
