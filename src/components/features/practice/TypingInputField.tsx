'use client';

import { forwardRef } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { cn } from '@/core/shared/utils/common/cn';
import type { SessionState } from './hooks';

interface TypingInputFieldProps {
  sessionState: SessionState;
  showResult: boolean;
  onInputChange: (value: string) => void;
}

/**
 * OTP-style input field component for typing practice
 */
export const TypingInputField = forwardRef<
  HTMLInputElement,
  TypingInputFieldProps
>(({ sessionState, showResult, onInputChange }, ref) => {
  if (!sessionState.currentWord) return null;

  const word = sessionState.currentWord.wordText;
  const wordLength = word.length;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Word length indicator */}
      <div className="text-sm text-muted-foreground">{wordLength} letters</div>

      <div className="flex justify-center">
        <InputOTP
          ref={ref}
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
});

TypingInputField.displayName = 'TypingInputField';
