import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getUserListWords,
  type UserListWordWithDetails,
} from '@/core/domains/dictionary/actions/user-list-actions';
import { getUserSettings } from '@/core/domains/user/actions/user-settings-actions';
import { LanguageCode } from '@/core/types';
import type { ListBasicInfo, ListDetailState } from '../types';

interface UseListDetailStateProps {
  userId: string;
  listId: string;
  initialUserLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

interface UseListDetailStateReturn extends ListDetailState {
  setSearchTerm: (term: string) => void;
  loadData: () => Promise<void>;
  loadUserSettings: () => Promise<void>;
}

/**
 * Custom hook for managing list detail state
 * Handles data fetching, filtering, and user settings
 */
export function useListDetailState({
  userId,
  listId,
  initialUserLanguages,
}: UseListDetailStateProps): UseListDetailStateReturn {
  // Core state
  const [listInfo, setListInfo] = useState<ListBasicInfo | null>(null);
  const [words, setWords] = useState<UserListWordWithDetails[]>([]);
  const [filteredWords, setFilteredWords] = useState<UserListWordWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLanguages, setUserLanguages] = useState<{
    base: LanguageCode;
    target: LanguageCode;
  } | null>(null);

  // Load user settings
  const loadUserSettings = useCallback(async () => {
    try {
      const userSettings = await getUserSettings();
      if (
        userSettings &&
        userSettings.user &&
        userSettings.user.baseLanguageCode &&
        userSettings.user.targetLanguageCode
      ) {
        setUserLanguages({
          base: userSettings.user.baseLanguageCode,
          target: userSettings.user.targetLanguageCode,
        });
      } else {
        setUserLanguages(initialUserLanguages);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      setUserLanguages(initialUserLanguages);
    }
  }, [initialUserLanguages]);

  // Load list info and words
  const loadData = useCallback(async () => {
    // Don't load data until we have user languages
    if (!userLanguages) {
      return;
    }

    try {
      setLoading(true);

      // Use the proper getUserListWords function with user languages
      const result = await getUserListWords(userId, listId, userLanguages, {
        sortBy: 'orderIndex',
        sortOrder: 'asc',
      });

      setListInfo(result.listDetails);
      setWords(result.words);
      setFilteredWords(result.words);
    } catch (error) {
      console.error('Error loading list data:', error);
      toast.error('Failed to load list data');
    } finally {
      setLoading(false);
    }
  }, [userId, listId, userLanguages]);

  // Initialize user settings
  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  // Load data after user languages are available
  useEffect(() => {
    if (userLanguages) {
      loadData();
    }
  }, [loadData, userLanguages]);

  // Filter words based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWords(words);
    } else {
      const filtered = words.filter((word) =>
        word.word.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredWords(filtered);
    }
  }, [words, searchTerm]);

  return {
    listInfo,
    words,
    filteredWords,
    loading,
    searchTerm,
    userLanguages,
    setSearchTerm,
    loadData,
    loadUserSettings,
  };
}
