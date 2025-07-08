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
import { TrendingUp, Target, Clock, Zap, BookOpen } from 'lucide-react';
import { DictionaryPerformanceMetrics } from '@/core/domains/user/actions/dictionary-performance-actions';
import { formatPercentage, getPercentageColor } from './utils';

interface LearningEfficiencyTabProps {
  metrics: DictionaryPerformanceMetrics;
}

export const LearningEfficiencyTab = React.memo<LearningEfficiencyTabProps>(
  ({ metrics }) => {
    const { learningEfficiency } = metrics;

    return (
      <TabsContent value="efficiency" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Learning Progress
              </CardTitle>
              <CardDescription>
                Your vocabulary growth and learning speed metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Learning Velocity</span>
                  <span className="text-sm font-bold">
                    {learningEfficiency.learningVelocity.toFixed(1)} words/day
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    learningEfficiency.learningVelocity * 10,
                    100,
                  )}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  Average new words learned per day over the last 30 days
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Words Learned per Week
                  </span>
                  <span className="text-sm font-bold">
                    {learningEfficiency.wordsLearnedPerWeek.toFixed(0)}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    learningEfficiency.wordsLearnedPerWeek * 2,
                    100,
                  )}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  Weekly vocabulary expansion rate
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Mastery Progression
                  </span>
                  <span
                    className={`text-sm font-bold ${getPercentageColor(
                      learningEfficiency.masteryProgression,
                    )}`}
                  >
                    {learningEfficiency.masteryProgression.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.abs(learningEfficiency.masteryProgression)}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  Weekly improvement in average mastery scores
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Learning Effectiveness
              </CardTitle>
              <CardDescription>
                How effectively you retain and master new vocabulary
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
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of learned words still retained over time
                </p>
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
                  value={Math.max(
                    100 - learningEfficiency.averageTimeToMaster * 2,
                    0,
                  )}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  Average days from first encounter to mastery
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Efficiency Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Learning Efficiency Insights
            </CardTitle>
            <CardDescription>
              Detailed analysis of your learning patterns and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {learningEfficiency.retentionRate >= 80
                    ? 'Excellent'
                    : learningEfficiency.retentionRate >= 60
                      ? 'Good'
                      : 'Needs Work'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Retention Quality
                </div>
              </div>

              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {learningEfficiency.averageTimeToMaster <= 7
                    ? 'Fast'
                    : learningEfficiency.averageTimeToMaster <= 14
                      ? 'Average'
                      : 'Slow'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Learning Speed
                </div>
              </div>

              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {learningEfficiency.learningVelocity >= 5
                    ? 'High'
                    : learningEfficiency.learningVelocity >= 2
                      ? 'Moderate'
                      : 'Low'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Learning Velocity
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">
                Personalized Recommendations
              </h4>
              <div className="space-y-2 text-sm">
                {learningEfficiency.retentionRate < 70 && (
                  <p className="text-orange-600">
                    • Consider increasing review frequency to improve retention
                  </p>
                )}
                {learningEfficiency.averageTimeToMaster > 14 && (
                  <p className="text-blue-600">
                    • Try shorter, more frequent study sessions for faster
                    mastery
                  </p>
                )}
                {learningEfficiency.learningVelocity < 2 && (
                  <p className="text-purple-600">
                    • Gradually increase daily word targets to boost learning
                    velocity
                  </p>
                )}
                {learningEfficiency.retentionRate >= 80 &&
                  learningEfficiency.averageTimeToMaster <= 7 && (
                    <p className="text-green-600">
                      • Excellent learning efficiency! Consider challenging
                      yourself with more advanced vocabulary
                    </p>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  },
);

LearningEfficiencyTab.displayName = 'LearningEfficiencyTab';
