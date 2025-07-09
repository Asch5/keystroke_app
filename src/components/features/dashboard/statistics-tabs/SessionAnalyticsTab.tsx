import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Target } from 'lucide-react';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';
import { WeeklyDistributionChart } from '../charts/WeeklyDistributionChart';

interface SessionAnalyticsTabProps {
  statistics: UserStatistics;
  analytics: {
    learningPatterns: {
      mostActiveHour: number;
      averageSessionLength: number;
      preferredSessionType: string;
      weeklyDistribution: { day: string; sessions: number }[];
    };
  } | null;
}

export const SessionAnalyticsTab: React.FC<SessionAnalyticsTabProps> = ({
  statistics,
  analytics,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Session Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Total Sessions
              </span>
              <span className="font-medium">
                {statistics.sessionStatistics.totalSessions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Words Studied
              </span>
              <span className="font-medium">
                {statistics.sessionStatistics.totalWordsStudied.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Recent Sessions
              </span>
              <span className="font-medium">
                {statistics.sessionStatistics.recentSessionsCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Last Session
              </span>
              <span className="font-medium">
                {statistics.sessionStatistics.lastSessionDate
                  ? new Date(
                      statistics.sessionStatistics.lastSessionDate,
                    ).toLocaleDateString()
                  : 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-info-foreground">
                {Math.round(statistics.sessionStatistics.totalStudyTime / 60)}h{' '}
                {statistics.sessionStatistics.totalStudyTime % 60}m
              </div>
              <div className="text-sm text-muted-foreground">
                Total Study Time
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-center">
              <div>
                <div className="text-lg font-semibold">
                  {statistics.sessionStatistics.averageSessionDuration} min
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg Session Length
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-foreground">
                {statistics.sessionStatistics.averageAccuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Average Accuracy
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-modern-slate-foreground">
                {statistics.sessionStatistics.bestScore}%
              </div>
              <div className="text-xs text-muted-foreground">Best Score</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyDistributionChart
                data={analytics.learningPatterns.weeklyDistribution}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Most Active Hour
                </span>
                <span className="font-medium">
                  {analytics.learningPatterns.mostActiveHour}:00
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Preferred Session Type
                </span>
                <Badge variant="secondary">
                  {analytics.learningPatterns.preferredSessionType}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg Session Length
                </span>
                <span className="font-medium">
                  {analytics.learningPatterns.averageSessionLength.toFixed(0)}{' '}
                  min
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
