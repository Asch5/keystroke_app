import {
  Target,
  AlertTriangle,
  Brain,
  Clock,
  Activity,
  CheckCircle2,
  Trophy,
  Calendar,
  BarChart3,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { DictionaryPerformanceMetrics } from '@/core/domains/user/actions/dictionary-performance-actions';

interface WordAnalyticsTabProps {
  performanceMetrics: DictionaryPerformanceMetrics | null;
}

export const WordAnalyticsTab: React.FC<WordAnalyticsTabProps> = ({
  performanceMetrics,
}) => {
  return (
    <div className="space-y-4">
      {/* Word Performance Overview Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-success-foreground" />
              Top Performing Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceMetrics?.individualWordPerformance?.topPerformingWords
              ?.length ? (
              <div className="space-y-2">
                {performanceMetrics.individualWordPerformance.topPerformingWords
                  .slice(0, 5)
                  .map((word, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm font-medium">
                        {word.wordText}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {word.masteryScore}/100
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Level {word.srsLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No top performers yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-foreground" />
              Words Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceMetrics?.individualWordPerformance?.strugglingWords
              ?.length ? (
              <div className="space-y-2">
                {performanceMetrics.individualWordPerformance.strugglingWords
                  .slice(0, 5)
                  .map((word, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm font-medium">
                        {word.wordText}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {word.mistakeCount} errors
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {word.masteryScore}/100
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">All words performing well!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-modern-slate-foreground" />
              Learning Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceMetrics?.practicePerformance ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Average Response Time</span>
                  <span className="font-medium">
                    {performanceMetrics.practicePerformance.averageResponseTime?.toFixed(
                      1,
                    ) || 'N/A'}
                    ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Learning Velocity</span>
                  <Badge variant="outline">
                    {performanceMetrics.learningEfficiency.learningVelocity?.toFixed(
                      1,
                    ) || 'N/A'}{' '}
                    words/day
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Retention Rate</span>
                  <span className="font-medium">
                    {performanceMetrics.learningEfficiency.retentionRate?.toFixed(
                      1,
                    ) || 'N/A'}
                    %
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Learning patterns will appear here.</p>
                <p className="text-xs mt-2">
                  Practice more words to unlock insights!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Study Habits and Analytics */}
      {performanceMetrics?.studyHabits && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-info-foreground" />
              Study Habits & Analytics
            </CardTitle>
            <CardDescription>
              Insights based on your study patterns and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Study Habits */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Study Patterns
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-info-subtle rounded-lg">
                  <div className="text-lg font-bold text-info-foreground">
                    {performanceMetrics.studyHabits.studyStreak}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current Streak
                  </div>
                </div>
                <div className="text-center p-3 bg-success-subtle rounded-lg">
                  <div className="text-lg font-bold text-success-foreground">
                    {performanceMetrics.studyHabits.averageStudyTime.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg Minutes/Day
                  </div>
                </div>
                <div className="text-center p-3 bg-modern-slate-subtle rounded-lg">
                  <div className="text-lg font-bold text-modern-slate-foreground">
                    {performanceMetrics.studyHabits.preferredStudyTime}:00
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Preferred Hour
                  </div>
                </div>
                <div className="text-center p-3 bg-warning-subtle rounded-lg">
                  <div className="text-lg font-bold text-warning-foreground">
                    {(
                      performanceMetrics.studyHabits.studyConsistency * 100
                    ).toFixed(0)}
                    %
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Consistency
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Status Distribution */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Learning Status Distribution
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {performanceMetrics.difficultyDistribution.byLearningStatus.map(
                  (item) => (
                    <div
                      key={item.status}
                      className="text-center p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="text-xl font-bold">{item.count}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {item.status.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({item.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Coming Soon: Enhanced Individual Word Analytics */}
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h4 className="font-semibold mb-2">
                Enhanced Word Analytics Coming Soon
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Click on individual words in your dictionary to see detailed
                analytics including:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">Performance Timeline</Badge>
                <Badge variant="outline">Mistake Pattern Analysis</Badge>
                <Badge variant="outline">Predictive Insights</Badge>
                <Badge variant="outline">Retention Forecasting</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                These features will be available in the individual word detail
                pages
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Scores Overview */}
      {performanceMetrics?.performanceScores && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-info-foreground" />
              Detailed Performance Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-info-foreground">
                  {performanceMetrics.performanceScores.overallPerformanceScore.toFixed(
                    1,
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Overall Score
                </div>
                <Progress
                  value={
                    performanceMetrics.performanceScores
                      .overallPerformanceScore * 10
                  }
                  className="mt-2 h-2"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-foreground">
                  {performanceMetrics.performanceScores.responseTimeScore.toFixed(
                    1,
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Response Time
                </div>
                <Progress
                  value={
                    performanceMetrics.performanceScores.responseTimeScore * 10
                  }
                  className="mt-2 h-2"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-modern-slate-foreground">
                  {performanceMetrics.performanceScores.streakConsistencyScore.toFixed(
                    1,
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Consistency</div>
                <Progress
                  value={
                    performanceMetrics.performanceScores
                      .streakConsistencyScore * 10
                  }
                  className="mt-2 h-2"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-foreground">
                  {performanceMetrics.performanceScores.improvementTrendScore.toFixed(
                    1,
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Improvement</div>
                <Progress
                  value={
                    performanceMetrics.performanceScores.improvementTrendScore *
                    10
                  }
                  className="mt-2 h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
