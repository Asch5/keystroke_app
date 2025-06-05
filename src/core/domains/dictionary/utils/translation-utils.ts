import { LanguageCode } from '@prisma/client';

/**
 * Translation data interface
 */
export interface TranslationData {
  id: number;
  languageCode: LanguageCode;
  content: string;
}

/**
 * Result of getting the best definition/translation for a user
 */
export interface DefinitionDisplayData {
  content: string;
  isTranslation: boolean;
  languageCode: LanguageCode;
  originalDefinition?: string;
}

/**
 * Get the best definition or translation to display based on user's native language
 * Priority: Native language translation > Original definition
 *
 * @param originalDefinition - The original definition in the target language
 * @param originalLanguageCode - Language code of the original definition
 * @param translations - Available translations
 * @param userNativeLanguage - User's native language code
 * @returns The best content to display
 */
export function getBestDefinitionForUser(
  originalDefinition: string,
  originalLanguageCode: LanguageCode,
  translations: TranslationData[] = [],
  userNativeLanguage: LanguageCode,
): DefinitionDisplayData {
  // If user's native language is the same as the original definition language,
  // use the original definition
  if (userNativeLanguage === originalLanguageCode) {
    return {
      content: originalDefinition,
      isTranslation: false,
      languageCode: originalLanguageCode,
    };
  }

  // Look for translation in user's native language
  const nativeTranslation = translations.find(
    (translation) => translation.languageCode === userNativeLanguage,
  );

  if (nativeTranslation) {
    return {
      content: nativeTranslation.content,
      isTranslation: true,
      languageCode: nativeTranslation.languageCode,
      originalDefinition,
    };
  }

  // Fall back to original definition if no native translation available
  return {
    content: originalDefinition,
    isTranslation: false,
    languageCode: originalLanguageCode,
  };
}

/**
 * Get the best example translation to display based on user's native language
 *
 * @param originalExample - The original example in the target language
 * @param originalLanguageCode - Language code of the original example
 * @param translations - Available translations
 * @param userNativeLanguage - User's native language code
 * @returns The best example content to display
 */
export function getBestExampleForUser(
  originalExample: string,
  originalLanguageCode: LanguageCode,
  translations: TranslationData[] = [],
  userNativeLanguage: LanguageCode,
): DefinitionDisplayData {
  return getBestDefinitionForUser(
    originalExample,
    originalLanguageCode,
    translations,
    userNativeLanguage,
  );
}

/**
 * Check if translations should be used for this user's language configuration
 *
 * @param userNativeLanguage - User's native language
 * @param contentLanguage - Language of the content being displayed
 * @returns True if translations should be prioritized
 */
export function shouldUseTranslations(
  userNativeLanguage: LanguageCode,
  contentLanguage: LanguageCode,
): boolean {
  return userNativeLanguage !== contentLanguage;
}
