/**
 * Google Cloud Text-to-Speech Service
 *
 * Features:
 * - Cost-effective voice selection
 * - Usage tracking and limits
 * - Flexible quality controls
 * - Caching for efficiency
 * - Rate limiting compliance
 */

import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

export interface TTSVoiceConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

export interface TTSQualityLevel {
  name: string;
  voiceType: 'standard' | 'wavenet' | 'neural2' | 'chirp3' | 'studio';
  costPerCharacter: number;
  freeLimit: number;
  description: string;
}

export interface TTSUsageStats {
  totalCharacters: number;
  charactersByVoiceType: Record<string, number>;
  estimatedCost: number;
  remainingFreeQuota: Record<string, number>;
  lastReset: Date;
}

export interface TTSRequest {
  text: string;
  languageCode: string;
  qualityLevel: 'standard' | 'high' | 'premium';
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate?: number; // 0.25 to 4.0
  pitch?: number; // -20.0 to 20.0
  cacheKey?: string;
}

export interface TTSResponse {
  audioContent: string; // base64 encoded audio
  contentType: string;
  characterCount: number;
  voiceUsed: string;
  cached: boolean;
  estimatedCost: number;
}

class TextToSpeechService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://texttospeech.googleapis.com/v1';
  private usageStats: TTSUsageStats;
  private audioCache = new Map<string, { audio: string; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 100;

  // Quality levels with cost optimization
  private readonly qualityLevels: Record<string, TTSQualityLevel> = {
    standard: {
      name: 'Standard',
      voiceType: 'standard',
      costPerCharacter: 0.000004,
      freeLimit: 4000000, // 4M characters
      description: 'Basic quality, most cost-effective',
    },
    high: {
      name: 'High Quality',
      voiceType: 'neural2',
      costPerCharacter: 0.000016,
      freeLimit: 1000000, // 1M characters
      description: 'Neural voices with natural sound',
    },
    premium: {
      name: 'Premium',
      voiceType: 'studio',
      costPerCharacter: 0.00016,
      freeLimit: 1000000, // 1M characters
      description: 'Studio quality for important content',
    },
  };

  // Supported voices by language
  private readonly voiceConfigs: Record<string, TTSVoiceConfig[]> = {
    en: [
      { languageCode: 'en-US', name: 'en-US-Standard-C', ssmlGender: 'FEMALE' },
      { languageCode: 'en-US', name: 'en-US-Standard-D', ssmlGender: 'MALE' },
      { languageCode: 'en-US', name: 'en-US-Neural2-C', ssmlGender: 'FEMALE' },
      { languageCode: 'en-US', name: 'en-US-Neural2-D', ssmlGender: 'MALE' },
      { languageCode: 'en-US', name: 'en-US-Studio-O', ssmlGender: 'FEMALE' },
      { languageCode: 'en-US', name: 'en-US-Studio-Q', ssmlGender: 'MALE' },
    ],
    da: [
      { languageCode: 'da-DK', name: 'da-DK-Standard-A', ssmlGender: 'FEMALE' },
      { languageCode: 'da-DK', name: 'da-DK-Neural2-D', ssmlGender: 'FEMALE' },
      { languageCode: 'da-DK', name: 'da-DK-WaveNet-A', ssmlGender: 'FEMALE' },
    ],
    es: [
      { languageCode: 'es-ES', name: 'es-ES-Standard-A', ssmlGender: 'FEMALE' },
      { languageCode: 'es-ES', name: 'es-ES-Neural2-B', ssmlGender: 'MALE' },
    ],
    fr: [
      { languageCode: 'fr-FR', name: 'fr-FR-Standard-A', ssmlGender: 'FEMALE' },
      { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B', ssmlGender: 'MALE' },
    ],
    de: [
      { languageCode: 'de-DE', name: 'de-DE-Standard-A', ssmlGender: 'FEMALE' },
      { languageCode: 'de-DE', name: 'de-DE-Neural2-B', ssmlGender: 'MALE' },
    ],
    ru: [
      { languageCode: 'ru-RU', name: 'ru-RU-Standard-A', ssmlGender: 'FEMALE' },
      { languageCode: 'ru-RU', name: 'ru-RU-Standard-B', ssmlGender: 'MALE' },
    ],
  };

  constructor() {
    this.apiKey = process.env.GOOGLE_TTS_API_KEY || '';
    if (!this.apiKey) {
      serverLog(
        'GOOGLE_TTS_API_KEY not found in environment variables. TTS functionality will be disabled.',
        'warn',
      );
      // Don't throw error - just disable TTS functionality
    }

    // Initialize usage stats
    this.usageStats = {
      totalCharacters: 0,
      charactersByVoiceType: {},
      estimatedCost: 0,
      remainingFreeQuota: {
        standard: this.qualityLevels.standard?.freeLimit || 0,
        high: this.qualityLevels.high?.freeLimit || 0,
        premium: this.qualityLevels.premium?.freeLimit || 0,
      },
      lastReset: new Date(),
    };

    // Clean cache periodically
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Generate speech from text with cost optimization
   */
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      // Check if API key is available
      if (!this.apiKey) {
        throw new Error(
          'TTS service is disabled. GOOGLE_TTS_API_KEY environment variable is not configured.',
        );
      }

      // Validate request
      this.validateRequest(request);

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedAudio = this.getFromCache(cacheKey);

      if (cachedAudio) {
        return {
          audioContent: cachedAudio.audio,
          contentType: 'audio/mp3',
          characterCount: request.text.length,
          voiceUsed: 'cached',
          cached: true,
          estimatedCost: 0,
        };
      }

      // Check usage limits
      const characterCount = request.text.length;

      if (!this.canProcessRequest(request.qualityLevel, characterCount)) {
        throw new Error(
          `Usage limit exceeded for ${request.qualityLevel} quality. Consider using a lower quality level.`,
        );
      }

      // Select optimal voice
      const voice = this.selectOptimalVoice(request);

      // Prepare API request
      const apiRequest = {
        input: { text: request.text },
        voice: {
          languageCode: voice.languageCode,
          name: voice.name,
          ssmlGender: request.ssmlGender || voice.ssmlGender,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: request.speakingRate || 1.0,
          pitch: request.pitch || 0.0,
        },
      };

      // Prepare headers for API request
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add referrer information for server-side requests
      if (typeof window === 'undefined') {
        // Server-side: add origin header
        headers['Origin'] = 'https://localhost:3000';
        headers['Referer'] = 'https://localhost:3000/';
      }

      // Make API call
      const response = await fetch(
        `${this.baseUrl}/text:synthesize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(apiRequest),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `TTS API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
        );
      }

      const data = await response.json();

      // Update usage tracking
      const estimatedCost = this.updateUsageStats(
        request.qualityLevel,
        characterCount,
      );

      // Cache the result
      this.addToCache(cacheKey, data.audioContent);

      return {
        audioContent: data.audioContent,
        contentType: 'audio/mp3',
        characterCount,
        voiceUsed: voice.name,
        cached: false,
        estimatedCost,
      };
    } catch (error) {
      serverLog('TTS Service Error', 'error', { error: String(error) });
      throw error;
    }
  }

  /**
   * Generate speech for word definitions (high quality)
   */
  async generateWordSpeech(
    text: string,
    languageCode: string,
    options?: Partial<TTSRequest>,
  ): Promise<TTSResponse> {
    return this.generateSpeech({
      text,
      languageCode,
      qualityLevel: 'high',
      cacheKey: `word_${languageCode}_${text}`,
      ...options,
    });
  }

  /**
   * Generate speech for examples (standard quality for cost efficiency)
   */
  async generateExampleSpeech(
    text: string,
    languageCode: string,
    options?: Partial<TTSRequest>,
  ): Promise<TTSResponse> {
    return this.generateSpeech({
      text,
      languageCode,
      qualityLevel: 'standard',
      cacheKey: `example_${languageCode}_${text}`,
      ...options,
    });
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): TTSUsageStats {
    return { ...this.usageStats };
  }

  /**
   * Reset usage statistics (typically called monthly)
   */
  resetUsageStats(): void {
    this.usageStats = {
      totalCharacters: 0,
      charactersByVoiceType: {},
      estimatedCost: 0,
      remainingFreeQuota: {
        standard: this.qualityLevels.standard?.freeLimit || 0,
        high: this.qualityLevels.high?.freeLimit || 0,
        premium: this.qualityLevels.premium?.freeLimit || 0,
      },
      lastReset: new Date(),
    };
  }

  /**
   * Get available quality levels
   */
  getQualityLevels(): Record<string, TTSQualityLevel> {
    return { ...this.qualityLevels };
  }

  /**
   * Check if request can be processed within limits
   */
  private canProcessRequest(
    qualityLevel: string,
    characterCount: number,
  ): boolean {
    const remaining = this.usageStats.remainingFreeQuota[qualityLevel];
    return remaining !== undefined && remaining >= characterCount;
  }

  /**
   * Get available genders for a specific language
   */
  getAvailableGenders(languageCode: string): ('MALE' | 'FEMALE' | 'NEUTRAL')[] {
    const availableVoices = this.voiceConfigs[languageCode];
    if (!availableVoices || availableVoices.length === 0) {
      return [];
    }

    const genders = new Set(availableVoices.map((voice) => voice.ssmlGender));
    return Array.from(genders).sort((a, b) => {
      // Prefer FEMALE > MALE > NEUTRAL order for consistency
      const order = { FEMALE: 0, MALE: 1, NEUTRAL: 2 };
      return order[a as keyof typeof order] - order[b as keyof typeof order];
    });
  }

  /**
   * Get default gender for a language (first available)
   */
  getDefaultGender(languageCode: string): 'MALE' | 'FEMALE' | 'NEUTRAL' | null {
    const availableGenders = this.getAvailableGenders(languageCode);
    return availableGenders.length > 0 ? availableGenders[0] || null : null;
  }

  /**
   * Select optimal voice based on request with better gender fallback
   */
  private selectOptimalVoice(request: TTSRequest): TTSVoiceConfig {
    const availableVoices = this.voiceConfigs[request.languageCode];

    if (!availableVoices || availableVoices.length === 0) {
      throw new Error(
        `No voices available for language: ${request.languageCode}`,
      );
    }

    const qualityConfig = this.qualityLevels[request.qualityLevel];

    if (!qualityConfig) {
      throw new Error(`Invalid quality level: ${request.qualityLevel}`);
    }

    // Filter voices by quality level
    const suitableVoices = availableVoices.filter((voice) => {
      if (qualityConfig.voiceType === 'standard') {
        return voice.name.includes('Standard');
      } else if (qualityConfig.voiceType === 'neural2') {
        return voice.name.includes('Neural2');
      } else if (qualityConfig.voiceType === 'studio') {
        return voice.name.includes('Studio');
      }
      return voice.name.includes('Standard'); // Fallback
    });

    const voicesToUse =
      suitableVoices.length > 0 ? suitableVoices : availableVoices;

    // Select voice based on gender preference with proper fallback
    if (request.ssmlGender) {
      const genderMatchedVoice = voicesToUse.find(
        (v) => v.ssmlGender === request.ssmlGender,
      );

      if (genderMatchedVoice) {
        return genderMatchedVoice;
      } else {
        // Log that requested gender is not available and fallback to default
        serverLog('Voice gender not available, using default', 'warn', {
          requestedGender: request.ssmlGender,
          languageCode: request.languageCode,
          availableGenders: this.getAvailableGenders(request.languageCode),
        });
      }
    }

    // Return first available voice as fallback
    const fallbackVoice = voicesToUse[0];
    if (!fallbackVoice) {
      throw new Error(
        `No suitable voice found for language: ${request.languageCode}`,
      );
    }
    return fallbackVoice;
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(
    qualityLevel: string,
    characterCount: number,
  ): number {
    const qualityConfig = this.qualityLevels[qualityLevel];
    const cost =
      Math.max(
        0,
        characterCount -
          (this.usageStats.remainingFreeQuota[qualityLevel] || 0),
      ) * (qualityConfig?.costPerCharacter || 0);

    this.usageStats.totalCharacters += characterCount;
    this.usageStats.charactersByVoiceType[qualityLevel] =
      (this.usageStats.charactersByVoiceType[qualityLevel] || 0) +
      characterCount;
    this.usageStats.estimatedCost += cost;
    this.usageStats.remainingFreeQuota[qualityLevel] = Math.max(
      0,
      (this.usageStats.remainingFreeQuota[qualityLevel] || 0) - characterCount,
    );

    return cost;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: TTSRequest): string {
    if (request.cacheKey) return request.cacheKey;

    const keyData = {
      text: request.text,
      lang: request.languageCode,
      quality: request.qualityLevel,
      gender: request.ssmlGender,
      rate: request.speakingRate,
      pitch: request.pitch,
    };

    return btoa(JSON.stringify(keyData)).replace(/[/+=]/g, '');
  }

  /**
   * Get audio from cache
   */
  private getFromCache(
    key: string,
  ): { audio: string; timestamp: number } | null {
    const cached = this.audioCache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.audioCache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Add audio to cache
   */
  private addToCache(key: string, audio: string): void {
    // Remove oldest entries if cache is full
    if (this.audioCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.audioCache.keys().next().value;
      if (oldestKey) {
        this.audioCache.delete(oldestKey);
      }
    }

    this.audioCache.set(key, {
      audio,
      timestamp: Date.now(),
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.audioCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.audioCache.delete(key);
      }
    }
  }

  /**
   * Validate TTS request
   */
  private validateRequest(request: TTSRequest): void {
    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Text is required');
    }

    if (request.text.length > 5000) {
      throw new Error('Text exceeds maximum length of 5000 characters');
    }

    if (!request.languageCode) {
      throw new Error('Language code is required');
    }

    if (!this.qualityLevels[request.qualityLevel]) {
      throw new Error(`Invalid quality level: ${request.qualityLevel}`);
    }

    if (
      request.speakingRate &&
      (request.speakingRate < 0.25 || request.speakingRate > 4.0)
    ) {
      throw new Error('Speaking rate must be between 0.25 and 4.0');
    }

    if (request.pitch && (request.pitch < -20.0 || request.pitch > 20.0)) {
      throw new Error('Pitch must be between -20.0 and 20.0');
    }
  }
}

