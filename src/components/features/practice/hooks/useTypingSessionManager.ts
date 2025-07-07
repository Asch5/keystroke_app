'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useUser } from '@/core/shared/hooks/useUser';
import { toast } from 'sonner';
import {
  createTypingPracticeSession,
  completePracticeSession,
  type PracticeWord,
  type CreatePracticeSessionRequest,
  type DifficultyConfig,
} from '@/core/domains/user/actions/practice-actions';
import { LearningStatus } from '@/core/types';

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

interface UseTypingSessionManagerProps {
  userListId: string | undefined;
  listId: string | undefined;
  difficultyLevel?: number;
  wordsCount?: number;
  includeWordStatuses?: LearningStatus[];
}

/**
 * Custom hook for managing typing practice sessions
 * Handles session creation, completion, and state management
 */
export function useTypingSessionManager({
  userListId,
  listId,
  difficultyLevel = 3,
  wordsCount = 10,
  includeWordStatuses = [
    LearningStatus.notStarted,
    LearningStatus.inProgress,
    LearningStatus.difficult,
  ],
}: UseTypingSessionManagerProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
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

        if (response.success && response.sessionResult) {
          const result = response.sessionResult;

          toast.success(
            `Session completed! Accuracy: ${result.accuracy.toFixed(1)}% | Score: ${result.sessionScore}`,
            { duration: 5000 },
          );

          // Show achievements if any
          // Note: achievements would be implemented in future enhancement
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
   * Update session state
   */
  const updateSessionState = useCallback(
    (updater: (prev: SessionState) => SessionState) => {
      setSessionState(updater);
    },
    [],
  );

  /**
   * Update user input
   */
  const updateUserInput = useCallback((value: string) => {
    setSessionState((prev) => ({ ...prev, userInput: value }));
  }, []);

  /**
   * Update score and stats
   */
  const updateScoreAndStats = useCallback(
    (pointsEarned: number, isCorrect: boolean) => {
      setSessionState((prev) => ({
        ...prev,
        score: prev.score + pointsEarned,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        incorrectAnswers: prev.incorrectAnswers + (isCorrect ? 0 : 1),
      }));
    },
    [],
  );

  /**
   * Move to next word or complete session
   */
  const moveToNextWord = useCallback(() => {
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
  }, []);

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
    progressPercentage,

    // Actions
    startPracticeSession,
    finishPracticeEarly,
    updateSessionState,
    updateUserInput,
    updateScoreAndStats,
    moveToNextWord,
  };
}

export type { SessionState };
