import { PartOfSpeech, SourceType, LanguageCode, Gender } from '@prisma/client';

/**
 * Core word entity types for dictionary domain
 */

// Basic word structure - simplified from legacy types
export interface WordEntity {
  id?: number;
  word: string;
  languageCode: LanguageCode;
  phonetic?: string | null;
  etymology?: string | null;
  source: SourceType;
  isHighlighted?: boolean;
  frequencyGeneral?: number | null;
  forms?: string | null;
  frequency?: number | null;
  partOfSpeech?: PartOfSpeech | null;
  variant?: string | null;
  gender?: Gender | null;
  sourceEntityId?: string | null;
}

// Simple word for basic operations
export interface BasicWord {
  id: string;
  text: string; // Word in target language
  translation: string; // Word in base language
  languageId: string; // Target language ID
  category?: string; // Category of the word (optional)
  difficulty?: 'easy' | 'medium' | 'hard'; // Difficulty level
  audioUrl?: string; // URL to pronunciation audio (optional)
  exampleSentence?: string; // Example usage (optional)
}

// Word relationships
export interface WordRelationship {
  type: string;
  word: string;
  phonetic?: string | null;
}
