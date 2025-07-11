import type { LocaleConfig, UILanguageCode } from './types';

/**
 * Internationalization Constants
 *
 * Core configuration and constants for the i18n system
 */

// Default UI language
export const DEFAULT_UI_LANGUAGE: UILanguageCode = 'en';

// Supported UI languages configuration
export const SUPPORTED_LOCALES: Record<UILanguageCode, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: '$',
    },
  },
  da: {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: 'kr',
    },
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: '€',
    },
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      currency: '€',
    },
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: '.',
      currency: '€',
    },
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      currency: '₽',
    },
  },
} as const;

// Local storage key for UI language preference
export const UI_LANGUAGE_STORAGE_KEY = 'keystroke_ui_language';

// Fallback translations namespace priority
export const NAMESPACE_PRIORITY: string[] = [
  'common',
  'errors',
  'navigation',
  'settings',
  'dictionary',
  'practice',
  'admin',
  'auth',
];

// Translation file paths
export const TRANSLATION_PATHS = {
  en: '/locales/en.json',
  da: '/locales/da.json',
  es: '/locales/es.json',
  fr: '/locales/fr.json',
  de: '/locales/de.json',
  ru: '/locales/ru.json',
} as const;
