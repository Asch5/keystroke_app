import type { SimpleWordAnalytics } from '@/core/domains/user/actions/simple-word-analytics';
import type { UserDictionaryItem } from '@/core/domains/user/actions/user-dictionary-actions';

export interface EnhancedWordDifficultyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  word: UserDictionaryItem | null;
}

export interface WordAnalyticsState {
  analytics: SimpleWordAnalytics | null;
  loading: boolean;
  error: string | null;
}

export interface TabComponentProps {
  analytics: SimpleWordAnalytics;
  word: UserDictionaryItem;
}

export type PerformanceColorType =
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'modern';
export type LearningModalityType = 'textual' | 'visual' | 'auditory';
export type SessionPositionType = 'early' | 'middle' | 'late';
