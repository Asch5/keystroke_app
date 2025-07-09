'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Clock,
  Target,
  Activity,
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
  TrendingUp,
  Eye,
  Volume2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { LearningStatus } from '@/core/types';
import type { UserDictionaryItem } from '@/core/domains/user/actions/user-dictionary-actions';
import {
  getSimpleWordAnalytics,
  type SimpleWordAnalytics,
} from '@/core/domains/user/actions/simple-word-analytics';
import {
  PerformanceTimeline,
  MistakePatternAnalysis,
  PredictiveInsights,
} from './word-analytics';

interface EnhancedWordDifficultyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  word: UserDictionaryItem | null;
}

export function EnhancedWordDifficultyDialog({
  isOpen,
  onClose,
  word,
}: EnhancedWordDifficultyDialogProps) {
  const [analytics, setAnalytics] = useState<SimpleWordAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchWordAnalytics = useCallback(async () => {
    if (!word) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getSimpleWordAnalytics(word.userId, word.id);
      if (result.success && result.analytics) {
        setAnalytics(result.analytics);
      } else {
        setError(result.error || 'Failed to load word analytics');
      }
    } catch {
      setError('Failed to analyze word performance');
      toast.error('Failed to load word analytics');
    } finally {
      setLoading(false);
    }
  }, [word]);

  useEffect(() => {
    if (isOpen && word) {
      fetchWordAnalytics();
    }
    // Reset tab when dialog opens
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen, word, fetchWordAnalytics]);

  const getStatusIcon = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case LearningStatus.inProgress:
        return <Activity className="h-4 w-4 text-blue-500" />;
      case LearningStatus.needsReview:
        return <RotateCcw className="h-4 w-4 text-yellow-500" />;
      case LearningStatus.difficult:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case LearningStatus.notStarted:
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!word) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced Performance Analysis: &ldquo;{word.word}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Comprehensive AI-powered analysis of your learning progress,
            performance patterns, and personalized recommendations
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Analyzing word performance...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={fetchWordAnalytics}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {analytics && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="session">Session Analysis</TabsTrigger>
              <TabsTrigger value="progression">Progression</TabsTrigger>
              <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
              <TabsTrigger value="comparative">Comparative</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="predictions">AI Insights</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Overall Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.basicMetrics.masteryScore.toFixed(0)}%
                    </div>
                    <Progress
                      value={analytics.basicMetrics.masteryScore}
                      className="h-2 mt-1"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Mastery Score
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getStatusIcon(word.learningStatus)}
                      Learning Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="mb-2">
                      {word.learningStatus}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      SRS Level: {analytics.basicMetrics.srsLevel}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.basicMetrics.totalAttempts > 0
                        ? (
                            (analytics.basicMetrics.correctAttempts /
                              analytics.basicMetrics.totalAttempts) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.basicMetrics.correctAttempts} /{' '}
                      {analytics.basicMetrics.totalAttempts} attempts
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Response Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {(
                        analytics.basicMetrics.averageResponseTime / 1000
                      ).toFixed(1)}
                      s
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Average response time
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {analytics.basicMetrics.currentStreak}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current Streak
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {analytics.basicMetrics.mistakeCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Mistakes
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {analytics.basicMetrics.skipCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Times Skipped
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {analytics.progressionMetrics.lastUsedRecency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Days Since Last Use
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visual Learning Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Learning Modality Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-lg font-bold">
                        {(
                          analytics.visualLearning.modalityEffectiveness
                            .textual ?? 0
                        ).toFixed(0)}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Text Learning
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <Eye className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-lg font-bold">
                        {(
                          analytics.visualLearning.modalityEffectiveness
                            .visual ?? 0
                        ).toFixed(0)}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Visual Learning
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <Volume2 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-lg font-bold">
                        {(
                          analytics.visualLearning.modalityEffectiveness
                            .auditory ?? 0
                        ).toFixed(0)}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Audio Learning
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Badge variant="outline">
                      Preferred:{' '}
                      {analytics.visualLearning.preferredLearningModality}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
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
                      <div className="text-lg font-bold text-green-600">
                        {analytics.sessionPerformance.fastestResponseTime.toFixed(
                          0,
                        )}
                        ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Fastest Response
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {analytics.sessionPerformance.medianResponseTime.toFixed(
                          0,
                        )}
                        ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Median Response
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {analytics.sessionPerformance.slowestResponseTime.toFixed(
                          0,
                        )}
                        ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Slowest Response
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {analytics.sessionPerformance.responseTimeConsistency.toFixed(
                          0,
                        )}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Consistency Score
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">
                      Attempt Pattern Analysis
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {analytics.sessionPerformance.firstAttemptSuccessRate.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          First Attempt Success
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {analytics.sessionPerformance.multipleAttemptSuccessRate.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Recovery Success Rate
                        </div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">
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

              {/* Session Position Effect */}
              {Object.values(
                analytics.sessionPerformance.sessionPositionEffect,
              ).some((val) => val > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Session Position Performance
                    </CardTitle>
                    <CardDescription>
                      How your performance varies by position within practice
                      sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.sessionPerformance.sessionPositionEffect.early.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Early Session
                        </div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {analytics.sessionPerformance.sessionPositionEffect.middle.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Middle Session
                        </div>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {analytics.sessionPerformance.sessionPositionEffect.late.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Late Session
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Session Analysis Tab */}
            <TabsContent value="session" className="space-y-6">
              {/* Time-of-Day Performance */}
              {analytics.sessionPerformance.performanceBySessionTime.length >
                0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Performance by Time of Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.sessionPerformance.performanceBySessionTime
                        .sort((a, b) => a.hour - b.hour)
                        .map((timeData) => (
                          <div
                            key={timeData.hour}
                            className="flex items-center gap-3"
                          >
                            <span className="text-sm w-16">
                              {timeData.hour.toString().padStart(2, '0')}:00
                            </span>
                            <div className="flex-grow">
                              <Progress
                                value={timeData.accuracy}
                                className="h-3"
                              />
                            </div>
                            <span className="text-sm font-medium w-16">
                              {timeData.accuracy.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contextual Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Optimal Performance Context
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <h4 className="font-medium mb-2">Best Time of Day</h4>
                      <div className="text-lg font-bold">
                        {analytics.contextualMetrics.timeOfDayOptimal.hour
                          .toString()
                          .padStart(2, '0')}
                        :00
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {analytics.contextualMetrics.timeOfDayOptimal.accuracy.toFixed(
                          1,
                        )}
                        % accuracy
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <h4 className="font-medium mb-2">
                        Optimal Session Length
                      </h4>
                      <div className="text-lg font-bold">
                        {analytics.contextualMetrics.sessionLengthOptimal} min
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Recommended duration
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progression Tab */}
            <TabsContent value="progression" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Learning Progression Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {analytics.progressionMetrics.masteryVelocity.toFixed(
                          2,
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Mastery Velocity
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {analytics.progressionMetrics.masteryStabilityIndex.toFixed(
                          0,
                        )}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Stability Index
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {analytics.progressionMetrics.retentionStrength.toFixed(
                          0,
                        )}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Retention Strength
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
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
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {analytics.progressionMetrics.srsIntervalOptimality.toFixed(
                            0,
                          )}
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Interval Optimality
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {analytics.progressionMetrics.srsSuccessRate.toFixed(
                            0,
                          )}
                          %
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SRS Success Rate
                        </div>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          {analytics.progressionMetrics.srsRegressionCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Regression Count
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mistakes Tab */}
            <TabsContent value="mistakes" className="space-y-6">
              <MistakePatternAnalysis
                errorAnalytics={analytics.errorAnalytics}
                wordText={word.word}
              />
            </TabsContent>

            {/* Comparative Tab */}
            <TabsContent value="comparative" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Comparative Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
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
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {analytics.comparativeMetrics.personalAverageComparison
                          .accuracy > 0
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
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {analytics.comparativeMetrics.difficultyPercentile.toFixed(
                          0,
                        )}
                        %
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
                      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <h5 className="font-medium mb-2">Efficiency Index</h5>
                        <div className="text-lg font-bold">
                          {analytics.comparativeMetrics.learningEfficiencyIndex.toFixed(
                            2,
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <h5 className="font-medium mb-2">Predicted Mastery</h5>
                        <div className="text-lg font-bold">
                          {analytics.comparativeMetrics.predictedTimeToMastery}{' '}
                          days
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-6">
              <PerformanceTimeline
                timeline={analytics.timeline}
                wordText={word.word}
              />
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="predictions" className="space-y-6">
              <PredictiveInsights
                predictions={analytics.predictions}
                insights={analytics.insights}
                wordText={word.word}
              />
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
