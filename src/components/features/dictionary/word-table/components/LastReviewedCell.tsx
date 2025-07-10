import React from 'react';
import { LastReviewedCellProps } from '../types';

/**
 * Last reviewed cell component for displaying when word was last reviewed
 * Shows formatted date or "Never" if not reviewed
 */
export function LastReviewedCell({ lastReviewedAt }: LastReviewedCellProps) {
  return (
    <div className="text-sm">
      {lastReviewedAt ? lastReviewedAt.toLocaleDateString() : 'Never'}
    </div>
  );
}
