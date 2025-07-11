import { clientLog } from '@/core/lib/utils/logUtils';
import { LanguageCode, PartOfSpeech } from '@/core/types';
import { FrequencyRequest, FrequencyResponse } from '@/core/types/dictionary';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

/**
 * Fetches frequency data for a single word
 * @param word The word to fetch frequency for
 * @param languageCode The language code of the word
 * @returns FrequencyResponse data or null if request failed
 */
export async function fetchWordFrequency(
  word: string,
  languageCode: LanguageCode,
): Promise<FrequencyResponse | null> {
  try {
    const request: FrequencyRequest = {
      word,
      languageCode,
    };

    const response = await fetch('http://192.168.8.231:5000/frequency', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([request]), // API expects an array of requests
    });

    if (!response.ok) {
      await serverLog('Failed to fetch frequency for word', 'error', {
        word,
        statusText: response.statusText,
      });
      return null;
    }

    const data: unknown = await response.json();
    void clientLog(
      `Frequency data --- from Frequency Service first step: ${JSON.stringify(data)}`,
      'info',
    );

    // API returns an array of responses, we expect the first item
    if (Array.isArray(data) && data.length > 0) {
      const frequencyItem = data[0] as FrequencyResponse;

      // Only treat as error if 'error' property exists AND is not null
      if (
        frequencyItem &&
        'error' in frequencyItem &&
        frequencyItem['error'] !== null
      ) {
        void clientLog(
          `Error fetching frequency for word ---- from Frequency Service: ${word}: ${frequencyItem['error']}`,
          'error',
        );
        return null;
      }
      void clientLog(
        `Frequency frequencyItem ---- from Frequency Service: ${JSON.stringify(frequencyItem)}`,
        'info',
      );
      return frequencyItem;
    }

    return null;
  } catch (error) {
    await serverLog('Exception fetching frequency for word', 'error', {
      word,
      error,
    });
    return null;
  }
}

/**
 * Fetches frequency data for multiple words in batch
 * @param requests Array of word and language code pairs
 * @returns Array of FrequencyResponse objects
 */
export async function fetchBatchFrequencies(
  requests: FrequencyRequest[],
): Promise<(FrequencyResponse | null)[]> {
  if (requests.length === 0) {
    return [];
  }

  try {
    const response = await fetch('http://localhost:5555/frequency', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requests),
    });

    if (!response.ok) {
      await serverLog('Failed to fetch batch frequencies', 'error', {
        statusText: response.statusText,
      });
      return requests.map(() => null);
    }

    const data: unknown = await response.json();

    if (Array.isArray(data)) {
      const results = await Promise.all(
        data.map(async (item, index) => {
          if (typeof item === 'object' && item !== null && 'error' in item) {
            const errorItem = item as { error: unknown };
            await serverLog(
              'Error fetching frequency for word in batch',
              'error',
              {
                word: requests[index]?.word,
                error: String(errorItem.error),
              },
            );
            return null;
          }
          return item as FrequencyResponse;
        }),
      );
      return results;
    }

    return requests.map(() => null);
  } catch (error) {
    await serverLog('Exception fetching batch frequencies', 'error', {
      error,
    });
    return requests.map(() => null);
  }
}

/**
 * Gets the general frequency for a word
 * @param frequencyData The frequency response data
 * @returns The general frequency value or null
 */
export function getGeneralFrequency(
  frequencyData: FrequencyResponse | null,
): number | null {
  if (!frequencyData) return null;

  // Return the general frequency if available
  return frequencyData.orderIndexGeneralWord;
}

/**
 * Gets the frequency for a specific part of speech
 * @param frequencyData The frequency response data
 * @param partOfSpeech The part of speech to get frequency for
 * @returns The frequency value for the specified part of speech or null
 */
export function getPartOfSpeechFrequency(
  frequencyData: FrequencyResponse | null,
  partOfSpeech: PartOfSpeech | null,
): number | null {
  if (!frequencyData || !partOfSpeech || !frequencyData.isPartOfSpeech) {
    return null;
  }

  // If the part of speech exists in the data, return its frequency
  const posData = frequencyData.partOfSpeech?.[partOfSpeech];
  return posData ? posData.orderIndexPartOfspeech : null;
}

/**
 * Gets the highest frequency across all parts of speech
 * @param frequencyData The frequency response data
 * @returns The highest frequency value or null
 */
export function getHighestPartOfSpeechFrequency(
  frequencyData: FrequencyResponse | null,
): number | null {
  if (!frequencyData?.isPartOfSpeech) {
    return null;
  }

  let highestFrequency: number | null = null;

  // Find the highest frequency across all parts of speech
  if (frequencyData.partOfSpeech) {
    // Use type-safe approach to iterate through the object
    Object.entries(frequencyData.partOfSpeech).forEach(([, posData]) => {
      // Add type assertion to posData
      const typedPosData = posData as {
        orderIndexPartOfspeech: number;
        frequencyGeneral: number;
      };
      if (typedPosData && 'frequencyGeneral' in typedPosData) {
        if (
          highestFrequency === null ||
          typedPosData.frequencyGeneral > highestFrequency
        ) {
          highestFrequency = typedPosData.frequencyGeneral;
        }
      }
    });
  }

  return highestFrequency;
}
