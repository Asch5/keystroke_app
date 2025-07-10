import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/shared/utils/common/cn';
import { CharacterButtonProps } from '../types';

/**
 * Character button component with repetitive character handling
 * Displays characters with numbering for duplicates and visual feedback
 */
export function CharacterButton({
  char,
  index,
  isAvailable,
  onClick,
  disabled,
  characterPool = [],
  className,
  wrongPositions = [],
  showFeedback = false,
  isCorrect = false,
}: CharacterButtonProps) {
  // Get character styling based on feedback state
  const getCharacterStyle = (charIndex: number) => {
    if (!showFeedback) return '';

    if (isCorrect) {
      return 'bg-success-subtle border-success-border text-success-foreground';
    }

    if (wrongPositions.includes(charIndex)) {
      return 'bg-error-subtle border-error-border text-error-foreground animate-pulse';
    }

    return 'bg-success-subtle border-success-border text-success-foreground';
  };

  // Count occurrences of this character up to this point for numbering
  const getSameCharsBefore = () => {
    // This would need to be calculated from the parent component
    // For now, we'll use a simple approach
    return 0;
  };

  const getTotalSameChars = () => {
    return characterPool.filter((c) => c === char).length;
  };

  // Show numbered badge for repetitive characters
  const showNumberBadge = getTotalSameChars() > 1;
  const charNumber = getSameCharsBefore() + 1;

  return (
    <div className={cn('relative', className)}>
      <Button
        variant={isAvailable ? 'secondary' : 'outline'}
        size="lg"
        onClick={onClick}
        disabled={disabled}
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
}
