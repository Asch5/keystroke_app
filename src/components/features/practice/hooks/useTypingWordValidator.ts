'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { validateTypingInput } from '@/core/domains/user/actions/practice-actions';

interface WordResult {
  isCorrect: boolean;
  accuracy: number;
  partialCredit: boolean;
  pointsEarned: number;
  feedback: string;
  responseTime: number;
  userInput: string;
  correctWord: string;
  mistakes: Array<{
    position: number;
    expected: string;
    actual: string;
  }>;
}

interface UseTypingWordValidatorProps {
  onScoreUpdate: (pointsEarned: number, isCorrect: boolean) => void;
}

/**
 * Custom hook for validating typing input and managing word results
 * Handles word submission, validation, and result tracking
 */
export function useTypingWordValidator({
  onScoreUpdate,
}: UseTypingWordValidatorProps) {
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [showResult, setShowResult] = useState(false);

  /**
   * Analyze mistakes between user input and correct word
   */
  const analyzeMistakes = useCallback(
    (userInput: string, correctWord: string) => {
      const mistakes = [];

      for (let i = 0; i < Math.max(userInput.length, correctWord.length); i++) {
        const userChar = userInput[i] || '';
        const correctChar = correctWord[i] || '';

        if (userChar !== correctChar) {
          mistakes.push({
            position: i,
            expected: correctChar,
            actual: userChar,
          });
        }
      }

      return mistakes;
    },
    [],
  );

  /**
   * Submit current word for validation
   */
  const validateWord = useCallback(
    async (
      sessionId: string,
      userDictionaryId: string,
      userInput: string,
      correctWord: string,
      startTime: Date,
    ): Promise<WordResult | undefined> => {
      const responseTime = Date.now() - startTime.getTime();

      try {
        const response = await validateTypingInput({
          sessionId,
          userDictionaryId,
          userInput,
          responseTime,
        });

        if (response.success && response.result) {
          const mistakes = analyzeMistakes(userInput, correctWord);

          const result: WordResult = {
            ...response.result,
            responseTime,
            userInput,
            correctWord,
            mistakes,
          };

          setWordResults((prev) => [...prev, result]);
          setShowResult(true);

          // Update score
          onScoreUpdate(result.pointsEarned, result.isCorrect);

          // Show feedback toast
          toast(result.feedback, {
            icon: result.isCorrect ? '✅' : result.partialCredit ? '⚠️' : '❌',
            duration: result.isCorrect ? 3000 : 4000,
          });

          return result;
        } else {
          toast.error(response.error || 'Failed to validate input');
        }
      } catch (error) {
        console.error('Error validating input:', error);
        toast.error('Failed to validate input');
      }

      return undefined;
    },
    [analyzeMistakes, onScoreUpdate],
  );

  /**
   * Handle word skip
   */
  const skipWord = useCallback(
    (userInput: string, correctWord: string): WordResult => {
      const result: WordResult = {
        isCorrect: false,
        accuracy: 0,
        partialCredit: false,
        pointsEarned: -2,
        feedback: 'Skipped',
        responseTime: 0,
        userInput,
        correctWord,
        mistakes: [],
      };

      setWordResults((prev) => [...prev, result]);
      setShowResult(true);
      onScoreUpdate(result.pointsEarned, result.isCorrect);

      toast.info(`Skipped. The word was: ${correctWord}`, {
        duration: 3000,
      });

      return result;
    },
    [onScoreUpdate],
  );

  /**
   * Reset results for new session
   */
  const resetResults = useCallback(() => {
    setWordResults([]);
    setShowResult(false);
  }, []);

  return {
    // State
    wordResults,
    showResult,

    // Actions
    validateWord,
    skipWord,
    resetResults,
    setShowResult,

    // Utilities
    analyzeMistakes,
  };
}

export type { WordResult };
