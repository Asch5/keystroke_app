'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { EnhancedPracticeSession } from '@/core/domains/user/actions/practice-actions';

interface SessionProgress {
  correctAnswers: number;
  incorrectAnswers: number;
  currentScore: number;
  timeStarted: number;
}

interface PracticeSessionSummaryProps {
  session: EnhancedPracticeSession;
  sessionProgress: SessionProgress;
}

/**
 * Displays session completion summary with statistics
 * Shows accuracy, score, time spent, and session details
 */
export function PracticeSessionSummary({
  session,
  sessionProgress,
}: PracticeSessionSummaryProps) {
  const accuracy =
    (sessionProgress.correctAnswers /
      (sessionProgress.correctAnswers + sessionProgress.incorrectAnswers)) *
    100;
  const timeSpent = Math.round(
    (Date.now() - sessionProgress.timeStarted) / 1000 / 60,
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8 text-center space-y-6">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
          <Trophy className="h-8 w-8" />
          Session Complete!
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {sessionProgress.correctAnswers}
            </div>
            <div className="text-sm text-green-700">Correct</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {sessionProgress.incorrectAnswers}
            </div>
            <div className="text-sm text-red-700">Incorrect</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {accuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-blue-700">Accuracy</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {sessionProgress.currentScore}
            </div>
            <div className="text-sm text-purple-700">Score</div>
          </div>
        </div>

        <div className="pt-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {timeSpent} minutes • {session.words.length} words •{' '}
            {session.practiceType}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
