'use client';

import { useEffect, useRef } from 'react';
import { gameSoundService } from '@/core/domains/dictionary/services/game-sound-service';
import type { SessionState, WordResult, TypingPracticeSettings } from './index';

interface UseTypingInputStateProps {
  sessionState: SessionState;
  showResult: boolean;
  wordResults: WordResult[];
  settings: TypingPracticeSettings;
  onInputChange: (value: string) => void;
  onWordSubmit: () => void;
  onSkipWord: () => Promise<WordResult | undefined>;
  onNextWord: () => void;
  onPlayAudio: (
    word: string,
    audioUrl: string | undefined,
    isCorrect: boolean,
  ) => void;
}

/**
 * Custom hook for managing typing input state, sound effects, and keyboard events
 */
export function useTypingInputState({
  sessionState,
  showResult,
  wordResults,
  settings,
  onInputChange,
  onWordSubmit,
  onSkipWord,
  onNextWord,
  onPlayAudio,
}: UseTypingInputStateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPlayedAutoAudioRef = useRef(false);

  // Initialize game sound service
  useEffect(() => {
    if (settings.enableGameSounds) {
      gameSoundService.initialize({
        volume: settings.gameSoundVolume,
        enabled: settings.enableGameSounds,
        useStaticFiles: true,
      });
    }
  }, [settings.enableGameSounds, settings.gameSoundVolume]);

  // Auto-focus on the input when component mounts or when a new word appears
  useEffect(() => {
    if (
      sessionState.isActive &&
      !showResult &&
      inputRef.current &&
      sessionState.currentWord
    ) {
      inputRef.current.focus();
    }
  }, [sessionState.currentWord, sessionState.isActive, showResult]);

  // Auto-play audio when new word appears (if setting is enabled)
  useEffect(() => {
    const currentWord = sessionState.currentWord;
    const shouldPlayAutoAudio =
      settings.playAudioOnStart &&
      currentWord &&
      sessionState.isActive &&
      !showResult &&
      !hasPlayedAutoAudioRef.current;

    if (shouldPlayAutoAudio && currentWord) {
      console.log('🎵 Auto-playing audio for new word:', currentWord.wordText);
      hasPlayedAutoAudioRef.current = true;

      // Play audio automatically when word appears
      onPlayAudio(
        currentWord.wordText,
        currentWord.audioUrl,
        true, // neutral - not success or error
      );
    }

    // Reset the flag when word changes
    if (currentWord) {
      hasPlayedAutoAudioRef.current = false;
    }
  }, [
    sessionState.currentWord,
    settings.playAudioOnStart,
    sessionState.isActive,
    showResult,
    onPlayAudio,
  ]);

  // Handle typing feedback with game sounds
  const handleInputChangeWithSound = (value: string) => {
    const previousLength = sessionState.userInput.length;
    const newLength = value.length;

    // Character was added
    if (newLength > previousLength && sessionState.currentWord) {
      const newChar = value[newLength - 1];
      const expectedChar = sessionState.currentWord.wordText[newLength - 1];

      // Play keystroke sound if enabled
      if (settings.enableKeystrokeSounds) {
        gameSoundService.playKeystroke();
      }

      // Play feedback sound based on correctness
      if (settings.enableGameSounds) {
        if (newChar !== expectedChar) {
          // Wrong character typed
          gameSoundService.playError();
        }
        // Note: Success sound is played on word completion, not per character
      }
    }

    // Call the original input handler
    onInputChange(value);
  };

  // Handle Enter key for submission, skip, and next word
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && sessionState.isActive) {
        // Prevent default behavior and stop propagation
        event.preventDefault();
        event.stopPropagation();

        console.log('🎯 Enter key pressed:', {
          showResult,
          userInput: sessionState.userInput,
          userInputLength: sessionState.userInput?.length || 0,
        });

        if (showResult) {
          // When showing results, Enter triggers "Next Word"
          console.log('📝 Triggering Next Word');
          onNextWord();
        } else {
          // When typing, Enter behavior depends on input
          if (sessionState.userInput && sessionState.userInput.length > 0) {
            // If user has typed something, submit the word
            console.log('✅ Triggering Submit');
            onWordSubmit();

            // Play success sound if word is correct
            if (settings.enableGameSounds && sessionState.currentWord) {
              const isCorrect =
                sessionState.userInput === sessionState.currentWord.wordText;
              if (isCorrect) {
                gameSoundService.playSuccess();
              }
            }
          } else {
            // If user hasn't typed anything, skip the word
            console.log('⏭️ Triggering Skip');
            onSkipWord()
              .then(() => {
                console.log('✨ Skip completed');
              })
              .catch((error) => {
                console.error('❌ Skip error:', error);
              });
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    sessionState.isActive,
    sessionState.userInput,
    sessionState.currentWord,
    showResult,
    settings.enableGameSounds,
    onWordSubmit,
    onNextWord,
    onSkipWord,
  ]);

  // Play success sound when word is completed correctly
  useEffect(() => {
    if (showResult && wordResults.length > 0 && settings.enableGameSounds) {
      const lastResult = wordResults[wordResults.length - 1];
      if (lastResult?.isCorrect) {
        gameSoundService.playSuccess();
      }
    }
  }, [showResult, wordResults, settings.enableGameSounds]);

  return {
    inputRef,
    handleInputChangeWithSound,
  };
}
