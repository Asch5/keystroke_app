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
import {
  Calendar,
  TrendingUp,
  Star,
  Target,
  Clock,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SimpleWordAnalytics } from '@/core/domains/user/actions/simple-word-analytics';

interface PerformanceTimelineProps {
  timeline: SimpleWordAnalytics['timeline'];
  wordText: string;
}

export const PerformanceTimeline = React.memo<PerformanceTimelineProps>(
  ({ timeline, wordText }) => {
    const getMilestoneIcon = (event: string) => {
      switch (event) {
        case 'first_attempt':
          return <Activity className="h-4 w-4 text-info-foreground" />;
        case 'first_correct':
          return <CheckCircle className="h-4 w-4 text-success-foreground" />;
        case 'streak_milestone':
          return <Star className="h-4 w-4 text-warning-foreground" />;
        case 'mastery_level':
          return <Target className="h-4 w-4 text-modern-slate-foreground" />;
        default:
          return <Clock className="h-4 w-4 text-content-secondary" />;
      }
    };

    const getMilestoneColor = (event: string) => {
      switch (event) {
        case 'first_attempt':
          return 'border-info-border bg-info-subtle';
        case 'first_correct':
          return 'border-success-border bg-success-subtle';
        case 'streak_milestone':
          return 'border-warning-border bg-warning-subtle';
        case 'mastery_level':
          return 'border-modern-slate-border bg-modern-slate-subtle';
        default:
          return 'border-content-border bg-content-subtle';
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-info-foreground" />
            Learning Journey Timeline
          </CardTitle>
          <CardDescription>
            Visual representation of your progress with &ldquo;{wordText}&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Milestones Section */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Key Milestones
            </h4>
            {timeline.milestones.length > 0 ? (
              <div className="space-y-3">
                {timeline.milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${getMilestoneColor(
                      milestone.event,
                    )}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getMilestoneIcon(milestone.event)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium capitalize">
                          {milestone.event.replace('_', ' ')}
                        </h5>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(milestone.date, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {milestone.details}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Performance:</span>
                          <Progress
                            value={milestone.performance}
                            className="h-2 w-20"
                          />
                          <span className="text-xs font-medium">
                            {milestone.performance}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start practicing to see your learning milestones</p>
              </div>
            )}
          </div>

          {/* Performance Trend Section */}
          {timeline.trendLine.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recent Performance Trend
              </h4>
              <div className="space-y-3">
                {timeline.trendLine.slice(-5).map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(point.date, { addSuffix: true })}
                      </span>
                      <Badge
                        variant={
                          point.accuracy === 100 ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {point.accuracy === 100 ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <div className="text-xs">
                      {point.responseTime > 0 && (
                        <span className="text-muted-foreground">
                          {(point.responseTime / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions Section */}
          {timeline.predictions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Performance Predictions
              </h4>
              <div className="space-y-2">
                {timeline.predictions.map((prediction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-info-subtle rounded"
                  >
                    <span className="text-sm">
                      {formatDistanceToNow(prediction.date)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={prediction.predictedPerformance}
                        className="h-2 w-16"
                      />
                      <span className="text-sm font-medium">
                        {prediction.predictedPerformance.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Predictions based on your current learning pattern and similar
                words
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);

PerformanceTimeline.displayName = 'PerformanceTimeline';
