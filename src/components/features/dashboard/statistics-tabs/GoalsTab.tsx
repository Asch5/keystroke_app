import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, Zap, CheckCircle2 } from 'lucide-react';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';

interface GoalsTabProps {
  statistics: UserStatistics;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ statistics }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Daily Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {statistics.dailyProgress.todayProgress} /{' '}
                {statistics.dailyProgress.dailyGoal}
              </div>
              <div className="text-sm text-muted-foreground">Words Today</div>
            </div>
            <Progress
              value={
                (statistics.dailyProgress.todayProgress /
                  statistics.dailyProgress.dailyGoal) *
                100
              }
              className="mt-2"
            />
            {statistics.dailyProgress.todayProgress >=
              statistics.dailyProgress.dailyGoal && (
              <div className="flex items-center justify-center gap-1 text-success-foreground text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Goal completed!
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-info-foreground">
                {statistics.dailyProgress.weeklyProgress}
              </div>
              <div className="text-sm text-muted-foreground">
                Words This Week
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-modern-slate-foreground">
                {statistics.dailyProgress.monthlyProgress}
              </div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Goal Achievement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-foreground">
                {statistics.dailyProgress.goalAchievementRate.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Goal Achievement Rate
              </div>
              <div className="text-xs text-muted-foreground">
                (Last 30 days)
              </div>
            </div>
            <Progress
              value={statistics.dailyProgress.goalAchievementRate}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
