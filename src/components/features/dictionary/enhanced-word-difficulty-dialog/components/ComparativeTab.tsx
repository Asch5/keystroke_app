'use client';

import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TabComponentProps } from '../types';
import { getPerformanceColor } from '../utils/colorUtils';

export function ComparativeTab({ analytics }: Omit<TabComponentProps, 'word'>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Comparative Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div
            className={`text-center p-4 ${getPerformanceColor('info')} bg-info-subtle rounded-lg`}
          >
            <div className={`text-lg font-bold ${getPerformanceColor('info')}`}>
              {analytics.comparativeMetrics.personalAverageComparison
                .responseTime > 0
                ? '+'
                : ''}
              {analytics.comparativeMetrics.personalAverageComparison.responseTime.toFixed(
                1,
              )}
              %
            </div>
            <div className="text-sm text-muted-foreground">
              vs Personal Average (Time)
            </div>
          </div>
          <div
            className={`text-center p-4 ${getPerformanceColor('success')} bg-success-subtle rounded-lg`}
          >
            <div
              className={`text-lg font-bold ${getPerformanceColor('success')}`}
            >
              {analytics.comparativeMetrics.personalAverageComparison.accuracy >
              0
                ? '+'
                : ''}
              {analytics.comparativeMetrics.personalAverageComparison.accuracy.toFixed(
                1,
              )}
              %
            </div>
            <div className="text-sm text-muted-foreground">
              vs Personal Average (Accuracy)
            </div>
          </div>
          <div
            className={`text-center p-4 ${getPerformanceColor('modern')} bg-modern-slate-subtle rounded-lg`}
          >
            <div
              className={`text-lg font-bold ${getPerformanceColor('modern')}`}
            >
              {analytics.comparativeMetrics.difficultyPercentile.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Difficulty Percentile
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-3">Learning Efficiency</h4>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 ${getPerformanceColor('warning')} bg-warning-subtle rounded-lg`}
            >
              <h5 className="font-medium mb-2">Efficiency Index</h5>
              <div className="text-lg font-bold">
                {analytics.comparativeMetrics.learningEfficiencyIndex.toFixed(
                  2,
                )}
              </div>
            </div>
            <div
              className={`p-4 ${getPerformanceColor('warning')} bg-warning-subtle rounded-lg`}
            >
              <h5 className="font-medium mb-2">Predicted Mastery</h5>
              <div className="text-lg font-bold">
                {analytics.comparativeMetrics.predictedTimeToMastery} days
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-3">Learning Progression</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div
                className={`text-lg font-bold ${getPerformanceColor('info')}`}
              >
                {analytics.progressionMetrics.masteryVelocity.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Mastery Velocity
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${getPerformanceColor('success')}`}
              >
                {analytics.progressionMetrics.retentionStrength.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Retention Strength
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${getPerformanceColor('modern')}`}
              >
                {analytics.progressionMetrics.timeToFirstCorrect}
              </div>
              <div className="text-sm text-muted-foreground">
                Days to First Correct
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3">SRS Effectiveness</h4>
            <div className="grid grid-cols-3 gap-4">
              <div
                className={`text-center p-3 ${getPerformanceColor('info')} bg-info-subtle rounded-lg`}
              >
                <div
                  className={`text-lg font-bold ${getPerformanceColor('info')}`}
                >
                  {analytics.progressionMetrics.srsIntervalOptimality.toFixed(
                    0,
                  )}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  Interval Optimality
                </div>
              </div>
              <div
                className={`text-center p-3 ${getPerformanceColor('success')} bg-success-subtle rounded-lg`}
              >
                <div
                  className={`text-lg font-bold ${getPerformanceColor('success')}`}
                >
                  {analytics.progressionMetrics.srsSuccessRate.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  SRS Success Rate
                </div>
              </div>
              <div
                className={`text-center p-3 ${getPerformanceColor('error')} bg-error-subtle rounded-lg`}
              >
                <div
                  className={`text-lg font-bold ${getPerformanceColor('error')}`}
                >
                  {analytics.progressionMetrics.srsRegressionCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Regression Count
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
