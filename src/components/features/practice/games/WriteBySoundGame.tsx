'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  Target,
  Headphones,
  Pause,
} from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';
import { PracticeAudioControls } from '../shared/PracticeAudioControls';

interface WriteBySoundGameProps {
  word: {
    wordText: string;
    definition?: string;
    oneWordTranslation?: string;
    audioUrl: string; // Required for this game type
    phonetic?: string;
  };
  onAnswer: (userInput: string, isCorrect: boolean, attempts: number) => void;
  onNext?: () => void; // New: For Next button instead of auto-advance
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  autoPlayAudio?: boolean;
  maxReplays?: number;
  className?: string;
}

/**
 * Write the Word by Sound practice game
 * Audio-only word typing with replay limits
 */
export function WriteBySoundGame({
  word,
  onAnswer,
  onNext,
  onAudioPlay,
  autoPlayAudio = true,
  maxReplays = 3,
  className,
}: WriteBySoundGameProps) {
  const [userInput, setUserInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedInitial, setHasPlayedInitial] = useState(false);
  const [characterStates, setCharacterStates] = useState<
    ('correct' | 'incorrect' | 'neutral')[]
  >([]);
  const [showHint, setShowHint] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const targetWord = word.wordText.toLowerCase().trim();

  // Character validation states
  useEffect(() => {
    const states: ('correct' | 'incorrect' | 'neutral')[] = [];
    const input = userInput.toLowerCase();

    for (let i = 0; i < Math.max(input.length, targetWord.length); i++) {
      if (i >= input.length) {
        states.push('neutral');
      } else if (i >= targetWord.length) {
        states.push('incorrect');
      } else if (input[i] === targetWord[i]) {
        states.push('correct');
      } else {
        states.push('incorrect');
      }
    }

    setCharacterStates(states);
  }, [userInput, targetWord]);

  // Auto-play initial audio
  useEffect(() => {
    if (autoPlayAudio && !hasPlayedInitial && word.audioUrl) {
      handleAudioPlay(true);
      setHasPlayedInitial(true);
    }
  }, [autoPlayAudio, hasPlayedInitial, word.audioUrl]);

  // Focus input after initial audio
  useEffect(() => {
    if (hasPlayedInitial && inputRef.current && !hasSubmitted) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasPlayedInitial, hasSubmitted]);

  const handleAudioPlay = (isInitial = false) => {
    if (!word.audioUrl || isPlaying) return;

    if (!isInitial) {
      if (replayCount >= maxReplays) return;
      setReplayCount((prev) => prev + 1);
    }

    setIsPlaying(true);

    // Create new audio instance for each play
    const audio = new Audio(word.audioUrl);

    audio.onloadstart = () => setIsPlaying(true);
    audio.oncanplaythrough = () => {
      audio.play().catch(console.error);
    };
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      console.error('Audio failed to load');
      setIsPlaying(false);
    };

    // Cleanup
    audioRef.current = audio;

    if (onAudioPlay) {
      onAudioPlay(word.wordText, word.audioUrl);
    }
  };

  const handleSubmit = () => {
    if (hasSubmitted || userInput.trim() === '') return;

    setHasSubmitted(true);
    const trimmedInput = userInput.trim().toLowerCase();
    const correct = trimmedInput === targetWord;

    setIsCorrect(correct);
    setShowFeedback(true);

    // Call the answer handler
    onAnswer(userInput.trim(), correct, 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !hasSubmitted) {
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasSubmitted) {
      setUserInput(e.target.value);
    }
  };

  const toggleHint = () => {
    if (!hasSubmitted) {
      setShowHint(!showHint);
    }
  };

  const getInputClassName = () => {
    if (!hasSubmitted) return '';

    if (isCorrect) {
      return 'border-green-500 bg-green-50 text-green-700';
    } else {
      return 'border-red-500 bg-red-50 text-red-700';
    }
  };

  const getCharacterStyle = (index: number) => {
    if (!hasSubmitted || index >= characterStates.length) return '';

    const state = characterStates[index];
    switch (state) {
      case 'correct':
        return 'bg-green-100 text-green-700';
      case 'incorrect':
        return 'bg-red-100 text-red-700';
      default:
        return '';
    }
  };

  const replaysRemaining = Math.max(0, maxReplays - replayCount);
  const replayProgress = (replayCount / maxReplays) * 100;

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <CardTitle className="text-xl">Write the Word by Sound</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Difficulty 4+
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Headphones className="h-3 w-3" />
              Audio Only
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Headphones className="h-4 w-4" />
              <span className="font-medium">
                Listen carefully and type what you hear
              </span>
            </div>
            <p className="text-sm text-blue-600">
              You can replay the audio up to {maxReplays} times. Use your
              keyboard or the replay button below.
            </p>
          </div>

          {/* Audio Controls */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <Button
                onClick={() => handleAudioPlay()}
                disabled={isPlaying || replaysRemaining === 0}
                variant={replaysRemaining > 0 ? 'default' : 'secondary'}
                size="lg"
                className="flex items-center gap-2 px-6 py-3"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Playing...
                  </>
                ) : replaysRemaining > 0 ? (
                  <>
                    <RotateCcw className="h-5 w-5" />
                    Replay Audio ({replaysRemaining} left)
                  </>
                ) : (
                  <>
                    <VolumeX className="h-5 w-5" />
                    No Replays Left
                  </>
                )}
              </Button>
            </div>

            {/* Replay Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Audio Replays Used</span>
                <span>
                  {replayCount}/{maxReplays}
                </span>
              </div>
              <Progress value={replayProgress} className="h-2" />
            </div>
          </div>

          {/* Hint Toggle */}
          {!hasSubmitted && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleHint}
                className="flex items-center gap-1"
              >
                <Volume2 className="h-3 w-3" />
                {showHint ? 'Hide' : 'Show'} Length Hint
              </Button>
            </div>
          )}

          {/* Hint Display */}
          {showHint && !hasSubmitted && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <div className="text-yellow-700 text-center">
                The word has{' '}
                <span className="font-bold">{targetWord.length}</span> letters
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="relative">
            <Input
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type what you hear..."
              className={cn(
                'text-lg py-3 px-4 text-center font-mono tracking-wider',
                getInputClassName(),
              )}
              disabled={hasSubmitted}
              autoComplete="off"
              spellCheck={false}
            />

            {/* Character-by-character feedback overlay */}
            {hasSubmitted && userInput && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-mono tracking-wider text-lg">
                {userInput.split('').map((char, index) => (
                  <span
                    key={index}
                    className={cn('px-0.5 rounded', getCharacterStyle(index))}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={hasSubmitted || userInput.trim() === ''}
              className="px-8 py-2"
            >
              {hasSubmitted ? (
                isCorrect ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Correct!
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Try Again Next Time
                  </>
                )
              ) : (
                'Submit Answer'
              )}
            </Button>
          </div>
        </div>

        {/* Feedback Section */}
        {showFeedback && (
          <div
            className={cn(
              'p-4 rounded-lg text-center',
              isCorrect
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center gap-2 text-lg font-medium mb-2',
                isCorrect ? 'text-green-700' : 'text-red-700',
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
                <Button
                  onClick={onNext}
                  className="px-8 py-2"
                  variant="default"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Keyboard Shortcut Hint */}
        {!hasSubmitted && (
          <div className="text-center text-sm text-muted-foreground">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> to
            submit •
            <kbd className="px-2 py-1 bg-muted rounded text-xs ml-1">R</kbd> to
            replay audio
          </div>
        )}
      </CardContent>
    </Card>
  );
}
