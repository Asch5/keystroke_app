import { Star, Edit, Volume2, VolumeX } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/shared/utils/common/cn';
import { WordCellProps } from '../types';

/**
 * Word cell component displaying word information and audio controls
 * Shows word text, part of speech, variant, and audio playback button
 */
export function WordCell({
  word,
  isPlayingAudio,
  playingWordId,
  onPlayAudio,
}: WordCellProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{word.word}</span>
          {word.isFavorite && (
            <Star className="h-3 w-3 text-warning-foreground fill-current" />
          )}
          {word.isModified && <Edit className="h-3 w-3 text-info-foreground" />}
        </div>
        <div className="text-xs text-muted-foreground">
          {word.partOfSpeech} {word.variant && `• ${word.variant}`}
        </div>
      </div>
      {/* Audio Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-6 w-6 p-0 hover:bg-muted',
          !word.audioUrl && 'opacity-50 cursor-not-allowed',
        )}
        title={word.audioUrl ? 'Play pronunciation' : 'No audio available'}
        disabled={isPlayingAudio && playingWordId !== word.id}
        onClick={() => onPlayAudio(word.word, word.audioUrl, word.id)}
      >
        {word.audioUrl ? (
          <Volume2
            className={cn(
              'h-3 w-3 text-info-foreground',
              isPlayingAudio && playingWordId === word.id && 'animate-pulse',
            )}
          />
        ) : (
          <VolumeX className="h-3 w-3 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
