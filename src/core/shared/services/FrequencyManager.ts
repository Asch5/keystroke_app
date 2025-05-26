import { LanguageCode, PartOfSpeech } from '@prisma/client';
import { LogLevel } from '@/core/lib/utils/logUtils';
import { serverLog } from '@/core/lib/server/serverLogger';
import {
  fetchWordFrequency,
  getGeneralFrequency,
  getPartOfSpeechFrequency,
} from '@/core/lib/services/frequencyService';

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
        serverLog(
          `Fetching frequency data for "${word}" (${languageCode})`,
          LogLevel.INFO,
        );

        const frequencyData = await fetchWordFrequency(word, languageCode);
        const generalFreq = getGeneralFrequency(frequencyData);

        // Initialize PoS-specific cache
        const posSpecificCache = new Map<PartOfSpeech, number | null>();

        this.cache.set(cacheKey, {
          general: generalFreq,
          posSpecific: posSpecificCache,
        });

        serverLog(
          `Cached frequency data for "${word}": general=${generalFreq}`,
          LogLevel.INFO,
        );
      } catch (error) {
        serverLog(
          `Error fetching frequency data for "${word}": ${error}`,
          LogLevel.ERROR,
        );

        // Cache null values to avoid retrying failed requests
        this.cache.set(cacheKey, {
          general: null,
          posSpecific: new Map<PartOfSpeech, number | null>(),
        });
      }
    }

    const cachedData = this.cache.get(cacheKey)!;
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

          serverLog(
            `Cached PoS frequency for "${word}" (${partOfSpeech}): ${posSpecificFreq}`,
            LogLevel.INFO,
          );
        } catch (error) {
          serverLog(
            `Error fetching PoS frequency for "${word}" (${partOfSpeech}): ${error}`,
            LogLevel.ERROR,
          );
          cachedData.posSpecific.set(partOfSpeech, null);
          posSpecificFreq = null;
        }
      } else {
        posSpecificFreq = cachedData.posSpecific.get(partOfSpeech)!;
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
