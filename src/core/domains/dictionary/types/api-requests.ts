import {
  PartOfSpeech,
  SourceType,
  LanguageCode,
  RelationshipType,
} from '@/core/types';

/**
 * API request/response types for dictionary domain
 */

// Update data interfaces for API requests
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
  audioFiles?: import('./audio').AudioUpdateData[];
  examples?: Record<number, ExampleUpdateData[]>;
  relatedWords?: Record<RelationshipType, RelatedWordUpdateData[]>;
}

// API response interfaces
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

// General word data for API processing
export interface WordData {
  id?: number;
  word: string;
  languageCode: string;
  phonetic: string | null;
  etymology: string | null;
  definitions?: DefinitionUpdateData[];
  audioFiles?: import('./audio').AudioUpdateData[];
  examples?: Record<number, ExampleUpdateData[]>;
  relatedWords?: Record<RelationshipType, RelatedWordUpdateData[]>;
}
