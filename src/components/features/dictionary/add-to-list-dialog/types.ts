/**
 * Types for AddToListDialog modular components
 */

import { LanguageCode, DifficultyLevel } from '@/core/types';
import { UserListWithDetails } from '@/core/domains/dictionary/actions/user-list-actions';

export interface AddToListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  };
  wordText: string;
  userDictionaryId: string;
  onWordAddedToList: (listName: string) => void;
}

export interface NewListFormData {
  name: string;
  description: string;
  difficulty: DifficultyLevel | '';
  coverImageUrl: string;
}

export interface ExistingListTabProps {
  userLists: UserListWithDetails[];
  loading: boolean;
  isSubmitting: boolean;
  selectedListId: string;
  onSelectList: (listId: string) => void;
  onAddToList: () => void;
  onClose: () => void;
}

export interface NewListTabProps {
  formData: NewListFormData;
  isSubmitting: boolean;
  onFormDataChange: (updates: Partial<NewListFormData>) => void;
  onCreateList: () => void;
  onClose: () => void;
}

export interface ListItemProps {
  list: UserListWithDetails;
  isSelected: boolean;
  onSelect: (listId: string) => void;
}

export const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

export const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-difficulty-beginner-subtle text-difficulty-beginner-foreground',
  elementary:
    'bg-difficulty-elementary-subtle text-difficulty-elementary-foreground',
  intermediate:
    'bg-difficulty-intermediate-subtle text-difficulty-intermediate-foreground',
  advanced: 'bg-difficulty-advanced-subtle text-difficulty-advanced-foreground',
  proficient:
    'bg-difficulty-proficient-subtle text-difficulty-proficient-foreground',
};
