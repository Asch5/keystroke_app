import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Brain, TrendingUp, TrendingDown } from 'lucide-react';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';
import { MistakeAnalysisChart } from '../charts/MistakeAnalysisChart';

interface MistakeAnalysisTabProps {
  statistics: UserStatistics;
  analytics: {
    mistakesByType: { type: string; count: number }[];
  } | null;
}

export const MistakeAnalysisTab: React.FC<MistakeAnalysisTabProps> = ({
  statistics,
  analytics,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Mistake Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.mistakeAnalysis.totalMistakes}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Mistakes
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Most Common Type
                </span>
                <Badge variant="destructive">
                  {statistics.mistakeAnalysis.mostCommonMistakeType}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Improvement Rate
                </span>
                <span
                  className={`font-medium flex items-center gap-1 ${
                    statistics.mistakeAnalysis.improvementRate >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {statistics.mistakeAnalysis.improvementRate >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(statistics.mistakeAnalysis.improvementRate).toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Difficult Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.mistakeAnalysis.difficultWords
                .slice(0, 5)
                .map((word, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm font-medium">{word.wordText}</span>
                    <Badge variant="outline">
                      {word.mistakeCount} mistakes
                    </Badge>
                  </div>
                ))}
              {statistics.mistakeAnalysis.difficultWords.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No difficult words identified yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {analytics && analytics.mistakesByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mistake Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <MistakeAnalysisChart data={analytics.mistakesByType} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
