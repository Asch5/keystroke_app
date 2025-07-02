import { LanguageCode, PartOfSpeech } from '@/core/types';

/**
 * Frequency types for dictionary domain
 */

// Frequency request
export interface FrequencyRequest {
  word: string;
  languageCode: LanguageCode;
}

// Frequency response from API
export interface FrequencyResponse {
  word: string;
  languageCode: LanguageCode;
  orderIndexGeneralWord: number;
  frequencyGeneral: number | null;
  isPartOfSpeech: boolean;
  partOfSpeech:
    | {
        [key in PartOfSpeech]?: {
          orderIndexPartOfspeech: number;
          frequencyGeneral: number;
        };
      }
    | null;
  error?: string;
}

// Frequency utility types
export type FrequencyLevel =
  | 'very_common'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very_rare';

export interface FrequencyMapping {
  position: number;
  level: FrequencyLevel;
  description: string;
}
