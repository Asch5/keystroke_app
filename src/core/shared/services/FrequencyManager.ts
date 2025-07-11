import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import {
  fetchWordFrequency,
  getGeneralFrequency,
  getPartOfSpeechFrequency,
} from '@/core/lib/services/frequencyService';
import { LanguageCode, PartOfSpeech } from '@/core/types';

/**
 * FrequencyManager class to handle frequency data caching and avoid duplicate API calls
 */
export class FrequencyManager {
  private cache = new Map<
    string,
    { general: number | null; posSpecific: Map<PartOfSpeech, number | null> }
  >();

  /**
   * Get frequency data for a word, caching results to avoid duplicate API calls
   */
  async getFrequencyData(
    word: string,
    languageCode: LanguageCode,
    partOfSpeech?: PartOfSpeech,
  ): Promise<{ general: number | null; posSpecific: number | null }> {
    const cacheKey = `${word}-${languageCode}`;

    // Check if we have cached data
    if (!this.cache.has(cacheKey)) {
      try {
        void serverLog(
          `Fetching frequency data for "${word}" (${languageCode})`,
          'info',
        );

        const frequencyData = await fetchWordFrequency(word, languageCode);
        const generalFreq = getGeneralFrequency(frequencyData);

        // Initialize PoS-specific cache
        const posSpecificCache = new Map<PartOfSpeech, number | null>();

        this.cache.set(cacheKey, {
          general: generalFreq,
          posSpecific: posSpecificCache,
        });

        void serverLog(
          `Cached frequency data for "${word}": general=${generalFreq}`,
          'info',
        );
      } catch (error) {
        void serverLog(
          `Error fetching frequency data for "${word}": ${error instanceof Error ? error.message : String(error)}`,
          'error',
        );

        // Cache null values to avoid retrying failed requests
        this.cache.set(cacheKey, {
          general: null,
          posSpecific: new Map<PartOfSpeech, number | null>(),
        });
      }
    }

    const cachedData = this.cache.get(cacheKey);
    if (!cachedData) {
      return { general: null, posSpecific: null };
    }
    let posSpecificFreq: number | null = null;

    // Get PoS-specific frequency if requested
    if (partOfSpeech) {
      if (!cachedData.posSpecific.has(partOfSpeech)) {
        try {
          // We need to re-fetch to get PoS-specific data, but we already have the general data cached
          const frequencyData = await fetchWordFrequency(word, languageCode);
          posSpecificFreq = getPartOfSpeechFrequency(
            frequencyData,
            partOfSpeech,
          );
          cachedData.posSpecific.set(partOfSpeech, posSpecificFreq);

          void serverLog(
            `Cached PoS frequency for "${word}" (${partOfSpeech}): ${posSpecificFreq}`,
            'info',
          );
        } catch (error) {
          void serverLog(
            `Error fetching PoS frequency for "${word}" (${partOfSpeech}): ${error instanceof Error ? error.message : String(error)}`,
            'error',
          );
          cachedData.posSpecific.set(partOfSpeech, null);
          posSpecificFreq = null;
        }
      } else {
        posSpecificFreq = cachedData.posSpecific.get(partOfSpeech) ?? null;
      }
    }

    return {
      general: cachedData.general,
      posSpecific: posSpecificFreq,
    };
  }

  /**
   * Clear cache for testing or memory management
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size for monitoring
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}
