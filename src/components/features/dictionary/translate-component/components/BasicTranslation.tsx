import React from 'react';
import { BasicTranslationProps } from '../types';

/**
 * Basic translation display component
 * Shows original word and translation with transcriptions
 */
export function BasicTranslation({ result }: BasicTranslationProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Original</h3>
          <p className="text-xl">{result.word}</p>
          {result.wordTranscription && (
            <p className="text-sm text-content-secondary mt-1">
              /{result.wordTranscription}/
            </p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Translation</h3>
          <p className="text-xl">{result.translation}</p>
          {result.translationTranscription && (
            <p className="text-sm text-content-secondary mt-1">
              /{result.translationTranscription}/
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
