import { LanguageCode } from '@prisma/client';
import { getBestDefinitionForUser } from '../../dictionary/utils/translation-utils';

/**
 * Interface for a word with potential translations
 */
export interface WordWithTranslations {
  definition: string;
  targetLanguageCode: LanguageCode;
  translations?: Array<{
    id: number;
    languageCode: LanguageCode;
    content: string;
  }>;
}

/**
 * Get the best definition to display for a user based on their native language
 * This function can be used with any word object that has definition and translations
 */
export function getDisplayDefinition(
  word: WordWithTranslations,
  userNativeLanguage: LanguageCode,
): {
  content: string;
  isTranslation: boolean;
  originalDefinition?: string | undefined;
} {
  if (!word.translations || word.translations.length === 0) {
    // No translations available, return original definition
    return {
      content: word.definition,
      isTranslation: false,
    };
  }

  // Use the translation utility to get the best definition
  const bestDefinition = getBestDefinitionForUser(
    word.definition,
    word.targetLanguageCode,
    word.translations,
    userNativeLanguage,
  );

  return {
    content: bestDefinition.content,
    isTranslation: bestDefinition.isTranslation,
    originalDefinition: bestDefinition.originalDefinition,
  };
}

/**
 * Check if a user should see translations based on their language settings
 */
export function shouldShowTranslations(
  userNativeLanguage: LanguageCode,
  targetLanguageCode: LanguageCode,
): boolean {
  return userNativeLanguage !== targetLanguageCode;
}
