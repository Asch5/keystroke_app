'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation, SUPPORTED_LOCALES } from '@/core/shared/services/i18n';
import type { UILanguageCode } from '@/core/shared/services/i18n';

/**
 * Language Selector Component
 *
 * Allows users to switch the interface language.
 * Demonstrates the complete i18n system with dynamic language switching.
 */
export function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();

  const handleLanguageChange = (newLocale: UILanguageCode) => {
    setLocale(newLocale);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">
        {t('settings.interfaceLanguage')}:
      </span>
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_LOCALES).map(([code, config]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <span>{config.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({config.nativeName})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Compact Language Selector (for narrow spaces)
 */
export function CompactLanguageSelector() {
  const { locale, setLocale } = useTranslation();

  const handleLanguageChange = (newLocale: UILanguageCode) => {
    setLocale(newLocale);
  };

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SUPPORTED_LOCALES).map(([code, config]) => (
          <SelectItem key={code} value={code}>
            {config.nativeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
