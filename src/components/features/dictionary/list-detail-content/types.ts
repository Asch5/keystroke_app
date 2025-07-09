import { LanguageCode } from '@/core/types';
import type { UserListWordWithDetails } from '@/core/domains/dictionary/actions/user-list-actions';

export interface ListDetailContentProps {
  userId: string;
  listId: string;
  userLanguages?: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

export interface ListBasicInfo {
  id: string;
  displayName: string;
  displayDescription: string | null;
  wordCount: number;
  learnedWordCount: number;
}

export interface ListDetailState {
  listInfo: ListBasicInfo | null;
  words: UserListWordWithDetails[];
  filteredWords: UserListWordWithDetails[];
  loading: boolean;
  searchTerm: string;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  } | null;
}

export interface AudioState {
  isPlayingAudio: boolean;
  playingWordId: string | null;
}

export interface RemoveDialogState {
  open: boolean;
  wordId: string;
  wordText: string;
  userDictionaryId: string;
}

export interface AddWordsDialogState {
  open: boolean;
}

export interface ListDetailActions {
  handleRemoveFromList: () => Promise<void>;
  playWordAudio: (
    word: string,
    audioUrl: string | null,
    wordId: string,
  ) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setRemoveDialog: (state: RemoveDialogState) => void;
  setAddWordsDialog: (state: AddWordsDialogState) => void;
  loadData: () => Promise<void>;
}

export { type UserListWordWithDetails };
