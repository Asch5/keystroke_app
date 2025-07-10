/**
 * Types for TranslateComponent modular components
 */

import { TranslationSynonym, Definition } from 'extended-google-translate-api';

export interface TranslationResponse {
  word: string;
  translation: string;
  wordTranscription?: string;
  translationTranscription?: string;
  translations?: Record<string, (string | TranslationSynonym)[]>;
  definitions?: Record<string, (string | Definition)[]>;
  examples?: string[];
}

export interface TranslationOptions {
  returnRawResponse: boolean;
  detailedTranslations: boolean;
  definitionSynonyms: boolean;
  detailedTranslationsSynonyms: boolean;
  definitions: boolean;
  definitionExamples: boolean;
  examples: boolean;
  removeStyles: boolean;
}

export interface LanguageOption {
  value: string;
  label: string;
}

export interface TranslationFormProps {
  text: string;
  sourceLang: string;
  destLang: string;
  options: TranslationOptions;
  isLoading: boolean;
  onTextChange: (text: string) => void;
  onSourceLangChange: (lang: string) => void;
  onDestLangChange: (lang: string) => void;
  onOptionChange: (option: keyof TranslationOptions, value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export interface TranslationResultProps {
  result: TranslationResponse;
}

export interface BasicTranslationProps {
  result: TranslationResponse;
}

export interface TranslationsTabProps {
  translations: Record<string, (string | TranslationSynonym)[]> | undefined;
}

export interface DefinitionsTabProps {
  definitions: Record<string, (string | Definition)[]> | undefined;
}

export interface ExamplesTabProps {
  examples: string[] | undefined;
}

export interface RawJsonTabProps {
  result: TranslationResponse;
}

export interface ErrorDisplayProps {
  error: string;
}
