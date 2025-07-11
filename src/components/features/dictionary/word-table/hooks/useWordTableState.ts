'use client';

import { useState } from 'react';
import type { UserDictionaryItem } from '@/core/domains/user/actions/user-dictionary-actions';
import { DialogState } from '../types';

/**
 * State management hook for WordTable dialogs
 * Handles difficulty and performance dialog states
 */
export function useWordTableState() {
  // State for difficulty analysis dialog
  const [difficultyDialog, setDifficultyDialog] = useState<DialogState>({
    isOpen: false,
    word: null,
  });

  // State for performance analytics dialog
  const [performanceDialog, setPerformanceDialog] = useState<DialogState>({
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

  return {
    difficultyDialog,
    performanceDialog,
    handleOpenDifficultyDialog,
    handleCloseDifficultyDialog,
    handleOpenPerformanceDialog,
    handleClosePerformanceDialog,
  };
}
