'use client';

import { Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AuthenticatedImage } from '@/components/shared/AuthenticatedImage';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/core/shared/utils/common/cn';
import { LearningStatus } from '@/core/types';

interface WordCardProps {
  word: {
    wordText: string;
    definition: string;
    oneWordTranslation?: string;
    phonetic?: string;
    partOfSpeech?: string;
    learningStatus: LearningStatus;
    audioUrl?: string;
    imageId?: number;
    imageUrl?: string;
    imageDescription?: string;
  };
  isPlayingAudio?: boolean;
  showNextButton?: boolean;
  autoPlayAudio?: boolean;
  onPlayAudio?: (word: string, audioUrl?: string) => void;
  onNext?: () => void;
  className?: string;
}

/**
 * Universal WordCard component for consistent word review across all practice types
 * Shows target word, phonetic, definition, examples, audio, images, and next button
 */
export function WordCard({
  word,
  isPlayingAudio = false,
  showNextButton = true,
  autoPlayAudio = false,
  onPlayAudio,
  onNext,
  className,
}: WordCardProps) {
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  // Auto-play audio when card appears (if enabled)
  useEffect(() => {
    if (autoPlayAudio && !hasAutoPlayed && word.audioUrl && onPlayAudio) {
      setHasAutoPlayed(true);
      onPlayAudio(word.wordText, word.audioUrl);
    }
  }, [autoPlayAudio, hasAutoPlayed, word.audioUrl, word.wordText, onPlayAudio]);

  // Reset auto-play flag when word changes
  useEffect(() => {
    setHasAutoPlayed(false);
  }, [word.wordText]);

  const handlePlayAudio = () => {
    if (onPlayAudio && word.audioUrl) {
      onPlayAudio(word.wordText, word.audioUrl);
    }
  };

  const getLearningStatusColor = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return 'bg-status-learned-subtle text-status-learned-foreground';
      case LearningStatus.inProgress:
        return 'bg-status-in-progress-subtle text-status-in-progress-foreground';
      case LearningStatus.difficult:
        return 'bg-status-difficult-subtle text-status-difficult-foreground';
      case LearningStatus.needsReview:
        return 'bg-status-needs-review-subtle text-status-needs-review-foreground';
      default:
        return 'bg-status-not-started-subtle text-status-not-started-foreground';
    }
  };

  const getLearningStatusLabel = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return 'Learned';
      case LearningStatus.inProgress:
        return 'In Progress';
      case LearningStatus.difficult:
        return 'Difficult';
      case LearningStatus.needsReview:
        return 'Needs Review';
      case LearningStatus.notStarted:
        return 'New';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            {word.wordText}
            {word.audioUrl && onPlayAudio && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayAudio}
                disabled={isPlayingAudio}
                className="h-8 w-8 p-0 shrink-0"
                title={`Play pronunciation of ${word.wordText}`}
                aria-label={`Play pronunciation of ${word.wordText}`}
              >
                {isPlayingAudio ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {word.partOfSpeech && (
              <Badge variant="secondary" className="text-xs">
                {word.partOfSpeech}
              </Badge>
            )}
            <Badge
              className={cn(
                'text-xs',
                getLearningStatusColor(word.learningStatus),
              )}
            >
              {getLearningStatusLabel(word.learningStatus)}
            </Badge>
          </div>
        </div>

        {word.phonetic && (
          <p className="text-sm text-muted-foreground font-mono">
            /{word.phonetic}/
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Definition Section */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Definition</h3>
          <p className="text-muted-foreground leading-relaxed">
            {word.definition}
          </p>

          {word.oneWordTranslation && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                Translation:{' '}
                <span className="font-bold">{word.oneWordTranslation}</span>
              </p>
            </div>
          )}
        </div>

        {/* Image Section */}
        {(word.imageId || word.imageUrl) && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Visual</h3>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                🔧 Image Debug: ID={word.imageId}, URL=
                {word.imageUrl?.substring(0, 50)}...
                <br />
                Using:{' '}
                {word.imageId ? `/api/images/${word.imageId}` : 'External URL'}
              </div>
            )}
            <AspectRatio
              ratio={16 / 9}
              className="bg-muted rounded-lg overflow-hidden"
            >
              <AuthenticatedImage
                src={
                  word.imageId ? `/api/images/${word.imageId}` : word.imageUrl!
                }
                alt={
                  word.imageDescription ||
                  `Visual representation of ${word.wordText}`
                }
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onImageError={() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn(
                      `🖼️ Image failed to load for word: ${word.wordText}`,
                      {
                        imageId: word.imageId,
                        imageUrl: word.imageUrl,
                        usingAuthenticatedImage: !!word.imageId,
                        finalSrc: word.imageId
                          ? `/api/images/${word.imageId}`
                          : word.imageUrl,
                      },
                    );
                  }
                }}
              />
            </AspectRatio>
          </div>
        )}

        {/* Audio Unavailable Notice */}
        {!word.audioUrl && (
          <div className="text-sm text-muted-foreground text-center p-2 bg-muted/30 rounded-lg">
            🔇 No audio available for this word
          </div>
        )}

        {/* Navigation */}
        {showNextButton && onNext && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={onNext}
              className="flex items-center gap-2 min-w-[120px]"
              size="lg"
            >
              Next Word
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
