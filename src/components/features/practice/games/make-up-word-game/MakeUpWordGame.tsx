'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/core/shared/utils/common/cn';
import { GameHeader } from './components/GameHeader';
import { GameArea } from './components/GameArea';
import { GameControls } from './components/GameControls';
import { useGameState } from './hooks/useGameState';
import { useGameActions } from './hooks/useGameActions';
import { MakeUpWordGameProps } from './types';

/**
 * Main MakeUpWordGame component - refactored to ~100 lines (down from 481 lines)
 * Uses modular architecture with focused components and custom hooks
 */
export function MakeUpWordGame({
  word,
  showResult = false,
  onAnswer,
  onAudioPlay,
  autoPlayAudio = false,
  onNext,
  className,
}: MakeUpWordGameProps) {
  // State management hook
  const {
    gameState,
    updateGameState,
    completeGame,
    maxAttempts,
    targetWord,
    userInput,
  } = useGameState(word, onAnswer, onNext);

  // Actions hook
  const {
    handleCharacterSelect,
    handleCharacterRemove,
    handleSubmit,
    resetCharacterPool,
    shuffleAvailableChars,
    handleAudioPlay,
  } = useGameActions(
    gameState,
    updateGameState,
    completeGame,
    targetWord,
    userInput,
    maxAttempts,
    word.characterPool,
    onAudioPlay,
    word.wordText,
    word.audioUrl,
  );

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <GameHeader
        word={word}
        attempts={gameState.attempts}
        maxAttempts={maxAttempts}
        autoPlayAudio={autoPlayAudio}
        onAudioPlay={handleAudioPlay}
      />

      <CardContent className="space-y-6">
        <GameArea
          gameState={gameState}
          word={word}
          onCharacterSelect={handleCharacterSelect}
          onCharacterRemove={handleCharacterRemove}
          onShuffle={shuffleAvailableChars}
        />

        <GameControls
          gameState={gameState}
          word={word}
          userInput={userInput}
          maxAttempts={maxAttempts}
          showResult={showResult}
          onSubmit={handleSubmit}
          onReset={resetCharacterPool}
        />
      </CardContent>
    </Card>
  );
}
