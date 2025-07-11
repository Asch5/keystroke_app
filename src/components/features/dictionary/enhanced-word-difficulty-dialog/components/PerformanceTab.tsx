'use client';

import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TabComponentProps } from '../types';
import { getPerformanceColor } from '../utils/colorUtils';

export function PerformanceTab({ analytics }: Omit<TabComponentProps, 'word'>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Session-Based Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div
              className={`text-lg font-bold ${getPerformanceColor('success')}`}
            >
              {analytics.sessionPerformance.fastestResponseTime.toFixed(0)}ms
            </div>
            <div className="text-sm text-muted-foreground">
              Fastest Response
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${getPerformanceColor('info')}`}>
              {analytics.sessionPerformance.medianResponseTime.toFixed(0)}ms
            </div>
            <div className="text-sm text-muted-foreground">Median Response</div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg font-bold ${getPerformanceColor('warning')}`}
            >
              {analytics.sessionPerformance.slowestResponseTime.toFixed(0)}ms
            </div>
            <div className="text-sm text-muted-foreground">
              Slowest Response
            </div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg font-bold ${getPerformanceColor('modern')}`}
            >
              {analytics.sessionPerformance.responseTimeConsistency.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Consistency Score
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-3">Attempt Pattern Analysis</h4>
          <div className="grid grid-cols-3 gap-4">
            <div
              className={`text-center p-3 ${getPerformanceColor('success')} bg-success-subtle rounded-lg`}
            >
              <div
                className={`text-lg font-bold ${getPerformanceColor('success')}`}
              >
                {analytics.sessionPerformance.firstAttemptSuccessRate.toFixed(
                  1,
                )}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                First Attempt Success
              </div>
            </div>
            <div
              className={`text-center p-3 ${getPerformanceColor('info')} bg-info-subtle rounded-lg`}
            >
              <div
                className={`text-lg font-bold ${getPerformanceColor('info')}`}
              >
                {analytics.sessionPerformance.multipleAttemptSuccessRate.toFixed(
                  1,
                )}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                Recovery Success Rate
              </div>
            </div>
            <div
              className={`text-center p-3 ${getPerformanceColor('warning')} bg-warning-subtle rounded-lg`}
            >
              <div
                className={`text-lg font-bold ${getPerformanceColor('warning')}`}
              >
                {analytics.sessionPerformance.averageAttemptsPerSession.toFixed(
                  1,
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Avg Attempts per Session
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
