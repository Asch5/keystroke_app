'use client';

import { useMemo } from 'react';

interface MistakeAnalysisData {
  type: string;
  count: number;
}

interface MistakeAnalysisChartProps {
  data: MistakeAnalysisData[];
}

/**
 * Simple horizontal bar chart component displaying mistake types distribution
 */
export function MistakeAnalysisChart({ data }: MistakeAnalysisChartProps) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map((item) => item.count), 1);
  }, [data]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.count - a.count);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No mistake analysis data available
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 p-4">
      {sortedData.map((item, index) => {
        const barWidth = (item.count / maxCount) * 100;
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium capitalize">
                {item.type.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-muted-foreground">
                {item.count} mistake{item.count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-destructive h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${barWidth}%`,
                  minWidth: item.count > 0 ? '8px' : '0px',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
