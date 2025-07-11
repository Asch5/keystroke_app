import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  RefreshCw,
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
import type { SimpleWordAnalytics } from '@/core/domains/user/actions/simple-word-analytics';

interface MistakePatternAnalysisProps {
  errorAnalytics: SimpleWordAnalytics['errorAnalytics'];
  wordText: string;
}

export const MistakePatternAnalysis = React.memo<MistakePatternAnalysisProps>(
  ({ errorAnalytics, wordText }) => {
    const getTrendIcon = (rate: number) => {
      if (rate > 0)
        return <TrendingUp className="h-4 w-4 text-success-foreground" />;
      if (rate < 0)
        return <TrendingDown className="h-4 w-4 text-error-foreground" />;
      return <Target className="h-4 w-4 text-content-secondary" />;
    };

    const getTrendColor = (rate: number) => {
      if (rate > 0) return 'text-success-foreground';
      if (rate < 0) return 'text-error-foreground';
      return 'text-content-secondary';
    };

    return (
      <div className="space-y-6">
        {/* Mistake Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-foreground" />
              Mistake Pattern Analysis
            </CardTitle>
            <CardDescription>
              Detailed analysis of errors and learning challenges for &ldquo;
              {wordText}&rdquo;
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-foreground">
                  {errorAnalytics.mistakesByTimeOfDay
                    ? Object.values(errorAnalytics.mistakesByTimeOfDay).reduce(
                        (a, b) => a + b,
                        0,
                      )
                    : 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Mistakes
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info-foreground">
                  {errorAnalytics.recoveryTimeAfterMistake.toFixed(1)}s
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg Recovery Time
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold flex items-center justify-center gap-1 ${getTrendColor(
                    errorAnalytics.mistakeReductionRate,
                  )}`}
                >
                  {getTrendIcon(errorAnalytics.mistakeReductionRate)}
                  {Math.abs(errorAnalytics.mistakeReductionRate).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Improvement Rate
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-modern-slate-foreground">
                  {errorAnalytics.mistakeRecurrencePattern.length}
                </div>
                <div className="text-xs text-muted-foreground">Error Types</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time-Based Mistake Patterns */}
        {Object.keys(errorAnalytics.mistakesByTimeOfDay).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-info-foreground" />
                Mistakes by Time of Day
              </CardTitle>
              <CardDescription>
                When you typically make mistakes with this word
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(errorAnalytics.mistakesByTimeOfDay)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([hour, count]) => {
                    const timeLabel = `${hour.padStart(2, '0')}:00`;
                    const maxCount = Math.max(
                      ...Object.values(errorAnalytics.mistakesByTimeOfDay),
                    );
                    const percentage =
                      maxCount > 0 ? (count / maxCount) * 100 : 0;

                    return (
                      <div key={hour} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{timeLabel}</span>
                          <span className="font-medium">{count} mistakes</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Position Effect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-success-foreground" />
              Session Position Effect
            </CardTitle>
            <CardDescription>
              How your mistake rate varies by position in practice sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-info-subtle rounded-lg">
                <div className="text-2xl font-bold text-info-foreground">
                  {errorAnalytics.mistakesBySessionPosition.early}
                </div>
                <div className="text-sm text-muted-foreground">
                  Early Session
                </div>
                <div className="text-xs text-muted-foreground">
                  First third of practice
                </div>
              </div>
              <div className="text-center p-4 bg-warning-subtle rounded-lg">
                <div className="text-2xl font-bold text-warning-foreground">
                  {errorAnalytics.mistakesBySessionPosition.middle}
                </div>
                <div className="text-sm text-muted-foreground">
                  Middle Session
                </div>
                <div className="text-xs text-muted-foreground">
                  Second third of practice
                </div>
              </div>
              <div className="text-center p-4 bg-error-subtle rounded-lg">
                <div className="text-2xl font-bold text-error-foreground">
                  {errorAnalytics.mistakesBySessionPosition.late}
                </div>
                <div className="text-sm text-muted-foreground">
                  Late Session
                </div>
                <div className="text-xs text-muted-foreground">
                  Final third of practice
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mistake Recurrence Patterns */}
        {errorAnalytics.mistakeRecurrencePattern.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-modern-slate-foreground" />
                Recurring Mistake Patterns
              </CardTitle>
              <CardDescription>
                Types of mistakes you tend to repeat with this word
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorAnalytics.mistakeRecurrencePattern
                  .sort((a, b) => b.frequency - a.frequency)
                  .map((pattern, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <div className="font-medium capitalize">
                          {pattern.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last occurred:{' '}
                          {formatDistanceToNow(pattern.lastOccurrence, {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {pattern.frequency}x
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Correction Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-success-foreground" />
              Error Recovery Analysis
            </CardTitle>
            <CardDescription>
              How you typically handle mistakes with this word
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-success-foreground">
                  {errorAnalytics.errorCorrection.selfCorrected}
                </div>
                <div className="text-sm text-muted-foreground">
                  Self-Corrected
                </div>
                <div className="text-xs text-muted-foreground">
                  Fixed independently
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-info-foreground">
                  {errorAnalytics.errorCorrection.hintRequired}
                </div>
                <div className="text-sm text-muted-foreground">
                  Hint Required
                </div>
                <div className="text-xs text-muted-foreground">
                  Needed assistance
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-warning-foreground">
                  {errorAnalytics.errorCorrection.skipped}
                </div>
                <div className="text-sm text-muted-foreground">Skipped</div>
                <div className="text-xs text-muted-foreground">
                  Avoided attempt
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Misspellings */}
        {errorAnalytics.commonMisspellings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-error-foreground" />
                Common Misspellings
              </CardTitle>
              <CardDescription>
                Frequent spelling errors you make with this word
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {errorAnalytics.commonMisspellings.map((spelling, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-error-subtle rounded"
                  >
                    <span className="font-mono text-sm font-medium">
                      {spelling.incorrect}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {spelling.frequency}x
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Type Evolution */}
        {errorAnalytics.errorTypeEvolution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-modern-slate-foreground" />
                Error Pattern Evolution
              </CardTitle>
              <CardDescription>
                How your mistake patterns have changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorAnalytics.errorTypeEvolution.map((evolution, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg bg-muted/20"
                  >
                    <div className="font-medium mb-2">{evolution.period}</div>
                    <div className="flex flex-wrap gap-1">
                      {evolution.dominantErrorTypes.map((type, typeIndex) => (
                        <Badge
                          key={typeIndex}
                          variant="outline"
                          className="text-xs"
                        >
                          {type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  },
);

MistakePatternAnalysis.displayName = 'MistakePatternAnalysis';
