'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Book,
  Star,
  StarOff,
  Play,
  Image as ImageIcon,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  X,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  FileText,
  Brain,
  Activity,
} from 'lucide-react';
import { LearningStatus, LanguageCode } from '@/core/types';
import { cn } from '@/core/shared/utils/common/cn';
import {
  getDisplayDefinition,
  shouldShowTranslations,
} from '@/core/domains/user/utils/dictionary-display-utils';
import type { UserDictionaryItem } from '@/core/domains/user/actions/user-dictionary-actions';
import { WordDifficultyDialog } from './WordDifficultyDialog';
import { EnhancedWordDifficultyDialog } from './EnhancedWordDifficultyDialog';
import { useState } from 'react';

interface WordTableProps {
  words: UserDictionaryItem[];
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  } | null;
  isPlayingAudio: boolean;
  playingWordId: string | null;
  onToggleFavorite: (wordId: string) => void;
  onStatusUpdate: (wordId: string, newStatus: LearningStatus) => void;
  onRemoveWord: (wordId: string, wordText: string) => void;
  onAddToList: (wordText: string, userDictionaryId: string) => void;
  onPlayAudio: (word: string, audioUrl: string | null, wordId: string) => void;
  onViewWordDetail: (wordText: string, languageCode: LanguageCode) => void;
}

/**
 * Word Table Component
 *
 * Displays the dictionary words in a table format with actions
 * Extracted from MyDictionaryContent to improve component modularity
 */
export function WordTable({
  words,
  userLanguages,
  isPlayingAudio,
  playingWordId,
  onToggleFavorite,
  onStatusUpdate,
  onRemoveWord,
  onAddToList,
  onPlayAudio,
  onViewWordDetail,
}: WordTableProps) {
  // State for difficulty analysis dialog
  const [difficultyDialog, setDifficultyDialog] = useState<{
    isOpen: boolean;
    word: UserDictionaryItem | null;
  }>({
    isOpen: false,
    word: null,
  });

  // State for performance analytics dialog
  const [performanceDialog, setPerformanceDialog] = useState<{
    isOpen: boolean;
    word: UserDictionaryItem | null;
  }>({
    isOpen: false,
    word: null,
  });

  const handleOpenDifficultyDialog = (word: UserDictionaryItem) => {
    setDifficultyDialog({
      isOpen: true,
      word,
    });
  };

  const handleCloseDifficultyDialog = () => {
    setDifficultyDialog({
      isOpen: false,
      word: null,
    });
  };

  const handleOpenPerformanceDialog = (word: UserDictionaryItem) => {
    setPerformanceDialog({
      isOpen: true,
      word,
    });
  };

  const handleClosePerformanceDialog = () => {
    setPerformanceDialog({
      isOpen: false,
      word: null,
    });
  };
  // Get status color
  const getStatusColor = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return 'bg-success text-success-foreground';
      case LearningStatus.inProgress:
        return 'bg-info text-info-foreground';
      case LearningStatus.needsReview:
        return 'bg-warning text-warning-foreground';
      case LearningStatus.difficult:
        return 'bg-error text-error-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Get status label
  const getStatusLabel = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return 'Learned';
      case LearningStatus.inProgress:
        return 'Learning';
      case LearningStatus.needsReview:
        return 'Review';
      case LearningStatus.difficult:
        return 'Difficult';
      case LearningStatus.notStarted:
        return 'Not Started';
      default:
        return status;
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Word</TableHead>
            <TableHead>Translation</TableHead>
            <TableHead>Definition</TableHead>
            <TableHead>Lists</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Mastery</TableHead>
            <TableHead>Last Reviewed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {words.map((word) => (
            <TableRow key={word.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{word.word}</span>
                      {word.isFavorite && (
                        <Star className="h-3 w-3 text-warning-foreground fill-current" />
                      )}
                      {word.isModified && (
                        <Edit className="h-3 w-3 text-info-foreground" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {word.partOfSpeech} {word.variant && `• ${word.variant}`}
                    </div>
                  </div>
                  {/* Audio Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-6 w-6 p-0 hover:bg-muted',
                      !word.audioUrl && 'opacity-50 cursor-not-allowed',
                    )}
                    title={
                      word.audioUrl
                        ? 'Play pronunciation'
                        : 'No audio available'
                    }
                    disabled={isPlayingAudio && playingWordId !== word.id}
                    onClick={() =>
                      onPlayAudio(word.word, word.audioUrl, word.id)
                    }
                  >
                    {word.audioUrl ? (
                      <Volume2
                        className={cn(
                          'h-3 w-3 text-info-foreground',
                          isPlayingAudio &&
                            playingWordId === word.id &&
                            'animate-pulse',
                        )}
                      />
                    ) : (
                      <VolumeX className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {/* Translation Column - Only DefinitionToOneWord or dash */}
                {word.oneWordTranslation ? (
                  <span className="text-sm">{word.oneWordTranslation}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  <p className="text-sm truncate">
                    {userLanguages &&
                    shouldShowTranslations(
                      userLanguages.base,
                      userLanguages.target,
                    )
                      ? getDisplayDefinition(
                          {
                            definition: word.definition,
                            targetLanguageCode: userLanguages.target,
                            translations: word.translations,
                          },
                          userLanguages.base,
                        ).content
                      : word.definition}
                  </p>
                  {word.customNotes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Note: {word.customNotes}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  {word.lists && word.lists.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {word.lists.slice(0, 2).map((listName, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {listName}
                        </Badge>
                      ))}
                      {word.lists.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{word.lists.length - 2} more
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No lists
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(word.learningStatus)}>
                  {getStatusLabel(word.learningStatus)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Progress value={word.progress} className="h-2 w-16" />
                  <span className="text-xs text-muted-foreground">
                    {word.progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {word.masteryScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {word.reviewCount} reviews
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {word.lastReviewedAt
                    ? new Date(word.lastReviewedAt).toLocaleDateString()
                    : 'Never'}
                </div>
              </TableCell>
              <TableCell className="text-right">
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
                        onClick={() =>
                          onPlayAudio(word.word, word.audioUrl, word.id)
                        }
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
                    <DropdownMenuItem
                      onClick={() => onAddToList(word.word, word.id)}
                    >
                      <Book className="h-4 w-4 mr-2" />
                      Add to List
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onViewWordDetail(word.word, word.targetLanguageCode)
                      }
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Word Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleOpenDifficultyDialog(word)}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      View Difficulty Analysis
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleOpenPerformanceDialog(word)}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Performance
                    </DropdownMenuItem>

                    {/* Dynamic Learning Status Actions */}
                    {word.learningStatus === LearningStatus.learned ? (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(word.id, LearningStatus.inProgress)
                        }
                      >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Unmark as Learned
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(word.id, LearningStatus.learned)
                        }
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Mark as Learned
                      </DropdownMenuItem>
                    )}

                    {word.learningStatus === LearningStatus.needsReview ? (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(word.id, LearningStatus.inProgress)
                        }
                      >
                        <X className="h-4 w-4 mr-2" />
                        Unmark for Review
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(word.id, LearningStatus.needsReview)
                        }
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Difficulty Analysis Dialog */}
      <WordDifficultyDialog
        isOpen={difficultyDialog.isOpen}
        onClose={handleCloseDifficultyDialog}
        word={difficultyDialog.word}
      />
      {/* Performance Analytics Dialog */}
      <EnhancedWordDifficultyDialog
        isOpen={performanceDialog.isOpen}
        onClose={handleClosePerformanceDialog}
        word={performanceDialog.word}
      />
    </>
  );
}
