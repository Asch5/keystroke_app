import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Flame, Target, Clock, Calendar } from 'lucide-react';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';

interface StatisticsOverviewProps {
  statistics: UserStatistics;
}

export const StatisticsOverview: React.FC<StatisticsOverviewProps> = ({
  statistics,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Vocabulary
          </CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.learningProgress.totalWords.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {statistics.learningProgress.wordsLearned} learned (
            {statistics.learningProgress.progressPercentage.toFixed(1)}%)
          </p>
          <Progress
            value={statistics.learningProgress.progressPercentage}
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.learningProgress.currentStreak}
          </div>
          <p className="text-xs text-muted-foreground">
            Best: {statistics.learningProgress.longestStreak} days
          </p>
          <div className="flex items-center mt-2">
            <Flame className="h-3 w-3 text-orange-500 mr-1" />
            <span className="text-xs">
              {statistics.sessionStatistics.streakDays} day streak
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Accuracy
          </CardTitle>
          <Target className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {statistics.sessionStatistics.averageAccuracy.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Best score: {statistics.sessionStatistics.bestScore}%
          </p>
          <Progress
            value={statistics.sessionStatistics.averageAccuracy}
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Study Time</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(statistics.sessionStatistics.totalStudyTime / 60)}h
          </div>
          <p className="text-xs text-muted-foreground">
            Avg: {statistics.sessionStatistics.averageSessionDuration}{' '}
            min/session
          </p>
          <div className="flex items-center mt-2">
            <Calendar className="h-3 w-3 text-blue-500 mr-1" />
            <span className="text-xs">
              {statistics.sessionStatistics.totalSessions} sessions
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
