'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/core/shared/utils/common/cn';
import {
  useWriteByDefinitionState,
  WriteByDefinitionHeader,
  WriteByDefinitionInput,
  WriteByDefinitionFeedback,
  WriteByDefinitionKeyboard,
} from './write-by-definition';

interface WriteByDefinitionGameProps {
  word: {
    wordText: string;
    definition: string;
    oneWordTranslation?: string;
    audioUrl?: string;
    phonetic?: string;
  };
  showResult?: boolean;
  onAnswer: (userInput: string, isCorrect: boolean, attempts: number) => void;
  onNext?: () => void; // New: For Next button instead of auto-advance
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  autoPlayAudio?: boolean;
  showVirtualKeyboard?: boolean;
  className?: string;
}

/**
 * Write the Word by Definition practice game
 * Full word typing from definition with real-time character validation
 */
export function WriteByDefinitionGame({
  word,
  onAnswer,
  onNext,
  onAudioPlay,
  autoPlayAudio = false,
  showVirtualKeyboard = false,
  className,
}: WriteByDefinitionGameProps) {
  const gameState = useWriteByDefinitionState({
    word,
    onAnswer,
    ...(onAudioPlay && { onAudioPlay }),
    showVirtualKeyboard,
  });

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Header with definition and controls */}
      <WriteByDefinitionHeader
        word={word}
        showHint={gameState.showHint}
        showKeyboard={gameState.showKeyboard}
        targetWord={gameState.targetWord}
        onToggleHint={gameState.toggleHint}
        onToggleKeyboard={gameState.toggleKeyboard}
      />

      <CardContent className="space-y-6">
        {/* Input Section */}
        <WriteByDefinitionInput
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
        <WriteByDefinitionFeedback
          showFeedback={gameState.showFeedback}
          isCorrect={gameState.isCorrect}
          word={word}
          autoPlayAudio={autoPlayAudio}
          {...(onNext && { onNext })}
          onAudioPlay={gameState.handleAudioPlay}
        />

        {/* Virtual Keyboard */}
        <WriteByDefinitionKeyboard
          showKeyboard={gameState.showKeyboard}
          hasSubmitted={gameState.hasSubmitted}
          onVirtualKeyPress={gameState.handleVirtualKeyPress}
        />
      </CardContent>
    </Card>
  );
}
