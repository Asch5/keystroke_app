'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/core/shared/utils/common/cn';
import {
  useWriteBySoundState,
  WriteBySoundHeader,
  WriteBySoundAudioControls,
  WriteBySoundHint,
  WriteBySoundInput,
  WriteBySoundFeedback,
} from './write-by-sound';

interface WriteBySoundGameProps {
  word: {
    wordText: string;
    definition?: string;
    oneWordTranslation?: string;
    audioUrl: string; // Required for this game type
    phonetic?: string;
  };
  onAnswer: (userInput: string, isCorrect: boolean, attempts: number) => void;
  onNext?: () => void; // New: For Next button instead of auto-advance
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  autoPlayAudio?: boolean;
  maxReplays?: number;
  className?: string;
}

/**
 * Write the Word by Sound practice game
 * Audio-only word typing with replay limits
 */
export function WriteBySoundGame({
  word,
  onAnswer,
  onNext,
  onAudioPlay,
  autoPlayAudio = true,
  maxReplays = 3,
  className,
}: WriteBySoundGameProps) {
  const gameState = useWriteBySoundState({
    word,
    onAnswer,
    ...(onAudioPlay && { onAudioPlay }),
    autoPlayAudio,
    maxReplays,
  });

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Header with instructions */}
      <WriteBySoundHeader maxReplays={maxReplays} />

      <CardContent className="space-y-6">
        {/* Audio Controls */}
        <WriteBySoundAudioControls
          isPlaying={gameState.isPlaying}
          replaysRemaining={gameState.replaysRemaining}
          replayProgress={gameState.replayProgress}
          replayCount={gameState.replayCount}
          maxReplays={maxReplays}
          showHint={gameState.showHint}
          hasSubmitted={gameState.hasSubmitted}
          onAudioPlay={() => gameState.handleAudioPlay()}
          onToggleHint={gameState.toggleHint}
        />

        {/* Hint Display */}
        <WriteBySoundHint
          showHint={gameState.showHint}
          hasSubmitted={gameState.hasSubmitted}
          wordLength={gameState.targetWord.length}
        />

        {/* Input Section */}
        <WriteBySoundInput
          ref={gameState.inputRef}
          userInput={gameState.userInput}
          hasSubmitted={gameState.hasSubmitted}
          isCorrect={gameState.isCorrect}
          onInputChange={gameState.handleInputChange}
          onKeyPress={gameState.handleKeyPress}
          onSubmit={gameState.handleSubmit}
          getInputClassName={gameState.getInputClassName}
          getCharacterStyle={gameState.getCharacterStyle}
        />

        {/* Feedback Section */}
        <WriteBySoundFeedback
          showFeedback={gameState.showFeedback}
          isCorrect={gameState.isCorrect}
          word={word}
          onNext={onNext}
          onAudioPlay={onAudioPlay}
        />

        {/* Keyboard Shortcut Hint */}
        {!gameState.hasSubmitted && (
          <div className="text-center text-sm text-muted-foreground">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> to
            submit • <kbd className="px-2 py-1 bg-muted rounded text-xs">R</kbd>{' '}
            to replay audio
          </div>
        )}
      </CardContent>
    </Card>
  );
}
