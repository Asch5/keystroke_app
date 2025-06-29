import { LanguageCode } from '@prisma/client';
import { prisma } from '@/core/shared/database/client';

/**
 * Interface for user's effective language configuration
 */
export interface UserLanguageConfig {
  baseLanguageCode: LanguageCode;
  targetLanguageCode: LanguageCode;
}

/**
 * Get user's current language configuration
 * This is the single source of truth for user's language preferences
 */
export async function getUserLanguageConfig(
  userId: string,
): Promise<UserLanguageConfig> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      baseLanguageCode: true,
      targetLanguageCode: true,
    },
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return {
    baseLanguageCode: user.baseLanguageCode,
    targetLanguageCode: user.targetLanguageCode,
  };
}

/**
 * Check if user should see translations for content in a specific language
 */
export function shouldShowTranslationsForUser(
  userBaseLanguage: LanguageCode,
  contentLanguage: LanguageCode,
): boolean {
  return userBaseLanguage !== contentLanguage;
}

/**
 * Check if content's target language matches user's learning language
 */
export function isContentCompatibleWithUser(
  contentTargetLanguage: LanguageCode,
  userTargetLanguage: LanguageCode,
): boolean {
  return contentTargetLanguage === userTargetLanguage;
}

/**
 * Get language display information
 */
export function getLanguageDisplayInfo(languageCode: LanguageCode): {
  name: string;
  flag: string;
} {
  const languageMap: Record<LanguageCode, { name: string; flag: string }> = {
    en: { name: 'English', flag: '🇺🇸' },
    ru: { name: 'Russian', flag: '🇷🇺' },
    da: { name: 'Danish', flag: '🇩🇰' },
    es: { name: 'Spanish', flag: '🇪🇸' },
    fr: { name: 'French', flag: '🇫🇷' },
    de: { name: 'German', flag: '🇩🇪' },
    it: { name: 'Italian', flag: '🇮🇹' },
    pt: { name: 'Portuguese', flag: '🇵🇹' },
    zh: { name: 'Chinese', flag: '🇨🇳' },
    ja: { name: 'Japanese', flag: '🇯🇵' },
    ko: { name: 'Korean', flag: '🇰🇷' },
    ar: { name: 'Arabic', flag: '🇸🇦' },
    pl: { name: 'Polish', flag: '🇵🇱' },
    hi: { name: 'Hindi', flag: '🇮🇳' },
    ne: { name: 'Nepali', flag: '🇳🇵' },
    tr: { name: 'Turkish', flag: '🇹🇷' },
    sv: { name: 'Swedish', flag: '🇸🇪' },
    no: { name: 'Norwegian', flag: '🇳🇴' },
    fi: { name: 'Finnish', flag: '🇫🇮' },
    ur: { name: 'Urdu', flag: '🇵🇰' },
    fa: { name: 'Persian', flag: '🇮🇷' },
    uk: { name: 'Ukrainian', flag: '🇺🇦' },
    ro: { name: 'Romanian', flag: '🇷🇴' },
    nl: { name: 'Dutch', flag: '🇳🇱' },
    vi: { name: 'Vietnamese', flag: '🇻🇳' },
    bn: { name: 'Bengali', flag: '🇧🇩' },
    id: { name: 'Indonesian', flag: '🇮🇩' },
  };

  return languageMap[languageCode] || { name: languageCode, flag: '🌐' };
}

/**
 * Format language pair for display
 */
export function formatLanguagePair(
  baseLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  format: 'short' | 'long' = 'short',
): string {
  if (format === 'short') {
    return `${baseLanguage} → ${targetLanguage}`;
  }

  const baseInfo = getLanguageDisplayInfo(baseLanguage);
  const targetInfo = getLanguageDisplayInfo(targetLanguage);

  return `${baseInfo.flag} ${baseInfo.name} → ${targetInfo.flag} ${targetInfo.name}`;
}
