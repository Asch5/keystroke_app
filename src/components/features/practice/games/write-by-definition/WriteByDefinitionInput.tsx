'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/core/shared/utils/common/cn';

interface WriteByDefinitionInputProps {
  userInput: string;
  hasSubmitted: boolean;
  isCorrect: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
  getInputClassName: () => string;
  getCharacterStyle: (index: number) => string;
}

/**
 * Input section component for Write by Definition game
 * Handles user input with character-by-character feedback
 */
export const WriteByDefinitionInput = forwardRef<
  HTMLInputElement,
  WriteByDefinitionInputProps
>(
  (
    {
      userInput,
      hasSubmitted,
      isCorrect,
      onInputChange,
      onKeyPress,
      onSubmit,
      getInputClassName,
      getCharacterStyle,
    },
    ref,
  ) => {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Input
            ref={ref}
            value={userInput}
            onChange={onInputChange}
            onKeyPress={onKeyPress}
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
            onClick={onSubmit}
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
    );
  },
);

WriteByDefinitionInput.displayName = 'WriteByDefinitionInput';
