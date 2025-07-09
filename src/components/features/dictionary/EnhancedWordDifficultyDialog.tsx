'use client';

import { EnhancedWordDifficultyDialogContent } from './enhanced-word-difficulty-dialog/components/EnhancedWordDifficultyDialogContent';
import { EnhancedWordDifficultyDialogProps } from './enhanced-word-difficulty-dialog/types';

export function EnhancedWordDifficultyDialog(
  props: EnhancedWordDifficultyDialogProps,
) {
  return <EnhancedWordDifficultyDialogContent {...props} />;
}
