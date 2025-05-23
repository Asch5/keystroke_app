/**
 * Formats text with {bc} to indicate bold text in the sentence.
 * @param text - The text to format.
 * @returns The formatted text with {bc} to indicate bold text.
 */
export function formatWithBC(text: unknown): string {
  if (typeof text !== 'string') {
    console.warn('Input is not a string:', text);
    return '';
  }

  return text
    .split(':') // Split the sentence by colon
    .map((part) => `{bc}${part.trim()}`) // Add {bc} to each part
    .join(' '); // Join the parts back with a space
}

/**
 * Cleans up example text by removing cross-references and formatting.
 * @param text - The text to clean up.
 * @returns The cleaned up text.
 */
export function cleanupExampleText(text: unknown): string {
  if (typeof text !== 'string') {
    console.warn('Non-string example text encountered:', text);
    return String(text || '')
      .replace(/{(?!it}|\/it})([^}]+)}/g, '') // Keep {it} and {/it} tags but remove others
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Skip if it's a cross-reference
  if (
    text.startsWith('{dx}') ||
    text.startsWith('{bc}{sx|') ||
    text.startsWith('{sx|')
  ) {
    return '';
  }

  return text
    .replace(/{(?!it}|\/it})([^}]+)}/g, '') // Keep {it} and {/it} tags but remove others
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes text by removing tags and extra spaces.
 * @param input - The text to normalize.
 * @returns The normalized text.
 */
export function normalizeText(input: string): string {
  // Remove tags like {it}, {phrase}, {ldquo}, {rdquo}, and their content
  const cleanedText = input.replace(/{[^}]+}/g, '').replace(/\[.*?\]/g, '');
  // Remove extra spaces and trim the result
  return cleanedText.replace(/\s+/g, ' ').trim();
}
