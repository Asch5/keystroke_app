import { BookOpen, Users, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ListBasicInfo } from '../types';
import { getIconColor } from '../utils/styleUtils';

interface ListStatsCardsProps {
  listInfo: ListBasicInfo;
}

/**
 * Stats cards component showing key metrics for the list
 * Displays total words, learned words, progress percentage, and remaining words
 */
export function ListStatsCards({ listInfo }: ListStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <BookOpen className={`h-5 w-5 ${getIconColor('info')}`} />
            <div>
              <p className="text-sm font-medium text-content-secondary">
                Total Words
              </p>
              <p className="text-2xl font-bold">{listInfo.wordCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Target className={`h-5 w-5 ${getIconColor('success')}`} />
            <div>
              <p className="text-sm font-medium text-content-secondary">
                Learned
              </p>
              <p className="text-2xl font-bold">{listInfo.learnedWordCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className={`h-5 w-5 ${getIconColor('modern')}`} />
            <div>
              <p className="text-sm font-medium text-content-secondary">
                Progress
              </p>
              <p className="text-2xl font-bold">
                {listInfo.wordCount > 0
                  ? (
                      (listInfo.learnedWordCount / listInfo.wordCount) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Users className={`h-5 w-5 ${getIconColor('warning')}`} />
            <div>
              <p className="text-sm font-medium text-content-secondary">
                Remaining
              </p>
              <p className="text-2xl font-bold">
                {listInfo.wordCount - listInfo.learnedWordCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
