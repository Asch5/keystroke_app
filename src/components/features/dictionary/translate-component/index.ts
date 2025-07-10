/**
 * TranslateComponent modular components barrel export
 */

export { default as TranslateComponent } from './TranslateComponent';
export { useTranslationState } from './hooks/useTranslationState';
export { languageOptions, defaultOptions } from './constants';

// Component exports
export { TranslationForm } from './components/TranslationForm';
export { ErrorDisplay } from './components/ErrorDisplay';
export { TranslationResult } from './components/TranslationResult';
export { BasicTranslation } from './components/BasicTranslation';
export { TranslationsTab } from './components/TranslationsTab';
export { DefinitionsTab } from './components/DefinitionsTab';
export { ExamplesTab } from './components/ExamplesTab';
export { RawJsonTab } from './components/RawJsonTab';

// Type exports
export type {
  TranslationResponse,
  TranslationOptions,
  LanguageOption,
  TranslationFormProps,
  TranslationResultProps,
  BasicTranslationProps,
  TranslationsTabProps,
  DefinitionsTabProps,
  ExamplesTabProps,
  RawJsonTabProps,
  ErrorDisplayProps,
} from './types';
