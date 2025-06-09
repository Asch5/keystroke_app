'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@/core/shared/hooks/useUser';
import { toast } from 'sonner';
import {
  createTypingPracticeSession,
  validateTypingInput,
  completePracticeSession,
  type PracticeWord,
  type CreatePracticeSessionRequest,
  type DifficultyConfig,
} from '@/core/domains/user/actions/practice-actions';
import { LearningStatus } from '@prisma/client';

interface SessionState {
  sessionId: string | null;
  words: PracticeWord[];
  currentWordIndex: number;
  currentWord: PracticeWord | null;
  userInput: string;
  difficultyConfig: DifficultyConfig | null;
  isActive: boolean;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: Date | null;
}

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

interface UseTypingPracticeStateProps {
  userListId: string | undefined;
  listId: string | undefined;
  difficultyLevel?: number;
  wordsCount?: number;
  includeWordStatuses?: LearningStatus[];
}

const INITIAL_SESSION_STATE: SessionState = {
  sessionId: null,
  words: [],
  currentWordIndex: 0,
  currentWord: null,
  userInput: '',
  difficultyConfig: null,
  isActive: false,
  score: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  startTime: null,
};

export function useTypingPracticeState({
  userListId,
  listId,
  difficultyLevel = 3,
  wordsCount = 10,
  includeWordStatuses = [
    LearningStatus.notStarted,
    LearningStatus.inProgress,
    LearningStatus.difficult,
  ],
}: UseTypingPracticeStateProps) {
  const { user } = useUser();
  const [sessionState, setSessionState] = useState<SessionState>(
    INITIAL_SESSION_STATE,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentWordStartTime, setCurrentWordStartTime] = useState<Date | null>(
    null,
  );

  /**
   * Analyze mistakes between user input and correct word
   */
  const analyzeMistakes = useCallback(
    (userInput: string, correctWord: string) => {
      const mistakes = [];
      const maxLength = Math.max(userInput.length, correctWord.length);

      for (let i = 0; i < maxLength; i++) {
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
   * Complete the current practice session
   */
  const handleSessionComplete = useCallback(async () => {
    if (!sessionState.sessionId) return;

    try {
      const response = await completePracticeSession(sessionState.sessionId);

      if (response.success && response.sessionSummary) {
        const summary = response.sessionSummary;

        toast.success(
          `Session completed! Accuracy: ${summary.accuracy}% | Score: ${summary.score}`,
          { duration: 5000 },
        );

        // Show achievements
        if (summary.achievements.length > 0) {
          summary.achievements.forEach((achievement) => {
            toast.success(`🏆 ${achievement}`, { duration: 3000 });
          });
        }
      }
    } catch (error) {
      console.error('Error completing session:', error);
    }

    setSessionState((prev) => ({ ...prev, isActive: false }));
  }, [sessionState.sessionId]);

  /**
   * Start a new practice session
   */
  const startPracticeSession = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to start practice');
      return;
    }

    setIsLoading(true);
    try {
      const request: CreatePracticeSessionRequest = {
        userId: user.id,
        userListId: userListId ?? null,
        listId: listId ?? null,
        difficultyLevel,
        wordsCount,
        includeWordStatuses,
      };

      const response = await createTypingPracticeSession(request);

      if (response.success && response.session) {
        const { sessionId, words, difficultyConfig } = response.session;

        setSessionState({
          sessionId,
          words,
          currentWordIndex: 0,
          currentWord: words[0] || null,
          userInput: '',
          difficultyConfig,
          isActive: true,
          score: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          startTime: new Date(),
        });

        setWordResults([]);
        setShowResult(false);
        setCurrentWordStartTime(new Date());

        toast.success(
          `Practice session started! ${words.length} words to practice.`,
        );
      } else {
        toast.error(response.error || 'Failed to start practice session');
      }
    } catch (error) {
      console.error('Error starting practice session:', error);
      toast.error('Failed to start practice session');
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    userListId,
    listId,
    difficultyLevel,
    wordsCount,
    includeWordStatuses,
  ]);

  /**
   * Submit current word for validation
   */
  const handleWordSubmit = useCallback(
    async (inputValue?: string): Promise<WordResult | undefined> => {
      if (
        !sessionState.sessionId ||
        !sessionState.currentWord ||
        !currentWordStartTime
      )
        return undefined;

      const userInput = inputValue || sessionState.userInput;
      const responseTime = Date.now() - currentWordStartTime.getTime();

      try {
        const response = await validateTypingInput({
          sessionId: sessionState.sessionId,
          userDictionaryId: sessionState.currentWord.userDictionaryId,
          userInput,
          responseTime,
        });

        if (response.success && response.result) {
          const correctWord = sessionState.currentWord.wordText;
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

          // Update session state
          setSessionState((prev) => ({
            ...prev,
            score: prev.score + result.pointsEarned,
            correctAnswers: prev.correctAnswers + (result.isCorrect ? 1 : 0),
            incorrectAnswers:
              prev.incorrectAnswers + (result.isCorrect ? 0 : 1),
          }));

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
    [
      sessionState.sessionId,
      sessionState.currentWord,
      sessionState.userInput,
      currentWordStartTime,
      analyzeMistakes,
    ],
  );

  /**
   * Handle word input change
   */
  const handleInputChange = useCallback(
    (value: string) => {
      if (!sessionState.isActive || !sessionState.currentWord) return;

      setSessionState((prev) => ({ ...prev, userInput: value }));

      // Auto-submit when user types the complete word
      if (value.length === sessionState.currentWord.wordText.length) {
        setTimeout(() => handleWordSubmit(value), 0);
      }
    },
    [sessionState.isActive, sessionState.currentWord, handleWordSubmit],
  );

  /**
   * Move to next word
   */
  const handleNextWord = useCallback(() => {
    setShowResult(false);
    setSessionState((prev) => {
      const nextIndex = prev.currentWordIndex + 1;

      if (nextIndex >= prev.words.length) {
        // Session completed
        handleSessionComplete();
        return { ...prev, isActive: false };
      }

      return {
        ...prev,
        currentWordIndex: nextIndex,
        currentWord: prev.words[nextIndex] ?? null,
        userInput: '',
      };
    });
    setCurrentWordStartTime(new Date());
  }, [handleSessionComplete]);

  /**
   * Skip current word
   */
  const handleSkipWord = useCallback(async (): Promise<
    WordResult | undefined
  > => {
    if (sessionState.currentWord) {
      const correctWord = sessionState.currentWord.wordText;
      const userInput = sessionState.userInput;

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
      setSessionState((prev) => ({
        ...prev,
        incorrectAnswers: prev.incorrectAnswers + 1,
        score: prev.score - 2,
      }));

      toast.info(`Skipped. The word was: ${correctWord}`, {
        duration: 3000,
      });

      return result;
    }

    return undefined;
  }, [sessionState.currentWord, sessionState.userInput]);

  /**
   * Calculate progress percentage
   */
  const progressPercentage =
    sessionState.words.length > 0
      ? (sessionState.currentWordIndex / sessionState.words.length) * 100
      : 0;

  return {
    // State
    sessionState,
    isLoading,
    wordResults,
    showResult,
    currentWordStartTime,

    // Computed values
    progressPercentage,

    // Actions
    startPracticeSession,
    handleWordSubmit,
    handleInputChange,
    handleNextWord,
    handleSkipWord,
    setShowResult,

    // Utilities
    analyzeMistakes,
  };
}

export type { SessionState, WordResult };
