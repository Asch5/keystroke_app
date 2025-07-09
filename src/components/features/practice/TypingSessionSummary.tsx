'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Play } from 'lucide-react';
import type { SessionState, WordResult } from './hooks/useTypingPracticeState';

interface TypingSessionSummaryProps {
  sessionState: SessionState;
  wordResults: WordResult[];
  onStartNewSession: () => void;
}

/**
 * Session summary component displaying practice results and statistics
 */
export function TypingSessionSummary({
  sessionState,
  wordResults,
  onStartNewSession,
}: TypingSessionSummaryProps) {
  if (sessionState.isActive || wordResults.length === 0) return null;

  const accuracy = Math.round(
    (wordResults.filter((r) => r.isCorrect).length / wordResults.length) * 100,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Session Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{wordResults.length}</div>
            <div className="text-sm text-muted-foreground">Words Practiced</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success-foreground">
              {wordResults.filter((r) => r.isCorrect).length}
            </div>
            <div className="text-sm text-muted-foreground">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-info-foreground">
              {accuracy}%
            </div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{sessionState.score}</div>
            <div className="text-sm text-muted-foreground">Final Score</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={onStartNewSession}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Practice Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
