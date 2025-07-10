/**
 * Types for MakeUpWordGame modular components
 */

export interface MakeUpWordGameProps {
  word: {
    wordText: string;
    definition: string;
    oneWordTranslation?: string;
    characterPool?: string[];
    audioUrl?: string;
    phonetic?: string;
    isPhrase?: boolean;
    maxAttempts?: number;
  };
  showResult?: boolean;
  onAnswer: (userInput: string, isCorrect: boolean, attempts: number) => void;
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  autoPlayAudio?: boolean;
  onNext?: () => void;
  className?: string;
}

export interface GameState {
  selectedChars: string[];
  availableChars: string[];
  attempts: number;
  showFeedback: boolean;
  isCorrect: boolean;
  wrongPositions: number[];
  isGameCompleted: boolean;
}

export interface WordData {
  wordText: string;
  definition: string;
  oneWordTranslation?: string;
  characterPool?: string[];
  audioUrl?: string;
  phonetic?: string;
  isPhrase?: boolean;
  maxAttempts?: number;
}

export interface GameActions {
  handleCharacterSelect: (char: string, index: number) => void;
  handleCharacterRemove: (index: number) => void;
  handleSubmit: () => void;
  resetCharacterPool: () => void;
  shuffleAvailableChars: () => void;
  handleAudioPlay: () => void;
}

export interface CharacterButtonProps {
  char: string;
  index: number;
  isAvailable: boolean;
  onClick: () => void;
  disabled: boolean;
  characterPool?: string[];
  className?: string;
  wrongPositions?: number[];
  showFeedback?: boolean;
  isCorrect?: boolean;
}
