'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
  createContext,
} from 'react';
import { DEFAULT_UI_LANGUAGE } from '../services/i18n/constants';
import type {
  TranslationFile,
  TranslationKey,
  TranslationParams,
  UILanguageCode,
  I18nContextType,
} from '../services/i18n/types';
import {
  loadTranslations,
  resolveTranslationKey,
  getStoredLocale,
  storeLocale,
  formatDate as formatDateUtil,
  formatNumber as formatNumberUtil,
  formatCurrency as formatCurrencyUtil,
  formatRelativeTime as formatRelativeTimeUtil,
} from '../services/i18n/utils';

/**
 * I18n Context and Hook
 *
 * Provides translation functionality throughout the application with
 * automatic locale detection, caching, and formatting utilities.
 */

// Create the i18n context
const I18nContext = createContext<I18nContextType | null>(null);

// Default empty translations to prevent errors during loading
const DEFAULT_TRANSLATIONS = {
  common: {},
  settings: {},
  dictionary: {},
  practice: {},
  admin: {},
  auth: {},
  errors: {},
  navigation: {},
} as TranslationFile;

/**
 * I18n Provider Component
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] =
    useState<UILanguageCode>(DEFAULT_UI_LANGUAGE);
  const [translations, setTranslations] =
    useState<TranslationFile>(DEFAULT_TRANSLATIONS);
  const [isLoading, setIsLoading] = useState(true);

  // Load translations when locale changes
  useEffect(() => {
    async function loadTranslationsForLocale() {
      setIsLoading(true);
      try {
        const loadedTranslations = await loadTranslations(locale);
        setTranslations(loadedTranslations);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Keep current translations as fallback
      } finally {
        setIsLoading(false);
      }
    }

    loadTranslationsForLocale();
  }, [locale]);

  // Initialize locale from storage on mount
  useEffect(() => {
    const storedLocale = getStoredLocale();
    setLocaleState(storedLocale);
  }, []);

  // Update locale and persist to storage
  const setLocale = useCallback((newLocale: UILanguageCode) => {
    setLocaleState(newLocale);
    storeLocale(newLocale);
  }, []);

  // Translation function
  const t = useCallback(
    (
      key: TranslationKey,
      params?: TranslationParams,
      options?: { fallback?: string },
    ): string => {
      if (isLoading && !translations.common.save) {
        // Return key as fallback during loading
        return options?.fallback || key;
      }

      return resolveTranslationKey(
        translations,
        key,
        params,
        options?.fallback,
      );
    },
    [translations, isLoading],
  );

  // Formatting functions with locale binding
  const formatDate = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions) =>
      formatDateUtil(date, locale, options),
    [locale],
  );

  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions) =>
      formatNumberUtil(num, locale, options),
    [locale],
  );

  const formatCurrency = useCallback(
    (amount: number, currency?: string) =>
      formatCurrencyUtil(amount, locale, currency),
    [locale],
  );

  const formatRelativeTime = useCallback(
    (date: Date) => formatRelativeTimeUtil(date, locale),
    [locale],
  );

  const contextValue: I18nContextType = useMemo(
    () => ({
      locale,
      translations,
      setLocale,
      t,
      formatDate,
      formatNumber,
      formatCurrency,
      formatRelativeTime,
    }),
    [
      locale,
      translations,
      setLocale,
      t,
      formatDate,
      formatNumber,
      formatCurrency,
      formatRelativeTime,
    ],
  );

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}

/**
 * Main useTranslation hook
 */
export function useTranslation() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  return context;
}

/**
 * Hook for formatting utilities only (lighter alternative)
 */
export function useIntl() {
  const {
    locale,
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
  } = useTranslation();

  return {
    locale,
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
  };
}

/**
 * Hook to get current locale
 */
export function useLocale() {
  const { locale, setLocale } = useTranslation();

  return {
    locale,
    setLocale,
  };
}
