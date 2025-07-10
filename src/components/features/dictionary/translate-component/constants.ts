/**
 * Constants for TranslateComponent
 */

import { LanguageOption, TranslationOptions } from './types';

// Language options for source and destination
export const languageOptions: LanguageOption[] = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'ar', label: 'Arabic' },
];

// Default translation options
export const defaultOptions: TranslationOptions = {
  returnRawResponse: false,
  detailedTranslations: true,
  definitionSynonyms: false,
  detailedTranslationsSynonyms: false,
  definitions: true,
  definitionExamples: false,
  examples: true,
  removeStyles: true,
};
