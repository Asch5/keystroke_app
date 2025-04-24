import {
  PartOfSpeech,
  RelationshipType,
  LanguageCode,
  SourceType,
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

export interface ProcessedWordData {
  word: {
    word: string;
    languageCode: string;
    phonetic: string | null;
    audio: string | null;
    audioFiles?: string[] | null;
    etymology: string | null;
    phrasalVerbAnnotations?: string[] | null;
    sourceEntityId?: string | null;
    relatedWords: {
      type: RelationshipType;
      word: string;
    }[];
  };
  definitions: {
    partOfSpeech: string;
    source: string;
    languageCode: string;
    isPlural: boolean;
    definition: string;
    subjectStatusLabels?: string | null;
    generalLabels?: string | null;
    grammaticalNote?: string | null;
    usageNote?: string | null;
    isInShortDef?: boolean;
    examples: {
      example: string;
      languageCode: string;
      grammaticalNote?: string | null;
    }[];
  }[];
  phrases: {
    phrase: string;
    definition: string;
    examples: {
      example: string;
      languageCode: string;
      grammaticalNote?: string | null;
    }[];
  }[];
  stems: string[];
}
