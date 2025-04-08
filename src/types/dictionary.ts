import { LanguageCode } from '@prisma/client';

// Types for dictionary-related data structures
const LANGUAGE_MAP: Record<LanguageCode, string> = {
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

// const LANGUAGE_MAP_ARRAY = Object.entries(LANGUAGE_MAP).map(([code, name]) => ({
//     id: code,
//     name,
// }));

const LANGUAGE_MAP_ARRAY = [
  { id: 'en', name: 'English' },
  { id: 'ru', name: 'Russian' },
  { id: 'da', name: 'Danish' },
];

// src/types/dictionary.ts
export interface ProcessedWordData {
  word: {
    word: string;
    languageCode: string;
    phonetic: string | null;
    audio: string | null;
    etymology: string | null;
    relatedWords: {
      type: 'plural_en' | 'related' | 'phrasal_verb';
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
    isInShortDef?: boolean;
    examples: {
      example: string;
      languageCode: string;
    }[];
  }[];
  phrases: {
    phrase: string;
    definition: string;
    examples: {
      example: string;
      languageCode: string;
    }[];
  }[];
  stems: string[];
}

export { LANGUAGE_MAP, LANGUAGE_MAP_ARRAY };
