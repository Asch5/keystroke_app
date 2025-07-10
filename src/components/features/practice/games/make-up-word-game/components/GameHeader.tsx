import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { PracticeAudioControls } from '../../../shared/PracticeAudioControls';
import { WordData } from '../types';

interface GameHeaderProps {
  word: WordData;
  attempts: number;
  maxAttempts: number;
  autoPlayAudio?: boolean;
  onAudioPlay: () => void;
}

/**
 * Game header component showing word definition, translation, and audio controls
 * Displays attempt counter and word metadata
 */
export function GameHeader({
  word,
  attempts,
  maxAttempts,
  autoPlayAudio = false,
  onAudioPlay,
}: GameHeaderProps) {
  return (
    <CardHeader className="text-center pb-4">
      <div className="flex items-center justify-center gap-4 mb-4">
        <CardTitle className="text-xl">Make Up the Word</CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant={attempts >= maxAttempts ? 'destructive' : 'outline'}
            className="flex items-center gap-1"
          >
            <Target className="h-3 w-3" />
            {attempts}/{maxAttempts}
          </Badge>
          {word.isPhrase && (
            <Badge variant="secondary" className="text-xs">
              Phrase
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Definition Section */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-lg leading-relaxed">{word.definition}</p>
          {word.oneWordTranslation && (
            <div className="mt-2 text-sm text-muted-foreground">
              Translation:{' '}
              <span className="font-medium">{word.oneWordTranslation}</span>
            </div>
          )}
        </div>

        {/* Audio Controls */}
        {word.audioUrl && (
          <div className="flex justify-center">
            <PracticeAudioControls
              audioUrl={word.audioUrl}
              audioType="word"
              showVolumeControl={false}
              showReplayCounter={false}
              autoPlay={autoPlayAudio}
              onPlay={onAudioPlay}
              className="max-w-sm"
            />
          </div>
        )}

        {/* Phonetic */}
        {word.phonetic && (
          <p className="text-sm text-muted-foreground font-mono">
            /{word.phonetic}/
          </p>
        )}
      </div>
    </CardHeader>
  );
}
