'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Play } from 'lucide-react';
import type { SessionState } from './hooks/useTypingPracticeState';

interface TypingPracticeHeaderProps {
  sessionState: SessionState;
  isLoading: boolean;
  progressPercentage: number;
  onStartPractice: () => void;
}

/**
 * Header component for typing practice sessions
 * Displays session stats, progress bar, and timer
 */
export function TypingPracticeHeader({
  sessionState,
  isLoading,
  progressPercentage,
  onStartPractice,
}: TypingPracticeHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Typing Practice
            </CardTitle>
            <CardDescription>
              Practice typing words from your vocabulary
            </CardDescription>
          </div>
          {!sessionState.isActive && (
            <Button
              onClick={onStartPractice}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isLoading ? 'Starting...' : 'Start Practice'}
            </Button>
          )}
        </div>
      </CardHeader>

      {sessionState.isActive && (
        <CardContent>
          {/* Progress and Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sessionState.currentWordIndex + 1}
              </div>
              <div className="text-sm text-muted-foreground">
                of {sessionState.words.length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {sessionState.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {sessionState.incorrectAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {sessionState.score}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
