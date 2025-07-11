'use client';

import { BookOpen, RotateCcw, Shuffle, Target, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/core/shared/hooks/useUser';
import { LearningStatus } from '@/core/types';
import { VocabularyPracticeSettings } from './settings';

interface VocabularyPracticeContentProps {
  userListId?: string;
  listId?: string;
  mode?: string;
  difficultyLevel?: number;
  wordsCount?: number;
}

interface PracticeMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  includeWordStatuses: LearningStatus[];
  shortDescription: string;
}

const PRACTICE_MODES: PracticeMode[] = [
  {
    id: 'learn-new',
    name: 'Learn New Words',
    description:
      'Practice words you haven&apos;t started learning yet. Perfect for expanding your vocabulary with fresh content.',
    shortDescription: 'New words only',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'bg-info',
    includeWordStatuses: [LearningStatus.notStarted],
  },
  {
    id: 'continue-learning',
    name: 'Continue Learning',
    description:
      'Practice words you&apos;ve started but haven&apos;t mastered yet. Focus on words in progress and difficult ones.',
    shortDescription: 'In-progress words',
    icon: <Target className="h-5 w-5" />,
    color: 'bg-warning',
    includeWordStatuses: [LearningStatus.inProgress, LearningStatus.difficult],
  },
  {
    id: 'refresh-vocabulary',
    name: 'Refresh Vocabulary',
    description:
      'Review words that need refreshing or have been learned but require periodic practice.',
    shortDescription: 'Review words',
    icon: <RotateCcw className="h-5 w-5" />,
    color: 'bg-success',
    includeWordStatuses: [LearningStatus.needsReview, LearningStatus.learned],
  },
  {
    id: 'mix-mode',
    name: 'Mix Mode',
    description:
      'Practice all types of words in a smart order: new words, in-progress, and review words for comprehensive learning.',
    shortDescription: 'All word types',
    icon: <Shuffle className="h-5 w-5" />,
    color: 'bg-accent',
    includeWordStatuses: [
      LearningStatus.notStarted,
      LearningStatus.inProgress,
      LearningStatus.difficult,
      LearningStatus.needsReview,
      LearningStatus.learned,
    ],
  },
];

/**
 * Main vocabulary practice component with practice mode selection
 * Similar to typing practice but focused on vocabulary learning modes
 */
export function VocabularyPracticeContent({
  userListId,
  listId,
  mode,
  difficultyLevel,
  wordsCount,
}: VocabularyPracticeContentProps) {
  const { user } = useUser();
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<string>(mode ?? '');

  /**
   * Start practice with selected mode
   */
  const startPracticeMode = (modeId: string) => {
    const params = new URLSearchParams();

    // Add list selection
    if (userListId) {
      params.set('userListId', userListId);
    }
    if (listId) {
      params.set('listId', listId);
    }

    // Add practice mode
    params.set('mode', modeId);

    // Add other parameters
    if (difficultyLevel) {
      params.set('difficultyLevel', difficultyLevel.toString());
    }
    if (wordsCount) {
      params.set('wordsCount', wordsCount.toString());
    }

    // Route to enhanced practice with mode parameter
    router.push(`/dashboard/practice/enhanced?${params.toString()}`);
  };

  /**
   * Go back to practice overview
   */
  const goBackToPracticeOverview = () => {
    router.push('/dashboard/practice');
  };

  // Early return for unauthenticated users
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please log in to access vocabulary practice.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackToPracticeOverview}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl font-bold">
                Vocabulary Practice
              </CardTitle>
              <CardDescription className="mt-1">
                Choose your practice mode and start learning vocabulary with
                interactive exercises
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Practice Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Practice Modes
          </CardTitle>
          <CardDescription>
            Select the type of vocabulary practice that matches your learning
            goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRACTICE_MODES.map((practiceMode) => (
              <Card
                key={practiceMode.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                  selectedMode === practiceMode.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedMode(practiceMode.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${practiceMode.color} text-white`}
                      >
                        {practiceMode.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {practiceMode.name}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {practiceMode.shortDescription}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    {practiceMode.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Word types: {practiceMode.includeWordStatuses.length}{' '}
                      categories
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startPracticeMode(practiceMode.id);
                      }}
                      disabled={
                        !selectedMode || selectedMode !== practiceMode.id
                      }
                    >
                      Start Practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Practice Settings */}
      <VocabularyPracticeSettings />

      {/* Quick Start Section */}
      {selectedMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ready to Start?</CardTitle>
            <CardDescription>
              You&apos;ve selected &quot;
              {PRACTICE_MODES.find((m) => m.id === selectedMode)?.name}&quot;.
              Click the button below to begin your practice session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              onClick={() => startPracticeMode(selectedMode)}
              className="w-full md:w-auto"
            >
              Start {PRACTICE_MODES.find((m) => m.id === selectedMode)?.name}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
