import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GenerationProgressProps } from '../types';

/**
 * Generation progress component for TTS generation progress display
 * Shows progress bar and status messages during audio generation
 */
export function GenerationProgress({
  isGenerating,
  generationProgress,
  generationStatus,
}: GenerationProgressProps) {
  if (!isGenerating) return null;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Generating Audio...</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(generationProgress)}%
            </span>
          </div>
          <Progress value={generationProgress} className="w-full" />
          {generationStatus && (
            <p className="text-sm text-muted-foreground">{generationStatus}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
