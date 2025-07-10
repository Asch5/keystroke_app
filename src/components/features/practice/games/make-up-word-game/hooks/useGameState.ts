import { useState, useEffect } from 'react';
import { GameState, WordData } from '../types';
import { gameSoundService } from '@/core/domains/dictionary/services/game-sound-service';

/**
 * Main state management hook for MakeUpWordGame
 * Handles all game state logic and side effects
 */
export function useGameState(
  word: WordData,
  onAnswer: (userInput: string, isCorrect: boolean, attempts: number) => void,
  onNext?: () => void,
) {
  const [gameState, setGameState] = useState<GameState>({
    selectedChars: [],
    availableChars: [],
    attempts: 0,
    showFeedback: false,
    isCorrect: false,
    wrongPositions: [],
    isGameCompleted: false,
  });

  const maxAttempts = word.maxAttempts || (word.isPhrase ? 6 : 3);
  const targetWord = word.wordText.toLowerCase();
  const userInput = gameState.selectedChars.join('').toLowerCase();

  // Initialize character pool and reset game state
  useEffect(() => {
    if (word.characterPool) {
      setGameState({
        selectedChars: [],
        availableChars: [...word.characterPool],
        attempts: 0,
        showFeedback: false,
        isCorrect: false,
        wrongPositions: [],
        isGameCompleted: false,
      });
    }
  }, [word.characterPool, word.wordText]);

  // Initialize game sound service
  useEffect(() => {
    gameSoundService.initialize({
      volume: 0.5,
      enabled: true,
      useStaticFiles: true,
    });
  }, []);

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  };

  const completeGame = (isCorrect: boolean, attempts: number) => {
    updateGameState({
      isGameCompleted: true,
      showFeedback: true,
      isCorrect,
    });

    if (isCorrect) {
      gameSoundService.playSuccess();
    } else {
      gameSoundService.playError();
    }

    onAnswer(userInput, isCorrect, attempts);

    // Auto-advance to word card
    setTimeout(
      () => {
        onNext?.();
      },
      isCorrect ? 1500 : 2000,
    );
  };

  return {
    gameState,
    updateGameState,
    completeGame,
    maxAttempts,
    targetWord,
    userInput,
  };
}
