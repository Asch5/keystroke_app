'use client';

import { Target, TrendingUp, Eye, Volume2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TabComponentProps } from '../types';
import {
  getLearningModalityColor,
  getPerformanceColor,
} from '../utils/colorUtils';
import { getStatusIcon } from '../utils/iconUtils';

export function OverviewTab({ analytics, word }: TabComponentProps) {
  const accuracy =
    analytics.basicMetrics.totalAttempts > 0
      ? (analytics.basicMetrics.correctAttempts /
          analytics.basicMetrics.totalAttempts) *
        100
      : 0;

  return (
    <>
      {/* Word Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(word.learningStatus)}
            Word Learning Status
          </CardTitle>
          <CardDescription>
            Current progress for &ldquo;{word.word}&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Mastery Score: {analytics.basicMetrics.masteryScore.toFixed(0)}%
              </span>
              <Badge variant="outline">
                {word.learningStatus.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            </div>
            <Progress
              value={analytics.basicMetrics.masteryScore}
              className="w-full"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">
                  {analytics.basicMetrics.totalAttempts}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Attempts
                </div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {analytics.basicMetrics.correctAttempts}
                </div>
                <div className="text-sm text-muted-foreground">
                  Correct Attempts
                </div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {(analytics.basicMetrics.averageResponseTime / 1000).toFixed(
                    1,
                  )}
                  s
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Response
                </div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {analytics.basicMetrics.currentStreak}
                </div>
                <div className="text-sm text-muted-foreground">
                  Current Streak
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-success-subtle rounded-lg">
              <div className="text-lg font-bold text-success-foreground">
                {accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Overall Accuracy
              </div>
            </div>
            <div className="text-center p-4 bg-info-subtle rounded-lg">
              <div className="text-lg font-bold text-info-foreground">
                {analytics.basicMetrics.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-muted-foreground">
                Avg Response Time
              </div>
            </div>
            <div className="text-center p-4 bg-warning-subtle rounded-lg">
              <div className="text-lg font-bold text-warning-foreground">
                {analytics.basicMetrics.mistakeCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Mistakes
              </div>
            </div>
            <div className="text-center p-4 bg-modern-slate-subtle rounded-lg">
              <div className="text-lg font-bold text-modern-slate-foreground">
                {analytics.sessionPerformance.responseTimeConsistency.toFixed(
                  0,
                )}
                %
              </div>
              <div className="text-sm text-muted-foreground">Consistency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div
                className={`text-lg font-bold ${getPerformanceColor('success')}`}
              >
                {analytics.basicMetrics.srsLevel}
              </div>
              <div className="text-sm text-muted-foreground">SRS Level</div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${getPerformanceColor('info')}`}
              >
                {analytics.basicMetrics.skipCount}
              </div>
              <div className="text-sm text-muted-foreground">Times Skipped</div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${getPerformanceColor('modern')}`}
              >
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
            <div
              className={`text-center p-4 ${getLearningModalityColor('textual').bg} rounded-lg`}
            >
              <FileText
                className={`h-6 w-6 ${getLearningModalityColor('textual').icon} mx-auto mb-2`}
              />
              <div className="text-lg font-bold">
                {(
                  analytics.visualLearning.modalityEffectiveness.textual ?? 0
                ).toFixed(0)}
                %
              </div>
              <div className="text-sm text-muted-foreground">Text Learning</div>
            </div>
            <div
              className={`text-center p-4 ${getLearningModalityColor('visual').bg} rounded-lg`}
            >
              <Eye
                className={`h-6 w-6 ${getLearningModalityColor('visual').icon} mx-auto mb-2`}
              />
              <div className="text-lg font-bold">
                {(
                  analytics.visualLearning.modalityEffectiveness.visual ?? 0
                ).toFixed(0)}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                Visual Learning
              </div>
            </div>
            <div
              className={`text-center p-4 ${getLearningModalityColor('auditory').bg} rounded-lg`}
            >
              <Volume2
                className={`h-6 w-6 ${getLearningModalityColor('auditory').icon} mx-auto mb-2`}
              />
              <div className="text-lg font-bold">
                {(
                  analytics.visualLearning.modalityEffectiveness.auditory ?? 0
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
              Preferred: {analytics.visualLearning.preferredLearningModality}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
