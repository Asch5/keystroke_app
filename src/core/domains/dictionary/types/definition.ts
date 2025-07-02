import { PartOfSpeech, SourceType, LanguageCode } from '@/core/types';

/**
 * Definition entity types for dictionary domain
 */

// Core definition entity
export interface DefinitionEntity {
  id: number;
  word?: string; // Not in DB schema, but used in some methods
  definition: string;
  imageId: number | null;
  source: SourceType;
  languageCode: LanguageCode;
  subjectStatusLabels?: string | null;
  generalLabels?: string | null;
  grammaticalNote?: string | null;
  usageNote?: string | null;
  isInShortDef: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  partOfSpeech?: PartOfSpeech; // For backward compatibility
  isPlural?: boolean; // For backward compatibility
}

// Definition for processing
export interface ProcessedDefinition {
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
  examples: DefinitionExample[];
}

// Definition examples
export interface DefinitionExample {
  id?: number | null;
  example: string;
  languageCode: string;
  grammaticalNote?: string | null;
  sourceOfExample?: string | null;
}
