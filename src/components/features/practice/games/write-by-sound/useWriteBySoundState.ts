'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WordData {
  wordText: string;
  definition?: string;
  oneWordTranslation?: string;
  audioUrl: string;
  phonetic?: string;
}

interface UseWriteBySoundStateProps {
  word: WordData;
  onAnswer: (userInput: string, isCorrect: boolean, attempts: number) => void;
  onAudioPlay?: (word: string, audioUrl?: string) => void | undefined;
  autoPlayAudio?: boolean;
  maxReplays?: number;
}

/**
 * Custom hook for managing Write by Sound game state
 */
export function useWriteBySoundState({
  word,
  onAnswer,
  onAudioPlay,
  autoPlayAudio = true,
  maxReplays = 3,
}: UseWriteBySoundStateProps) {
  const [userInput, setUserInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedInitial, setHasPlayedInitial] = useState(false);
  const [characterStates, setCharacterStates] = useState<
    ('correct' | 'incorrect' | 'neutral')[]
  >([]);
  const [showHint, setShowHint] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
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

  // Create handleAudioPlay with useCallback to avoid dependency issues
  const handleAudioPlay = useCallback(
    (isInitial = false) => {
      if (!word.audioUrl || isPlaying) return;

      if (!isInitial) {
        if (replayCount >= maxReplays) return;
        setReplayCount((prev) => prev + 1);
      }

      setIsPlaying(true);

      // Create new audio instance for each play
      const audio = new Audio(word.audioUrl);

      audio.onloadstart = () => setIsPlaying(true);
      audio.oncanplaythrough = () => {
        audio.play().catch(console.error);
      };
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        console.error('Audio failed to load');
        setIsPlaying(false);
      };

      // Cleanup
      audioRef.current = audio;

      if (onAudioPlay) {
        onAudioPlay(word.wordText, word.audioUrl);
      }
    },
    [
      word.audioUrl,
      word.wordText,
      isPlaying,
      replayCount,
      maxReplays,
      onAudioPlay,
    ],
  );

  // Auto-play initial audio
  useEffect(() => {
    if (autoPlayAudio && !hasPlayedInitial && word.audioUrl) {
      handleAudioPlay(true);
      setHasPlayedInitial(true);
    }
  }, [autoPlayAudio, hasPlayedInitial, word.audioUrl, handleAudioPlay]);

  // Focus input after initial audio
  useEffect(() => {
    if (hasPlayedInitial && inputRef.current && !hasSubmitted) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasPlayedInitial, hasSubmitted]);

  const handleSubmit = () => {
    if (hasSubmitted || userInput.trim() === '') return;

    setHasSubmitted(true);
    const trimmedInput = userInput.trim().toLowerCase();
    const correct = trimmedInput === targetWord;

    setIsCorrect(correct);
    setShowFeedback(true);

    // Call the answer handler
    onAnswer(userInput.trim(), correct, 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !hasSubmitted) {
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasSubmitted) {
      setUserInput(e.target.value);
    }
  };

  const toggleHint = () => {
    if (!hasSubmitted) {
      setShowHint(!showHint);
    }
  };

  const getInputClassName = () => {
    if (!hasSubmitted) return '';

    if (isCorrect) {
      return 'border-green-500 bg-green-50 text-green-700';
    } else {
      return 'border-red-500 bg-red-50 text-red-700';
    }
  };

  const getCharacterStyle = (index: number) => {
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
  };

  const replaysRemaining = Math.max(0, maxReplays - replayCount);
  const replayProgress = (replayCount / maxReplays) * 100;

  return {
    // State
    userInput,
    hasSubmitted,
    showFeedback,
    isCorrect,
    replayCount,
    isPlaying,
    hasPlayedInitial,
    characterStates,
    showHint,
    targetWord,
    replaysRemaining,
    replayProgress,

    // Refs
    inputRef,
    audioRef,

    // Handlers
    handleSubmit,
    handleKeyPress,
    handleInputChange,
    toggleHint,
    handleAudioPlay,
    getInputClassName,
    getCharacterStyle,
  };
}
