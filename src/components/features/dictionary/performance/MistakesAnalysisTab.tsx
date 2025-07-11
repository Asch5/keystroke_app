import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
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
import { TabsContent } from '@/components/ui/tabs';
import { DictionaryPerformanceMetrics } from '@/core/domains/user/actions/dictionary-performance-actions';
import { formatPercentage, getPercentageColor } from './utils';

interface MistakesAnalysisTabProps {
  metrics: DictionaryPerformanceMetrics;
}

export const MistakesAnalysisTab = React.memo<MistakesAnalysisTabProps>(
  ({ metrics }) => {
    const { mistakeAnalysis } = metrics;

    return (
      <TabsContent value="mistakes" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-error-foreground" />
                Mistake Overview
              </CardTitle>
              <CardDescription>
                Analysis of errors and learning challenges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Mistakes</span>
                  <span className="text-sm font-bold">
                    {mistakeAnalysis.totalMistakes}
                  </span>
                </div>
                <Progress
                  value={Math.min(mistakeAnalysis.totalMistakes, 100)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Mistake Rate</span>
                  <span
                    className={`text-sm font-bold ${getPercentageColor(
                      100 - mistakeAnalysis.mistakeRate,
                    )}`}
                  >
                    {formatPercentage(mistakeAnalysis.mistakeRate)}
                  </span>
                </div>
                <Progress value={mistakeAnalysis.mistakeRate} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Average Mistakes per Word
                  </span>
                  <span className="text-sm font-bold">
                    {mistakeAnalysis.averageMistakesPerWord.toFixed(1)}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    mistakeAnalysis.averageMistakesPerWord * 20,
                    100,
                  )}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Improvement Rate</span>
                  <span
                    className={`text-sm font-bold flex items-center gap-1 ${getPercentageColor(
                      mistakeAnalysis.improvementRate,
                    )}`}
                  >
                    {mistakeAnalysis.improvementRate > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatPercentage(
                      Math.abs(mistakeAnalysis.improvementRate),
                    )}
                  </span>
                </div>
                <Progress
                  value={Math.abs(mistakeAnalysis.improvementRate)}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-foreground" />
                Most Problematic Words
              </CardTitle>
              <CardDescription>
                Words with the highest number of mistakes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mistakeAnalysis.mostProblematicWords.length > 0 ? (
                  mistakeAnalysis.mostProblematicWords
                    .slice(0, 6)
                    .map((word) => (
                      <div
                        key={word.wordText}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium">{word.wordText}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            {word.mistakeCount} errors
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatPercentage(
                              (word.mistakeCount /
                                mistakeAnalysis.totalMistakes) *
                                100,
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    No problematic words identified yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mistake Types Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-info-foreground" />
              Mistake Types Breakdown
            </CardTitle>
            <CardDescription>
              Analysis of different types of mistakes you make
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mistakeAnalysis.mistakesByType.length > 0 ? (
                mistakeAnalysis.mistakesByType.slice(0, 5).map((mistake) => (
                  <div key={mistake.type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">
                        {mistake.type.replace('_', ' ')}
                      </span>
                      <span className="font-bold">
                        {mistake.count} ({formatPercentage(mistake.percentage)})
                      </span>
                    </div>
                    <Progress value={mistake.percentage} className="h-2" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  No mistake patterns identified yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Highest Mistake Word */}
        {mistakeAnalysis.highestMistakeWord && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-error-foreground" />
                Word Needing Most Attention
              </CardTitle>
              <CardDescription>
                The word with the highest number of mistakes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-error-subtle rounded-lg">
                <div>
                  <div className="font-bold text-lg">
                    {mistakeAnalysis.highestMistakeWord.wordText}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Focus on this word during your next practice session
                  </div>
                </div>
                <Badge variant="destructive" className="text-sm">
                  {mistakeAnalysis.highestMistakeWord.mistakeCount} mistakes
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    );
  },
);

MistakesAnalysisTab.displayName = 'MistakesAnalysisTab';
