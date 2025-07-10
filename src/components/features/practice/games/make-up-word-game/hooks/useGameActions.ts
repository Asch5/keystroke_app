import { useCallback } from 'react';
import { GameState } from '../types';
import { gameSoundService } from '@/core/domains/dictionary/services/game-sound-service';

/**
 * Game actions hook that handles all user interactions
 * Contains the business logic for character selection, submission, etc.
 */
export function useGameActions(
  gameState: GameState,
  updateGameState: (updates: Partial<GameState>) => void,
  completeGame: (isCorrect: boolean, attempts: number) => void,
  targetWord: string,
  userInput: string,
  maxAttempts: number,
  characterPool?: string[],
  onAudioPlay?: (word: string, audioUrl?: string) => void,
  wordText?: string,
  audioUrl?: string,
) {
  // Check if character selection is valid (correct position in word)
  const isCharacterSelectionValid = useCallback(
    (char: string, currentPosition: number): boolean => {
      if (currentPosition >= targetWord.length) return false;
      return targetWord[currentPosition] === char.toLowerCase();
    },
    [targetWord],
  );

  const handleCharacterSelect = useCallback(
    (char: string, index: number) => {
      if (gameState.showFeedback || gameState.isGameCompleted) return;

      const currentPosition = gameState.selectedChars.length;
      const isValidSelection = isCharacterSelectionValid(char, currentPosition);

      if (!isValidSelection) {
        // Wrong character selection - play error sound and reduce attempts
        gameSoundService.playError();

        const newAttempts = gameState.attempts + 1;
        updateGameState({ attempts: newAttempts });

        // Check if attempts are exhausted
        if (newAttempts >= maxAttempts) {
          completeGame(false, newAttempts);
        }
        return; // Don't add the wrong character
      }

      // Valid character selection - move character from available to selected
      const newAvailable = [...gameState.availableChars];
      newAvailable.splice(index, 1);
      const newSelected = [...gameState.selectedChars, char];

      updateGameState({
        availableChars: newAvailable,
        selectedChars: newSelected,
      });

      // Check if word is completed
      const newUserInput = newSelected.join('').toLowerCase();
      if (newUserInput === targetWord) {
        completeGame(true, gameState.attempts + 1);
      }
    },
    [
      gameState,
      updateGameState,
      completeGame,
      targetWord,
      maxAttempts,
      isCharacterSelectionValid,
    ],
  );

  const handleCharacterRemove = useCallback(
    (index: number) => {
      if (gameState.showFeedback || gameState.isGameCompleted) return;

      // Move character from selected back to available
      const charToRemove = gameState.selectedChars[index];
      const newSelected = [...gameState.selectedChars];
      newSelected.splice(index, 1);

      // Only add to availableChars if charToRemove is defined
      const newAvailable = charToRemove
        ? [...gameState.availableChars, charToRemove]
        : gameState.availableChars;

      updateGameState({
        selectedChars: newSelected,
        availableChars: newAvailable,
      });
    },
    [gameState, updateGameState],
  );

  const handleSubmit = useCallback(() => {
    if (
      gameState.showFeedback ||
      gameState.selectedChars.length === 0 ||
      gameState.isGameCompleted
    )
      return;

    const newAttempts = gameState.attempts + 1;
    const correct = userInput === targetWord;

    if (!correct) {
      // Find wrong positions
      const wrong: number[] = [];
      for (let i = 0; i < Math.min(userInput.length, targetWord.length); i++) {
        if (userInput[i] !== targetWord[i]) {
          wrong.push(i);
        }
      }
      updateGameState({ wrongPositions: wrong });
    }

    completeGame(correct, newAttempts);
  }, [gameState, updateGameState, completeGame, userInput, targetWord]);

  const resetCharacterPool = useCallback(() => {
    if (characterPool && !gameState.isGameCompleted) {
      updateGameState({
        availableChars: [...characterPool],
        selectedChars: [],
      });
    }
  }, [characterPool, gameState.isGameCompleted, updateGameState]);

  const shuffleAvailableChars = useCallback(() => {
    if (gameState.showFeedback || gameState.isGameCompleted) return;
    updateGameState({
      availableChars: [...gameState.availableChars].sort(
        () => Math.random() - 0.5,
      ),
    });
  }, [gameState, updateGameState]);

  const handleAudioPlay = useCallback(() => {
    if (onAudioPlay && audioUrl && wordText) {
      onAudioPlay(wordText, audioUrl);
    }
  }, [onAudioPlay, audioUrl, wordText]);

  return {
    handleCharacterSelect,
    handleCharacterRemove,
    handleSubmit,
    resetCharacterPool,
    shuffleAvailableChars,
    handleAudioPlay,
  };
}
