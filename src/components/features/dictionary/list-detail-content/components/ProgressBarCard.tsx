import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ListBasicInfo } from '../types';

interface ProgressBarCardProps {
  listInfo: ListBasicInfo;
}

/**
 * Progress bar card component showing visual learning progress
 * Displays progress percentage, learned count, and remaining count
 */
export function ProgressBarCard({ listInfo }: ProgressBarCardProps) {
  const progressPercentage =
    listInfo.wordCount > 0
      ? (listInfo.learnedWordCount / listInfo.wordCount) * 100
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-content-secondary">
            <span>{listInfo.learnedWordCount} learned</span>
            <span>
              {listInfo.wordCount - listInfo.learnedWordCount} remaining
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
