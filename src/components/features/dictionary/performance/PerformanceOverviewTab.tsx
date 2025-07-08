import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TabsContent } from '@/components/ui/tabs';
import {
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  Brain,
  BookOpen,
  Zap,
  Award,
} from 'lucide-react';
import { DictionaryPerformanceMetrics } from '@/core/domains/user/actions/dictionary-performance-actions';
import { formatTime, formatPercentage, getPercentageColor } from './utils';

interface PerformanceOverviewTabProps {
  metrics: DictionaryPerformanceMetrics;
}

export const PerformanceOverviewTab = React.memo<PerformanceOverviewTabProps>(
  ({ metrics }) => {
    const {
      learningEfficiency,
      practicePerformance,
      studyHabits,
      vocabularyManagement,
      reviewSystem,
      performanceScores,
    } = metrics;

    return (
      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                Learning Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {learningEfficiency.learningVelocity.toFixed(1)} words/day
              </div>
              <p className="text-xs text-muted-foreground">
                Average learning rate over last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Practice Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(practicePerformance.averageAccuracy)}
              </div>
              <p className="text-xs text-muted-foreground">
                Overall correctness across all sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Study Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studyHabits.studyStreak}
              </div>
              <p className="text-xs text-muted-foreground">
                Consecutive days of practice
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceScores.overallPerformanceScore.toFixed(1)}/10
              </div>
              <p className="text-xs text-muted-foreground">
                Composite performance rating
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Learning Progress Summary */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Learning Progress
              </CardTitle>
              <CardDescription>
                Your vocabulary growth and mastery progression
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Retention Rate</span>
                  <span
                    className={`text-sm font-bold ${getPercentageColor(
                      learningEfficiency.retentionRate,
                    )}`}
                  >
                    {formatPercentage(learningEfficiency.retentionRate)}
                  </span>
                </div>
                <Progress
                  value={learningEfficiency.retentionRate}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Average Time to Master
                  </span>
                  <span className="text-sm font-bold">
                    {learningEfficiency.averageTimeToMaster.toFixed(1)} days
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (30 - learningEfficiency.averageTimeToMaster) * 3.33,
                    100,
                  )}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Words per Week</span>
                  <span className="text-sm font-bold">
                    {learningEfficiency.wordsLearnedPerWeek.toFixed(0)}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    learningEfficiency.wordsLearnedPerWeek * 4,
                    100,
                  )}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Practice Statistics
              </CardTitle>
              <CardDescription>
                Your practice session performance and habits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Sessions</span>
                  <span className="text-sm font-bold">
                    {practicePerformance.totalPracticeSessions}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    practicePerformance.totalPracticeSessions,
                    100,
                  )}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Average Response Time
                  </span>
                  <span className="text-sm font-bold">
                    {formatTime(practicePerformance.averageResponseTime / 1000)}
                  </span>
                </div>
                <Progress
                  value={Math.max(
                    100 - practicePerformance.averageResponseTime / 50,
                    0,
                  )}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Consistency Score</span>
                  <span
                    className={`text-sm font-bold ${getPercentageColor(
                      practicePerformance.consistencyScore,
                    )}`}
                  >
                    {formatPercentage(practicePerformance.consistencyScore)}
                  </span>
                </div>
                <Progress
                  value={practicePerformance.consistencyScore}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-lg font-bold">
                    {vocabularyManagement.wordsAddedThisWeek}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Words this week
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-lg font-bold">
                    {formatTime(studyHabits.averageStudyTime * 60)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg study time
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-lg font-bold">
                    {reviewSystem.wordsNeedingReview}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Need review
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-lg font-bold">
                    {studyHabits.longestStreak}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Longest streak
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-lg font-bold">
                    {reviewSystem.averageSrsLevel.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg SRS level
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                <div>
                  <div className="text-lg font-bold">
                    {formatPercentage(studyHabits.studyConsistency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Consistency
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    );
  },
);

PerformanceOverviewTab.displayName = 'PerformanceOverviewTab';
