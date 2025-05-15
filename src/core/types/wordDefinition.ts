import { PartOfSpeech, SourceType } from '@prisma/client';

/**
 * Represents the junction table between WordDetails and Definition
 */
export interface WordDefinition {
  wordDetailsId: number;
  definitionId: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  wordDetails?: WordDetails;
}

/**
 * WordDetails model from the database
 */
export interface WordDetails {
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
