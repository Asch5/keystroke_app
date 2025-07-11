import { SUPPORTED_LOCALES, DEFAULT_UI_LANGUAGE } from './constants';
import type {
  TranslationFile,
  TranslationKey,
  TranslationParams,
  UILanguageCode,
} from './types';
import { warnLog } from '@/core/infrastructure/monitoring/clientLogger';

/**
 * Translation Utilities
 *
 * Core utility functions for the i18n system including translation loading,
 * key resolution, parameter interpolation, and locale formatting.
 */

// Translation cache
const translationCache = new Map<UILanguageCode, TranslationFile>();

/**
 * Load translation file for a specific locale
 */
export async function loadTranslations(
  locale: UILanguageCode,
): Promise<TranslationFile> {
  // Check cache first
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!;
  }

  try {
    // Dynamic import based on locale
    const translations = await import(`../translations/${locale}.json`);
    const translationFile = translations.default as TranslationFile;

    // Cache the loaded translations
    translationCache.set(locale, translationFile);

    return translationFile;
  } catch {
    void warnLog(
      `Failed to load translations for locale ${locale}, falling back to English`,
    );

    // Fallback to English
    if (locale !== DEFAULT_UI_LANGUAGE) {
      return loadTranslations(DEFAULT_UI_LANGUAGE);
    }

    // If even English fails, return empty structure
    throw new Error('Failed to load default translations');
  }
}

/**
 * Get nested value from object using dot notation
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Interpolate parameters into translation string
 */
function interpolateParams(str: string, params?: TranslationParams): string {
  if (!params) return str;

  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Resolve translation key to string value
 */
export function resolveTranslationKey(
  translations: TranslationFile,
  key: TranslationKey,
  params?: TranslationParams,
  fallback?: string,
): string {
  // Handle simple keys (common namespace)
  if (!key.includes('.')) {
    const value = translations.common[key as keyof typeof translations.common];
    if (value) {
      return interpolateParams(value, params);
    }
  } else {
    // Handle namespaced keys
    const value = getNestedValue(translations, key);
    if (value && typeof value === 'string') {
      return interpolateParams(value, params);
    }
  }

  // Return fallback or key as last resort
  return fallback || key;
}

/**
 * Get browser locale or default
 */
export function getBrowserLocale(): UILanguageCode {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_LANGUAGE;
  }

  const browserLang = navigator.language.split('-')[0] as UILanguageCode;

  // Check if browser language is supported
  if (Object.keys(SUPPORTED_LOCALES).includes(browserLang)) {
    return browserLang;
  }

  return DEFAULT_UI_LANGUAGE;
}

/**
 * Get stored UI language preference
 */
export function getStoredLocale(): UILanguageCode {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_LANGUAGE;
  }

  try {
    const stored = localStorage.getItem(
      'keystroke_ui_language',
    ) as UILanguageCode;
    if (stored && Object.keys(SUPPORTED_LOCALES).includes(stored)) {
      return stored;
    }
  } catch {
    void warnLog('Failed to read stored locale preference');
  }

  return getBrowserLocale();
}

/**
 * Store UI language preference
 */
export function storeLocale(locale: UILanguageCode): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('keystroke_ui_language', locale);
  } catch {
    void warnLog('Failed to store locale preference');
  }
}

/**
 * Format date using locale-specific formatting
 */
export function formatDate(
  date: Date,
  locale: UILanguageCode,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch {
    // Fallback to English formatting
    return new Intl.DateTimeFormat('en', defaultOptions).format(date);
  }
}

/**
 * Format number using locale-specific formatting
 */
export function formatNumber(
  num: number,
  locale: UILanguageCode,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    // Fallback to English formatting
    return new Intl.NumberFormat('en', options).format(num);
  }
}

/**
 * Format currency using locale-specific formatting
 */
export function formatCurrency(
  amount: number,
  locale: UILanguageCode,
  currency?: string,
): string {
  const currencyCode = currency ?? 'USD'; // Default to USD

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    // Fallback formatting
    const localeConfig = SUPPORTED_LOCALES[locale];
    return `${localeConfig.numberFormat.currency}${formatNumber(
      amount,
      locale,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}`;
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date, locale: UILanguageCode): string {
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    const units: Array<[string, number]> = [
      ['year', 365 * 24 * 60 * 60],
      ['month', 30 * 24 * 60 * 60],
      ['day', 24 * 60 * 60],
      ['hour', 60 * 60],
      ['minute', 60],
      ['second', 1],
    ];

    for (const [unit, secondsInUnit] of units) {
      const value = Math.round(diffInSeconds / secondsInUnit);
      if (Math.abs(value) >= 1) {
        return rtf.format(value, unit as Intl.RelativeTimeFormatUnit);
      }
    }

    return rtf.format(0, 'second');
  } catch {
    // Fallback to simple English relative time
    const absSeconds = Math.abs(diffInSeconds);
    const isPast = diffInSeconds < 0;

    if (absSeconds < 60) {
      return isPast ? 'just now' : 'in a moment';
    } else if (absSeconds < 3600) {
      const minutes = Math.floor(absSeconds / 60);
      return isPast ? `${minutes}m ago` : `in ${minutes}m`;
    } else if (absSeconds < 86400) {
      const hours = Math.floor(absSeconds / 3600);
      return isPast ? `${hours}h ago` : `in ${hours}h`;
    } else {
      const days = Math.floor(absSeconds / 86400);
      return isPast ? `${days}d ago` : `in ${days}d`;
    }
  }
}

/**
 * Pluralization helper
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  if (count === 1) {
    return singular;
  }

  return plural ?? `${singular}s`;
}

/**
 * Clear translation cache (useful for testing or manual cache invalidation)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}
