import React from 'react';
import { GenerationOptionsProps } from '../types';

/**
 * Generation options component for TTS generation settings
 * Displays checkboxes for additional generation options
 */
export function GenerationOptions({
  overwriteExisting,
  onOverwriteChange,
}: GenerationOptionsProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Options</h3>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="overwrite"
          checked={overwriteExisting}
          onChange={(e) => onOverwriteChange(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="overwrite" className="text-sm">
          Overwrite existing audio files
        </label>
      </div>
    </div>
  );
}
