'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/shared/utils/common/cn';
import type { SessionState } from './hooks';

interface TypingAudioButtonProps {
  sessionState: SessionState;
  isPlayingAudio: boolean;
  onPlayAudio: (
    word: string,
    audioUrl: string | undefined,
    isCorrect: boolean,
  ) => void;
}

/**
 * Component for the audio button functionality
 */
export function TypingAudioButton({
  sessionState,
  isPlayingAudio,
  onPlayAudio,
}: TypingAudioButtonProps) {
  if (!sessionState.currentWord) return null;

  return (
    <div className="flex justify-center">
      <Button
        variant="outline"
        size="icon"
        title={
          sessionState.currentWord.audioUrl
            ? 'Play pronunciation'
            : 'No audio available'
        }
        disabled={isPlayingAudio || !sessionState.currentWord.audioUrl}
        onClick={() => {
          if (sessionState.currentWord) {
            onPlayAudio(
              sessionState.currentWord.wordText,
              sessionState.currentWord.audioUrl,
              true,
            );
          }
        }}
        className={cn(
          'transition-opacity',
          !sessionState.currentWord.audioUrl && 'opacity-50 cursor-not-allowed',
        )}
      >
        {sessionState.currentWord.audioUrl ? (
          <Volume2
            className={cn(
              'h-4 w-4 text-info-foreground',
              isPlayingAudio && 'animate-pulse',
            )}
          />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
