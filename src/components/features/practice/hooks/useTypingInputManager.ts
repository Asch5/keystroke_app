'use client';

import { useState, useCallback } from 'react';

interface UseTypingInputManagerProps {
  isActive: boolean;
  currentWord: string | null;
  autoSubmitAfterCorrect?: boolean;
  onSubmit: (inputValue: string) => void;
}

/**
 * Custom hook for managing typing input and auto-submit functionality
 * Handles user input changes and auto-submission logic
 */
export function useTypingInputManager({
  isActive,
  currentWord,
  autoSubmitAfterCorrect = false,
  onSubmit,
}: UseTypingInputManagerProps) {
  const [currentWordStartTime, setCurrentWordStartTime] = useState<
    Date | undefined
  >();

  /**
   * Handle word input change
   */
  const handleInputChange = useCallback(
    (value: string, onInputUpdate: (value: string) => void) => {
      if (!isActive || !currentWord) return;

      onInputUpdate(value);

      // Auto-submit when user types the correct word (if setting is enabled)
      if (
        autoSubmitAfterCorrect &&
        value.length === currentWord.length &&
        value.toLowerCase() === currentWord.toLowerCase()
      ) {
        setTimeout(() => onSubmit(value), 0);
      }
    },
    [isActive, currentWord, autoSubmitAfterCorrect, onSubmit],
  );

  /**
   * Start timing for current word
   */
  const startWordTimer = useCallback(() => {
    setCurrentWordStartTime(new Date());
  }, []);

  /**
   * Reset word timer
   */
  const resetWordTimer = useCallback(() => {
    setCurrentWordStartTime(undefined);
  }, []);

  return {
    // State
    currentWordStartTime,

    // Actions
    handleInputChange,
    startWordTimer,
    resetWordTimer,
  };
}
