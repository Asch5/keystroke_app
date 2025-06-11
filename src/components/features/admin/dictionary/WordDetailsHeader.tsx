import React from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import type { WordEntryData } from '@/core/lib/actions/dictionaryActions';

interface WordDetailsHeaderProps {
  wordDetails: WordEntryData;
}

/**
 * WordDetailsHeader component displays the main word information including
 * title, phonetic pronunciation, audio playback, and language metadata.
 *
 * @param wordDetails - The complete word entry data
 */
export function WordDetailsHeader({ wordDetails }: WordDetailsHeaderProps) {
  const primaryAudioUrl =
    wordDetails?.details?.[0]?.audioFiles?.find((af) => af.isPrimary)?.url ||
    wordDetails?.details?.[0]?.audioFiles?.[0]?.url;

  return (
    <CardHeader>
      <div className="flex flex-col items-center">
        <CardTitle className="text-3xl font-bold mb-2 flex items-center gap-3">
          {wordDetails.word}
          {primaryAudioUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 rounded-full"
              onClick={async () => {
                if (primaryAudioUrl) {
                  try {
                    await AudioService.playAudioFromDatabase(primaryAudioUrl);
                  } catch (error) {
                    console.error('Error playing audio:', error);
                  }
                }
              }}
            >
              <span role="img" aria-label="play audio">
                🔊
              </span>
            </Button>
          )}
        </CardTitle>
        {wordDetails.phoneticGeneral && (
          <CardDescription className="text-lg text-muted-foreground">
            {wordDetails.phoneticGeneral}
          </CardDescription>
        )}
      </div>
    </CardHeader>
  );
}