// Lazy-loaded singleton instance
let _textToSpeechService: TextToSpeechService | null = null;

export const getTextToSpeechService = (): TextToSpeechService => {
  if (!_textToSpeechService) {
    _textToSpeechService = new TextToSpeechService();
  }
  return _textToSpeechService;
};

// Export singleton instance (lazy-loaded)
export const textToSpeechService = {
  generateSpeech: (request: TTSRequest) =>
    getTextToSpeechService().generateSpeech(request),
  generateWordSpeech: (
    text: string,
    languageCode: string,
    options?: Partial<TTSRequest>,
  ) => getTextToSpeechService().generateWordSpeech(text, languageCode, options),
  generateExampleSpeech: (
    text: string,
    languageCode: string,
    options?: Partial<TTSRequest>,
  ) =>
    getTextToSpeechService().generateExampleSpeech(text, languageCode, options),
  getUsageStats: () => getTextToSpeechService().getUsageStats(),
  resetUsageStats: () => getTextToSpeechService().resetUsageStats(),
  getQualityLevels: () => getTextToSpeechService().getQualityLevels(),
  getAvailableGenders: (languageCode: string) =>
    getTextToSpeechService().getAvailableGenders(languageCode),
  getDefaultGender: (languageCode: string) =>
    getTextToSpeechService().getDefaultGender(languageCode),
};

// Export utility functions for UI components
export const getAvailableGendersForLanguage = (languageCode: string) =>
  getTextToSpeechService().getAvailableGenders(languageCode);

export const getDefaultGenderForLanguage = (languageCode: string) =>
  getTextToSpeechService().getDefaultGender(languageCode);
