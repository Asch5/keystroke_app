'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  BookOpen,
  Brain,
  Clock,
  Zap,
  BarChart3,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  Star,
  Flame,
  Users,
  Globe,
} from 'lucide-react';
import {
  getUserStatistics,
  getLearningAnalytics,
} from '@/core/domains/user/actions/user-stats-actions';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';
import { LearningProgressChart } from './charts/LearningProgressChart';
// import { SessionAnalyticsChart } from './charts/SessionAnalyticsChart';
import { MistakeAnalysisChart } from './charts/MistakeAnalysisChart';
import { VocabularyGrowthChart } from './charts/VocabularyGrowthChart';
import { WeeklyDistributionChart } from './charts/WeeklyDistributionChart';

interface StatisticsContentProps {
  userId: string;
}

/**
 * Main statistics content component displaying comprehensive user analytics
 */
export function StatisticsContent({ userId }: StatisticsContentProps) {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [analytics, setAnalytics] = useState<{
    dailyProgress: { date: string; wordsStudied: number; accuracy: number }[];
    mistakesByType: { type: string; count: number }[];
    learningPatterns: {
      mostActiveHour: number;
      averageSessionLength: number;
      preferredSessionType: string;
      weeklyDistribution: { day: string; sessions: number }[];
    };
    vocabularyGrowth: { date: string; totalWords: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [statsResult, analyticsResult] = await Promise.all([
          getUserStatistics(userId),
          getLearningAnalytics(userId, 30),
        ]);

        if (statsResult.success && statsResult.statistics) {
          setStatistics(statsResult.statistics);
        } else {
          setError(statsResult.error || 'Failed to fetch statistics');
        }

        if (analyticsResult.success && analyticsResult.analytics) {
          setAnalytics(analyticsResult.analytics);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Statistics fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  if (error || !statistics) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: {error || 'No statistics available'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
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
              Current Streak
            </CardTitle>
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

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="mistakes">Analysis</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
        </TabsList>

        {/* Learning Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Learned Words</span>
                    <span>{statistics.learningProgress.wordsLearned}</span>
                  </div>
                  <Progress
                    value={
                      (statistics.learningProgress.wordsLearned /
                        statistics.learningProgress.totalWords) *
                      100
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>In Progress</span>
                    <span>{statistics.learningProgress.wordsInProgress}</span>
                  </div>
                  <Progress
                    value={
                      (statistics.learningProgress.wordsInProgress /
                        statistics.learningProgress.totalWords) *
                      100
                    }
                    className="bg-yellow-100"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Need Review</span>
                    <span>
                      {statistics.learningProgress.wordsNeedingReview}
                    </span>
                  </div>
                  <Progress
                    value={
                      (statistics.learningProgress.wordsNeedingReview /
                        statistics.learningProgress.totalWords) *
                      100
                    }
                    className="bg-orange-100"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Difficult Words</span>
                    <span>{statistics.learningProgress.difficultWords}</span>
                  </div>
                  <Progress
                    value={
                      (statistics.learningProgress.difficultWords /
                        statistics.learningProgress.totalWords) *
                      100
                    }
                    className="bg-red-100"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Mastery Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {statistics.learningProgress.averageMasteryScore.toFixed(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Mastery Score
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold text-orange-500">
                      {statistics.learningProgress.currentStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Current Streak
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-purple-500">
                      {statistics.learningProgress.longestStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Best Streak
                    </div>
                  </div>
                </div>

                {analytics && (
                  <div className="mt-4">
                    <VocabularyGrowthChart data={analytics.vocabularyGrowth} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <LearningProgressChart data={analytics.dailyProgress} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Session Analytics Tab */}
        <TabsContent value="sessions" className="space-y-4">
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
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      statistics.sessionStatistics.totalStudyTime / 60,
                    )}
                    h {statistics.sessionStatistics.totalStudyTime % 60}m
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
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.sessionStatistics.averageAccuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Accuracy
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {statistics.sessionStatistics.bestScore}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Best Score
                  </div>
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
                      {analytics.learningPatterns.averageSessionLength.toFixed(
                        0,
                      )}{' '}
                      min
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Mistake Analysis Tab */}
        <TabsContent value="mistakes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Mistake Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {statistics.mistakeAnalysis.totalMistakes}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Mistakes
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Most Common Type
                    </span>
                    <Badge variant="destructive">
                      {statistics.mistakeAnalysis.mostCommonMistakeType}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Improvement Rate
                    </span>
                    <span
                      className={`font-medium flex items-center gap-1 ${
                        statistics.mistakeAnalysis.improvementRate >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {statistics.mistakeAnalysis.improvementRate >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(
                        statistics.mistakeAnalysis.improvementRate,
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Difficult Words
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics.mistakeAnalysis.difficultWords
                    .slice(0, 5)
                    .map((word, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm font-medium">
                          {word.wordText}
                        </span>
                        <Badge variant="outline">
                          {word.mistakeCount} mistakes
                        </Badge>
                      </div>
                    ))}
                  {statistics.mistakeAnalysis.difficultWords.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No difficult words identified yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {analytics && analytics.mistakesByType.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mistake Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <MistakeAnalysisChart data={analytics.mistakesByType} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Achievement Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {statistics.achievements.totalAchievements}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Achievements
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {statistics.achievements.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Points
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.achievements.recentAchievements.map(
                    (achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <Award className="h-5 w-5 text-yellow-500" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {achievement.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {achievement.description}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {achievement.points} pts
                        </Badge>
                      </div>
                    ),
                  )}
                  {statistics.achievements.recentAchievements.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No achievements yet. Keep learning to unlock your first
                      achievement!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
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
                  <div className="text-sm text-muted-foreground">
                    Words Today
                  </div>
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
                  <div className="flex items-center justify-center gap-1 text-green-600 text-sm">
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
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.dailyProgress.weeklyProgress}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Words This Week
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {statistics.dailyProgress.monthlyProgress}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    This Month
                  </div>
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
                  <div className="text-2xl font-bold text-green-600">
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
        </TabsContent>

        {/* Language Progress Tab */}
        <TabsContent value="language" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Language Learning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Learning Path
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {statistics.languageProgress.baseLanguage.toUpperCase()}
                      </Badge>
                      <span>→</span>
                      <Badge variant="outline">
                        {statistics.languageProgress.targetLanguage.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Proficiency Level
                    </span>
                    <Badge
                      variant={
                        statistics.languageProgress.proficiencyLevel ===
                        'beginner'
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
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Vocabulary Size
                    </span>
                    <span className="font-medium">
                      {statistics.languageProgress.estimatedVocabularySize.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Learning Community
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center py-4">
                  <div className="text-muted-foreground">
                    Community features coming soon!
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Connect with other learners, join study groups, and compete
                    in challenges.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
