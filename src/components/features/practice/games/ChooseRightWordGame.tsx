'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';
import { PracticeAudioControls } from '../shared/PracticeAudioControls';

interface ChooseRightWordGameProps {
  word: {
    wordText: string;
    definition: string;
    oneWordTranslation?: string;
    distractorOptions?: string[];
    correctAnswerIndex?: number;
    audioUrl?: string;
    phonetic?: string;
  };
  showResult?: boolean;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  autoPlayAudio?: boolean;
  className?: string;
}

/**
 * Choose the Right Word practice game
 * Shows definition and 4 multiple choice options with immediate feedback
 */
export function ChooseRightWordGame({
  word,
  showResult = false,
  onAnswer,
  onAudioPlay,
  autoPlayAudio = false,
  className,
}: ChooseRightWordGameProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const options = word.distractorOptions || [];
  const correctIndex = word.correctAnswerIndex ?? 0;

  // Reset state when word changes
  useEffect(() => {
    setSelectedIndex(null);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [word.wordText]);

  const handleOptionSelect = (index: number) => {
    if (showFeedback || selectedIndex !== null) return;

    const correct = index === correctIndex;

    setSelectedIndex(index);
    setIsCorrect(correct);
    setShowFeedback(true);

    // Call the answer handler
    onAnswer(index, correct);
  };

  const handleAudioPlay = () => {
    if (onAudioPlay && word.audioUrl) {
      onAudioPlay(word.wordText, word.audioUrl);
    }
  };

  const getOptionVariant = (index: number) => {
    if (!showFeedback) {
      return 'outline';
    }

    if (index === correctIndex) {
      return 'default'; // Correct answer highlighted in primary color
    }

    if (index === selectedIndex && index !== correctIndex) {
      return 'destructive'; // Wrong selection highlighted in red
    }

    return 'secondary'; // Other options dimmed
  };

  const getOptionIcon = (index: number) => {
    if (!showFeedback) return null;

    if (index === correctIndex) {
      return <CheckCircle className="h-4 w-4 text-success-foreground" />;
    }

    if (index === selectedIndex && index !== correctIndex) {
      return <XCircle className="h-4 w-4 text-error-foreground" />;
    }

    return null;
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">Choose the Right Word</CardTitle>
        <div className="space-y-3">
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
                onPlay={handleAudioPlay}
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

      <CardContent className="space-y-4">
        {/* Instruction */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Select the correct word that matches the definition:
          </p>
        </div>

        {/* Multiple Choice Options */}
        <div className="grid grid-cols-1 gap-3">
          {options.map((option, index) => (
            <Button
              key={index}
              variant={getOptionVariant(index)}
              size="lg"
              onClick={() => handleOptionSelect(index)}
              disabled={showFeedback}
              className={cn(
                'justify-between h-auto p-4 text-left transition-all duration-200',
                showFeedback &&
                  index === correctIndex &&
                  'ring-2 ring-success-border',
                showFeedback &&
                  index === selectedIndex &&
                  index !== correctIndex &&
                  'ring-2 ring-error-border',
              )}
            >
              <span className="text-lg font-medium">{option}</span>
              {getOptionIcon(index)}
            </Button>
          ))}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className="text-center space-y-2 pt-4">
            <div
              className={cn(
                'flex items-center justify-center gap-2 text-lg font-semibold',
                isCorrect ? 'text-success-foreground' : 'text-error-foreground',
              )}
            >
              {isCorrect ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Correct!
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  Not quite right
                </>
              )}
            </div>

            {!isCorrect && (
              <p className="text-sm text-muted-foreground">
                The correct answer is:{' '}
                <span className="font-semibold">{options[correctIndex]}</span>
              </p>
            )}

            <Badge variant="outline" className="mt-2">
              Auto-advancing to word review...
            </Badge>
          </div>
        )}

        {/* Loading state for when result is being processed */}
        {showResult && !showFeedback && (
          <div className="text-center">
            <Badge variant="outline">Processing your answer...</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
