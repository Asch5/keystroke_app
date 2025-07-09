import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Brain } from 'lucide-react';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';
import { LearningProgressChart } from '../charts/LearningProgressChart';
import { VocabularyGrowthChart } from '../charts/VocabularyGrowthChart';

interface LearningProgressTabProps {
  statistics: UserStatistics;
  analytics: {
    dailyProgress: { date: string; wordsStudied: number; accuracy: number }[];
    vocabularyGrowth: { date: string; totalWords: number }[];
  } | null;
}

export const LearningProgressTab: React.FC<LearningProgressTabProps> = ({
  statistics,
  analytics,
}) => {
  return (
    <div className="space-y-4">
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
                <span>{statistics.learningProgress.wordsNeedingReview}</span>
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
                <div className="text-xs text-muted-foreground">Best Streak</div>
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
    </div>
  );
};
