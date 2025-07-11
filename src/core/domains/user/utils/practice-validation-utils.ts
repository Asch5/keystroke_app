import { PracticeType } from '../actions/practice-types';

/**
 * Practice validation utilities for client and server-side use
 */

export interface WordComparisonResult {
  isCorrect: boolean;
  accuracy: number;
  partialCredit: boolean;
  userInput: string;
  correctWord: string;
  differences: { position: number; expected: string; actual: string }[];
}

/**
 * Validate word input against correct answer
 */
export function validateWordInput(
  userInput: string,
  correctWord: string,
): WordComparisonResult {
  const normalizedUserInput = userInput.trim().toLowerCase();
  const normalizedCorrectWord = correctWord.trim().toLowerCase();

  // Check for exact match
  const isCorrect = normalizedUserInput === normalizedCorrectWord;

  // Calculate accuracy using Levenshtein distance
  const accuracy = calculateAccuracy(
    normalizedUserInput,
    normalizedCorrectWord,
  );

  // Determine partial credit (80%+ accuracy)
  const partialCredit = !isCorrect && accuracy >= 80;

  // Find differences for feedback
  const differences = findWordDifferences(
    normalizedUserInput,
    normalizedCorrectWord,
  );

  return {
    isCorrect,
    accuracy,
    partialCredit,
    userInput: normalizedUserInput,
    correctWord: normalizedCorrectWord,
    differences,
  };
}

/**
 * Calculate accuracy between user input and correct answer using Levenshtein distance
 */
export function calculateAccuracy(
  userInput: string,
  correctAnswer: string,
): number {
  if (!userInput || !correctAnswer) return 0;

  const distance = levenshteinDistance(
    userInput.toLowerCase(),
    correctAnswer.toLowerCase(),
  );
  const maxLength = Math.max(userInput.length, correctAnswer.length);

  return Math.round(((maxLength - distance) / maxLength) * 100);
}

/**
 * Levenshtein distance calculation for accuracy
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
 * Find differences between user input and correct word
 */
export function findWordDifferences(
  userInput: string,
  correctWord: string,
): { position: number; expected: string; actual: string }[] {
  const differences: { position: number; expected: string; actual: string }[] =
    [];
  const maxLength = Math.max(userInput.length, correctWord.length);

  for (let i = 0; i < maxLength; i++) {
    const userChar = userInput[i] ?? '';
    const correctChar = correctWord[i] ?? '';

    if (userChar !== correctChar) {
      differences.push({
        position: i,
        expected: correctChar,
        actual: userChar,
      });
    }
  }

  return differences;
}

/**
 * Get mistake type based on exercise type
 */
export function getMistakeType(exerciseType: PracticeType): string {
  switch (exerciseType) {
    case 'write-by-sound':
      return 'pronunciation';
    case 'write-by-definition':
      return 'meaning';
    case 'remember-translation':
      return 'translation';
    case 'choose-right-word':
      return 'recognition';
    case 'make-up-word':
      return 'spelling';
    default:
      return 'spelling';
  }
}

/**
 * Validate multiple choice answer
 */
export function validateMultipleChoice(
  selectedIndex: number,
  correctIndex: number,
): {
  isCorrect: boolean;
  accuracy: number;
  feedback: string;
} {
  const isCorrect = selectedIndex === correctIndex;
  const accuracy = isCorrect ? 100 : 0;

  let feedback = '';
  if (isCorrect) {
    feedback = '✅ Correct!';
  } else {
    feedback = `❌ Incorrect. The correct answer was option ${correctIndex + 1}.`;
  }

  return {
    isCorrect,
    accuracy,
    feedback,
  };
}

/**
 * Validate drag-and-drop word construction
 */
export function validateWordConstruction(
  constructedWord: string,
  correctWord: string,
): WordComparisonResult {
  // Similar to typing validation but more lenient for drag-and-drop
  const normalizedConstructed = constructedWord.trim().toLowerCase();
  const normalizedCorrect = correctWord.trim().toLowerCase();

  const isCorrect = normalizedConstructed === normalizedCorrect;
  const accuracy = calculateAccuracy(normalizedConstructed, normalizedCorrect);

  // More generous partial credit for construction (70%+ accuracy)
  const partialCredit = !isCorrect && accuracy >= 70;

  const differences = findWordDifferences(
    normalizedConstructed,
    normalizedCorrect,
  );

  return {
    isCorrect,
    accuracy,
    partialCredit,
    userInput: normalizedConstructed,
    correctWord: normalizedCorrect,
    differences,
  };
}

/**
 * Calculate response time bonus
 */
export function calculateResponseTimeBonus(
  responseTime: number,
  exerciseType: PracticeType,
): number {
  const thresholds = {
    'remember-translation': 2000, // 2 seconds
    'choose-right-word': 3000, // 3 seconds
    'make-up-word': 5000, // 5 seconds
    'write-by-definition': 8000, // 8 seconds
    'write-by-sound': 6000, // 6 seconds
    typing: 5000, // 5 seconds
    'unified-practice': 5000, // 5 seconds
  };

  const threshold = thresholds[exerciseType as keyof typeof thresholds] || 5000;

  if (responseTime <= threshold) {
    const bonusPercentage = Math.max(0, (threshold - responseTime) / threshold);
    return Math.round(bonusPercentage * 100); // 0-100 bonus points
  }

  return 0;
}
