'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';
import { PracticeAudioControls } from '../../shared/PracticeAudioControls';

interface WordData {
  wordText: string;
  definition?: string;
  oneWordTranslation?: string;
  audioUrl: string;
  phonetic?: string;
}

interface WriteBySoundFeedbackProps {
  showFeedback: boolean;
  isCorrect: boolean;
  word: WordData;
  onNext?: (() => void) | undefined;
  onAudioPlay?: ((word: string, audioUrl?: string) => void) | undefined;
}

/**
 * Feedback section component for Write by Sound game
 */
export function WriteBySoundFeedback({
  showFeedback,
  isCorrect,
  word,
  onNext,
  onAudioPlay,
}: WriteBySoundFeedbackProps) {
  if (!showFeedback) return null;

  return (
    <div
      className={cn(
        'p-4 rounded-lg text-center',
        isCorrect
          ? 'bg-success-subtle border border-success-border'
          : 'bg-error-subtle border border-error-border',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center gap-2 text-lg font-medium mb-2',
          isCorrect ? 'text-success-foreground' : 'text-error-foreground',
        )}
      >
        {isCorrect ? (
          <>
            <CheckCircle className="h-5 w-5" />
            Excellent listening!
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5" />
            The correct word is:{' '}
            <span className="font-mono">{word.wordText}</span>
          </>
        )}
      </div>

      {/* Show definition after submission */}
      {word.definition && (
        <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
          <div className="font-medium mb-1">Definition:</div>
          <div>{word.definition}</div>
          {word.oneWordTranslation && (
            <div className="mt-1 text-muted-foreground">
              Translation: {word.oneWordTranslation}
            </div>
          )}
        </div>
      )}

      {/* Audio Controls for Feedback - Allow unlimited replays after submission */}
      <div className="flex justify-center mt-3">
        <PracticeAudioControls
          audioUrl={word.audioUrl}
          audioType="word"
          showVolumeControl={false}
          showReplayCounter={false}
          autoPlay={isCorrect}
          onPlay={() => onAudioPlay?.(word.wordText, word.audioUrl)}
          className="max-w-sm"
        />
      </div>

      {/* Next Button - Show when onNext is provided */}
      {onNext && (
        <div className="flex justify-center mt-4">
          <Button onClick={onNext} className="px-8 py-2" variant="default">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
