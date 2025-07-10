import { toast } from 'sonner';
import {
  getWordFromMerriamWebster,
  processAllWords,
  processOneWord,
} from '@/core/lib/db/processMerriamApi';
import { processDanishVariantOnServer } from '@/core/lib/actions/danishDictionaryActions/danishWordActions';
import { checkWordExistsByUuid } from '@/core/lib/actions/dictionaryActions';
import { ProcessedWord } from '../types';
import { DanishDictionaryObject } from '@/core/types/translationDanishTypes';

/**
 * Hook for processing individual words
 * Contains all business logic for word processing
 */
export function useWordProcessor() {
  const processWord = async (
    wordToProcess: string,
    language: 'en' | 'da',
    dictionaryType: string,
    processOneWordOnly: boolean,
  ): Promise<ProcessedWord[] | null> => {
    if (!wordToProcess.trim()) {
      return null;
    }

    try {
      if (language === 'en') {
        const formData = new FormData();
        formData.append('word', wordToProcess);
        formData.append('dictionaryType', dictionaryType);

        const result = await getWordFromMerriamWebster(
          {
            message: null,
            errors: { word: [] },
          },
          formData,
        );

        if (result.data && result.data.length > 0) {
          if (processOneWordOnly) {
            const firstEntry = result.data[0];
            const mainId = firstEntry?.meta?.id;
            const mainUuid = firstEntry?.meta?.uuid;

            if (mainId && mainUuid) {
              const existingWord = await checkWordExistsByUuid(
                mainId,
                mainUuid,
              );

              if (existingWord) {
                toast.info(
                  `The word "${wordToProcess}" already exists in the dictionary.`,
                );
                return [
                  {
                    word: firstEntry?.meta?.id || wordToProcess,
                    timestamp: new Date(),
                    status: 'existed',
                    language: 'en',
                  },
                ];
              }
            }

            if (firstEntry) {
              await processOneWord(firstEntry);
              toast.success(
                `Added "${wordToProcess}" and its related forms to the dictionary.`,
              );

              return [
                {
                  word: firstEntry?.meta?.id || wordToProcess,
                  timestamp: new Date(),
                  status: 'added',
                  language: 'en',
                },
              ];
            }
          } else {
            let allExist = true;
            const existsMap = new Map<string, boolean>();

            for (const entry of result.data) {
              const uuid = entry?.meta?.uuid;
              const wordId = entry?.meta?.id;

              if (uuid) {
                const exists = await checkWordExistsByUuid(wordId, uuid);
                existsMap.set(wordId, !!exists);

                if (!exists) {
                  allExist = false;
                }
              }
            }

            if (allExist) {
              toast.info(
                `All words related to "${wordToProcess}" already exist in the dictionary.`,
              );

              return result.data.map((entry) => ({
                word: entry?.meta?.id || wordToProcess,
                timestamp: new Date(),
                status: 'existed' as const,
                language: 'en' as const,
              }));
            }

            await processAllWords(result.data);

            return result.data.map((entry) => {
              const wordId = entry?.meta?.id || wordToProcess;
              return {
                word: wordId,
                timestamp: new Date(),
                status: existsMap.get(wordId)
                  ? ('existed' as const)
                  : ('added' as const),
                language: 'en' as const,
              };
            });
          }
        } else {
          toast.error(`No results found for "${wordToProcess}"`);
          return null;
        }
      } else if (language === 'da') {
        // Danish word processing
        const danishResult = await getWordsFromDanishDictionary([
          wordToProcess,
        ]);

        if (danishResult && danishResult.length > 0 && danishResult[0]) {
          await processDanishVariantOnServer(
            danishResult[0] as unknown as Parameters<
              typeof processDanishVariantOnServer
            >[0],
            wordToProcess,
          );
          toast.success(
            `Added Danish word "${wordToProcess}" to the dictionary.`,
          );

          return [
            {
              word: wordToProcess,
              timestamp: new Date(),
              status: 'added',
              language: 'da',
            },
          ];
        } else {
          toast.error(`No Danish definition found for "${wordToProcess}"`);
          return null;
        }
      }
    } catch (error) {
      console.error('Error processing word:', error);
      toast.error(`Error processing "${wordToProcess}". Please try again.`);
      return null;
    }

    return null;
  };

  return {
    processWord,
  };
}

async function getWordsFromDanishDictionary(
  words: string[],
): Promise<DanishDictionaryObject[]> {
  try {
    const response = await fetch(
      'http://localhost:5000/get_danish_definitions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(words),
      },
    );

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Danish definitions:', error);
    throw error;
  }
}
