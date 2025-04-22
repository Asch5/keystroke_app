'use server';

import { prisma } from '@/lib/prisma';
import { LanguageCode, PartOfSpeech } from '@prisma/client';

type PartOfSpeechDetails = {
  orderIndexPartOfspeech: number;
  freauencyGeneral: number;
};
type PartOfSpeechMap = {
  [key in PartOfSpeech]?: PartOfSpeechDetails;
};

type FrequencyWord = {
  word: string;
  orderIndexGeneralWord: number;
  freauencyGeneral?: number | null;
  isPartOfSpeech: boolean;
  partOfSpeech?: PartOfSpeechMap;
};

// Import result type
type ImportResult = {
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
  total: number;
  progress: number;
};

/**
 * Server action to import words from a JSON structure like combinedArrayWordsWithFrwquency
 * @param jsonData Array of FrequencyWord objects
 * @param language Language code
 * @returns Results of the import operation
 */
export async function importFrequencyJson(
  jsonData: FrequencyWord[],
  language: LanguageCode = LanguageCode.en,
): Promise<ImportResult> {
  const result: ImportResult = {
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    total: jsonData.length,
    progress: 0,
  };

  try {
    if (!jsonData || jsonData.length === 0) {
      return result;
    }
    console.log('jsonData', jsonData);

    // Process each frequency word
    for (let i = 0; i < jsonData.length; i++) {
      const frequencyWord = jsonData[i];
      if (!frequencyWord || !frequencyWord.word) {
        result.skipped++;
        continue;
      }

      try {
        // Check if word already exists with explicit field selection
        let wordRecord = await prisma.word.findFirst({
          where: {
            word: frequencyWord.word,
            languageCode: language,
          },
          select: {
            id: true,
            word: true,
            languageCode: true,
          },
        });

        // If word doesn't exist, create it
        if (!wordRecord) {
          try {
            wordRecord = await prisma.word.create({
              data: {
                word: frequencyWord.word,
                languageCode: language,
                additionalInfo: {},
              },
              select: {
                id: true,
                word: true,
                languageCode: true,
              },
            });
            result.added++;
          } catch (createError) {
            console.error(
              `Error creating word '${frequencyWord.word}':`,
              createError,
            );
            throw new Error(
              `Failed to create word: ${createError instanceof Error ? createError.message : String(createError)}`,
            );
          }
        } else {
          result.updated++;
        }

        // Ensure wordRecord is defined before proceeding
        if (!wordRecord) {
          throw new Error(
            `Failed to create or find word: ${frequencyWord.word}`,
          );
        }

        // Always add an entry with PartOfSpeech.undefined using orderIndexGeneralWord
        await prisma.wordFrequencyData.upsert({
          where: {
            orderIndex_language_wordId_partOfSpeech: {
              orderIndex: frequencyWord.orderIndexGeneralWord,
              language: language,
              wordId: wordRecord.id,
              partOfSpeech: PartOfSpeech.undefined,
            },
          },
          create: {
            wordId: wordRecord.id,
            orderIndex: frequencyWord.orderIndexGeneralWord,
            partOfSpeech: PartOfSpeech.undefined,
            frequency: frequencyWord.freauencyGeneral || 0,
            language: language,
          },
          update: {
            frequency: frequencyWord.freauencyGeneral || 0,
          },
        });

        // Process part of speech data if available
        if (frequencyWord.isPartOfSpeech && frequencyWord.partOfSpeech) {
          for (const [pos, details] of Object.entries(
            frequencyWord.partOfSpeech,
          )) {
            const partOfSpeech = pos as PartOfSpeech;

            await prisma.wordFrequencyData.upsert({
              where: {
                orderIndex_language_wordId_partOfSpeech: {
                  orderIndex: details.orderIndexPartOfspeech,
                  language: language,
                  wordId: wordRecord.id,
                  partOfSpeech: partOfSpeech,
                },
              },
              create: {
                wordId: wordRecord.id,
                orderIndex: details.orderIndexPartOfspeech,
                partOfSpeech: partOfSpeech,
                frequency: details.freauencyGeneral,
                language: language,
              },
              update: {
                frequency: details.freauencyGeneral,
              },
            });
          }
        }
      } catch (error) {
        console.error(`Error processing word '${frequencyWord.word}':`, error);
        result.errors.push(
          `Failed to process word '${frequencyWord.word}': ${error instanceof Error ? error.message : String(error)}`,
        );
        result.skipped++;
      }

      // Update progress
      result.progress = (i + 1) / jsonData.length;
    }

    return result;
  } catch (error) {
    console.error('Error importing frequency JSON:', error);
    throw new Error(
      `Failed to import frequency JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Server action to import words and add them to the WordFrequencyData table
 * @param words Array of words to import
 * @param language Language code
 * @returns Results of the import operation
 */
export async function importWordFrequencies(
  words: string[],
  language: LanguageCode = LanguageCode.en,
): Promise<ImportResult> {
  const result: ImportResult = {
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    total: words.length,
    progress: 0,
  };

  try {
    if (!words || words.length === 0) {
      return result;
    }

    // Process each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i]?.trim();
      if (!word) {
        result.skipped++;
        continue;
      }

      try {
        // Check if word already exists
        let wordRecord = await prisma.word.findUnique({
          where: {
            word_languageCode: {
              word: word,
              languageCode: language,
            },
          },
        });

        // If word doesn't exist, create it
        if (!wordRecord) {
          try {
            wordRecord = await prisma.word.create({
              data: {
                word: word,
                languageCode: language,
                additionalInfo: {},
              },
            });
            result.added++;
          } catch (createError) {
            console.error(`Error creating word '${word}':`, createError);
            throw new Error(
              `Failed to create word: ${createError instanceof Error ? createError.message : String(createError)}`,
            );
          }
        } else {
          result.updated++;
        }

        // Ensure wordRecord is defined before proceeding
        if (!wordRecord) {
          throw new Error(`Failed to create or find word: ${word}`);
        }

        // Check if frequency data already exists
        const existingFrequency = await prisma.wordFrequencyData.findFirst({
          where: {
            wordId: wordRecord.id,
            partOfSpeech: PartOfSpeech.undefined,
            language: language,
          },
        });

        if (!existingFrequency) {
          // Create new frequency data
          await prisma.wordFrequencyData.create({
            data: {
              wordId: wordRecord.id,
              orderIndex: i + 1, // Use the index in the list as order
              partOfSpeech: PartOfSpeech.undefined,
              frequency: 1, // Default frequency value
              language: language,
            },
          });
        } else {
          // Update existing frequency data
          await prisma.wordFrequencyData.update({
            where: {
              id: existingFrequency.id,
            },
            data: {
              orderIndex: i + 1, // Update the index
            },
          });
        }
      } catch (error) {
        console.error(`Error processing word '${word}':`, error);
        result.errors.push(
          `Failed to process word '${word}': ${error instanceof Error ? error.message : String(error)}`,
        );
        result.skipped++;
      }

      // Update progress
      result.progress = (i + 1) / words.length;
    }

    return result;
  } catch (error) {
    console.error('Error importing word frequencies:', error);
    throw new Error(
      `Failed to import word frequencies: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Server action to get word frequency data
 * @param language Language code
 * @param limit Maximum number of records to retrieve
 * @returns Array of word frequency records
 */
export async function getWordFrequencyData(
  language: LanguageCode = LanguageCode.en,
  limit: number = 100,
) {
  try {
    // First get the frequency data
    const frequencyData = await prisma.wordFrequencyData.findMany({
      where: {
        language,
      },
      orderBy: {
        orderIndex: 'asc',
      },
      take: limit,
    });

    // For each frequency record, get the word data
    const enrichedData = await Promise.all(
      frequencyData.map(async (record) => {
        const word = await prisma.word.findUnique({
          where: {
            id: record.wordId,
          },
        });

        return {
          frequency: record,
          word: word || null,
        };
      }),
    );

    return enrichedData;
  } catch (error) {
    console.error('Error fetching word frequency data:', error);
    throw new Error(
      `Failed to fetch word frequency data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
