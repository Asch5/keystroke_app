'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TypingWordDisplay } from './TypingWordDisplay';
import { TypingInputField } from './TypingInputField';
import { TypingResultFeedback } from './TypingResultFeedback';
import { TypingControls } from './TypingControls';
import { TypingAudioButton } from './TypingAudioButton';
import { useTypingInputState } from './hooks/useTypingInputState';

import type { SessionState, WordResult, TypingPracticeSettings } from './hooks';

interface TypingWordInputProps {
  sessionState: SessionState;
  showResult: boolean;
  wordResults: WordResult[];
  isPlayingAudio: boolean;
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
  onFinishPractice: () => void;
}

/**
 * Word input component for typing practice
 * Handles the typing interface, visual feedback, and word comparison
 */
export function TypingWordInput({
  sessionState,
  showResult,
  wordResults,
  isPlayingAudio,
  settings,
  onInputChange,
  onWordSubmit,
  onSkipWord,
  onNextWord,
  onPlayAudio,
  onFinishPractice,
}: TypingWordInputProps) {
  const { inputRef, handleInputChangeWithSound } = useTypingInputState({
    sessionState,
    showResult,
    wordResults,
    settings,
    onInputChange,
    onWordSubmit,
    onSkipWord,
    onNextWord,
    onPlayAudio,
  });

  if (!sessionState.currentWord) return null;

  return (
    <Card>
      <CardContent className="p-8 space-y-6">
        {/* Word display */}
        <TypingWordDisplay
          sessionState={sessionState}
          showResult={showResult}
          settings={settings}
        />

        {/* Input area */}
        <TypingInputField
          ref={inputRef}
          sessionState={sessionState}
          showResult={showResult}
          onInputChange={handleInputChangeWithSound}
        />

        {/* Result feedback */}
        <TypingResultFeedback
          showResult={showResult}
          wordResults={wordResults}
          isPlayingAudio={isPlayingAudio}
        />

        {/* Controls */}
        <TypingControls
          sessionState={sessionState}
          showResult={showResult}
          onWordSubmit={onWordSubmit}
          onSkipWord={onSkipWord}
          onNextWord={onNextWord}
          onFinishPractice={onFinishPractice}
        />

        {/* Audio button */}
        <TypingAudioButton
          sessionState={sessionState}
          isPlayingAudio={isPlayingAudio}
          onPlayAudio={onPlayAudio}
        />
      </CardContent>
    </Card>
  );
}
