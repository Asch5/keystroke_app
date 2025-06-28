import { LanguageCode } from '@prisma/client';

/**
 * Interface for list language information
 */
export interface ListLanguages {
  baseLanguageCode: LanguageCode;
  targetLanguageCode: LanguageCode;
}

/**
 * Interface for word language information
 */
export interface WordLanguages {
  baseLanguageCode: LanguageCode;
  targetLanguageCode: LanguageCode;
}

/**
 * Check if a word's languages are compatible with a list's languages
 * @param wordLanguages - The word's base and target language codes
 * @param listLanguages - The list's base and target language codes
 * @returns true if compatible, false otherwise
 */
export function isWordCompatibleWithList(
  wordLanguages: WordLanguages,
  listLanguages: ListLanguages,
): boolean {
  // A word is compatible with a list if:
  // 1. The word's languages match the list's languages exactly, OR
  // 2. The word's languages match the list's languages in reverse order
  const exactMatch =
    wordLanguages.baseLanguageCode === listLanguages.baseLanguageCode &&
    wordLanguages.targetLanguageCode === listLanguages.targetLanguageCode;

  const reverseMatch =
    wordLanguages.baseLanguageCode === listLanguages.targetLanguageCode &&
    wordLanguages.targetLanguageCode === listLanguages.baseLanguageCode;

  return exactMatch || reverseMatch;
}

/**
 * Check if a language is supported by a list (either as base or target)
 * @param language - The language code to check
 * @param listLanguages - The list's base and target language codes
 * @returns true if the language is supported, false otherwise
 */
export function isLanguageSupportedByList(
  language: LanguageCode,
  listLanguages: ListLanguages,
): boolean {
  return (
    language === listLanguages.baseLanguageCode ||
    language === listLanguages.targetLanguageCode
  );
}

/**
 * Get a human-readable string describing the list's supported languages
 * @param listLanguages - The list's base and target language codes
 * @returns A formatted string like "en-da" or "Danish-English"
 */
export function getListLanguagesDescription(
  listLanguages: ListLanguages,
  format: 'short' | 'long' = 'short',
): string {
  if (format === 'short') {
    return `${listLanguages.baseLanguageCode}-${listLanguages.targetLanguageCode}`;
  }

  // For long format, you could add a mapping to full language names
  const languageNames: Record<LanguageCode, string> = {
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
  };

  return `${languageNames[listLanguages.baseLanguageCode]} → ${languageNames[listLanguages.targetLanguageCode]}`;
}

/**
 * Validate that all words in a collection are compatible with a list's languages
 * @param words - Array of word language information
 * @param listLanguages - The list's base and target language codes
 * @returns Object with validation result and details
 */
export function validateWordsForList(
  words: WordLanguages[],
  listLanguages: ListLanguages,
): {
  isValid: boolean;
  compatibleCount: number;
  incompatibleCount: number;
  incompatibleWords: number[]; // indices of incompatible words
} {
  const incompatibleIndices: number[] = [];
  let compatibleCount = 0;

  words.forEach((word, index) => {
    if (isWordCompatibleWithList(word, listLanguages)) {
      compatibleCount++;
    } else {
      incompatibleIndices.push(index);
    }
  });

  return {
    isValid: incompatibleIndices.length === 0,
    compatibleCount,
    incompatibleCount: incompatibleIndices.length,
    incompatibleWords: incompatibleIndices,
  };
}
