'use client';

import { DifficultyLevel } from '@/core/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Edit, Trash2, ExternalLink } from 'lucide-react';
import { type UserListWithDetails } from '@/core/domains/dictionary';

interface UserListCardProps {
  list: UserListWithDetails;
  onEdit: () => void;
  onRemove: () => void;
  onNavigate: () => void;
}

const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-100 text-green-800',
  elementary: 'bg-blue-100 text-blue-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  proficient: 'bg-red-100 text-red-800',
};

/**
 * UserListCard component for displaying individual user vocabulary lists
 * Features progress tracking, stats display, and list management actions
 */
export function UserListCard({
  list,
  onEdit,
  onRemove,
  onNavigate,
}: UserListCardProps) {
  const isCustomList = !list.listId;
  const progressPercentage =
    list.wordCount > 0 ? (list.learnedWordCount / list.wordCount) * 100 : 0;

  return (
    <Card
      className="group hover:shadow-md transition-shadow cursor-pointer"
      onClick={onNavigate}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium truncate">{list.displayName}</h3>
              {isCustomList && (
                <Badge variant="secondary" className="text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Custom
                </Badge>
              )}
            </div>

            {list.displayDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {list.displayDescription}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate();
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">{list.wordCount}</div>
              <div className="text-muted-foreground">Words</div>
            </div>
            <div>
              <div className="font-medium">{list.learnedWordCount}</div>
              <div className="text-muted-foreground">Learned</div>
            </div>
          </div>

          {/* Difficulty */}
          <div className="flex items-center justify-between">
            <Badge className={difficultyColors[list.displayDifficulty]}>
              {difficultyDisplayNames[list.displayDifficulty]}
            </Badge>
            {list.sampleWords.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {list.sampleWords.join(', ')}...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
