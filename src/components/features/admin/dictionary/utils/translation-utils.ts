import { LanguageCode } from '@prisma/client';

/**
 * Finds a translation in the specified target language from an array of translations
 *
 * @param translations - Array of translation objects with languageCode and content
 * @param targetLang - The target language code to find
 * @returns The translation content or undefined if not found
 */
export const findTranslation = (
  translations:
    | Array<{ id: number; languageCode: LanguageCode; content: string }>
    | undefined,
  targetLang: LanguageCode,
): string | undefined => {
  return translations?.find(
    (t: { languageCode: LanguageCode }) => t.languageCode === targetLang,
  )?.content;
};

/**
 * Formats relationship type keys into human-readable display strings
 *
 * @param typeKey - The relationship type key (e.g., "synonym", "plural_da")
 * @returns Formatted display string
 */
export function formatRelationshipType(typeKey: string): string {
  if (!typeKey) return 'Related';

  // Split by underscore and capitalize each part
  const parts = typeKey.split('_');
  const capitalized = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

  // Handle language-specific suffixes
  if (typeKey.endsWith('_da')) return `${capitalized.replace(' Da', '')} (DA)`;
  if (typeKey.endsWith('_en')) return `${capitalized.replace(' En', '')} (EN)`;

  return capitalized;
}
