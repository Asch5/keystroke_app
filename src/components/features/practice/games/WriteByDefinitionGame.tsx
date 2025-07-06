'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CheckCircle,
  XCircle,
  Keyboard,
  Eye,
  EyeOff,
  Target,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/core/shared/utils/common/cn';
import { PracticeAudioControls } from '../shared/PracticeAudioControls';

interface WriteByDefinitionGameProps {
  word: {
    wordText: string;
    definition: string;
    oneWordTranslation?: string;
    audioUrl?: string;
    phonetic?: string;
  };
  showResult?: boolean;
  onAnswer: (userInput: string, isCorrect: boolean, attempts: number) => void;
  onNext?: () => void; // New: For Next button instead of auto-advance
  onAudioPlay?: (word: string, audioUrl?: string) => void;
  autoPlayAudio?: boolean;
  showVirtualKeyboard?: boolean;
  className?: string;
}

/**
 * Write the Word by Definition practice game
 * Full word typing from definition with real-time character validation
 */
export function WriteByDefinitionGame({
  word,
  onAnswer,
  onNext,
  onAudioPlay,
  autoPlayAudio = false,
  showVirtualKeyboard = false,
  className,
}: WriteByDefinitionGameProps) {
  const [userInput, setUserInput] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(showVirtualKeyboard);
  const [showHint, setShowHint] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [characterStates, setCharacterStates] = useState<
    ('correct' | 'incorrect' | 'neutral')[]
  >([]);

  const inputRef = useRef<HTMLInputElement>(null);
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

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !hasSubmitted) {
      inputRef.current.focus();
    }
  }, [hasSubmitted]);

  const handleSubmit = () => {
    if (hasSubmitted || userInput.trim() === '') return;

    setHasSubmitted(true);
    const trimmedInput = userInput.trim().toLowerCase();
    const correct = trimmedInput === targetWord;

    setIsCorrect(correct);
    setShowFeedback(true);

    // Call the answer handler
    onAnswer(userInput.trim(), correct, 1);

    // Auto-advance after showing feedback
    setTimeout(
      () => {
        // Game completed - orchestrator will handle transition
      },
      correct ? 1500 : 2500,
    );
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
    setShowHint(!showHint);
  };

  const toggleKeyboard = () => {
    setShowKeyboard(!showKeyboard);
  };

  const handleAudioPlay = () => {
    if (onAudioPlay && word.audioUrl) {
      onAudioPlay(word.wordText, word.audioUrl);
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

  // Virtual keyboard layout (simplified)
  const keyboardRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

  const handleVirtualKeyPress = (key: string) => {
    if (hasSubmitted) return;

    if (key === 'Backspace') {
      setUserInput((prev) => prev.slice(0, -1));
    } else if (key === 'Space') {
      setUserInput((prev) => prev + ' ');
    } else {
      setUserInput((prev) => prev + key);
    }
  };

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <CardTitle className="text-xl">Write the Word</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Difficulty 4
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Definition
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {/* Definition Section */}
          <div className="p-6 bg-muted/30 rounded-lg">
            <div className="text-lg leading-relaxed font-medium mb-3">
              {word.definition}
            </div>
            {word.oneWordTranslation && (
              <div className="text-sm text-muted-foreground">
                Translation:{' '}
                <span className="font-medium">{word.oneWordTranslation}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleHint}
              className="flex items-center gap-1"
            >
              {showHint ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
              {showHint ? 'Hide' : 'Show'} Hint
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleKeyboard}
              className="flex items-center gap-1"
            >
              <Keyboard className="h-3 w-3" />
              {showKeyboard ? 'Hide' : 'Show'} Keyboard
            </Button>
          </div>

          {/* Hint Display */}
          {showHint && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <Eye className="h-3 w-3" />
                <span className="font-medium">Hint:</span>
              </div>
              <div className="mt-1 text-blue-600">
                The word has {targetWord.length} letters
                {word.phonetic && (
                  <span className="ml-2">({word.phonetic})</span>
                )}
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
              placeholder="Type the word here..."
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
                  Excellent!
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  The correct answer is:{' '}
                  <span className="font-mono">{word.wordText}</span>
                </>
              )}
            </div>

            {/* Audio Controls for Feedback */}
            {word.audioUrl && (
              <div className="flex justify-center mt-3">
                <PracticeAudioControls
                  audioUrl={word.audioUrl}
                  audioType="word"
                  showVolumeControl={false}
                  showReplayCounter={false}
                  autoPlay={isCorrect && autoPlayAudio}
                  onPlay={handleAudioPlay}
                  className="max-w-sm"
                />
              </div>
            )}

            {/* Next Button - CORRECTION: Exercise 4 has Next button instead of auto-advance */}
            {onNext && (
              <div className="flex justify-center mt-4">
                <Button
                  onClick={onNext}
                  className="px-8 py-3 text-lg"
                  size="lg"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Virtual Keyboard */}
        {showKeyboard && !hasSubmitted && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              {keyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1">
                  {row.split('').map((key) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className="min-w-8 h-8 p-0 font-mono"
                      onClick={() => handleVirtualKeyPress(key)}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
              ))}
              <div className="flex justify-center gap-1 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 h-8"
                  onClick={() => handleVirtualKeyPress('Space')}
                >
                  Space
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 h-8"
                  onClick={() => handleVirtualKeyPress('Backspace')}
                >
                  ⌫
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
