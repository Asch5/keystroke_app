/**
 * Types for AddNewWordForm modular components
 */

export interface ProcessedWord {
  word: string;
  timestamp: Date;
  status: 'added' | 'existed';
  language?: 'en' | 'da';
  phonetic?: string | null;
  stems?: string[];
  definitions?: {
    id: number;
    partOfSpeech: string;
    definition: string;
    examples: { id: number; example: string }[];
  }[];
}

export interface AddNewWordFormProps {
  className?: string;
}

export interface WordProcessorState {
  loading: boolean;
  word: string;
  language: 'en' | 'da';
  dictionaryType: string;
  processOneWordOnly: boolean;
  processedWords: ProcessedWord[];
}

export interface FileProcessorState {
  fileUploading: boolean;
  uploadedFileName: string;
}

export type LanguageType = 'en' | 'da';
export type DictionaryType = 'learners' | 'intermediate';
