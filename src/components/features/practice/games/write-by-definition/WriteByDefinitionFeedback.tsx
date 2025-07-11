'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/shared/utils/common/cn';
import { PracticeAudioControls } from '../../shared/PracticeAudioControls';

interface WriteByDefinitionFeedbackProps {
  showFeedback: boolean;
  isCorrect: boolean;
  word: {
    wordText: string;
    audioUrl?: string;
  };
  autoPlayAudio: boolean;
  onNext?: () => void;
  onAudioPlay: () => void;
}

/**
 * Feedback section component for Write by Definition game
 * Shows results with audio controls and next button
 */
export function WriteByDefinitionFeedback({
  showFeedback,
  isCorrect,
  word,
  autoPlayAudio,
  onNext,
  onAudioPlay,
}: WriteByDefinitionFeedbackProps) {
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
            Excellent!
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5" />
            The correct answer is:{' '}
            <span className="font-mono">{word.wordText}</span>
          </>
        )}
      </div>

      {/* Audio Controls for Feedback */}
      {word.audioUrl && (
        <div className="flex justify-center mt-3">
          <PracticeAudioControls
            audioUrl={word.audioUrl}
            audioType="word"
            showVolumeControl={false}
            showReplayCounter={false}
            autoPlay={isCorrect && autoPlayAudio}
            onPlay={onAudioPlay}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Next Button */}
      {onNext && (
        <div className="flex justify-center mt-4">
          <Button onClick={onNext} className="px-8 py-3 text-lg" size="lg">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
