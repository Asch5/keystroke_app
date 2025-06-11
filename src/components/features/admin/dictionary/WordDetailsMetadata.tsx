import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { WordEntryData } from '@/core/lib/actions/dictionaryActions';

interface WordDetailsMetadataProps {
  wordDetails: WordEntryData;
}

/**
 * WordDetailsMetadata component displays language information and frequency data
 * for the word entry.
 *
 * @param wordDetails - The complete word entry data
 */
export function WordDetailsMetadata({ wordDetails }: WordDetailsMetadataProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <h4 className="text-md font-semibold mb-1 text-muted-foreground">
          Language
        </h4>
        <Badge variant="secondary" className="mt-1">
          {wordDetails.languageCode.toUpperCase()}
        </Badge>
      </div>
      {wordDetails.frequencyGeneral > 0 && (
        <div className="md:col-span-2">
          <h4 className="text-md font-semibold mb-1 text-muted-foreground">
            Overall Frequency
          </h4>
          <div className="bg-muted/20 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Rank:</p>
              <Badge variant="outline" className="font-mono">
                {wordDetails.frequencyGeneral}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
