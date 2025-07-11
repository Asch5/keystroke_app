'use client';

import type {
  PracticeType,
  EnhancedPracticeSession,
  PracticeWord,
} from '@/core/domains/user/actions/practice-actions';
import type { VocabularyPracticeSettings } from '@/core/state/features/settingsSlice';
import {
  ChooseRightWordGame,
  RememberTranslationGame,
  MakeUpWordGame,
  WriteByDefinitionGame,
  WriteBySoundGame,
} from './games';

type PracticeConfigsType = Record<
  PracticeType,
  {
    difficultyLevel: number;
    maxAttempts: number;
    autoAdvance: boolean;
    requiresAudio: boolean;
    requiresInput: boolean;
    optionCount?: number;
    maxAttemptsPhrase?: number;
    maxAudioReplays?: number;
  }
>;

// Type for words with exerciseType from unified practice
type UnifiedPracticeWordType = PracticeWord & { exerciseType: PracticeType };

interface PracticeGameRendererProps {
  session: EnhancedPracticeSession;
  settings: VocabularyPracticeSettings;
  currentWord: PracticeWord;
  practiceConfigs: PracticeConfigsType | null;
  onGameAnswer: (
    userInput: string,
    isCorrect: boolean,
    attempts: number,
  ) => void;
  onGameNext: () => void;
  onAudioPlay?: (word: string, audioUrl?: string) => void;
}

/**
 * Renders the appropriate practice game based on session type
 * Handles game-specific props and configurations
 */
export function PracticeGameRenderer({
  session,
  settings,
  currentWord,
  practiceConfigs,
  onGameAnswer,
  onGameNext,
  onAudioPlay,
}: PracticeGameRendererProps) {
  if (!currentWord || !practiceConfigs) return null;

  // Ensure word has required properties for game components
  const wordForGame = {
    ...currentWord,
    oneWordTranslation: currentWord.oneWordTranslation ?? '',
    audioUrl: currentWord.audioUrl ?? '',
    phonetic: currentWord.phonetic ?? '',
  };

  // Create specific props for each game type to match their expected interfaces
  const baseGameProps = {
    word: wordForGame,
    autoPlayAudio: settings.autoPlayAudioOnGameStart,
    className: 'w-full',
  };

  // Create a no-op function for required callbacks that might be undefined
  const handleAudioPlay = onAudioPlay || (() => {});

  // For unified practice, use the exerciseType from the word
  const effectivePracticeType =
    session.practiceType === 'unified-practice'
      ? (currentWord as UnifiedPracticeWordType).exerciseType
      : session.practiceType;

  // Type guard to ensure the practice type is valid
  if (!practiceConfigs[effectivePracticeType]) {
    console.error(`Unknown practice type: ${effectivePracticeType}`);
    return (
      <div className="text-center p-8 text-error-foreground">
        Unknown practice type: {effectivePracticeType}
      </div>
    );
  }

  switch (effectivePracticeType) {
    case 'choose-right-word':
      return (
        <ChooseRightWordGame
          {...baseGameProps}
          onAnswer={(selectedIndex, isCorrect) =>
            onGameAnswer('', isCorrect, 1)
          }
          onAudioPlay={handleAudioPlay}
        />
      );

    case 'remember-translation':
      return (
        <RememberTranslationGame
          {...baseGameProps}
          onAnswer={(remembered) => onGameAnswer('', remembered, 1)}
          onAudioPlay={handleAudioPlay}
        />
      );

    case 'make-up-word':
      return (
        <MakeUpWordGame
          {...baseGameProps}
          onAnswer={onGameAnswer}
          onAudioPlay={handleAudioPlay}
          onNext={onGameNext}
        />
      );

    case 'write-by-definition': {
      const nextFn = practiceConfigs[effectivePracticeType].autoAdvance
        ? () => {} // Empty function if auto-advance
        : onGameNext;

      return (
        <WriteByDefinitionGame
          {...baseGameProps}
          onAnswer={onGameAnswer}
          onAudioPlay={handleAudioPlay}
          showVirtualKeyboard={session.settings?.showHints ?? false}
          onNext={nextFn}
        />
      );
    }

    case 'write-by-sound': {
      const nextFn = practiceConfigs[effectivePracticeType].autoAdvance
        ? () => {} // Empty function if auto-advance
        : onGameNext;

      return (
        <WriteBySoundGame
          {...baseGameProps}
          onAnswer={onGameAnswer}
          onAudioPlay={handleAudioPlay}
          maxReplays={3}
          onNext={nextFn}
        />
      );
    }

    default:
      console.error(`Unknown practice type: ${effectivePracticeType}`);
      return (
        <div className="text-center p-8 text-error-foreground">
          Unknown practice type: {effectivePracticeType}
        </div>
      );
  }
}
