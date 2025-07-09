'use client';

import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Target, BookOpen, Keyboard } from 'lucide-react';

interface WriteByDefinitionHeaderProps {
  word: {
    wordText: string;
    definition: string;
    oneWordTranslation?: string;
    phonetic?: string;
  };
  showHint: boolean;
  showKeyboard: boolean;
  targetWord: string;
  onToggleHint: () => void;
  onToggleKeyboard: () => void;
}

/**
 * Header component for Write by Definition game
 * Shows definition, translation, and control buttons
 */
export function WriteByDefinitionHeader({
  word,
  showHint,
  showKeyboard,
  targetWord,
  onToggleHint,
  onToggleKeyboard,
}: WriteByDefinitionHeaderProps) {
  return (
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
            onClick={onToggleHint}
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
            onClick={onToggleKeyboard}
            className="flex items-center gap-1"
          >
            <Keyboard className="h-3 w-3" />
            {showKeyboard ? 'Hide' : 'Show'} Keyboard
          </Button>
        </div>

        {/* Hint Display */}
        {showHint && (
          <div className="p-3 bg-info-subtle border border-info-border rounded-lg text-sm">
            <div className="flex items-center gap-2 text-info-foreground">
              <Eye className="h-3 w-3" />
              <span className="font-medium">Hint:</span>
            </div>
            <div className="mt-1 text-info-foreground">
              The word has {targetWord.length} letters
              {word.phonetic && <span className="ml-2">({word.phonetic})</span>}
            </div>
          </div>
        )}
      </div>
    </CardHeader>
  );
}
