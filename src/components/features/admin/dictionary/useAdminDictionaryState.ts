import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchDictionaryWordDetails,
  deleteSelectedWords,
  deleteWordAudio,
  type DictionaryWordDetails,
} from '@/core/domains/dictionary/actions';
import { LanguageCode, PartOfSpeech, SourceType } from '@prisma/client';
import { toast } from 'sonner';
import { FilterState } from './AdminDictionaryConstants';

/**
 * Custom hook for managing all state and business logic for the admin dictionaries page
 * Handles data fetching, filtering, selection, and actions
 */
export function useAdminDictionaryState() {
  const router = useRouter();

  // Language and data state
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    LanguageCode.en,
  );
  const [wordDetails, setWordDetails] = useState<DictionaryWordDetails[]>([]);
  const [filteredWordDetails, setFilteredWordDetails] = useState<
    DictionaryWordDetails[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    partOfSpeech: [],
    source: [],
    hasAudio: null,
    hasImage: null,
    hasVariant: null,
    hasDefinition: null,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Selection state
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddWordsToListDialogOpen, setIsAddWordsToListDialogOpen] =
    useState(false);
  const [isDeepSeekDialogOpen, setIsDeepSeekDialogOpen] = useState(false);
  const [isManualFormsDialogOpen, setIsManualFormsDialogOpen] = useState(false);
  const [selectedWordForForms, setSelectedWordForForms] =
    useState<DictionaryWordDetails | null>(null);

  // Apply filters logic
  const applyFilters = useCallback(() => {
    let filtered = wordDetails;

    // Filter by part of speech
    if (filters.partOfSpeech.length > 0) {
      filtered = filtered.filter((item) =>
        filters.partOfSpeech.includes(item.partOfSpeech),
      );
    }

    // Filter by source
    if (filters.source.length > 0) {
      filtered = filtered.filter((item) =>
        filters.source.includes(item.source),
      );
    }

    // Filter by audio
    if (filters.hasAudio !== null) {
      filtered = filtered.filter(
        (item) => !!item.audioUrl === filters.hasAudio,
      );
    }

    // Filter by image
    if (filters.hasImage !== null) {
      filtered = filtered.filter((item) => item.hasImage === filters.hasImage);
    }

    // Filter by variant
    if (filters.hasVariant !== null) {
      filtered = filtered.filter(
        (item) => !!item.variant === filters.hasVariant,
      );
    }

    // Filter by definition
    if (filters.hasDefinition !== null) {
      filtered = filtered.filter(
        (item) => !!item.definition === filters.hasDefinition,
      );
    }

    setFilteredWordDetails(filtered);
  }, [wordDetails, filters]);

  // Load word details effect
  useEffect(() => {
    async function loadWordDetails() {
      setIsLoading(true);
      try {
        const fetchedWordDetails =
          await fetchDictionaryWordDetails(selectedLanguage);
        setWordDetails(fetchedWordDetails);
      } catch (error) {
        console.error('Error loading word details:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWordDetails();
  }, [selectedLanguage]);

  // Apply filters effect
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Filter change handler
  const handleFilterChange = (
    filterType: keyof FilterState,
    value: PartOfSpeech | SourceType | boolean | null,
    checked?: boolean,
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (filterType === 'partOfSpeech') {
        const currentArray = newFilters.partOfSpeech;
        if (checked) {
          newFilters.partOfSpeech = [...currentArray, value as PartOfSpeech];
        } else {
          newFilters.partOfSpeech = currentArray.filter(
            (item) => item !== value,
          );
        }
      } else if (filterType === 'source') {
        const currentArray = newFilters.source;
        if (checked) {
          newFilters.source = [...currentArray, value as SourceType];
        } else {
          newFilters.source = currentArray.filter((item) => item !== value);
        }
      } else {
        newFilters[filterType] = value as boolean | null;
      }

      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      partOfSpeech: [],
      source: [],
      hasAudio: null,
      hasImage: null,
      hasVariant: null,
      hasDefinition: null,
    });
  };

  // Word selection handlers
  const toggleWordSelection = (wordDetailId: string) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(wordDetailId)) {
      newSelected.delete(wordDetailId);
    } else {
      newSelected.add(wordDetailId);
    }
    setSelectedWords(newSelected);
  };

  const selectAllWords = () => {
    const allWordIds = new Set(
      filteredWordDetails.map((word) => word.id.toString()),
    );
    setSelectedWords(allWordIds);
  };

  const clearSelection = () => {
    setSelectedWords(new Set());
  };

  // Action handlers
  const handleCreateWordList = () => {
    if (selectedWords.size === 0) {
      alert('Please select at least one word to create a list.');
      return;
    }

    // Convert selected word detail IDs to definition IDs
    const selectedDefinitionIds = filteredWordDetails
      .filter((word) => selectedWords.has(word.id.toString()))
      .map((word) => word.definitionId)
      .filter((id) => id !== undefined) as number[];

    // Navigate to list creation page with selected words
    const params = new URLSearchParams({
      language: selectedLanguage,
      selectedDefinitions: selectedDefinitionIds.join(','),
    });

    router.push(`/admin/dictionaries/create-list?${params.toString()}`);
  };

  const handleDeleteSelectedWords = async () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word to delete.');
      return;
    }

    setIsDeleting(true);
    try {
      const wordDetailIds = Array.from(selectedWords);
      const result = await deleteSelectedWords(wordDetailIds);

      if (result.success) {
        toast.success(result.message);

        // Refresh the word list
        const fetchedWordDetails =
          await fetchDictionaryWordDetails(selectedLanguage);
        setWordDetails(fetchedWordDetails);

        // Clear selection
        setSelectedWords(new Set());
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting words:', error);
      toast.error('An unexpected error occurred while deleting words.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAudio = async (wordId: number) => {
    try {
      const result = await deleteWordAudio(wordId);
      if (result.success) {
        toast.success(result.message);
        handleAudioGenerated(); // Refresh the list
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to delete audio');
      console.error('Audio deletion error:', error);
    }
  };

  const handleAudioGenerated = async () => {
    // Refresh the word list to show updated audio status
    const fetchedWordDetails =
      await fetchDictionaryWordDetails(selectedLanguage);
    setWordDetails(fetchedWordDetails);
  };

  const openDeleteDialog = () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word to delete.');
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  const openAddWordsToListDialog = () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word to add to a list.');
      return;
    }
    setIsAddWordsToListDialogOpen(true);
  };

  const handleWordsAddedToList = () => {
    // Clear selection after adding words to list
    setSelectedWords(new Set());
    setIsAddWordsToListDialogOpen(false);
  };

  const openDeepSeekDialog = () => {
    if (selectedWords.size === 0) {
      toast.error(
        'Please select at least one word to extract words from definitions.',
      );
      return;
    }
    setIsDeepSeekDialogOpen(true);
  };

  const handleDeepSeekSuccess = () => {
    // Refresh the word list after successful word extraction
    handleAudioGenerated(); // This already refreshes the word list
    setIsDeepSeekDialogOpen(false);
    clearSelection();
  };

  // Get selected WordDetail IDs for DeepSeek
  const getSelectedWordDetailIds = () => {
    return Array.from(selectedWords).map((id) => parseInt(id));
  };

  // Manual forms handlers
  const openManualFormsDialog = (wordDetail: DictionaryWordDetails) => {
    setSelectedWordForForms(wordDetail);
    setIsManualFormsDialogOpen(true);
  };

  const handleManualFormsSuccess = () => {
    // Close dialog and refresh data
    setIsManualFormsDialogOpen(false);
    setSelectedWordForForms(null);

    // Refresh the word list to show newly added forms
    handleAudioGenerated(); // This already refreshes the word list
  };

  return {
    // State
    selectedLanguage,
    wordDetails,
    filteredWordDetails,
    isLoading,
    filters,
    filtersOpen,
    selectedWords,
    isDeleteDialogOpen,
    isDeleting,
    isAddWordsToListDialogOpen,
    isDeepSeekDialogOpen,
    isManualFormsDialogOpen,
    selectedWordForForms,

    // Actions
    setSelectedLanguage,
    handleFilterChange,
    clearAllFilters,
    setFiltersOpen,
    toggleWordSelection,
    selectAllWords,
    clearSelection,
    handleCreateWordList,
    handleDeleteSelectedWords,
    handleDeleteAudio,
    handleAudioGenerated,
    openDeleteDialog,
    openAddWordsToListDialog,
    handleWordsAddedToList,
    setIsDeleteDialogOpen,
    setIsAddWordsToListDialogOpen,
    openDeepSeekDialog,
    handleDeepSeekSuccess,
    getSelectedWordDetailIds,
    setIsDeepSeekDialogOpen,
    openManualFormsDialog,
    handleManualFormsSuccess,
    setIsManualFormsDialogOpen,
  };
}
