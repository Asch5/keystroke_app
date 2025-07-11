'use client';

import { Trophy, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SessionState, WordResult } from './hooks';

interface TypingControlsProps {
  sessionState: SessionState;
  showResult: boolean;
  onWordSubmit: () => void;
  onSkipWord: () => Promise<WordResult | undefined>;
  onNextWord: () => void;
  onFinishPractice: () => void;
}

/**
 * Component for rendering control buttons (Submit, Skip, Finish, Next)
 */
export function TypingControls({
  sessionState,
  showResult,
  onWordSubmit,
  onSkipWord,
  onNextWord,
  onFinishPractice,
}: TypingControlsProps) {
  return (
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
}
