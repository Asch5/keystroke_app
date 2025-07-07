'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Shuffle, Target } from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';
import { PracticeAudioControls } from '../shared/PracticeAudioControls';
import { gameSoundService } from '@/core/domains/dictionary/services/game-sound-service';

interface MakeUpWordGameProps {
  word: {
    wordText: string;
    definition: string;
    oneWordTranslation?: string;
    characterPool?: string[];
    audioUrl?: string;
    phonetic?: string;
    isPhrase?: boolean;
    maxAttempts?: number;
  };
  showResult?: boolean;
  onAnswer: (userInput: string, isCorrect: boolean, attempts: number) => void;
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  autoPlayAudio?: boolean;
  onNext?: () => void;
  className?: string;
}

/**
 * Make Up the Word practice game
 * Assembles words character by character with visual feedback and attempt limits
 */
export function MakeUpWordGame({
  word,
  showResult = false,
  onAnswer,
  onAudioPlay,
  autoPlayAudio = false,
  onNext,
  className,
}: MakeUpWordGameProps) {
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [availableChars, setAvailableChars] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongPositions, setWrongPositions] = useState<number[]>([]);
  const [isGameCompleted, setIsGameCompleted] = useState(false);

  const maxAttempts = word.maxAttempts || (word.isPhrase ? 6 : 3);
  const targetWord = word.wordText.toLowerCase();
  const userInput = selectedChars.join('').toLowerCase();

  // Initialize character pool with repetitive character tracking
  useEffect(() => {
    if (word.characterPool) {
      setAvailableChars([...word.characterPool]);
      setSelectedChars([]);
      setAttempts(0);
      setShowFeedback(false);
      setIsCorrect(false);
      setWrongPositions([]);
      setIsGameCompleted(false);
    }
  }, [word.characterPool, word.wordText]);

  // Initialize game sound service
  useEffect(() => {
    gameSoundService.initialize({
      volume: 0.5,
      enabled: true,
      useStaticFiles: true,
    });
  }, []);

  // Check if character selection is valid (correct position in word)
  const isCharacterSelectionValid = (
    char: string,
    currentPosition: number,
  ): boolean => {
    if (currentPosition >= targetWord.length) return false;
    return targetWord[currentPosition] === char.toLowerCase();
  };

  const handleCharacterSelect = (char: string, index: number) => {
    if (showFeedback || isGameCompleted) return;

    const currentPosition = selectedChars.length;
    const isValidSelection = isCharacterSelectionValid(char, currentPosition);

    if (!isValidSelection) {
      // Wrong character selection - play error sound and reduce attempts
      gameSoundService.playError();

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Check if attempts are exhausted
      if (newAttempts >= maxAttempts) {
        setIsGameCompleted(true);
        setShowFeedback(true);
        setIsCorrect(false);

        // Call onAnswer with final result
        onAnswer(userInput, false, newAttempts);

        // Auto-advance to word card after 2 seconds
        setTimeout(() => {
          onNext?.();
        }, 2000);
      }

      return; // Don't add the wrong character
    }

    // Valid character selection - move character from available to selected
    const newAvailable = [...availableChars];
    newAvailable.splice(index, 1);
    setAvailableChars(newAvailable);
    setSelectedChars([...selectedChars, char]);

    // Check if word is completed
    const newUserInput = [...selectedChars, char].join('').toLowerCase();
    if (newUserInput === targetWord) {
      setIsCorrect(true);
      setShowFeedback(true);
      setIsGameCompleted(true);

      // Play success sound
      gameSoundService.playSuccess();

      // Call onAnswer with success
      onAnswer(newUserInput, true, attempts + 1);

      // Auto-advance to word card after 1.5 seconds
      setTimeout(() => {
        onNext?.();
      }, 1500);
    }
  };

  const handleCharacterRemove = (index: number) => {
    if (showFeedback || isGameCompleted) return;

    // Move character from selected back to available
    const charToRemove = selectedChars[index];
    const newSelected = [...selectedChars];
    newSelected.splice(index, 1);
    setSelectedChars(newSelected);

    // Fix: Only add to availableChars if charToRemove is defined
    if (charToRemove) {
      setAvailableChars([...availableChars, charToRemove]);
    }
  };

  const handleSubmit = () => {
    if (showFeedback || selectedChars.length === 0 || isGameCompleted) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const correct = userInput === targetWord;
    setIsCorrect(correct);
    setShowFeedback(true);
    setIsGameCompleted(true);

    if (correct) {
      gameSoundService.playSuccess();
    } else {
      gameSoundService.playError();

      // Find wrong positions
      const wrong: number[] = [];
      for (let i = 0; i < Math.min(userInput.length, targetWord.length); i++) {
        if (userInput[i] !== targetWord[i]) {
          wrong.push(i);
        }
      }
      setWrongPositions(wrong);
    }

    // Call the answer handler
    onAnswer(userInput, correct, newAttempts);

    // Auto-advance to word card
    setTimeout(
      () => {
        onNext?.();
      },
      correct ? 1500 : 2000,
    );
  };

  const resetCharacterPool = () => {
    if (word.characterPool && !isGameCompleted) {
      setAvailableChars([...word.characterPool]);
      setSelectedChars([]);
    }
  };

  const shuffleAvailableChars = () => {
    if (showFeedback || isGameCompleted) return;
    setAvailableChars([...availableChars].sort(() => Math.random() - 0.5));
  };

  const handleAudioPlay = () => {
    if (onAudioPlay && word.audioUrl) {
      onAudioPlay(word.wordText, word.audioUrl);
    }
  };

  const getCharacterStyle = (index: number) => {
    if (!showFeedback) return '';

    if (isCorrect) {
      return 'bg-green-100 border-green-500 text-green-700';
    }

    if (wrongPositions.includes(index)) {
      return 'bg-red-100 border-red-500 text-red-700 animate-pulse';
    }

    return 'bg-green-100 border-green-500 text-green-700';
  };

  // Enhanced character display with repetitive character handling
  const renderCharacterButton = (
    char: string,
    index: number,
    isAvailable: boolean = true,
  ) => {
    // Count occurrences of this character up to this point
    const charArray = isAvailable ? availableChars : selectedChars;
    const sameCharsBefore = charArray
      .slice(0, index)
      .filter((c) => c === char).length;
    const totalSameChars = (word.characterPool || []).filter(
      (c) => c === char,
    ).length;

    // Show numbered badge for repetitive characters
    const showNumberBadge = totalSameChars > 1;
    const charNumber = sameCharsBefore + 1;

    return (
      <div key={`${char}-${index}`} className="relative">
        <Button
          variant={isAvailable ? 'secondary' : 'outline'}
          size="lg"
          onClick={() =>
            isAvailable
              ? handleCharacterSelect(char, index)
              : handleCharacterRemove(index)
          }
          disabled={showFeedback || isGameCompleted}
          className={cn(
            'h-12 w-12 text-lg font-bold transition-all duration-200',
            isAvailable
              ? 'hover:bg-primary/20 hover:border-primary'
              : cn(
                  getCharacterStyle(index),
                  !showFeedback &&
                    'hover:bg-destructive/10 hover:border-destructive',
                ),
          )}
        >
          {char === ' ' ? '␣' : char}
        </Button>
        {showNumberBadge && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {charNumber}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
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

      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">
            Select characters to spell the word
          </p>
          <p className="text-sm text-muted-foreground">
            {word.isPhrase
              ? 'Include spaces for multi-word phrases. Choose characters in the correct order!'
              : 'Click characters in the correct order to build the word'}
          </p>
          {attempts > 0 && attempts < maxAttempts && (
            <p className="text-sm text-orange-600">
              Wrong selection! {maxAttempts - attempts} attempts remaining
            </p>
          )}
        </div>

        {/* Word Building Area */}
        <div className="space-y-4">
          {/* Selected Characters Display */}
          <div className="p-4 bg-muted/20 rounded-lg border-2 border-dashed min-h-[80px]">
            <div className="flex flex-wrap gap-2 justify-center items-center min-h-[48px]">
              {selectedChars.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Click characters below to start building...
                </p>
              ) : (
                selectedChars.map((char, index) =>
                  renderCharacterButton(char, index, false),
                )
              )}
            </div>
          </div>

          {/* Character Pool */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Available Characters:
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={shuffleAvailableChars}
                disabled={showFeedback || isGameCompleted}
                className="text-xs"
              >
                <Shuffle className="h-3 w-3 mr-1" />
                Shuffle
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center p-4 bg-muted/10 rounded-lg border">
              {availableChars.map((char, index) =>
                renderCharacterButton(char, index, true),
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!showFeedback && !isGameCompleted && selectedChars.length > 0 && (
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={resetCharacterPool}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleSubmit}
              size="lg"
              className="flex items-center gap-2 min-w-[120px]"
            >
              Submit Word
            </Button>
          </div>
        )}

        {/* Feedback */}
        {(showFeedback || isGameCompleted) && (
          <div className="text-center space-y-4">
            <div
              className={cn(
                'flex items-center justify-center gap-2 text-lg font-semibold',
                isCorrect ? 'text-green-600' : 'text-red-600',
              )}
            >
              {isCorrect ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Perfect! You got it right
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  {attempts >= maxAttempts ? 'No more attempts' : 'Incorrect!'}
                </>
              )}
            </div>

            {!isCorrect && (
              <div className="space-y-2">
                {userInput && (
                  <p className="text-sm text-muted-foreground">
                    Your answer: <span className="font-mono">{userInput}</span>
                  </p>
                )}
                {attempts >= maxAttempts && (
                  <p className="text-sm text-muted-foreground">
                    Correct answer:{' '}
                    <span className="font-semibold">{word.wordText}</span>
                  </p>
                )}
              </div>
            )}

            <Badge variant="outline" className="mt-2">
              {isCorrect
                ? 'Excellent work! Advancing to word review...'
                : attempts >= maxAttempts
                  ? 'Advancing to word review...'
                  : 'Try again on next attempt...'}
            </Badge>
          </div>
        )}

        {/* Loading state */}
        {showResult && !showFeedback && !isGameCompleted && (
          <div className="text-center">
            <Badge variant="outline">Processing your answer...</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
