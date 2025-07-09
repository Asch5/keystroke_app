import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
import { DictionaryPerformanceMetrics } from '@/core/domains/user/actions/dictionary-performance-actions';
import {
  PerformanceOverviewTab,
  PerformanceScoresTab,
  MistakesAnalysisTab,
  LearningEfficiencyTab,
} from './performance';

/**
 * Dictionary Performance Section Component Props Interface
 */
interface DictionaryPerformanceSectionProps {
  /** Comprehensive performance metrics for the user's dictionary */
  metrics: DictionaryPerformanceMetrics;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
}

/**
 * Get trend indicator based on improvement trend
 */
function getTrendIndicator(trend: 'improving' | 'stable' | 'declining') {
  switch (trend) {
    case 'improving':
      return {
        icon: TrendingUp,
        color: 'text-success-foreground',
        label: 'Improving',
      };
    case 'declining':
      return {
        icon: TrendingDown,
        color: 'text-error-foreground',
        label: 'Declining',
      };
    default:
      return { icon: Target, color: 'text-content-secondary', label: 'Stable' };
  }
}

/**
 * Loading state component for performance section
 */
const PerformanceLoadingState = React.memo(() => (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 animate-pulse" />
        <CardTitle>Performance Analytics</CardTitle>
      </div>
      <CardDescription>
        Loading your learning performance data...
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </CardContent>
  </Card>
));

PerformanceLoadingState.displayName = 'PerformanceLoadingState';

/**
 * Dictionary Performance Section Component
 *
 * Comprehensive performance analytics dashboard for user's dictionary learning progress.
 * Displays detailed metrics across multiple categories including learning efficiency,
 * practice performance, mistake analysis, study habits, vocabulary management,
 * review system effectiveness, and difficulty distribution.
 *
 * Features:
 * - Learning Efficiency: Time to master, learning velocity, retention rates
 * - Practice Performance: Accuracy, response times, consistency, improvement trends
 * - Mistake Analysis: Error patterns, problematic words, improvement tracking
 * - Study Habits: Study streaks, preferred times, consistency patterns
 * - Vocabulary Management: Addition rates, customization, media content
 * - Review System: SRS effectiveness, compliance, upcoming reviews
 * - Difficulty Distribution: Status breakdowns, mastery ranges, challenging areas
 *
 * @param {DictionaryPerformanceSectionProps} props - Component properties
 * @returns {JSX.Element} The comprehensive performance analytics interface
 */
export const DictionaryPerformanceSection =
  React.memo<DictionaryPerformanceSectionProps>(
    ({ metrics, isLoading = false }) => {
      if (isLoading) {
        return <PerformanceLoadingState />;
      }

      const { practicePerformance } = metrics;
      const trendIndicator = getTrendIndicator(
        practicePerformance.improvementTrend,
      );
      const TrendIcon = trendIndicator.icon;

      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-info-foreground" />
                <CardTitle>Performance Analytics</CardTitle>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendIcon className={`h-3 w-3 ${trendIndicator.color}`} />
                {trendIndicator.label}
              </Badge>
            </div>
            <CardDescription>
              Comprehensive analysis of your learning progress, practice
              performance, and vocabulary mastery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
                <TabsTrigger value="practice">Practice</TabsTrigger>
                <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
                <TabsTrigger value="habits">Habits</TabsTrigger>
                <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
                <TabsTrigger value="scores">Scores</TabsTrigger>
              </TabsList>

              {/* Extracted Tab Components */}
              <PerformanceOverviewTab metrics={metrics} />
              <LearningEfficiencyTab metrics={metrics} />
              <PerformanceScoresTab metrics={metrics} />
              <MistakesAnalysisTab metrics={metrics} />

              {/* TODO: Extract remaining tabs to separate components */}
              {/* PracticePerformanceTab */}
              {/* StudyHabitsTab */}
              {/* VocabularyManagementTab */}
              {/* ReviewSystemTab */}
            </Tabs>
          </CardContent>
        </Card>
      );
    },
  );

DictionaryPerformanceSection.displayName = 'DictionaryPerformanceSection';
