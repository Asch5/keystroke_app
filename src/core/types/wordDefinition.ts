import { PartOfSpeech, SourceType, LanguageCode } from '@prisma/client';
import { WordFrequency } from '@/core/lib/utils/commonDictUtils/frequencyUtils';

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

/**
 * Form data structure for word editing - this is what the components expect
 */
export interface WordFormData {
  word: {
    id: number;
    text: string;
    phoneticGeneral: string | null;
    audio: string | null;
    audioFiles: Array<{
      id: number;
      url: string;
      isPrimary: boolean;
    }>;
    etymology: string | null;
    isPlural: boolean;
    pluralForm: string | null;
    pastTenseForm: string | null;
    pastParticipleForm: string | null;
    presentParticipleForm: string | null;
    thirdPersonForm: string | null;
    wordFrequency: WordFrequency;
    languageCode: LanguageCode;
    createdAt: Date;
    additionalInfo: string | null;
  };
  relatedWords: Record<
    string,
    Array<{
      id: number;
      word: string;
      phoneticGeneral?: string | null;
      audio?: string | null;
    }>
  >;
  definitions: Array<{
    id: number;
    text: string;
    partOfSpeech: PartOfSpeech;
    image?: {
      id: number;
      url?: string;
    } | null;
    frequencyPartOfSpeech: number;
    languageCode: LanguageCode;
    source: SourceType;
    subjectStatusLabels: string | null;
    isPlural: boolean;
    generalLabels: string | null;
    grammaticalNote: string | null;
    usageNote: string | null;
    isInShortDef: boolean;
    examples: Array<{
      id: number;
      text: string;
      grammaticalNote?: string | null;
      audio?: string | null;
    }>;
    translations: Array<{
      id: number;
      languageCode: LanguageCode;
      content: string;
    }>;
  }>;
  phrases: Array<unknown>; // Empty for now
  mistakes: Array<unknown>; // From WordEntryData
}
