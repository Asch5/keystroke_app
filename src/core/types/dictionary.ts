import {
  PartOfSpeech,
  RelationshipType,
  LanguageCode,
  SourceType,
  Gender,
} from '@prisma/client';

//! Type definitions for dictionary operations

export interface DefinitionUpdateData {
  id?: number;
  definition: string;
  partOfSpeech: PartOfSpeech;
  imageId: number | null;
  isPlural: boolean;
  source: SourceType;
  languageCode: LanguageCode;
  subjectStatusLabels: string | null;
  generalLabels: string | null;
  grammaticalNote: string | null;
  usageNote: string | null;
  isInShortDef: boolean;
}

export interface ExampleUpdateData {
  id?: number;
  example: string;
  grammaticalNote: string | null;
}

export interface AudioUpdateData {
  id?: number;
  url: string;
  source: SourceType;
  languageCode: LanguageCode;
  isPrimary?: boolean;
}

export interface RelatedWordUpdateData {
  id?: number;
  word: string;
  phonetic: string | null;
}

export interface WordUpdateData {
  word: string;
  phonetic: string | null;
  etymology: string | null;
  definitions?: DefinitionUpdateData[];
  audioFiles?: AudioUpdateData[];
  examples?: Record<number, ExampleUpdateData[]>;
  relatedWords?: Record<RelationshipType, RelatedWordUpdateData[]>;
}

export interface UpdateWordResult {
  success: boolean;
  data?: {
    id: number;
    word: string;
    phonetic?: string | null;
    etymology?: string | null;
  };
  error?: string;
}

//! Types for dictionary-related data structures
export const LANGUAGE_MAP: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
  da: 'Danish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
} as const;

export const LANGUAGE_MAP_ARRAY = [
  { id: 'en', name: 'English' },
  { id: 'ru', name: 'Russian' },
  { id: 'da', name: 'Danish' },
] as const;

export interface DefinitionExampleOfProcessWordData {
  example: string;
  languageCode: string;
  grammaticalNote?: string | null;
}

export type RelationshipFromTo =
  | 'mainWord'
  | 'subWord'
  | 'mainWordDetails'
  | 'subWordDetails';

export interface ProcessedWordData {
  word: {
    word: string;
    languageCode: string;
    source: SourceType;
    isHighlighted: boolean;
    frequencyGeneral: number | null;
    frequency: number | null;
    partOfSpeech: PartOfSpeech | null;
    phonetic: string | null;
    variant?: string | null;
    gender?: Gender | null;
    audioFiles?: string[] | null;
    etymology: string | null;
    sourceEntityId?: string | null;
    relatedWords: {
      type: RelationshipType;
      word: string;
    }[];
  };
  definitions: {
    id?: number | null;
    source: string;
    languageCode: string;
    definition: string;
    subjectStatusLabels?: string | null;
    generalLabels?: string | null;
    grammaticalNote?: string | null;
    usageNote?: string | null;
    isInShortDef?: boolean;
    image?: {
      id: number;
      url: string;
      description: string | null;
    } | null;
    examples: {
      example: string;
      languageCode: string;
      grammaticalNote?: string | null;
    }[];
  }[];
  phrases: {
    phrase: string;
    definition: string;
    examples: DefinitionExampleOfProcessWordData[];
  }[];
  stems: string[];
}

//frequency request
export interface FrequencyRequest {
  word: string;
  languageCode: LanguageCode;
}

// Example response from the frequency API
//  {
//   "word": "have",
//   "languageCode": "en",
//   "orderIndexGeneralWord": 54,
//   "frequencyGeneral": null,
//   "isPartOfSpeech": true,
//   "partOfSpeech": {
//     "verb": {
//       "orderIndexPartOfspeech": 2,
//       "frequencyGeneral": 45309447
//     },
//     "noun": {
//       "orderIndexPartOfspeech": 252,
//       "frequencyGeneral": 504864
//     }
//   }
// },

// frequency response
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
