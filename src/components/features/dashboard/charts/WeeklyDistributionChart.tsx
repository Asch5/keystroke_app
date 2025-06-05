'use client';

import { useMemo } from 'react';

interface WeeklyDistributionData {
  day: string;
  sessions: number;
}

interface WeeklyDistributionChartProps {
  data: WeeklyDistributionData[];
}

/**
 * Simple bar chart component displaying weekly activity distribution
 */
export function WeeklyDistributionChart({
  data,
}: WeeklyDistributionChartProps) {
  const maxSessions = useMemo(() => {
    return Math.max(...data.map((item) => item.sessions), 1);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No weekly activity data available
      </div>
    );
  }

  return (
    <div className="w-full h-48 p-4">
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((item, index) => {
          const barHeight = (item.sessions / maxSessions) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="flex flex-col items-center justify-end h-32 w-full">
                <div className="text-xs text-center mb-1 text-muted-foreground">
                  {item.sessions}
                </div>
                <div
                  className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                  style={{
                    height: `${barHeight}%`,
                    minHeight: item.sessions > 0 ? '4px' : '0px',
                  }}
                />
              </div>
              <div className="text-xs text-center mt-2 text-muted-foreground font-medium">
                {item.day.substring(0, 3)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
