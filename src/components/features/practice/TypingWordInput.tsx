'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Volume2, SkipForward, Trophy, VolumeX } from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';
import type { SessionState, WordResult } from './hooks/useTypingPracticeState';

interface TypingWordInputProps {
  sessionState: SessionState;
  showResult: boolean;
  wordResults: WordResult[];
  isPlayingAudio: boolean;
  onInputChange: (value: string) => void;
  onWordSubmit: () => void;
  onSkipWord: () => Promise<WordResult | undefined>;
  onNextWord: () => void;
  onPlayAudio: (
    word: string,
    audioUrl: string | undefined,
    isCorrect: boolean,
  ) => void;
}

/**
 * Word input component for typing practice
 * Handles the typing interface, visual feedback, and word comparison
 */
export function TypingWordInput({
  sessionState,
  showResult,
  wordResults,
  isPlayingAudio,
  onInputChange,
  onWordSubmit,
  onSkipWord,
  onNextWord,
  onPlayAudio,
}: TypingWordInputProps) {
  if (!sessionState.currentWord) return null;

  const word = sessionState.currentWord.wordText;
  const wordLength = word.length;

  /**
   * Render the OTP-style input slots for typing
   */
  const renderWordInput = () => (
    <div className="flex flex-col items-center space-y-4">
      {/* Word length indicator */}
      <div className="text-sm text-muted-foreground">{wordLength} letters</div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={wordLength}
          value={sessionState.userInput}
          onChange={onInputChange}
          disabled={!sessionState.isActive || showResult}
        >
          <InputOTPGroup className="gap-2">
            {Array.from({ length: wordLength }, (_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className={cn(
                  'w-12 h-12 text-lg font-semibold border-2 transition-all duration-200',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  showResult
                    ? sessionState.userInput[index] === word[index]
                      ? 'bg-green-500/20 border-green-500 text-green-600 dark:text-green-400'
                      : sessionState.userInput[index]
                        ? 'bg-red-500/20 border-red-500 text-red-600 dark:text-red-400'
                        : 'bg-muted border-muted-foreground/30'
                    : index === sessionState.userInput.length
                      ? 'border-primary ring-2 ring-primary/20' // Active slot
                      : index < sessionState.userInput.length
                        ? 'border-primary/60 bg-primary/10' // Filled slots
                        : 'border-muted-foreground/30', // Empty slots
                )}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  );

  /**
   * Render result feedback and word comparison
   */
  const renderResultFeedback = () => {
    if (!showResult || wordResults.length === 0) return null;

    const lastResult = wordResults[wordResults.length - 1];
    const isCorrect = lastResult?.isCorrect;

    return (
      <div className="text-center space-y-4">
        {/* Result badge */}
        <Badge
          variant={isCorrect ? 'default' : 'destructive'}
          className="text-sm"
        >
          {lastResult?.feedback}
          {isPlayingAudio && ' 🔊'}
        </Badge>

        {/* Word comparison for incorrect attempts */}
        {!isCorrect && lastResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">You typed:</p>
                <div className="font-mono text-lg">
                  {lastResult.userInput.split('').map((char, index) => (
                    <span
                      key={index}
                      className={cn(
                        'px-1 py-0.5 rounded',
                        lastResult.mistakes.some((m) => m.position === index)
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                          : 'bg-green-500/20 text-green-600 dark:text-green-400',
                      )}
                    >
                      {char || '_'}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Correct word:</p>
                <div className="font-mono text-lg">
                  {lastResult.correctWord.split('').map((char, index) => (
                    <span
                      key={index}
                      className={cn(
                        'px-1 py-0.5 rounded',
                        lastResult.mistakes.some((m) => m.position === index)
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mistake summary */}
            {lastResult.mistakes.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <p>
                  {lastResult.mistakes.length} mistake
                  {lastResult.mistakes.length !== 1 ? 's' : ''} found
                </p>
              </div>
            )}
          </div>
        )}

        {/* Success message for correct attempts */}
        {isCorrect && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Perfect! The word was: <span className="font-mono">{word}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8 space-y-8">
        {/* Word Definition */}
        <div className="text-center space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Type the word:
          </h2>
          <p className="text-2xl font-semibold text-foreground">
            {sessionState.currentWord.definition}
          </p>
          <div className="flex items-center justify-center gap-4">
            {sessionState.currentWord.phonetic && (
              <p className="text-sm text-muted-foreground font-mono">
                /{sessionState.currentWord.phonetic}/
              </p>
            )}
            {sessionState.currentWord.partOfSpeech && (
              <Badge variant="outline" className="text-xs">
                {sessionState.currentWord.partOfSpeech}
              </Badge>
            )}
          </div>
        </div>

        {/* Typing Input */}
        {renderWordInput()}

        {/* Result Feedback */}
        {renderResultFeedback()}

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          {!showResult && (
            <>
              <Button
                variant="outline"
                onClick={onSkipWord}
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>

              {sessionState.userInput && (
                <Button
                  onClick={onWordSubmit}
                  className="flex items-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Submit
                </Button>
              )}
            </>
          )}

          {showResult && (
            <Button
              onClick={onNextWord}
              className="flex items-center gap-2 bg-primary"
            >
              <SkipForward className="h-4 w-4" />
              Next Word
            </Button>
          )}

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
              !sessionState.currentWord.audioUrl &&
                'opacity-50 cursor-not-allowed',
            )}
          >
            {sessionState.currentWord.audioUrl ? (
              <Volume2
                className={cn(
                  'h-4 w-4 text-blue-600',
                  isPlayingAudio && 'animate-pulse',
                )}
              />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
