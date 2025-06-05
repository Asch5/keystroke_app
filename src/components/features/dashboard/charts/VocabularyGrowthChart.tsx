'use client';

import { useMemo } from 'react';

interface VocabularyGrowthData {
  date: string;
  totalWords: number;
}

interface VocabularyGrowthChartProps {
  data: VocabularyGrowthData[];
}

/**
 * Simple area chart component displaying vocabulary growth over time
 */
export function VocabularyGrowthChart({ data }: VocabularyGrowthChartProps) {
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
    return Math.max(...data.map((item) => item.totalWords), 1);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No vocabulary growth data available
      </div>
    );
  }

  return (
    <div className="w-full h-48 p-4">
      <div className="flex items-end justify-between h-full space-x-1">
        {chartData.slice(-10).map((item, index) => {
          const barHeight = (item.totalWords / maxWords) * 100;
          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1 min-w-0"
            >
              <div className="flex flex-col items-center justify-end h-32 w-full">
                <div className="text-xs text-center mb-1 text-muted-foreground">
                  {item.totalWords}
                </div>
                <div
                  className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t transition-all duration-300"
                  style={{
                    height: `${barHeight}%`,
                    minHeight: item.totalWords > 0 ? '4px' : '0px',
                  }}
                />
              </div>
              <div className="text-xs text-center mt-2 text-muted-foreground font-medium truncate w-full">
                {item.formattedDate}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
