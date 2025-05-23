import { PartOfSpeech, SourceType } from '@prisma/client';

/**
 * Word details entity types for dictionary domain
 */

/**
 * Represents the junction table between WordDetails and Definition
 */
export interface WordDefinitionRelation {
  wordDetailsId: number;
  definitionId: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  wordDetails?: WordDetailsEntity;
}

/**
 * WordDetails model from the database
 */
export interface WordDetailsEntity {
  id: number;
  wordId: number;
  partOfSpeech: PartOfSpeech;
  variant?: string | null;
  gender?: string | null;
  phonetic?: string | null;
  forms?: string | null;
  frequency?: number | null;
  isPlural: boolean;
  source: SourceType;
}
