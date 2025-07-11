/**
 * Internationalization System Exports
 *
 * Complete i18n system for the Keystroke App with type-safe translations,
 * automatic locale detection, and comprehensive formatting utilities.
 */

// Core types
export type {
  UILanguageCode,
  TranslationKey,
  TranslationParams,
  TranslationFile,
  TranslationKeys,
  I18nContextType,
  LocaleConfig,
} from './types';

// Constants
export {
  DEFAULT_UI_LANGUAGE,
  SUPPORTED_LOCALES,
  UI_LANGUAGE_STORAGE_KEY,
} from './constants';

// Utility functions
export {
  loadTranslations,
  resolveTranslationKey,
  getBrowserLocale,
  getStoredLocale,
  storeLocale,
  formatDate,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
  pluralize,
  clearTranslationCache,
} from './utils';

// React hooks and providers
export {
  useTranslation,
  useIntl,
  useLocale,
  I18nProvider,
} from '../../hooks/useTranslation';
