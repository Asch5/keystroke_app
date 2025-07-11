'use client';

import { useCallback } from 'react';
import { LearningStatus } from '@/core/types';
import { useTypingInputManager } from './useTypingInputManager';
import { useTypingSessionManager } from './useTypingSessionManager';
import { useTypingWordValidator } from './useTypingWordValidator';
import type { SessionState, WordResult } from './index';

interface UseTypingPracticeStateProps {
  userListId: string | undefined;
  listId: string | undefined;
  difficultyLevel?: number;
  wordsCount?: number;
  includeWordStatuses?: LearningStatus[];
  autoSubmitAfterCorrect?: boolean;
}

/**
 * Main hook for typing practice state management
 * Orchestrates session, validation, and input management
 */
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
  // Session management
  const sessionManager = useTypingSessionManager({
    userListId,
    listId,
    difficultyLevel,
    wordsCount,
    includeWordStatuses,
  });

  // Word validation
  const wordValidator = useTypingWordValidator({
    onScoreUpdate: sessionManager.updateScoreAndStats,
  });

  // Input management
  const inputManager = useTypingInputManager({
    isActive: sessionManager.sessionState.isActive,
    currentWord: sessionManager.sessionState.currentWord?.wordText || null,
    autoSubmitAfterCorrect,
    onSubmit: handleWordSubmit,
  });

  /**
   * Submit current word for validation
   */
  async function handleWordSubmit(
    inputValue?: string,
  ): Promise<WordResult | undefined> {
    if (
      !sessionManager.sessionState.sessionId ||
      !sessionManager.sessionState.currentWord ||
      !inputManager.currentWordStartTime
    ) {
      return undefined;
    }

    const userInput = inputValue || sessionManager.sessionState.userInput;
    const { currentWord } = sessionManager.sessionState;

    return await wordValidator.validateWord(
      sessionManager.sessionState.sessionId,
      currentWord.userDictionaryId,
      userInput,
      currentWord.wordText,
      inputManager.currentWordStartTime,
    );
  }

  /**
   * Handle word input change
   */
  const handleInputChange = useCallback(
    (value: string) => {
      inputManager.handleInputChange(value, sessionManager.updateUserInput);
    },
    [inputManager, sessionManager.updateUserInput],
  );

  /**
   * Move to next word
   */
  const handleNextWord = useCallback(() => {
    wordValidator.setShowResult(false);
    sessionManager.moveToNextWord();
    inputManager.startWordTimer();
  }, [wordValidator, sessionManager, inputManager]);

  /**
   * Skip current word
   */
  const handleSkipWord = useCallback(async (): Promise<
    WordResult | undefined
  > => {
    if (sessionManager.sessionState.currentWord) {
      return wordValidator.skipWord(
        sessionManager.sessionState.userInput,
        sessionManager.sessionState.currentWord.wordText,
      );
    }
    return undefined;
  }, [sessionManager.sessionState, wordValidator]);

  /**
   * Start practice session with initialization
   */
  const startPracticeSession = useCallback(async () => {
    wordValidator.resetResults();
    inputManager.resetWordTimer();
    await sessionManager.startPracticeSession();
    inputManager.startWordTimer();
  }, [wordValidator, inputManager, sessionManager]);

  return {
    // State
    sessionState: sessionManager.sessionState,
    isLoading: sessionManager.isLoading,
    wordResults: wordValidator.wordResults,
    showResult: wordValidator.showResult,
    currentWordStartTime: inputManager.currentWordStartTime,

    // Computed values
    progressPercentage: sessionManager.progressPercentage,

    // Actions
    startPracticeSession,
    handleWordSubmit,
    handleInputChange,
    handleNextWord,
    handleSkipWord,
    finishPracticeEarly: sessionManager.finishPracticeEarly,
    setShowResult: wordValidator.setShowResult,

    // Utilities
    analyzeMistakes: wordValidator.analyzeMistakes,
  };
}

export type { SessionState, WordResult };
