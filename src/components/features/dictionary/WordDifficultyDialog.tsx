'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  Activity,
  BarChart3,
  Zap,
  Timer,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Star,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { LearningStatus } from '@/core/types';
import type { UserDictionaryItem } from '@/core/domains/user/actions/user-dictionary-actions';
import { getWordDifficultyAnalysis } from '@/core/domains/user/actions/enhanced-practice-actions';

interface WordDifficultyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  word: UserDictionaryItem | null;
}

interface DifficultyAnalysis {
  userDictionaryId: string;
  word: string;
  difficultyScore: number;
  classification: 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';
  confidence: number;
  performanceMetrics: {
    mistakeRate: number;
    correctStreak: number;
    srsLevel: number;
    learningStatus: LearningStatus;
    responseTime: number;
    skipRate: number;
    recencyFrequency: number;
    weightedScore: number;
  };
  linguisticMetrics: {
    wordRarity: number;
    phoneticIrregularity: number;
    polysemy: number;
    wordLength: number;
    semanticAbstraction: number;
    relationalComplexity: number;
    weightedScore: number;
  };
  recommendations: string[];
  nextRecommendedPracticeType: string;
  estimatedTimeToMastery: string;
}

export function WordDifficultyDialog({
  isOpen,
  onClose,
  word,
}: WordDifficultyDialogProps) {
  const [analysis, setAnalysis] = useState<DifficultyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDifficultyAnalysis = useCallback(async () => {
    if (!word) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getWordDifficultyAnalysis(word.userId, word.id);
      if (typeof result === 'string') {
        setError(result);
      } else {
        setAnalysis(result);
      }
    } catch {
      setError('Failed to analyze word difficulty');
      toast.error('Failed to load difficulty analysis');
    } finally {
      setLoading(false);
    }
  }, [word]);

  useEffect(() => {
    if (isOpen && word) {
      fetchDifficultyAnalysis();
    }
  }, [isOpen, word, fetchDifficultyAnalysis]);

  const getDifficultyColor = (classification: string) => {
    switch (classification) {
      case 'very_easy':
        return 'bg-success text-success-foreground';
      case 'easy':
        return 'bg-success-subtle text-success-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'hard':
        return 'bg-warning-subtle text-warning-foreground';
      case 'very_hard':
        return 'bg-error text-error-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (classification: string) => {
    return classification.replace('_', ' ').toUpperCase();
  };

  const getStatusIcon = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return <CheckCircle className="h-4 w-4 text-success-foreground" />;
      case LearningStatus.inProgress:
        return <Activity className="h-4 w-4 text-info-foreground" />;
      case LearningStatus.needsReview:
        return <RotateCcw className="h-4 w-4 text-warning-foreground" />;
      case LearningStatus.difficult:
        return <AlertTriangle className="h-4 w-4 text-error-foreground" />;
      case LearningStatus.notStarted:
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!word) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Difficulty Analysis: &ldquo;{word.word}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Comprehensive analysis of word difficulty based on learning progress
            and linguistic complexity
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Analyzing word difficulty...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-error-foreground mx-auto mb-2" />
            <p className="text-error-foreground">{error}</p>
            <Button
              onClick={fetchDifficultyAnalysis}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {analysis && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="linguistic">Linguistic</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Difficulty Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      className={getDifficultyColor(analysis.classification)}
                    >
                      {getDifficultyLabel(analysis.classification)}
                    </Badge>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Score</span>
                        <span className="font-medium">
                          {analysis.difficultyScore.toFixed(1)}/10
                        </span>
                      </div>
                      <Progress
                        value={analysis.difficultyScore * 10}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getStatusIcon(word.learningStatus)}
                      Learning Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span>Progress</span>
                          <span className="font-medium">{word.progress}%</span>
                        </div>
                        <Progress value={word.progress} className="h-2 mt-1" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mastery Score: {word.masteryScore.toFixed(1)} |{' '}
                        {word.reviewCount} reviews
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {(analysis.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Analysis reliability based on available data
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quick Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Performance Metrics
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Mistake Rate</span>
                          <span>
                            {(
                              analysis.performanceMetrics.mistakeRate * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Correct Streak</span>
                          <span>
                            {analysis.performanceMetrics.correctStreak}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>SRS Level</span>
                          <span>{analysis.performanceMetrics.srsLevel}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Linguistic Complexity
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Word Rarity</span>
                          <span>
                            {(
                              analysis.linguisticMetrics.wordRarity * 100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phonetic Irregularity</span>
                          <span>
                            {(
                              analysis.linguisticMetrics.phoneticIrregularity *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Semantic Complexity</span>
                          <span>
                            {(
                              analysis.linguisticMetrics.semanticAbstraction *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Next Steps
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <Timer className="h-4 w-4" />
                        Recommended Practice:{' '}
                        {analysis.nextRecommendedPracticeType}
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Time to Mastery: {analysis.estimatedTimeToMastery}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance Metrics (70% weight)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries({
                    'Mistake Rate': {
                      value: analysis.performanceMetrics.mistakeRate,
                      weight: '25%',
                      description: 'How often you make mistakes with this word',
                      format: 'percentage',
                    },
                    'Correct Streak': {
                      value: analysis.performanceMetrics.correctStreak,
                      weight: '20%',
                      description: 'Number of consecutive correct answers',
                      format: 'number',
                    },
                    'SRS Level': {
                      value: analysis.performanceMetrics.srsLevel,
                      weight: '15%',
                      description: 'Spaced Repetition System advancement level',
                      format: 'number',
                    },
                    'Skip Rate': {
                      value: analysis.performanceMetrics.skipRate,
                      weight: '10%',
                      description:
                        'How often you skip this word during practice',
                      format: 'percentage',
                    },
                    'Response Time': {
                      value: analysis.performanceMetrics.responseTime,
                      weight: '10%',
                      description: 'Average time to answer correctly',
                      format: 'time',
                    },
                  }).map(([metric, data]) => (
                    <div key={metric} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{metric}</span>
                        <div className="text-right">
                          <span className="text-sm">
                            {data.format === 'percentage'
                              ? `${(data.value * 100).toFixed(1)}%`
                              : data.format === 'time'
                                ? `${data.value.toFixed(1)}s`
                                : data.value.toFixed(0)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({data.weight})
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(data.value * 100, 100)}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {data.description}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Performance Score</span>
                    <span>
                      {(analysis.performanceMetrics.weightedScore * 10).toFixed(
                        1,
                      )}
                      /10
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linguistic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Linguistic Metrics (30% weight)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries({
                    'Word Rarity': {
                      value: analysis.linguisticMetrics.wordRarity,
                      weight: '30%',
                      description: 'How uncommon this word is in the language',
                    },
                    'Phonetic Irregularity': {
                      value: analysis.linguisticMetrics.phoneticIrregularity,
                      weight: '20%',
                      description: 'How difficult the pronunciation is',
                    },
                    Polysemy: {
                      value: analysis.linguisticMetrics.polysemy,
                      weight: '15%',
                      description: 'Number of different meanings this word has',
                    },
                    'Word Length': {
                      value: analysis.linguisticMetrics.wordLength,
                      weight: '15%',
                      description: 'Complexity based on word length',
                    },
                    'Semantic Abstraction': {
                      value: analysis.linguisticMetrics.semanticAbstraction,
                      weight: '10%',
                      description: 'How abstract vs concrete the meaning is',
                    },
                    'Relational Complexity': {
                      value: analysis.linguisticMetrics.relationalComplexity,
                      weight: '10%',
                      description: 'Number of related words and forms',
                    },
                  }).map(([metric, data]) => (
                    <div key={metric} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{metric}</span>
                        <div className="text-right">
                          <span className="text-sm">
                            {(data.value * 100).toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({data.weight})
                          </span>
                        </div>
                      </div>
                      <Progress value={data.value * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {data.description}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Linguistic Score</span>
                    <span>
                      {(analysis.linguisticMetrics.weightedScore * 10).toFixed(
                        1,
                      )}
                      /10
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Next Practice Type
                      </h4>
                      <Badge variant="secondary" className="mb-2">
                        {analysis.nextRecommendedPracticeType}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Based on your current progress and word characteristics
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Time to Mastery
                      </h4>
                      <div className="text-lg font-semibold">
                        {analysis.estimatedTimeToMastery}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Estimated time with regular practice
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">
                      Specific Recommendations
                    </h4>
                    <div className="space-y-2">
                      {analysis.recommendations.map((recommendation, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                        >
                          <Lightbulb className="h-4 w-4 mt-0.5 text-info-foreground flex-shrink-0" />
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
