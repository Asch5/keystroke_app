'use client';

import { Clock, Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/core/shared/utils/common/cn';

type PracticeType =
  | 'typing'
  | 'choose-right-word'
  | 'make-up-word'
  | 'remember-translation'
  | 'write-by-definition'
  | 'write-by-sound';

interface UniversalProgressIndicatorProps {
  currentWordIndex: number;
  totalWords: number;
  practiceType: PracticeType;
  correctAnswers?: number;
  incorrectAnswers?: number;
  timeElapsed?: number; // in seconds
  difficultyLevel?: number;
  sessionScore?: number;
  className?: string;
}

/**
 * Universal progress indicator for all practice types
 * Shows current word position, progress bar, session type, accuracy, and time
 */
export function UniversalProgressIndicator({
  currentWordIndex,
  totalWords,
  practiceType,
  correctAnswers = 0,
  incorrectAnswers = 0,
  timeElapsed,
  difficultyLevel,
  sessionScore,
  className,
}: UniversalProgressIndicatorProps) {
  const progressPercentage =
    totalWords > 0 ? (currentWordIndex / totalWords) * 100 : 0;
  const totalAnswered = correctAnswers + incorrectAnswers;
  const accuracy =
    totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

  const getPracticeTypeLabel = (type: PracticeType): string => {
    switch (type) {
      case 'typing':
        return 'Typing Practice';
      case 'choose-right-word':
        return 'Choose Right Word';
      case 'make-up-word':
        return 'Make Up Word';
      case 'remember-translation':
        return 'Remember Translation';
      case 'write-by-definition':
        return 'Write by Definition';
      case 'write-by-sound':
        return 'Write by Sound';
      default:
        return 'Practice';
    }
  };

  const getPracticeTypeColor = (type: PracticeType): string => {
    switch (type) {
      case 'typing':
        return 'bg-practice-typing-subtle text-practice-typing-foreground';
      case 'choose-right-word':
        return 'bg-practice-multiple-choice-subtle text-practice-multiple-choice-foreground';
      case 'make-up-word':
        return 'bg-practice-multiple-choice-subtle text-practice-multiple-choice-foreground';
      case 'remember-translation':
        return 'bg-practice-flashcard-subtle text-practice-flashcard-foreground';
      case 'write-by-definition':
        return 'bg-practice-audio-subtle text-practice-audio-foreground';
      case 'write-by-sound':
        return 'bg-practice-audio-subtle text-practice-audio-foreground';
      default:
        return 'bg-content-soft text-content-secondary';
    }
  };

  const getDifficultyLabel = (level?: number): string => {
    if (!level) return '';
    switch (level) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Elementary';
      case 3:
        return 'Intermediate';
      case 4:
        return 'Advanced';
      case 5:
        return 'Proficient';
      default:
        return `Level ${level}`;
    }
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 90) return 'text-success-foreground';
    if (accuracy >= 70) return 'text-warning-foreground';
    return 'text-error-foreground';
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with practice type and difficulty */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                className={cn('text-sm', getPracticeTypeColor(practiceType))}
              >
                {getPracticeTypeLabel(practiceType)}
              </Badge>
              {difficultyLevel && (
                <Badge variant="outline" className="text-xs">
                  {getDifficultyLabel(difficultyLevel)}
                </Badge>
              )}
            </div>

            {timeElapsed !== undefined && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatTime(timeElapsed)}
              </div>
            )}
          </div>

          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Word {currentWordIndex + 1} of {totalWords}
              </span>
              <span className="text-muted-foreground">
                {Math.round(progressPercentage)}% complete
              </span>
            </div>

            <Progress
              value={progressPercentage}
              className="h-2"
              aria-label={`Progress: ${Math.round(progressPercentage)}% complete`}
            />
          </div>

          {/* Stats section */}
          {totalAnswered > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className={getAccuracyColor(accuracy)}>
                    {accuracy}% accuracy
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-success-foreground">
                    ✓ {correctAnswers}
                  </span>
                  <span className="text-error-foreground">
                    ✗ {incorrectAnswers}
                  </span>
                </div>
              </div>

              {sessionScore !== undefined && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{sessionScore} pts</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
