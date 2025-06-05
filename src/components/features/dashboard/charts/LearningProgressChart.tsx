'use client';

import { useMemo } from 'react';

interface LearningProgressData {
  date: string;
  wordsStudied: number;
  accuracy: number;
}

interface LearningProgressChartProps {
  data: LearningProgressData[];
}

/**
 * Simple line chart component displaying daily learning progress with words studied and accuracy
 */
export function LearningProgressChart({ data }: LearningProgressChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [data]);

  const maxWords = useMemo(() => {
    return Math.max(...data.map((item) => item.wordsStudied), 1);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No learning data available for the selected period
      </div>
    );
  }

  return (
    <div className="w-full h-64 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>Words Studied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded-full"></div>
            <span>Accuracy (%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 h-48">
        {chartData.slice(-7).map((item, index) => {
          const wordBarHeight = (item.wordsStudied / maxWords) * 100;
          const accuracyBarHeight = item.accuracy;

          return (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className="flex flex-col items-center justify-end h-32 w-full space-y-1">
                {/* Words Studied Bar */}
                <div className="flex flex-col items-center w-1/2">
                  <div className="text-xs text-center mb-1 text-muted-foreground">
                    {item.wordsStudied}
                  </div>
                  <div
                    className="w-full bg-primary rounded-t transition-all duration-300"
                    style={{
                      height: `${wordBarHeight}%`,
                      minHeight: item.wordsStudied > 0 ? '4px' : '0px',
                    }}
                  />
                </div>

                {/* Accuracy Bar */}
                <div className="flex flex-col items-center w-1/2">
                  <div className="text-xs text-center mb-1 text-muted-foreground">
                    {item.accuracy.toFixed(0)}%
                  </div>
                  <div
                    className="w-full bg-destructive rounded-t transition-all duration-300"
                    style={{
                      height: `${accuracyBarHeight}%`,
                      minHeight: item.accuracy > 0 ? '4px' : '0px',
                    }}
                  />
                </div>
              </div>

              <div className="text-xs text-center text-muted-foreground font-medium">
                {item.formattedDate}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
