import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TabsContent } from '@/components/ui/tabs';
import { Activity, Star, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DictionaryPerformanceMetrics } from '@/core/domains/user/actions/dictionary-performance-actions';

interface PerformanceScoresTabProps {
  metrics: DictionaryPerformanceMetrics;
}

export const PerformanceScoresTab = React.memo<PerformanceScoresTabProps>(
  ({ metrics }) => {
    const { performanceScores, individualWordPerformance } = metrics;

    return (
      <TabsContent value="scores" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-info-foreground" />
              Performance Scores (70% weight)
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of word difficulty based on learning
              progress and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Mistake Rate Score</span>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {performanceScores.mistakeRateScore.toFixed(1)}/10
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (25% weight)
                  </span>
                </div>
              </div>
              <Progress
                value={performanceScores.mistakeRateScore * 10}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                Frequency of mistakes during practice (fewer mistakes = higher
                score)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Streak Consistency Score</span>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {performanceScores.streakConsistencyScore.toFixed(1)}/10
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (20% weight)
                  </span>
                </div>
              </div>
              <Progress
                value={performanceScores.streakConsistencyScore * 10}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                Consistency of correct answer streaks (longer streaks = higher
                score)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Response Time Score</span>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {performanceScores.responseTimeScore.toFixed(1)}/10
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (15% weight)
                  </span>
                </div>
              </div>
              <Progress
                value={performanceScores.responseTimeScore * 10}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                Speed of responses during practice (faster responses = higher
                score)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Skip Behavior Score</span>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {performanceScores.skipBehaviorScore.toFixed(1)}/10
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (15% weight)
                  </span>
                </div>
              </div>
              <Progress
                value={performanceScores.skipBehaviorScore * 10}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                How often you skip words during practice (fewer skips = higher
                score)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">SRS Progression Score</span>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {performanceScores.srsProgressionScore.toFixed(1)}/10
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (15% weight)
                  </span>
                </div>
              </div>
              <Progress
                value={performanceScores.srsProgressionScore * 10}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                Spaced Repetition System advancement level (higher levels =
                higher score)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Improvement Trend Score</span>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {performanceScores.improvementTrendScore.toFixed(1)}/10
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (10% weight)
                  </span>
                </div>
              </div>
              <Progress
                value={performanceScores.improvementTrendScore * 10}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground">
                Recent performance trends and improvement patterns
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Overall Performance Score</span>
                <span
                  className={`${
                    performanceScores.overallPerformanceScore >= 7
                      ? 'text-success-foreground'
                      : performanceScores.overallPerformanceScore >= 5
                        ? 'text-warning-foreground'
                        : 'text-error-foreground'
                  }`}
                >
                  {performanceScores.overallPerformanceScore.toFixed(1)}/10
                </span>
              </div>
              <Progress
                value={performanceScores.overallPerformanceScore * 10}
                className="h-4"
              />
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div className="text-center">
                  <div className="w-3 h-3 bg-error-foreground rounded-full mx-auto mb-1"></div>
                  0-4: Needs Work
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-warning-foreground rounded-full mx-auto mb-1"></div>
                  5-6: Good Progress
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-success-foreground rounded-full mx-auto mb-1"></div>
                  7-10: Excellent
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Word Performance Summary */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning-foreground" />
                Top Performing Words
              </CardTitle>
              <CardDescription>
                Words with highest mastery scores and consistent performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {individualWordPerformance.topPerformingWords
                  .slice(0, 5)
                  .map((word, index) => (
                    <div
                      key={`${word.wordText}-${index}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">{word.wordText}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {word.masteryScore.toFixed(0)}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Streak: {word.correctStreak}
                        </span>
                      </div>
                    </div>
                  ))}
                {individualWordPerformance.topPerformingWords.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Start practicing to see your top performing words here
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-error-foreground" />
                Words Needing Attention
              </CardTitle>
              <CardDescription>
                Words with frequent mistakes or low performance scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {individualWordPerformance.strugglingWords
                  .slice(0, 5)
                  .map((word, index) => (
                    <div
                      key={`${word.wordText}-${index}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">{word.wordText}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {word.mistakeCount} mistakes
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Skips: {word.skipCount}
                        </span>
                      </div>
                    </div>
                  ))}
                {individualWordPerformance.strugglingWords.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Great job! No words need special attention right now
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    );
  },
);

PerformanceScoresTab.displayName = 'PerformanceScoresTab';
