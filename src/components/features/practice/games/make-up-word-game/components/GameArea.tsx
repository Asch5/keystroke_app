import { Shuffle } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { GameState, WordData } from '../types';
import { CharacterButton } from './CharacterButton';

interface GameAreaProps {
  gameState: GameState;
  word: WordData;
  onCharacterSelect: (char: string, index: number) => void;
  onCharacterRemove: (index: number) => void;
  onShuffle: () => void;
}

/**
 * Game area component for character selection and word building
 * Contains selected characters display and available character pool
 */
export function GameArea({
  gameState,
  word,
  onCharacterSelect,
  onCharacterRemove,
  onShuffle,
}: GameAreaProps) {
  const renderCharacterButton = (
    char: string,
    index: number,
    isAvailable: boolean = true,
  ) => {
    // Character numbering logic is handled within the CharacterButton component

    return (
      <CharacterButton
        key={`${char}-${index}-${isAvailable ? 'available' : 'selected'}`}
        char={char}
        index={index}
        isAvailable={isAvailable}
        onClick={() =>
          isAvailable
            ? onCharacterSelect(char, index)
            : onCharacterRemove(index)
        }
        disabled={gameState.showFeedback || gameState.isGameCompleted}
        characterPool={word.characterPool || []}
        wrongPositions={gameState.wrongPositions}
        showFeedback={gameState.showFeedback}
        isCorrect={gameState.isCorrect}
      />
    );
  };

  return (
    <div className="space-y-6">
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
        {gameState.attempts > 0 &&
          gameState.attempts <
            (word.maxAttempts || (word.isPhrase ? 6 : 3)) && (
            <p className="text-sm text-warning-foreground">
              Wrong selection!{' '}
              {(word.maxAttempts || (word.isPhrase ? 6 : 3)) -
                gameState.attempts}{' '}
              attempts remaining
            </p>
          )}
      </div>

      {/* Word Building Area */}
      <div className="space-y-4">
        {/* Selected Characters Display */}
        <div className="p-4 bg-muted/20 rounded-lg border-2 border-dashed min-h-[80px]">
          <div className="flex flex-wrap gap-2 justify-center items-center min-h-[48px]">
            {gameState.selectedChars.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Click characters below to start building...
              </p>
            ) : (
              gameState.selectedChars.map((char, index) =>
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
              onClick={onShuffle}
              disabled={gameState.showFeedback || gameState.isGameCompleted}
              className="text-xs"
            >
              <Shuffle className="h-3 w-3 mr-1" />
              Shuffle
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 justify-center p-4 bg-muted/10 rounded-lg border">
            {gameState.availableChars.map((char, index) =>
              renderCharacterButton(char, index, true),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
