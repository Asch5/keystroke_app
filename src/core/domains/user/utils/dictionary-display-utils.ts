import { LanguageCode } from '@prisma/client';
import {
  getBestDefinitionForUser,
  TranslationData,
  DefinitionDisplayData,
  shouldUseTranslations,
} from '../../dictionary/utils/translation-utils';
import { getUserLanguageConfig } from './language-helpers';

/**
 * Enhanced user dictionary item for display with dynamic language support
 */
export interface UserDictionaryDisplayItem {
  // Core word data
  id: string;
  word: string;
  definition: string;

  // Display-optimized content (using user's preferred language)
  displayDefinition: string;
  isDefinitionTranslated: boolean;
  originalDefinition?: string | undefined;

  // Language information
  userBaseLanguage: LanguageCode;
  targetLanguage: LanguageCode;

  // Additional metadata
  hasTranslations: boolean;
  translationCount: number;
}

/**
 * Data structure for definition with translations
 */
export interface DefinitionWithTranslations {
  definition: string;
  targetLanguageCode: LanguageCode;
  translations: TranslationData[];
}

/**
 * Process user dictionary item to use optimal language display based on user preferences
 */
export async function processUserDictionaryItemForDisplay(
  userId: string,
  item: {
    id: string;
    word: string;
    definition: string;
    targetLanguageCode: LanguageCode;
    translations: TranslationData[];
  },
): Promise<UserDictionaryDisplayItem> {
  // Get user's current language configuration
  const userLanguageConfig = await getUserLanguageConfig(userId);

  // Get the best definition to display
  const displayData = getBestDefinitionForUser(
    item.definition,
    item.targetLanguageCode,
    item.translations,
    userLanguageConfig.baseLanguageCode,
  );

  return {
    id: item.id,
    word: item.word,
    definition: item.definition,
    displayDefinition: displayData.content,
    isDefinitionTranslated: displayData.isTranslation,
    originalDefinition: displayData.originalDefinition,
    userBaseLanguage: userLanguageConfig.baseLanguageCode,
    targetLanguage: item.targetLanguageCode,
    hasTranslations: item.translations.length > 0,
    translationCount: item.translations.length,
  };
}

/**
 * Process multiple dictionary items for display
 */
export async function processUserDictionaryItemsForDisplay(
  userId: string,
  items: Array<{
    id: string;
    word: string;
    definition: string;
    targetLanguageCode: LanguageCode;
    translations: TranslationData[];
  }>,
): Promise<UserDictionaryDisplayItem[]> {
  // Get user's language configuration once for efficiency
  const userLanguageConfig = await getUserLanguageConfig(userId);

  return items.map((item) => {
    const displayData = getBestDefinitionForUser(
      item.definition,
      item.targetLanguageCode,
      item.translations,
      userLanguageConfig.baseLanguageCode,
    );

    return {
      id: item.id,
      word: item.word,
      definition: item.definition,
      displayDefinition: displayData.content,
      isDefinitionTranslated: displayData.isTranslation,
      originalDefinition: displayData.originalDefinition,
      userBaseLanguage: userLanguageConfig.baseLanguageCode,
      targetLanguage: item.targetLanguageCode,
      hasTranslations: item.translations.length > 0,
      translationCount: item.translations.length,
    };
  });
}

/**
 * Get display text indicating translation status for UI
 */
export function getTranslationStatusText(
  isTranslated: boolean,
  userBaseLanguage: LanguageCode,
  targetLanguage: LanguageCode,
): string | null {
  if (!isTranslated) {
    return null;
  }

  return `Translated from ${targetLanguage.toUpperCase()} to ${userBaseLanguage.toUpperCase()}`;
}

/**
 * Check if content should show translation indicators
 */
export function shouldShowTranslationIndicator(
  userBaseLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  hasTranslations: boolean,
): boolean {
  return userBaseLanguage !== targetLanguage && hasTranslations;
}

/**
 * Check if translations should be shown based on user's language preferences
 * Alias for shouldUseTranslations for component compatibility
 */
export function shouldShowTranslations(
  userBaseLanguage: LanguageCode,
  targetLanguage: LanguageCode,
): boolean {
  return shouldUseTranslations(userBaseLanguage, targetLanguage);
}

/**
 * Get the display definition with translation priority based on user's language
 * Wrapper for getBestDefinitionForUser for component compatibility
 */
export function getDisplayDefinition(
  definitionData: DefinitionWithTranslations,
  userBaseLanguage: LanguageCode,
): DefinitionDisplayData {
  return getBestDefinitionForUser(
    definitionData.definition,
    definitionData.targetLanguageCode,
    definitionData.translations,
    userBaseLanguage,
  );
}
