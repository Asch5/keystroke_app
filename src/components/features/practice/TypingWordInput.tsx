'use client';

import { useEffect, useRef } from 'react';
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
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { AuthenticatedImage } from '@/components/shared/AuthenticatedImage';
import { gameSoundService } from '@/core/domains/dictionary/services/game-sound-service';

import type { SessionState, WordResult, TypingPracticeSettings } from './hooks';

interface TypingWordInputProps {
  sessionState: SessionState;
  showResult: boolean;
  wordResults: WordResult[];
  isPlayingAudio: boolean;
  settings: TypingPracticeSettings;
  onInputChange: (value: string) => void;
  onWordSubmit: () => void;
  onSkipWord: () => Promise<WordResult | undefined>;
  onNextWord: () => void;
  onPlayAudio: (
    word: string,
    audioUrl: string | undefined,
    isCorrect: boolean,
  ) => void;
  onFinishPractice: () => void;
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
  settings,
  onInputChange,
  onWordSubmit,
  onSkipWord,
  onNextWord,
  onPlayAudio,
  onFinishPractice,
}: TypingWordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPlayedAutoAudioRef = useRef(false);

  // Initialize game sound service
  useEffect(() => {
    if (settings.enableGameSounds) {
      gameSoundService.initialize({
        volume: settings.gameSoundVolume,
        enabled: settings.enableGameSounds,
        useStaticFiles: true,
      });
    }
  }, [settings.enableGameSounds, settings.gameSoundVolume]);

  // Auto-focus on the input when component mounts or when a new word appears
  useEffect(() => {
    if (
      sessionState.isActive &&
      !showResult &&
      inputRef.current &&
      sessionState.currentWord
    ) {
      inputRef.current.focus();
    }
  }, [sessionState.currentWord, sessionState.isActive, showResult]);

  // Auto-play audio when new word appears (if setting is enabled)
  useEffect(() => {
    const currentWord = sessionState.currentWord;
    const shouldPlayAutoAudio =
      settings.playAudioOnStart &&
      currentWord &&
      sessionState.isActive &&
      !showResult &&
      !hasPlayedAutoAudioRef.current;

    if (shouldPlayAutoAudio && currentWord) {
      console.log('🎵 Auto-playing audio for new word:', currentWord.wordText);
      hasPlayedAutoAudioRef.current = true;

      // Play audio automatically when word appears
      onPlayAudio(
        currentWord.wordText,
        currentWord.audioUrl,
        true, // neutral - not success or error
      );
    }

    // Reset the flag when word changes
    if (currentWord) {
      hasPlayedAutoAudioRef.current = false;
    }
  }, [
    sessionState.currentWord,
    settings.playAudioOnStart,
    sessionState.isActive,
    showResult,
    onPlayAudio,
  ]);

  // Handle typing feedback with game sounds
  const handleInputChangeWithSound = (value: string) => {
    const previousLength = sessionState.userInput.length;
    const newLength = value.length;

    // Character was added
    if (newLength > previousLength && sessionState.currentWord) {
      const newChar = value[newLength - 1];
      const expectedChar = sessionState.currentWord.wordText[newLength - 1];

      // Play keystroke sound if enabled
      if (settings.enableKeystrokeSounds) {
        gameSoundService.playKeystroke();
      }

      // Play feedback sound based on correctness
      if (settings.enableGameSounds) {
        if (newChar !== expectedChar) {
          // Wrong character typed
          gameSoundService.playError();
        }
        // Note: Success sound is played on word completion, not per character
      }
    }

    // Call the original input handler
    onInputChange(value);
  };

  // Handle Enter key for submission, skip, and next word
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && sessionState.isActive) {
        // Prevent default behavior and stop propagation
        event.preventDefault();
        event.stopPropagation();

        console.log('🎯 Enter key pressed:', {
          showResult,
          userInput: sessionState.userInput,
          userInputLength: sessionState.userInput?.length || 0,
        });

        if (showResult) {
          // When showing results, Enter triggers "Next Word"
          console.log('📝 Triggering Next Word');
          onNextWord();
        } else {
          // When typing, Enter behavior depends on input
          if (sessionState.userInput && sessionState.userInput.length > 0) {
            // If user has typed something, submit the word
            console.log('✅ Triggering Submit');
            onWordSubmit();

            // Play success sound if word is correct
            if (settings.enableGameSounds && sessionState.currentWord) {
              const isCorrect =
                sessionState.userInput === sessionState.currentWord.wordText;
              if (isCorrect) {
                gameSoundService.playSuccess();
              }
            }
          } else {
            // If user hasn't typed anything, skip the word
            console.log('⏭️ Triggering Skip');
            onSkipWord()
              .then(() => {
                console.log('✨ Skip completed');
              })
              .catch((error) => {
                console.error('❌ Skip error:', error);
              });
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    sessionState.isActive,
    sessionState.userInput,
    sessionState.currentWord,
    showResult,
    settings.enableGameSounds,
    onWordSubmit,
    onNextWord,
    onSkipWord,
  ]);

  // Play success sound when word is completed correctly
  useEffect(() => {
    if (showResult && wordResults.length > 0 && settings.enableGameSounds) {
      const lastResult = wordResults[wordResults.length - 1];
      if (lastResult?.isCorrect) {
        gameSoundService.playSuccess();
      }
    }
  }, [showResult, wordResults, settings.enableGameSounds]);

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
          ref={inputRef}
          maxLength={wordLength}
          value={sessionState.userInput}
          onChange={handleInputChangeWithSound}
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
                          : 'text-muted-foreground',
                      )}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Correct word:</p>
                <div className="font-mono text-lg text-green-600 dark:text-green-400">
                  {lastResult.correctWord}
                </div>
              </div>
            </div>

            {/* Accuracy information */}
            <div className="text-sm text-muted-foreground">
              <p>Accuracy: {lastResult.accuracy}%</p>
              {lastResult.mistakes.length > 0 && (
                <p>Mistakes: {lastResult.mistakes.length}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render control buttons
   */
  const renderControls = () => (
    <div className="flex justify-center gap-3">
      {!showResult ? (
        <>
          <Button
            onClick={onWordSubmit}
            disabled={
              !sessionState.userInput || sessionState.userInput.length === 0
            }
            className="flex items-center gap-2"
          >
            <Trophy className="h-4 w-4" />
            Submit
          </Button>
          <Button
            variant="outline"
            onClick={() => onSkipWord()}
            className="flex items-center gap-2"
          >
            <SkipForward className="h-4 w-4" />
            Skip
          </Button>
          <Button
            variant="destructive"
            onClick={onFinishPractice}
            className="flex items-center gap-2"
          >
            🏁 Finish Practice
          </Button>
        </>
      ) : (
        <Button onClick={onNextWord} className="flex items-center gap-2">
          <SkipForward className="h-4 w-4" />
          Next Word
        </Button>
      )}
    </div>
  );

  return (
    <Card>
      <CardContent className="p-8 space-y-6">
        {/* Word display */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">
            Type this word:
          </h2>
          {!showResult ? (
            /* Show one-word translation or "-" during typing */
            <div className="text-4xl font-bold mb-4">
              {sessionState.currentWord.oneWordTranslation || '-'}
            </div>
          ) : (
            /* Show target word with phonetic after completion */
            <div className="space-y-2 mb-4">
              <div className="text-4xl font-bold">{word}</div>
              {sessionState.currentWord.phonetic && (
                <div className="text-lg text-muted-foreground font-mono">
                  /{sessionState.currentWord.phonetic}/
                </div>
              )}
            </div>
          )}
        </div>

        {/* Definition */}
        {sessionState.currentWord.definition && (
          <div className="text-center">
            <p className="text-muted-foreground max-w-lg mx-auto">
              {sessionState.currentWord.definition}
            </p>
          </div>
        )}

        {/* Image */}
        {settings.showDefinitionImages && sessionState.currentWord.imageUrl && (
          <div className="flex justify-center">
            <div className="w-48 h-32">
              <AspectRatio ratio={3 / 2}>
                <AuthenticatedImage
                  src={sessionState.currentWord.imageUrl}
                  alt={`Visual representation of ${word}`}
                  fill
                  className="rounded-md object-cover"
                  onImageError={(error) => {
                    console.error('🖼️ Image loading error:', {
                      word: sessionState.currentWord?.wordText,
                      imageUrl: sessionState.currentWord?.imageUrl,
                      imageId: sessionState.currentWord?.imageId,
                      error,
                    });
                  }}
                />
              </AspectRatio>
            </div>
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && sessionState.currentWord && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>🔧 Debug Info:</div>
            <div>
              Show Images: {settings.showDefinitionImages ? '✅' : '❌'}
            </div>
            <div>Image ID: {sessionState.currentWord.imageId || 'None'}</div>
            <div>Image URL: {sessionState.currentWord.imageUrl || 'None'}</div>
          </div>
        )}

        {/* Input area */}
        {renderWordInput()}

        {/* Result feedback */}
        {renderResultFeedback()}

        {/* Controls */}
        {renderControls()}

        {/* Audio button */}
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
