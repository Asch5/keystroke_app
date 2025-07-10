import React from 'react';
import { MasteryCellProps } from '../types';

/**
 * Mastery cell component for displaying mastery score and review count
 * Shows mastery score with review count below
 */
export function MasteryCell({ masteryScore, reviewCount }: MasteryCellProps) {
  return (
    <div className="text-center">
      <div className="text-sm font-medium">{masteryScore.toFixed(1)}</div>
      <div className="text-xs text-muted-foreground">{reviewCount} reviews</div>
    </div>
  );
}
