import { DollarSign } from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageStatsProps } from '../types';

/**
 * Usage statistics component for TTS usage data display
 * Shows current usage, costs, and quota information
 */
export function UsageStats({ ttsStats }: UsageStatsProps) {
  if (!ttsStats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Usage Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Characters:</span>
            <p className="font-medium">
              {ttsStats.totalCharacters.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Estimated Cost:</span>
            <p className="font-medium">${ttsStats.estimatedCost.toFixed(4)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Last Reset:</span>
            <p className="font-medium">
              {new Date(ttsStats.lastReset).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Standard Quota:</span>
            <p className="font-medium text-success-foreground">
              {ttsStats.remainingFreeQuota.standard?.toLocaleString() ?? 0}{' '}
              remaining
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
