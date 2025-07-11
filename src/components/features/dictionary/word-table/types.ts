/**
 * Types for WordTable modular components
 */

import type { UserDictionaryItem } from '@/core/domains/user/actions/user-dictionary-actions';
import { LearningStatus, LanguageCode } from '@/core/types';

export interface WordTableProps {
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

export interface WordCellProps {
  word: UserDictionaryItem;
  isPlayingAudio: boolean;
  playingWordId: string | null;
  onPlayAudio: (word: string, audioUrl: string | null, wordId: string) => void;
}

export interface DefinitionCellProps {
  word: UserDictionaryItem;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  } | null;
}

export interface ListsCellProps {
  lists: string[] | null;
}

export interface StatusCellProps {
  status: LearningStatus;
}

export interface ProgressCellProps {
  progress: number;
}

export interface MasteryCellProps {
  masteryScore: number;
  reviewCount: number;
}

export interface LastReviewedCellProps {
  lastReviewedAt: Date | null;
}

export interface WordActionsProps {
  word: UserDictionaryItem;
  onToggleFavorite: (wordId: string) => void;
  onStatusUpdate: (wordId: string, newStatus: LearningStatus) => void;
  onRemoveWord: (wordId: string, wordText: string) => void;
  onAddToList: (wordText: string, userDictionaryId: string) => void;
  onPlayAudio: (word: string, audioUrl: string | null, wordId: string) => void;
  onViewWordDetail: (wordText: string, languageCode: LanguageCode) => void;
  onOpenDifficultyDialog: (word: UserDictionaryItem) => void;
  onOpenPerformanceDialog: (word: UserDictionaryItem) => void;
}

export interface DialogState {
  isOpen: boolean;
  word: UserDictionaryItem | null;
}
