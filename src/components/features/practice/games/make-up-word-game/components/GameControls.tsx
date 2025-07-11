import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/shared/utils/common/cn';
import { GameState, WordData } from '../types';

interface GameControlsProps {
  gameState: GameState;
  word: WordData;
  userInput: string;
  maxAttempts: number;
  showResult?: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

/**
 * Game controls component for action buttons and feedback display
 * Shows submit/reset buttons and game completion feedback
 */
export function GameControls({
  gameState,
  word,
  userInput,
  maxAttempts,
  showResult = false,
  onSubmit,
  onReset,
}: GameControlsProps) {
  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      {!gameState.showFeedback &&
        !gameState.isGameCompleted &&
        gameState.selectedChars.length > 0 && (
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={onSubmit}
              size="lg"
              className="flex items-center gap-2 min-w-[120px]"
            >
              Submit Word
            </Button>
          </div>
        )}

      {/* Feedback */}
      {(gameState.showFeedback || gameState.isGameCompleted) && (
        <div className="text-center space-y-4">
          <div
            className={cn(
              'flex items-center justify-center gap-2 text-lg font-semibold',
              gameState.isCorrect
                ? 'text-success-foreground'
                : 'text-error-foreground',
            )}
          >
            {gameState.isCorrect ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Perfect! You got it right
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                {gameState.attempts >= maxAttempts
                  ? 'No more attempts'
                  : 'Incorrect!'}
              </>
            )}
          </div>

          {!gameState.isCorrect && (
            <div className="space-y-2">
              {userInput && (
                <p className="text-sm text-muted-foreground">
                  Your answer: <span className="font-mono">{userInput}</span>
                </p>
              )}
              {gameState.attempts >= maxAttempts && (
                <p className="text-sm text-muted-foreground">
                  Correct answer:{' '}
                  <span className="font-semibold">{word.wordText}</span>
                </p>
              )}
            </div>
          )}

          <Badge variant="outline" className="mt-2">
            {gameState.isCorrect
              ? 'Excellent work! Advancing to word review...'
              : gameState.attempts >= maxAttempts
                ? 'Advancing to word review...'
                : 'Try again on next attempt...'}
          </Badge>
        </div>
      )}

      {/* Loading state */}
      {showResult && !gameState.showFeedback && !gameState.isGameCompleted && (
        <div className="text-center">
          <Badge variant="outline">Processing your answer...</Badge>
        </div>
      )}
    </div>
  );
}
