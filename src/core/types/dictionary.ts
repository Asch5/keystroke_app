import {
  PartOfSpeech,
  RelationshipType,
  LanguageCode,
  SourceType,
  Gender,
} from '@/core/types';

//! Type definitions for dictionary operations

export interface DefinitionUpdateData {
  id?: number | undefined;
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
  id?: number | undefined;
  example: string;
  grammaticalNote: string | null;
}

export interface AudioUpdateData {
  id?: number | undefined;
  url: string;
  note?: string | null | undefined;
  source: SourceType;
  languageCode: LanguageCode;
  isPrimary?: boolean;
}

export interface RelatedWordUpdateData {
  id?: number | undefined;
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
  pl: 'Polish',
  hi: 'Hindi',
  ne: 'Nepali',
  tr: 'Turkish',
  sv: 'Swedish',
  no: 'Norwegian',
  fi: 'Finnish',
  ur: 'Urdu',
  fa: 'Persian',
  uk: 'Ukrainian',
  ro: 'Romanian',
  nl: 'Dutch',
  vi: 'Vietnamese',
  bn: 'Bengali',
  id: 'Indonesian',
} as const;

export const LANGUAGE_MAP_ARRAY = [
  { id: 'en', name: 'English' },
  { id: 'ru', name: 'Russian' },
  { id: 'da', name: 'Danish' },
] as const;

export interface DefinitionExampleOfProcessWordData {
  id?: number | null;
  example: string;
  languageCode: string;
  grammaticalNote?: string | null;
  sourceOfExample?: string | null;
}

export type RelationshipFromTo =
  | 'mainWord'
  | 'subWord'
  | 'mainWordDetails'
  | 'subWordDetails';

export interface AudioFile {
  url: string;
  word?: string | null;
  audio_type?: string | null;
  phonetic_audio?: string | null;
  note?: string | null;
}

export interface ProcessedWordData {
  word: {
    id?: number;
    word: string;
    languageCode: string;
    source: SourceType;
    isHighlighted: boolean;
    frequencyGeneral: number | null;
    forms?: string | null;
    frequency: number | null;
    partOfSpeech: PartOfSpeech | null;
    phonetic: string | null;
    variant?: string | null;
    gender?: Gender | null;
    audioFiles?: AudioFile[] | null;
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
      id?: number | null;
      example: string;
      languageCode: string;
      grammaticalNote?: string | null;
      sourceOfExample?: string | null;
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

interface SubWordDefinition {
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
    id?: number | null;
    example: string;
    languageCode: string;
    grammaticalNote?: string | null;
    sourceOfExample?: string | null;
  }[];
}

export interface SubWordData {
  id?: number | null;
  word: string;
  languageCode: string;
  phoneticGeneral?: string | null;
  frequencyGeneral?: string | null;
  etymology?: string | null;
  source: SourceType;
  //WordDetails section
  partOfSpeech: PartOfSpeech | null;
  phonetic?: string | null;
  variant?: string | null;
  gender?: Gender | null;
  forms?: string | null;
  audioFiles?: AudioFile[] | null;
  definitions: SubWordDefinition[];
  relationship: {
    fromWord: RelationshipFromTo;
    toWord: RelationshipFromTo;
    type: RelationshipType;
  }[];
  sourceData: string[];
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
export interface WordData {
  id?: number;
  word: string;
  languageCode: string;
  phonetic: string | null;
  etymology: string | null;
  definitions?: DefinitionUpdateData[];
  audioFiles?: AudioUpdateData[];
  examples?: Record<number, ExampleUpdateData[]>;
  relatedWords?: Record<RelationshipType, RelatedWordUpdateData[]>;
}

// ===== BACKWARD COMPATIBILITY LAYER =====
// Re-export new domain types for seamless transition
// Note: Domain types are available at @/core/domains/dictionary/types
// This maintains 100% backward compatibility while new code can use clean domain imports
