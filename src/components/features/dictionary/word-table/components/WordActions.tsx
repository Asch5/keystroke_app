import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Star,
  StarOff,
  Play,
  VolumeX,
  Image as ImageIcon,
  Book,
  FileText,
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  X,
  Trash2,
} from 'lucide-react';
import { LearningStatus } from '@/core/types';
import { WordActionsProps } from '../types';

/**
 * Word actions component with dropdown menu for all word operations
 * Provides comprehensive actions for word management and learning
 */
export function WordActions({
  word,
  onToggleFavorite,
  onStatusUpdate,
  onRemoveWord,
  onAddToList,
  onPlayAudio,
  onViewWordDetail,
  onOpenDifficultyDialog,
  onOpenPerformanceDialog,
}: WordActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onToggleFavorite(word.id)}>
          {word.isFavorite ? (
            <>
              <StarOff className="h-4 w-4 mr-2" />
              Remove from Favorites
            </>
          ) : (
            <>
              <Star className="h-4 w-4 mr-2" />
              Add to Favorites
            </>
          )}
        </DropdownMenuItem>

        {word.audioUrl ? (
          <DropdownMenuItem
            onClick={() => onPlayAudio(word.word, word.audioUrl, word.id)}
          >
            <Play className="h-4 w-4 mr-2" />
            Play Audio
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <VolumeX className="h-4 w-4 mr-2" />
            No Audio Available
          </DropdownMenuItem>
        )}

        {word.imageUrl && (
          <DropdownMenuItem>
            <ImageIcon className="h-4 w-4 mr-2" />
            View Image
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onAddToList(word.word, word.id)}>
          <Book className="h-4 w-4 mr-2" />
          Add to List
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onViewWordDetail(word.word, word.targetLanguageCode)}
        >
          <FileText className="h-4 w-4 mr-2" />
          Word Detail
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onOpenDifficultyDialog(word)}>
          <Brain className="h-4 w-4 mr-2" />
          View Difficulty Analysis
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onOpenPerformanceDialog(word)}>
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </DropdownMenuItem>

        {/* Dynamic Learning Status Actions */}
        {word.learningStatus === LearningStatus.learned ? (
          <DropdownMenuItem
            onClick={() => onStatusUpdate(word.id, LearningStatus.inProgress)}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Unmark as Learned
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onStatusUpdate(word.id, LearningStatus.learned)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Mark as Learned
          </DropdownMenuItem>
        )}

        {word.learningStatus === LearningStatus.needsReview ? (
          <DropdownMenuItem
            onClick={() => onStatusUpdate(word.id, LearningStatus.inProgress)}
          >
            <X className="h-4 w-4 mr-2" />
            Unmark for Review
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onStatusUpdate(word.id, LearningStatus.needsReview)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Mark for Review
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onRemoveWord(word.id, word.word)}
          className="text-error-foreground"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove from Dictionary
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
