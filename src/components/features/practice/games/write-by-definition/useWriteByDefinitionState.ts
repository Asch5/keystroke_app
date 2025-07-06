'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WordData {
  wordText: string;
  definition: string;
  oneWordTranslation?: string;
  audioUrl?: string;
  phonetic?: string;
}

interface UseWriteByDefinitionStateProps {
  word: WordData;
  onAnswer: (userInput: string, isCorrect: boolean, attempts: number) => void;
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  showVirtualKeyboard?: boolean;
}

/**
 * Custom hook for managing Write by Definition game state
 * Handles user input, validation, and character feedback
 */
export function useWriteByDefinitionState({
  word,
  onAnswer,
  onAudioPlay,
  showVirtualKeyboard = false,
}: UseWriteByDefinitionStateProps) {
  const [userInput, setUserInput] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(showVirtualKeyboard);
  const [showHint, setShowHint] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [characterStates, setCharacterStates] = useState<
    ('correct' | 'incorrect' | 'neutral')[]
  >([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const targetWord = word.wordText.toLowerCase().trim();

  // Character validation states
  useEffect(() => {
    const states: ('correct' | 'incorrect' | 'neutral')[] = [];
    const input = userInput.toLowerCase();

    for (let i = 0; i < Math.max(input.length, targetWord.length); i++) {
      if (i >= input.length) {
        states.push('neutral');
      } else if (i >= targetWord.length) {
        states.push('incorrect');
      } else if (input[i] === targetWord[i]) {
        states.push('correct');
      } else {
        states.push('incorrect');
      }
    }

    setCharacterStates(states);
  }, [userInput, targetWord]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !hasSubmitted) {
      inputRef.current.focus();
    }
  }, [hasSubmitted]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(() => {
    if (hasSubmitted || userInput.trim() === '') return;

    setHasSubmitted(true);
    const trimmedInput = userInput.trim().toLowerCase();
    const correct = trimmedInput === targetWord;

    setIsCorrect(correct);
    setShowFeedback(true);

    // Call the answer handler
    onAnswer(userInput.trim(), correct, 1);

    // Auto-advance after showing feedback
    setTimeout(
      () => {
        // Game completed - orchestrator will handle transition
      },
      correct ? 1500 : 2500,
    );
  }, [hasSubmitted, userInput, targetWord, onAnswer]);

  /**
   * Handle keyboard input
   */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !hasSubmitted) {
        handleSubmit();
      }
    },
    [hasSubmitted, handleSubmit],
  );

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!hasSubmitted) {
        setUserInput(e.target.value);
      }
    },
    [hasSubmitted],
  );

  /**
   * Toggle hint display
   */
  const toggleHint = useCallback(() => {
    setShowHint(!showHint);
  }, [showHint]);

  /**
   * Toggle virtual keyboard
   */
  const toggleKeyboard = useCallback(() => {
    setShowKeyboard(!showKeyboard);
  }, [showKeyboard]);

  /**
   * Handle audio play
   */
  const handleAudioPlay = useCallback(() => {
    if (onAudioPlay && word.audioUrl) {
      onAudioPlay(word.wordText, word.audioUrl);
    }
  }, [onAudioPlay, word.audioUrl, word.wordText]);

  /**
   * Handle virtual keyboard key press
   */
  const handleVirtualKeyPress = useCallback(
    (key: string) => {
      if (hasSubmitted) return;

      if (key === 'Backspace') {
        setUserInput((prev) => prev.slice(0, -1));
      } else if (key === 'Space') {
        setUserInput((prev) => prev + ' ');
      } else {
        setUserInput((prev) => prev + key);
      }
    },
    [hasSubmitted],
  );

  /**
   * Get input styling based on state
   */
  const getInputClassName = useCallback(() => {
    if (!hasSubmitted) return '';

    if (isCorrect) {
      return 'border-green-500 bg-green-50 text-green-700';
    } else {
      return 'border-red-500 bg-red-50 text-red-700';
    }
  }, [hasSubmitted, isCorrect]);

  /**
   * Get character styling for feedback
   */
  const getCharacterStyle = useCallback(
    (index: number) => {
      if (!hasSubmitted || index >= characterStates.length) return '';

      const state = characterStates[index];
      switch (state) {
        case 'correct':
          return 'bg-green-100 text-green-700';
        case 'incorrect':
          return 'bg-red-100 text-red-700';
        default:
          return '';
      }
    },
    [hasSubmitted, characterStates],
  );

  return {
    // State
    userInput,
    showKeyboard,
    showHint,
    hasSubmitted,
    showFeedback,
    isCorrect,
    characterStates,
    targetWord,

    // Refs
    inputRef,

    // Handlers
    handleSubmit,
    handleKeyPress,
    handleInputChange,
    toggleHint,
    toggleKeyboard,
    handleAudioPlay,
    handleVirtualKeyPress,

    // Utilities
    getInputClassName,
    getCharacterStyle,
  };
}
