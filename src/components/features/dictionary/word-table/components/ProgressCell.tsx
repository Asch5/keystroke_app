import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ProgressCellProps } from '../types';

/**
 * Progress cell component for displaying learning progress
 * Shows progress bar and percentage
 */
export function ProgressCell({ progress }: ProgressCellProps) {
  return (
    <div className="space-y-1">
      <Progress value={progress} className="h-2 w-16" />
      <span className="text-xs text-muted-foreground">{progress}%</span>
    </div>
  );
}
