'use client';

import {
  BookOpen,
  Flame,
  Target,
  Clock,
  TrendingUp,
  Play,
  BarChart3,
  Calendar,
  Award,
  Brain,
  Zap,
  ArrowRight,
  History,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getSessionStats } from '@/core/domains/user/actions/session-actions';
import { getUserStatistics } from '@/core/domains/user/actions/user-stats-actions';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';
import type { SessionStatsResponse } from '@/core/domains/user/types/session';

interface DashboardContentProps {
  userId: string;
}

/**
 * Main dashboard content component with overview and quick actions
 */
export function DashboardContent({ userId }: DashboardContentProps) {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStatsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        const [statsResult, sessionStatsResult] = await Promise.all([
          getUserStatistics(userId),
          getSessionStats(userId),
        ]);

        if (statsResult.success && statsResult.statistics) {
          setStatistics(statsResult.statistics);
        } else {
          setError(statsResult.error || 'Failed to fetch statistics');
        }

        if (sessionStatsResult.success && sessionStatsResult.stats) {
          setSessionStats(sessionStatsResult.stats);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="text-center py-8">
        <div className="text-error-foreground mb-4">
          Error: {error || 'No statistics available'}
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const isGoalMet =
    statistics.dailyProgress.todayProgress >=
    statistics.dailyProgress.dailyGoal;
  const progressPercentage = Math.min(
    (statistics.dailyProgress.todayProgress /
      statistics.dailyProgress.dailyGoal) *
      100,
    100,
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
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
            <CardTitle className="text-sm font-medium">
              Learning Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-warning-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.learningProgress.currentStreak}
            </div>
            <p className="text-xs text-muted-foreground">
              Best: {statistics.learningProgress.longestStreak} days
            </p>
            <div className="flex items-center mt-2">
              <Flame className="h-3 w-3 text-warning-foreground mr-1" />
              <span className="text-xs">Keep it going!</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Progress
            </CardTitle>
            <Target className="h-4 w-4 text-success-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.dailyProgress.todayProgress} /{' '}
              {statistics.dailyProgress.dailyGoal}
            </div>
            <p className="text-xs text-muted-foreground">Words learned today</p>
            <Progress value={progressPercentage} className="mt-2" />
            {isGoalMet && (
              <div className="flex items-center mt-1 text-success-foreground text-xs">
                <Award className="h-3 w-3 mr-1" />
                Goal achieved!
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-info-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(statistics.sessionStatistics.totalStudyTime / 60)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.sessionStatistics.totalSessions} sessions total
            </p>
            <div className="flex items-center mt-2">
              <Calendar className="h-3 w-3 text-info-foreground mr-1" />
              <span className="text-xs">
                {statistics.sessionStatistics.recentSessionsCount} this week
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-auto p-4">
              <Link
                href="/dashboard/practice"
                className="flex flex-col items-center gap-2"
              >
                <Play className="h-6 w-6" />
                <span className="text-sm font-medium">Start Practice</span>
                <span className="text-xs text-muted-foreground">
                  Typing practice
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link
                href="/dashboard/dictionary/my-dictionary"
                className="flex flex-col items-center gap-2"
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-sm font-medium">My Dictionary</span>
                <span className="text-xs text-muted-foreground">
                  {statistics.learningProgress.totalWords} words
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link
                href="/dashboard/statistics"
                className="flex flex-col items-center gap-2"
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm font-medium">View Statistics</span>
                <span className="text-xs text-muted-foreground">
                  Detailed analytics
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto p-4">
              <Link
                href="/dashboard/settings"
                className="flex flex-col items-center gap-2"
              >
                <Settings className="h-6 w-6" />
                <span className="text-sm font-medium">Settings</span>
                <span className="text-xs text-muted-foreground">
                  Preferences
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Learning Progress Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Learning Progress
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/statistics">
                View Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Learned Words</span>
                <span className="font-medium">
                  {statistics.learningProgress.wordsLearned}
                </span>
              </div>
              <Progress
                value={
                  (statistics.learningProgress.wordsLearned /
                    statistics.learningProgress.totalWords) *
                  100
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>In Progress</span>
                <span className="font-medium">
                  {statistics.learningProgress.wordsInProgress}
                </span>
              </div>
              <Progress
                value={
                  (statistics.learningProgress.wordsInProgress /
                    statistics.learningProgress.totalWords) *
                  100
                }
                className="h-2"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Average Accuracy
              </div>
              <Badge variant="secondary">
                {statistics.sessionStatistics.averageAccuracy.toFixed(1)}%
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Mastery Score</div>
              <Badge variant="outline">
                {statistics.learningProgress.averageMasteryScore.toFixed(0)}/100
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Session History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/statistics">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionStats &&
            sessionStats.recentSessions &&
            sessionStats.recentSessions.length > 0 ? (
              <div className="space-y-3">
                {sessionStats.recentSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-content-soft"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <div>
                        <div className="text-sm font-medium">
                          {session.wordsStudied} words studied
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {session.score ? `${session.score.toFixed(0)}%` : 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.duration
                          ? `${Math.round(session.duration / 60)}min`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">
                  Start learning to see your progress here
                </p>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">This week:</span>
                <span className="font-medium">
                  {statistics.dailyProgress.weeklyProgress} words
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">This month:</span>
                <span className="font-medium">
                  {statistics.dailyProgress.monthlyProgress} words
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Highlights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-modern-warm-foreground" />
            Recent Achievements
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/statistics">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {statistics.achievements.recentAchievements.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {statistics.achievements.recentAchievements
                .slice(0, 3)
                .map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Award className="h-5 w-5 text-modern-warm-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {achievement.description}
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {achievement.points} pts
                    </Badge>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No achievements yet</p>
              <p className="text-xs">
                Keep learning to unlock your first achievement!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language Learning Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Language Learning Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Learning Path
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {statistics.languageProgress.baseLanguage.toUpperCase()}
                  </Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="outline">
                    {statistics.languageProgress.targetLanguage.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Proficiency Level
                </span>
                <Badge
                  variant={
                    statistics.languageProgress.proficiencyLevel === 'beginner'
                      ? 'destructive'
                      : statistics.languageProgress.proficiencyLevel ===
                          'elementary'
                        ? 'secondary'
                        : statistics.languageProgress.proficiencyLevel ===
                            'intermediate'
                          ? 'default'
                          : statistics.languageProgress.proficiencyLevel ===
                              'advanced'
                            ? 'outline'
                            : 'default'
                  }
                >
                  {statistics.languageProgress.proficiencyLevel
                    .charAt(0)
                    .toUpperCase() +
                    statistics.languageProgress.proficiencyLevel.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Vocabulary Size
                </span>
                <span className="font-medium">
                  {statistics.languageProgress.estimatedVocabularySize.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Goal Achievement
                </span>
                <span className="font-medium">
                  {statistics.dailyProgress.goalAchievementRate.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
