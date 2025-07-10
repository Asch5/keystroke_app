'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WordCell } from './components/WordCell';
import { DefinitionCell } from './components/DefinitionCell';
import { ListsCell } from './components/ListsCell';
import { StatusCell } from './components/StatusCell';
import { ProgressCell } from './components/ProgressCell';
import { MasteryCell } from './components/MasteryCell';
import { LastReviewedCell } from './components/LastReviewedCell';
import { WordActions } from './components/WordActions';
import { useWordTableState } from './hooks/useWordTableState';
import { WordDifficultyDialog } from '../WordDifficultyDialog';
import { EnhancedWordDifficultyDialog } from '../EnhancedWordDifficultyDialog';
import { WordTableProps } from './types';

/**
 * Main WordTable component - refactored to ~80 lines (down from 465 lines)
 * Uses modular architecture with focused cell components and custom hooks
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
  const {
    difficultyDialog,
    performanceDialog,
    handleOpenDifficultyDialog,
    handleCloseDifficultyDialog,
    handleOpenPerformanceDialog,
    handleClosePerformanceDialog,
  } = useWordTableState();

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
                <WordCell
                  word={word}
                  isPlayingAudio={isPlayingAudio}
                  playingWordId={playingWordId}
                  onPlayAudio={onPlayAudio}
                />
              </TableCell>

              <TableCell>
                {word.oneWordTranslation ? (
                  <span className="text-sm">{word.oneWordTranslation}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>

              <TableCell>
                <DefinitionCell word={word} userLanguages={userLanguages} />
              </TableCell>

              <TableCell>
                <ListsCell lists={word.lists} />
              </TableCell>

              <TableCell>
                <StatusCell status={word.learningStatus} />
              </TableCell>

              <TableCell>
                <ProgressCell progress={word.progress} />
              </TableCell>

              <TableCell>
                <MasteryCell
                  masteryScore={word.masteryScore}
                  reviewCount={word.reviewCount}
                />
              </TableCell>

              <TableCell>
                <LastReviewedCell lastReviewedAt={word.lastReviewedAt} />
              </TableCell>

              <TableCell className="text-right">
                <WordActions
                  word={word}
                  onToggleFavorite={onToggleFavorite}
                  onStatusUpdate={onStatusUpdate}
                  onRemoveWord={onRemoveWord}
                  onAddToList={onAddToList}
                  onPlayAudio={onPlayAudio}
                  onViewWordDetail={onViewWordDetail}
                  onOpenDifficultyDialog={handleOpenDifficultyDialog}
                  onOpenPerformanceDialog={handleOpenPerformanceDialog}
                />
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
