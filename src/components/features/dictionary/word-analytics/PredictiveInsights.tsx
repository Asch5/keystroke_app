import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Clock,
  Lightbulb,
  Zap,
  Award,
  BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SimpleWordAnalytics } from '@/core/domains/user/actions/simple-word-analytics';

interface PredictiveInsightsProps {
  predictions: SimpleWordAnalytics['predictions'];
  insights: SimpleWordAnalytics['insights'];
  wordText: string;
}

export const PredictiveInsights = React.memo<PredictiveInsightsProps>(
  ({ predictions, insights, wordText }) => {
    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'low':
          return 'bg-success-foreground text-white';
        case 'medium':
          return 'bg-warning-foreground text-black';
        case 'high':
          return 'bg-error-foreground text-white';
        default:
          return 'bg-content-secondary text-white';
      }
    };

    const getInsightIcon = (type: string) => {
      switch (type) {
        case 'improvement':
          return <TrendingUp className="h-4 w-4 text-success-foreground" />;
        case 'concern':
          return <AlertTriangle className="h-4 w-4 text-error-foreground" />;
        case 'achievement':
          return <Award className="h-4 w-4 text-warning-foreground" />;
        case 'recommendation':
          return <Lightbulb className="h-4 w-4 text-info-foreground" />;
        default:
          return <Brain className="h-4 w-4 text-content-secondary" />;
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high':
          return 'destructive';
        case 'medium':
          return 'default';
        case 'low':
          return 'secondary';
        default:
          return 'outline';
      }
    };

    return (
      <div className="space-y-6">
        {/* Retention Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-modern-slate-foreground" />
              Retention Predictions
            </CardTitle>
            <CardDescription>
              AI-powered predictions for how well you&apos;ll remember &ldquo;
              {wordText}&rdquo;
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-modern-slate-subtle rounded-lg">
                <Badge className={getRiskColor(predictions.retentionRisk)}>
                  {predictions.retentionRisk.toUpperCase()} RISK
                </Badge>
                <div className="text-sm text-muted-foreground mt-2">
                  Forgetting Risk
                </div>
              </div>
              <div className="text-center p-4 bg-info-subtle rounded-lg">
                <div className="text-lg font-bold text-info-foreground">
                  {formatDistanceToNow(predictions.nextReviewOptimalTiming)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Optimal Review Time
                </div>
              </div>
              <div className="text-center p-4 bg-warning-subtle rounded-lg">
                <div className="text-lg font-bold text-warning-foreground">
                  {predictions.plateauRisk.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Plateau Risk
                </div>
              </div>
            </div>

            <Separator />

            {/* Forgetting Curve */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Forgetting Curve Prediction
              </h4>
              <div className="space-y-2">
                {predictions.forgettingCurvePrediction.map((point, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm w-12">
                      {point.days} day{point.days !== 1 ? 's' : ''}
                    </span>
                    <div className="flex-grow">
                      <Progress
                        value={point.retentionProbability * 100}
                        className="h-3"
                      />
                    </div>
                    <span className="text-sm font-medium w-12">
                      {(point.retentionProbability * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Probability of remembering this word after different time
                periods
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mastery Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-success-foreground" />
              Mastery Timeline Estimates
            </CardTitle>
            <CardDescription>
              Projected time to achieve full mastery based on current progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-error-subtle rounded-lg">
                <div className="text-2xl font-bold text-error-foreground">
                  {predictions.masteryTimelineEstimate.conservative}
                </div>
                <div className="text-sm text-muted-foreground">
                  Conservative
                </div>
                <div className="text-xs text-muted-foreground">days</div>
              </div>
              <div className="text-center p-4 bg-info-subtle rounded-lg">
                <div className="text-2xl font-bold text-info-foreground">
                  {predictions.masteryTimelineEstimate.realistic}
                </div>
                <div className="text-sm text-muted-foreground">Realistic</div>
                <div className="text-xs text-muted-foreground">days</div>
              </div>
              <div className="text-center p-4 bg-success-subtle rounded-lg">
                <div className="text-2xl font-bold text-success-foreground">
                  {predictions.masteryTimelineEstimate.optimistic}
                </div>
                <div className="text-sm text-muted-foreground">Optimistic</div>
                <div className="text-xs text-muted-foreground">days</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adaptive Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning-foreground" />
              AI-Powered Recommendations
            </CardTitle>
            <CardDescription>
              Personalized suggestions to optimize your learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-info-subtle rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4" />
                  Next Best Exercise
                </h4>
                <Badge variant="outline" className="mb-2">
                  {predictions.nextBestExerciseType}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Recommended based on your current performance pattern
                </p>
              </div>
              <div className="p-4 bg-warning-subtle rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  Practice Intensity
                </h4>
                <Badge
                  variant={
                    predictions.practiceIntensityRecommendation === 'increase'
                      ? 'destructive'
                      : predictions.practiceIntensityRecommendation ===
                          'decrease'
                        ? 'secondary'
                        : 'default'
                  }
                  className="mb-2"
                >
                  {predictions.practiceIntensityRecommendation.toUpperCase()}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Adjust practice frequency for optimal learning
                </p>
              </div>
            </div>

            {predictions.difficultyAdjustmentNeeded !== 0 && (
              <div className="p-3 bg-warning-subtle rounded-lg">
                <h4 className="font-medium mb-2">Difficulty Adjustment</h4>
                <p className="text-sm">
                  {predictions.difficultyAdjustmentNeeded > 0
                    ? 'Consider increasing difficulty for this word'
                    : 'Consider reducing difficulty for this word'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakthrough Recommendations */}
        {predictions.breakThroughRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success-foreground" />
                Breakthrough Strategies
              </CardTitle>
              <CardDescription>
                Specific strategies to overcome learning plateaus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {predictions.breakThroughRecommendations.map(
                  (recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-success-subtle rounded-lg"
                    >
                      <Lightbulb className="h-4 w-4 mt-0.5 text-success-foreground flex-shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Smart Insights */}
        {insights.insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-info-foreground" />
                Smart Insights
              </CardTitle>
              <CardDescription>
                AI-generated insights about your learning pattern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{insight.title}</h5>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      {insight.actionable && insight.suggestedAction && (
                        <div className="mt-2 p-2 bg-info-subtle rounded text-xs">
                          <strong>Suggested Action:</strong>{' '}
                          {insight.suggestedAction}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personalized Recommendations */}
        {insights.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning-foreground" />
                Personalized Action Plan
              </CardTitle>
              <CardDescription>
                Specific recommendations tailored to your learning needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.recommendations
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return (
                      priorityOrder[b.priority as keyof typeof priorityOrder] -
                      priorityOrder[a.priority as keyof typeof priorityOrder]
                    );
                  })
                  .map((rec, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={getPriorityColor(rec.priority)}
                          className="text-xs"
                        >
                          {rec.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rec.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h5 className="font-medium mb-1">{rec.recommendation}</h5>
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <strong>Expected Improvement:</strong>{' '}
                          {rec.expectedImprovement}
                        </div>
                        <div>
                          <strong>Effort Required:</strong>{' '}
                          <Badge variant="outline" className="text-xs">
                            {rec.effort}
                          </Badge>
                        </div>
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

PredictiveInsights.displayName = 'PredictiveInsights';
