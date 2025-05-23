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
