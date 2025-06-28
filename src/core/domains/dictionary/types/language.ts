import { LanguageCode } from '@prisma/client';

/**
 * Language mapping types for dictionary domain
 */

// Language mappings
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
} as const;

export const LANGUAGE_MAP_ARRAY = [
  { id: 'en', name: 'English' },
  { id: 'ru', name: 'Russian' },
  { id: 'da', name: 'Danish' },
] as const;

// Language utility types
export interface LanguageInfo {
  id: LanguageCode;
  name: string;
  nativeName?: string;
  flag?: string;
}

export type SupportedLanguage = keyof typeof LANGUAGE_MAP;

/**
 * Get the display name for a language code
 */
export function getLanguageDisplayName(code: LanguageCode): string {
  return LANGUAGE_MAP[code];
}

/**
 * Check if a language code is valid
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return code in LANGUAGE_MAP;
}

/**
 * Get all available language codes
 */
export function getAllLanguageCodes(): LanguageCode[] {
  return Object.keys(LANGUAGE_MAP) as LanguageCode[];
}

/**
 * Get all available language display names
 */
export function getAllLanguageDisplayNames(): string[] {
  return Object.values(LANGUAGE_MAP);
}

/**
 * Get language options for forms and selectors
 */
export function getLanguageOptions(): Array<{
  value: LanguageCode;
  label: string;
}> {
  return Object.entries(LANGUAGE_MAP).map(([code, name]) => ({
    value: code as LanguageCode,
    label: name,
  }));
}
