'use client';

import { DifficultyLevel } from '@/core/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Loader2 } from 'lucide-react';
import { type PublicUserListSummary } from '@/core/domains/dictionary';

interface PublicUserListCardProps {
  list: PublicUserListSummary;
  onAddToCollection: () => void;
  onRemoveFromCollection: () => void;
  onPreview?: () => void;
  isPending: boolean;
}

const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-success-subtle text-success-foreground',
  elementary: 'bg-info-subtle text-info-foreground',
  intermediate: 'bg-warning-subtle text-warning-foreground',
  advanced: 'bg-warning text-warning-foreground',
  proficient: 'bg-error-subtle text-error-foreground',
};

/**
 * PublicUserListCard component for displaying community-created vocabulary lists
 * Features author information, sample words, and collection management actions
 */
export function PublicUserListCard({
  list,
  onAddToCollection,
  onRemoveFromCollection,
  onPreview,
  isPending,
}: PublicUserListCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium truncate">{list.name}</h3>
              <Badge
                className={difficultyColors[list.difficultyLevel]}
                variant="secondary"
              >
                {difficultyDisplayNames[list.difficultyLevel]}
              </Badge>
            </div>

            {list.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {list.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>by {list.createdBy.name}</span>
              <span>•</span>
              <span>{list.wordCount} words</span>
            </div>

            {list.sampleWords.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  Sample words:
                </p>
                <div className="flex flex-wrap gap-1">
                  {list.sampleWords.slice(0, 3).map((word, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                  {list.sampleWords.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{list.sampleWords.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Created {new Date(list.createdAt).toLocaleDateString()}
          </div>

          <div className="space-y-2">
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Words
              </Button>
            )}

            {list.isInUserCollection ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveFromCollection}
                disabled={isPending}
                className="w-full text-error-foreground hover:text-error-foreground"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Remove'
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onAddToCollection}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add to Collection'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
