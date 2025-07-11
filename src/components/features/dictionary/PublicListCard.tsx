'use client';

import { Eye, Loader2, Heart, Plus, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { type PublicListSummary } from '@/core/domains/dictionary';
import { DifficultyLevel } from '@/core/types';

interface PublicListCardProps {
  list: PublicListSummary;
  onAddToCollection: () => void;
  onRemoveFromCollection: () => void;
  onPreview: () => void;
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
 * PublicListCard component for displaying official vocabulary lists
 * Features user count, category info, and collection management actions
 */
export function PublicListCard({
  list,
  onAddToCollection,
  onRemoveFromCollection,
  onPreview,
  isPending,
}: PublicListCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium truncate">{list.name}</h3>
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            </div>

            {list.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {list.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">{list.wordCount}</div>
              <div className="text-muted-foreground">Words</div>
            </div>
            <div>
              <div className="font-medium">{list.userCount}</div>
              <div className="text-muted-foreground">Users</div>
            </div>
          </div>

          {/* Category and Difficulty */}
          <div className="flex items-center justify-between">
            <Badge className={difficultyColors[list.difficultyLevel]}>
              {difficultyDisplayNames[list.difficultyLevel]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {list.categoryName}
            </span>
          </div>

          {/* Sample Words */}
          {list.sampleWords.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {list.sampleWords.join(', ')}...
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Words
              </Button>

              {list.isInUserCollection ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemoveFromCollection}
                  disabled={isPending}
                  className="w-full text-error-foreground border-error-border hover:bg-error-subtle"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                  Remove from Collection
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
                    <Plus className="h-4 w-4" />
                  )}
                  Add to Collection
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
