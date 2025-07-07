import { LanguageCode } from '@/core/types';
import { PracticeType } from '../actions/practice-types';

/**
 * Practice game utilities for client and server-side use
 */

/**
 * Generate character pool for make-up-word exercise
 * Creates a pool with exactly the characters needed for the target word,
 * including duplicate characters if they appear multiple times in the word.
 */
export function generateCharacterPool(correctWord: string): string[] {
  // Convert to lowercase and split into individual characters
  const wordChars = correctWord.toLowerCase().split('');

  // For make-up-word exercise, we want exactly the characters from the word
  // including duplicates (e.g., "corkscrew" should have two 'c' characters)
  // No extra characters are added to make it challenging but fair

  // Simply shuffle the word characters and return them
  return shuffleArray(wordChars);
}

/**
 * Generate distractor options for multiple choice
 */
export function generateDistractorOptions(
  correctWord: string,
  targetLanguageCode: LanguageCode,
  count: number = 3,
): string[] {
  const distractors: string[] = [];
  const existingWords = [correctWord];

  // Strategy 1: Similar looking words
  for (let i = 0; i < count && distractors.length < count; i++) {
    const similar = generateSimilarWord(correctWord, existingWords);
    if (similar && !existingWords.includes(similar)) {
      distractors.push(similar);
      existingWords.push(similar);
    }
  }

  // Strategy 2: Fill remaining with more random variations
  while (distractors.length < count) {
    const variation = generateWordVariation(correctWord, existingWords);
    if (variation && !existingWords.includes(variation)) {
      distractors.push(variation);
      existingWords.push(variation);
    }
  }

  return distractors.slice(0, count);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/**
 * Generate a word variation for distractors
 */
export function generateWordVariation(
  original: string,
  existing: string[],
): string {
  const variations = [
    // Add suffix
    () => original + 's',
    () => original + 'ed',
    () => original + 'ing',
    () => original + 'er',
    // Modify ending
    () => original.slice(0, -1) + 'y',
    () => original.slice(0, -1) + 'e',
    // Add prefix
    () => 'un' + original,
    () => 're' + original,
  ];

  let attempts = 0;
  let generated = original + 's'; // Default fallback

  do {
    const variation = variations[Math.floor(Math.random() * variations.length)];
    if (variation) {
      generated = variation();
      attempts++;
    } else {
      break;
    }
  } while (existing.includes(generated) && attempts < 10);

  return generated;
}

/**
 * Generate a similar word for distractors (internal helper)
 */
export function generateSimilarWord(
  original: string,
  existing: string[],
): string {
  const operations = [
    // Substitute one character
    () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const pos = Math.floor(Math.random() * original.length);
      return (
        original.substring(0, pos) +
        chars[Math.floor(Math.random() * chars.length)] +
        original.substring(pos + 1)
      );
    },
    // Add one character
    () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const pos = Math.floor(Math.random() * (original.length + 1));
      return (
        original.substring(0, pos) +
        chars[Math.floor(Math.random() * chars.length)] +
        original.substring(pos)
      );
    },
    // Remove one character (if word is long enough)
    () => {
      if (original.length > 3) {
        const pos = Math.floor(Math.random() * original.length);
        return original.substring(0, pos) + original.substring(pos + 1);
      }
      return original + 's'; // Fallback
    },
  ];

  let attempts = 0;
  let generated: string = original + 's'; // Default fallback

  do {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    if (operation) {
      generated = operation();
      attempts++;
    } else {
      break;
    }
  } while (existing.includes(generated) && attempts < 10);

  return generated;
}

/**
 * Extract word text from definition for practice purposes
 */
export function extractWordText(definition: string): string {
  // Simple heuristic to extract the main word from a definition
  // This is a basic implementation - could be enhanced with NLP
  const words = definition.split(' ');
  const stopWords = [
    'a',
    'an',
    'the',
    'to',
    'of',
    'in',
    'for',
    'with',
    'by',
    'at',
    'on',
  ];

  const meaningfulWords = words.filter(
    (word) =>
      word.length > 2 &&
      !stopWords.includes(word.toLowerCase()) &&
      /^[a-zA-Z]+$/.test(word),
  );

  return meaningfulWords[0] || words[0] || '';
}

/**
 * Get difficulty level from custom difficulty value
 */
export function getDifficultyLevel(customDifficulty: unknown): number | null {
  if (typeof customDifficulty === 'string') {
    const parsed = parseInt(customDifficulty, 10);
    return isNaN(parsed) ? null : Math.max(1, Math.min(5, parsed));
  }
  if (typeof customDifficulty === 'number') {
    return Math.max(1, Math.min(5, Math.round(customDifficulty)));
  }
  return null;
}

/**
 * Check if a word is similar enough to be a good distractor
 */
export function isWordSimilarEnough(
  word1: string,
  word2: string,
  threshold: number = 0.3,
): boolean {
  const distance = levenshteinDistance(
    word1.toLowerCase(),
    word2.toLowerCase(),
  );
  const maxLength = Math.max(word1.length, word2.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= threshold;
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j]![i] = Math.min(
        matrix[j]![i - 1]! + 1, // deletion
        matrix[j - 1]![i]! + 1, // insertion
        matrix[j - 1]![i - 1]! + indicator, // substitution
      );
    }
  }

  return matrix[str2.length]![str1.length]!;
}

/**
 * Normalize text for comparison
 */
export function normalizeTextForComparison(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Calculate word complexity score
 */
export function calculateWordComplexity(word: string): number {
  let complexity = 0;

  // Length factor
  complexity += Math.min(word.length, 10) * 2;

  // Uncommon characters
  const uncommonChars = ['q', 'x', 'z', 'j'];
  complexity +=
    uncommonChars.filter((char) => word.toLowerCase().includes(char)).length *
    5;

  // Double letters
  const doubleLetterPattern = /(.)\1/;
  if (doubleLetterPattern.test(word)) {
    complexity += 3;
  }

  // Silent letters (simplified heuristic)
  const silentLetterPatterns = [/gh/, /ght/, /kn/, /wr/, /mb$/];
  complexity +=
    silentLetterPatterns.filter((pattern) => pattern.test(word.toLowerCase()))
      .length * 4;

  return Math.min(complexity, 50); // Cap at 50
}

/**
 * Generate practice session configuration
 */
export function generatePracticeConfig(
  practiceType: PracticeType,
  difficulty: number,
): {
  maxAttempts: number;
  timeLimit?: number;
  showHints: boolean;
  autoAdvance: boolean;
} {
  const baseConfig = {
    maxAttempts: 3,
    showHints: true,
    autoAdvance: false,
  };

  switch (practiceType) {
    case 'remember-translation':
      return {
        ...baseConfig,
        maxAttempts: 1,
        timeLimit: difficulty > 3 ? 5000 : 0,
        autoAdvance: true,
      };

    case 'choose-right-word':
      return {
        ...baseConfig,
        maxAttempts: 1,
        timeLimit: difficulty > 2 ? 8000 : 0,
        autoAdvance: true,
      };

    case 'make-up-word':
      return {
        ...baseConfig,
        maxAttempts: 2,
        showHints: difficulty < 3,
      };

    case 'write-by-definition':
      return {
        ...baseConfig,
        maxAttempts: 3,
        showHints: difficulty < 4,
      };

    case 'write-by-sound':
      return {
        ...baseConfig,
        maxAttempts: 3,
        timeLimit: difficulty > 3 ? 12000 : 0,
        showHints: difficulty < 3,
      };

    default:
      return baseConfig;
  }
}
