'use client';

import { useEffect, useState, memo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getUserStatistics,
  getLearningAnalytics,
} from '@/core/domains/user/actions/user-stats-actions';
import type { UserStatistics } from '@/core/domains/user/actions/user-stats-actions';
import {
  getDictionaryPerformanceMetrics,
  type DictionaryPerformanceMetrics,
} from '@/core/domains/user/actions/dictionary-performance-actions';

import { StatisticsOverview } from './StatisticsOverview';
import {
  LearningProgressTab,
  SessionAnalyticsTab,
  PerformanceAnalyticsTab,
  WordAnalyticsTab,
  MistakeAnalysisTab,
  AchievementsTab,
  GoalsTab,
  LanguageProgressTab,
} from './statistics-tabs';

interface StatisticsContentProps {
  userId: string;
}

/**
 * Main statistics content component displaying comprehensive user analytics
 * Memoized to prevent unnecessary re-renders when parent updates but props remain same
 */
const StatisticsContent = memo(function StatisticsContent({
  userId,
}: StatisticsContentProps) {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [analytics, setAnalytics] = useState<{
    dailyProgress: { date: string; wordsStudied: number; accuracy: number }[];
    mistakesByType: { type: string; count: number }[];
    learningPatterns: {
      mostActiveHour: number;
      averageSessionLength: number;
      preferredSessionType: string;
      weeklyDistribution: { day: string; sessions: number }[];
    };
    vocabularyGrowth: { date: string; totalWords: number }[];
  } | null>(null);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<DictionaryPerformanceMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized fetch function to prevent recreation on every render
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsResult, analyticsResult, performanceResult] =
        await Promise.all([
          getUserStatistics(userId),
          getLearningAnalytics(userId, 30),
          getDictionaryPerformanceMetrics(userId),
        ]);

      if (statsResult.success && statsResult.statistics) {
        setStatistics(statsResult.statistics);
      } else {
        setError(statsResult.error || 'Failed to fetch statistics');
      }

      if (analyticsResult.success && analyticsResult.analytics) {
        setAnalytics(analyticsResult.analytics);
      }

      if (performanceResult.success && performanceResult.metrics) {
        setPerformanceMetrics(performanceResult.metrics);
      }

      // Word analytics are now integrated within performance metrics
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Statistics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  if (error || !statistics) {
    return (
      <div className="text-center py-8 text-error-foreground">
        Error: {error || 'No statistics available'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <StatisticsOverview statistics={statistics} />

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="word-analytics">Words</TabsTrigger>
          <TabsTrigger value="mistakes">Analysis</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
        </TabsList>

        {/* Learning Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <LearningProgressTab statistics={statistics} analytics={analytics} />
        </TabsContent>

        {/* Session Analytics Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <SessionAnalyticsTab statistics={statistics} analytics={analytics} />
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="performance" className="space-y-4">
          <PerformanceAnalyticsTab performanceMetrics={performanceMetrics} />
        </TabsContent>

        {/* Individual Word Analytics Tab */}
        <TabsContent value="word-analytics" className="space-y-4">
          <WordAnalyticsTab performanceMetrics={performanceMetrics} />
        </TabsContent>

        {/* Mistake Analysis Tab */}
        <TabsContent value="mistakes" className="space-y-4">
          <MistakeAnalysisTab statistics={statistics} analytics={analytics} />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <AchievementsTab statistics={statistics} />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <GoalsTab statistics={statistics} />
        </TabsContent>

        {/* Language Progress Tab */}
        <TabsContent value="language" className="space-y-4">
          <LanguageProgressTab statistics={statistics} />
        </TabsContent>
      </Tabs>
    </div>
  );
});

// Export the memoized component
export { StatisticsContent };
