import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { DictionaryPerformanceSection } from '@/components/features/dictionary/DictionaryPerformanceSection';
import type { DictionaryPerformanceMetrics } from '@/core/domains/user/actions/dictionary-performance-actions';

interface PerformanceAnalyticsTabProps {
  performanceMetrics: DictionaryPerformanceMetrics | null;
}

export const PerformanceAnalyticsTab: React.FC<
  PerformanceAnalyticsTabProps
> = ({ performanceMetrics }) => {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 animate-pulse" />
                Loading Performance Analytics...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        }
      >
        {performanceMetrics ? (
          <DictionaryPerformanceSection
            metrics={performanceMetrics}
            isLoading={!performanceMetrics}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-info-foreground" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance data will appear here once you have more practice
                sessions. Start practicing to unlock comprehensive analytics!
              </div>
            </CardContent>
          </Card>
        )}
      </Suspense>
    </div>
  );
};
