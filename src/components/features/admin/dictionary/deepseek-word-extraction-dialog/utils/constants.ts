import { LanguageOption } from '../types';

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'da', label: 'Danish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'no', label: 'Norwegian' },
];

export const DEFAULT_TARGET_LANGUAGES = ['en'];
export const DEFAULT_SOURCE_LANGUAGE = 'da';
export const DEFAULT_ONLY_SHORT_DEFINITIONS = false;
