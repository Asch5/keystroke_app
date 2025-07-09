'use client';

import { Eye } from 'lucide-react';

interface WriteBySoundHintProps {
  showHint: boolean;
  hasSubmitted: boolean;
  wordLength: number;
}

/**
 * Hint display component for Write by Sound game
 */
export function WriteBySoundHint({
  showHint,
  hasSubmitted,
  wordLength,
}: WriteBySoundHintProps) {
  if (!showHint || hasSubmitted) return null;

  return (
    <div className="p-3 bg-info-subtle border border-info-border rounded-lg text-sm">
      <div className="flex items-center gap-2 text-info-foreground">
        <Eye className="h-3 w-3" />
        <span className="font-medium">Hint:</span>
      </div>
      <div className="mt-1 text-muted-foreground">
        The word has {wordLength} letters
      </div>
    </div>
  );
}
