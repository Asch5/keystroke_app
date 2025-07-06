'use client';

import { Button } from '@/components/ui/button';

interface WriteByDefinitionKeyboardProps {
  showKeyboard: boolean;
  hasSubmitted: boolean;
  onVirtualKeyPress: (key: string) => void;
}

/**
 * Virtual keyboard component for Write by Definition game
 * Provides on-screen keyboard for input
 */
export function WriteByDefinitionKeyboard({
  showKeyboard,
  hasSubmitted,
  onVirtualKeyPress,
}: WriteByDefinitionKeyboardProps) {
  if (!showKeyboard || hasSubmitted) return null;

  // Virtual keyboard layout (simplified)
  const keyboardRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

  return (
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
                onClick={() => onVirtualKeyPress(key)}
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
            onClick={() => onVirtualKeyPress('Space')}
          >
            Space
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3 h-8"
            onClick={() => onVirtualKeyPress('Backspace')}
          >
            ⌫
          </Button>
        </div>
      </div>
    </div>
  );
}
