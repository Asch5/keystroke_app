'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';
import { PracticeAudioControls } from '../shared/PracticeAudioControls';

interface RememberTranslationGameProps {
  word: {
    wordText: string;
    definition: string;
    oneWordTranslation?: string;
    audioUrl?: string;
    phonetic?: string;
  };
  showResult?: boolean;
  onAnswer: (remembered: boolean) => void;
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  autoPlayAudio?: boolean;
  className?: string;
}

/**
 * Do You Remember the Translation practice game
 * Shows target word and asks if user remembers the translation (self-assessment)
 */
export function RememberTranslationGame({
  word,
  showResult = false,
  onAnswer,
  onAudioPlay,
  autoPlayAudio = false,
  className,
}: RememberTranslationGameProps) {
  const [hasAnswered, setHasAnswered] = useState(false);
  const [userRemembered, setUserRemembered] = useState<boolean | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  // Reset state when word changes
  useEffect(() => {
    setHasAnswered(false);
    setUserRemembered(null);
    setShowTranslation(false);
  }, [word.wordText]);

  const handleAnswer = (remembered: boolean) => {
    if (hasAnswered) return;

    setUserRemembered(remembered);
    setHasAnswered(true);
    setShowTranslation(true);

    // Call the answer handler
    onAnswer(remembered);
  };

  const handleAudioPlay = () => {
    if (onAudioPlay && word.audioUrl) {
      onAudioPlay(word.wordText, word.audioUrl);
    }
  };

  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">
          Do You Remember the Translation?
        </CardTitle>
        <div className="space-y-4">
          {/* Target Word Display */}
          <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <h2 className="text-4xl font-bold text-center mb-2">
              {word.wordText}
            </h2>

            {/* Phonetic */}
            {word.phonetic && (
              <p className="text-lg text-muted-foreground font-mono text-center">
                /{word.phonetic}/
              </p>
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
                onPlay={handleAudioPlay}
                className="max-w-sm"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Instructions */}
        {!hasAnswered && (
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              Do you remember what this word means?
            </p>
            <p className="text-sm text-muted-foreground">
              Think about the translation, then select your answer
            </p>
          </div>
        )}

        {/* Self-Assessment Buttons */}
        {!hasAnswered && (
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleAnswer(false)}
              className="flex-1 max-w-[200px] h-16 text-lg"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Don&apos;t Remember
            </Button>
            <Button
              size="lg"
              onClick={() => handleAnswer(true)}
              className="flex-1 max-w-[200px] h-16 text-lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />I Remember
            </Button>
          </div>
        )}

        {/* Translation Reveal */}
        {hasAnswered && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">
                Here&apos;s the answer:
              </h3>

              <div className="p-4 bg-muted/50 rounded-lg border">
                {/* Definition */}
                <div className="space-y-2">
                  <p className="text-lg leading-relaxed">{word.definition}</p>

                  {/* One-word translation highlight */}
                  {word.oneWordTranslation && (
                    <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium text-muted-foreground">
                        Quick Translation:
                      </p>
                      <p className="text-xl font-bold text-primary">
                        {word.oneWordTranslation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Self-Assessment Feedback */}
            <div className="text-center space-y-3">
              <div
                className={cn(
                  'flex items-center justify-center gap-2 text-lg font-semibold',
                  userRemembered ? 'text-green-600' : 'text-blue-600',
                )}
              >
                {userRemembered ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Great! You remembered it
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    No worries, now you&apos;ll remember
                  </>
                )}
              </div>

              <Badge variant="outline" className="mt-2">
                Auto-advancing to word review...
              </Badge>
            </div>
          </div>
        )}

        {/* Optional translation peek for non-answered state */}
        {!hasAnswered && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTranslation}
              className="text-muted-foreground hover:text-foreground"
            >
              {showTranslation ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide hint
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Peek at translation
                </>
              )}
            </Button>

            {showTranslation && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  {word.oneWordTranslation || word.definition}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading state for when result is being processed */}
        {showResult && !hasAnswered && (
          <div className="text-center">
            <Badge variant="outline">Processing your answer...</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
