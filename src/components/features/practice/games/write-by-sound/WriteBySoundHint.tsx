'use client';

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
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
      <div className="text-yellow-700 text-center">
        The word has <span className="font-bold">{wordLength}</span> letters
      </div>
    </div>
  );
}
