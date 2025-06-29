import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchWordDetailById,
  type WordDetailEditData,
} from '@/core/domains/dictionary/actions/word-details-actions';

interface UseWordDetailEditStateProps {
  wordDetailId: number;
}

interface UseWordDetailEditStateReturn {
  // Data state
  formData: WordDetailEditData | null;
  setFormData: React.Dispatch<React.SetStateAction<WordDetailEditData | null>>;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingDefinitions: boolean;
  setIsSavingDefinitions: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingAudioFiles: boolean;
  setIsSavingAudioFiles: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingRelationships: boolean;
  setIsSavingRelationships: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingImages: boolean;
  setIsSavingImages: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions
  loadWordDetail: () => Promise<void>;

  // Computed values
  isAnySaving: boolean;
}

export function useWordDetailEditState({
  wordDetailId,
}: UseWordDetailEditStateProps): UseWordDetailEditStateReturn {
  // Data state
  const [formData, setFormData] = useState<WordDetailEditData | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDefinitions, setIsSavingDefinitions] = useState(false);
  const [isSavingAudioFiles, setIsSavingAudioFiles] = useState(false);
  const [isSavingRelationships, setIsSavingRelationships] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);

  /**
   * Load word detail data
   */
  const loadWordDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchWordDetailById(wordDetailId);
      setFormData(data);
    } catch (error) {
      console.error('Error loading word detail:', error);
      toast.error('Failed to load word detail');
    } finally {
      setIsLoading(false);
    }
  }, [wordDetailId]);

  // Load data on mount
  useEffect(() => {
    loadWordDetail();
  }, [loadWordDetail]);

  // Computed values
  const isAnySaving =
    isSaving ||
    isSavingDefinitions ||
    isSavingAudioFiles ||
    isSavingRelationships ||
    isSavingImages;

  return {
    // Data state
    formData,
    setFormData,

    // Loading states
    isLoading,
    isSaving,
    setIsSaving,
    isSavingDefinitions,
    setIsSavingDefinitions,
    isSavingAudioFiles,
    setIsSavingAudioFiles,
    isSavingRelationships,
    setIsSavingRelationships,
    isSavingImages,
    setIsSavingImages,

    // Actions
    loadWordDetail,

    // Computed values
    isAnySaving,
  };
}
