'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  autoSubmitAfterCorrect?: boolean;
}

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
  autoSubmitAfterCorrect = false,
}: UseTypingPracticeStateProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentWordStartTime, setCurrentWordStartTime] = useState<
    Date | undefined
  >();
  const [shouldCompleteSession, setShouldCompleteSession] = useState(false);

  const [sessionState, setSessionState] = useState<SessionState>({
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
  });

  // Ref to track if we've already completed the session
  const sessionCompletedRef = useRef(false);

  /**
   * Complete the current practice session using useEffect to avoid render issues
   */
  useEffect(() => {
    const handleSessionComplete = async () => {
      if (
        !shouldCompleteSession ||
        !sessionState.sessionId ||
        sessionCompletedRef.current
      ) {
        return;
      }

      sessionCompletedRef.current = true;

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
      } finally {
        setShouldCompleteSession(false);
        setSessionState((prev) => ({ ...prev, isActive: false }));
      }
    };

    if (shouldCompleteSession) {
      handleSessionComplete();
    }
  }, [shouldCompleteSession, sessionState.sessionId]);

  /**
   * Start a new practice session
   */
  const startPracticeSession = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to start practice');
      return;
    }

    // Reset completion tracking
    sessionCompletedRef.current = false;
    setShouldCompleteSession(false);

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

      // Auto-submit when user types the correct word (if setting is enabled)
      if (
        autoSubmitAfterCorrect &&
        value.length === sessionState.currentWord.wordText.length &&
        value.toLowerCase() === sessionState.currentWord.wordText.toLowerCase()
      ) {
        setTimeout(() => handleWordSubmit(value), 0);
      }
    },
    [
      sessionState.isActive,
      sessionState.currentWord,
      handleWordSubmit,
      autoSubmitAfterCorrect,
    ],
  );

  /**
   * Move to next word
   */
  const handleNextWord = useCallback(() => {
    setShowResult(false);
    setSessionState((prev) => {
      const nextIndex = prev.currentWordIndex + 1;

      if (nextIndex >= prev.words.length) {
        // Session completed - trigger completion via useEffect
        setShouldCompleteSession(true);
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
  }, []);

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
      setShowResult(true);
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
   * Finish practice session early
   */
  const finishPracticeEarly = useCallback(() => {
    if (sessionState.isActive && sessionState.sessionId) {
      // Trigger session completion via useEffect
      setShouldCompleteSession(true);
      toast.info('Practice session finished early');
    }
  }, [sessionState.isActive, sessionState.sessionId]);

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
    finishPracticeEarly,
    setShowResult,

    // Utilities
    analyzeMistakes,
  };
}

export type { SessionState, WordResult };
