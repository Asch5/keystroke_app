import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Clock } from 'lucide-react';
import { TTSActionsProps } from '../types';

/**
 * TTS actions component for generation and cancel buttons
 * Displays action buttons with appropriate states and icons
 */
export function TTSActions({
  selectedWords,
  isGenerating,
  onGenerate,
  onCancel,
}: TTSActionsProps) {
  return (
    <div className="flex gap-3 pt-4">
      <Button
        onClick={onGenerate}
        disabled={isGenerating || selectedWords.size === 0}
        className="flex-1"
      >
        {isGenerating ? (
          <>
            <Clock className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4 mr-2" />
            Generate Audio for {selectedWords.size} Words
          </>
        )}
      </Button>
      <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
        Cancel
      </Button>
    </div>
  );
}
