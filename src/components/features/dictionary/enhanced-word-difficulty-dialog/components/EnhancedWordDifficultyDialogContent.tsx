'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { EnhancedWordDifficultyDialogProps } from '../types';
import { useWordAnalytics } from '../hooks/useWordAnalytics';
import { OverviewTab } from './OverviewTab';
import { PerformanceTab } from './PerformanceTab';
import { ComparativeTab } from './ComparativeTab';
import {
  PerformanceTimeline,
  MistakePatternAnalysis,
  PredictiveInsights,
} from '../../word-analytics';

export function EnhancedWordDifficultyDialogContent({
  isOpen,
  onClose,
  word,
}: EnhancedWordDifficultyDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { analytics, loading, error, refetch } = useWordAnalytics(isOpen, word);

  // Reset tab when dialog opens
  if (isOpen && activeTab !== 'overview') {
    setActiveTab('overview');
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading word analytics...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Retry
          </Button>
        </div>
      );
    }

    if (!analytics || !word) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      );
    }

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
          <TabsTrigger value="comparative">Comparative</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="predictions">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab analytics={analytics} word={word} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab analytics={analytics} />
        </TabsContent>

        <TabsContent value="mistakes" className="space-y-6">
          <MistakePatternAnalysis
            errorAnalytics={analytics.errorAnalytics}
            wordText={word.word}
          />
        </TabsContent>

        <TabsContent value="comparative" className="space-y-6">
          <ComparativeTab analytics={analytics} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <PerformanceTimeline
            timeline={analytics.timeline}
            wordText={word.word}
          />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictiveInsights
            predictions={analytics.predictions}
            insights={analytics.insights}
            wordText={word.word}
          />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Enhanced Word Analysis{word ? ` - "${word.word}"` : ''}
          </DialogTitle>
          <DialogDescription>
            Comprehensive analytics and performance insights for your word
            learning progress.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
