'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getUserDictionary,
  type UserDictionaryItem,
  type UserDictionaryFilters,
} from '@/core/domains/user/actions/user-dictionary-actions';
import { getUserSettings } from '@/core/domains/user/actions/user-settings-actions';
import {
  LearningStatus,
  PartOfSpeech,
  DifficultyLevel,
  LanguageCode,
} from '@/core/types';

/**
 * Custom hook for managing dictionary state and data fetching
 *
 * Handles all state management for the dictionary including filters,
 * pagination, and data fetching logic
 */
export function useDictionaryState(userId: string) {
  // Data states
  const [words, setWords] = useState<UserDictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userLanguages, setUserLanguages] = useState<{
    base: LanguageCode;
    target: LanguageCode;
  } | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LearningStatus[]>([]);
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState<
    PartOfSpeech[]
  >([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    DifficultyLevel[]
  >([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showModifiedOnly, setShowModifiedOnly] = useState(false);
  const [showNeedsReview, setShowNeedsReview] = useState(false);

  // Sort states
  const [sortBy, setSortBy] = useState<
    'word' | 'progress' | 'lastReviewedAt' | 'masteryScore' | 'createdAt'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const pageSize = 20;

  // Fetch words with current filters
  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const filters: UserDictionaryFilters = {
        ...(searchQuery && { searchQuery }),
        ...(selectedStatus.length > 0 && { learningStatus: selectedStatus }),
        ...(selectedPartOfSpeech.length > 0 && {
          partOfSpeech: selectedPartOfSpeech,
        }),
        ...(selectedDifficulty.length > 0 && {
          difficultyLevel: selectedDifficulty,
        }),
        ...(showFavoritesOnly && { isFavorite: showFavoritesOnly }),
        ...(showModifiedOnly && { isModified: showModifiedOnly }),
        ...(showNeedsReview && { needsReview: showNeedsReview }),
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      };

      console.log('🔍 Fetching dictionary words with filters:', filters);

      const result = await getUserDictionary(userId, filters);

      if (result && typeof result !== 'string') {
        console.log('✅ Dictionary fetch successful:', {
          itemsCount: result.items.length,
          totalCount: result.totalCount,
          searchQuery,
        });
        setWords(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error('❌ Error fetching dictionary words:', error);
      toast.error('Failed to load dictionary words');
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    searchQuery,
    selectedStatus,
    selectedPartOfSpeech,
    selectedDifficulty,
    showFavoritesOnly,
    showModifiedOnly,
    showNeedsReview,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  // Load user settings on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const userSettings = await getUserSettings();
        setUserLanguages({
          base: userSettings.user.baseLanguageCode,
          target: userSettings.user.targetLanguageCode,
        });
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    loadUserSettings();
  }, []);

  // Initial load and refetch on filter changes with debounced search
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        fetchWords();
      },
      searchQuery ? 300 : 0,
    ); // 300ms delay for search, immediate for other filters

    return () => clearTimeout(timeoutId);
  }, [fetchWords, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedStatus,
    selectedPartOfSpeech,
    selectedDifficulty,
    showFavoritesOnly,
    showModifiedOnly,
    showNeedsReview,
    sortBy,
    sortOrder,
  ]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedStatus([]);
    setSelectedPartOfSpeech([]);
    setSelectedDifficulty([]);
    setShowFavoritesOnly(false);
    setShowModifiedOnly(false);
    setShowNeedsReview(false);
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  }, []);

  return {
    // Data
    words,
    loading,
    totalCount,
    currentPage,
    totalPages,
    userLanguages,

    // Filters
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    selectedPartOfSpeech,
    setSelectedPartOfSpeech,
    selectedDifficulty,
    setSelectedDifficulty,
    showFavoritesOnly,
    setShowFavoritesOnly,
    showModifiedOnly,
    setShowModifiedOnly,
    showNeedsReview,
    setShowNeedsReview,

    // Sorting & Pagination
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    setCurrentPage,

    // Actions
    fetchWords,
    clearFilters,
  };
}
