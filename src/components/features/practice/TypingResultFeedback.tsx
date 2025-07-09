'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/shared/utils/common/cn';
import type { WordResult } from './hooks';

interface TypingResultFeedbackProps {
  showResult: boolean;
  wordResults: WordResult[];
  isPlayingAudio: boolean;
}

/**
 * Component for displaying result feedback and word comparison
 */
export function TypingResultFeedback({
  showResult,
  wordResults,
  isPlayingAudio,
}: TypingResultFeedbackProps) {
  if (!showResult || wordResults.length === 0) return null;

  const lastResult = wordResults[wordResults.length - 1];
  const isCorrect = lastResult?.isCorrect;

  return (
    <div className="text-center space-y-4">
      {/* Result badge */}
      <Badge
        variant={isCorrect ? 'default' : 'destructive'}
        className="text-sm"
      >
        {lastResult?.feedback}
        {isPlayingAudio && ' 🔊'}
      </Badge>

      {/* Word comparison for incorrect attempts */}
      {!isCorrect && lastResult && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">You typed:</p>
              <div className="font-mono text-lg">
                {lastResult.userInput.split('').map((char, index) => (
                  <span
                    key={index}
                    className={cn(
                      'px-1 py-0.5 rounded',
                      lastResult.mistakes.some((m) => m.position === index)
                        ? 'bg-error-subtle text-error-foreground border border-error-border'
                        : 'text-muted-foreground',
                    )}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Correct word:</p>
              <div className="font-mono text-lg text-success-foreground">
                {lastResult.correctWord}
              </div>
            </div>
          </div>

          {/* Accuracy information */}
          <div className="text-sm text-muted-foreground">
            <p>Accuracy: {lastResult.accuracy}%</p>
            {lastResult.mistakes.length > 0 && (
              <p>Mistakes: {lastResult.mistakes.length}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
