import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  updateWordDetailById,
  updateWordDetailDefinitions,
  updateWordDetailAudioFiles,
  updateWordDetailRelationships,
  updateWordDetailImages,
  type WordDetailEditData,
} from '@/core/domains/dictionary/actions/word-details-actions';

interface UseWordDetailEditActionsProps {
  wordDetailId: number;
  formData: WordDetailEditData | null;

  // State setters
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSavingDefinitions: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSavingAudioFiles: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSavingRelationships: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSavingImages: React.Dispatch<React.SetStateAction<boolean>>;

  // Reload function
  loadWordDetail: () => Promise<void>;
}

interface UseWordDetailEditActionsReturn {
  handleSaveAll: () => Promise<void>;
  handleSaveDefinitions: () => Promise<void>;
  handleSaveAudioFiles: () => Promise<void>;
  handleSaveImages: () => Promise<void>;
  handleSaveRelationships: () => Promise<void>;
}

export function useWordDetailEditActions({
  wordDetailId,
  formData,
  setIsSaving,
  setIsSavingDefinitions,
  setIsSavingAudioFiles,
  setIsSavingRelationships,
  setIsSavingImages,
  loadWordDetail,
}: UseWordDetailEditActionsProps): UseWordDetailEditActionsReturn {
  /**
   * Save only definitions section
   */
  const handleSaveDefinitions = useCallback(async () => {
    if (!formData) return;

    try {
      setIsSavingDefinitions(true);
      const result = await updateWordDetailDefinitions(
        wordDetailId,
        formData.definitions,
      );

      if (result.success) {
        toast.success('Definitions saved successfully!');
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save definitions');
      }
    } catch (error) {
      console.error('Error saving definitions:', error);
      toast.error('Failed to save definitions');
    } finally {
      setIsSavingDefinitions(false);
    }
  }, [formData, wordDetailId, loadWordDetail, setIsSavingDefinitions]);

  /**
   * Save only audio files section
   */
  const handleSaveAudioFiles = useCallback(async () => {
    if (!formData) return;

    try {
      setIsSavingAudioFiles(true);
      const result = await updateWordDetailAudioFiles(
        wordDetailId,
        formData.audioFiles,
      );

      if (result.success) {
        toast.success('Audio files saved successfully!');
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save audio files');
      }
    } catch (error) {
      console.error('Error saving audio files:', error);
      toast.error('Failed to save audio files');
    } finally {
      setIsSavingAudioFiles(false);
    }
  }, [formData, wordDetailId, loadWordDetail, setIsSavingAudioFiles]);

  /**
   * Save only images section (within definitions)
   */
  const handleSaveImages = useCallback(async () => {
    if (!formData) return;

    try {
      setIsSavingImages(true);
      const result = await updateWordDetailImages(
        wordDetailId,
        formData.definitions,
      );

      if (result.success) {
        toast.success('Images saved successfully!');
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save images');
      }
    } catch (error) {
      console.error('Error saving images:', error);
      toast.error('Failed to save images');
    } finally {
      setIsSavingImages(false);
    }
  }, [formData, wordDetailId, loadWordDetail, setIsSavingImages]);

  /**
   * Save only relationships section
   */
  const handleSaveRelationships = useCallback(async () => {
    if (!formData) return;

    try {
      setIsSavingRelationships(true);
      const result = await updateWordDetailRelationships(
        wordDetailId,
        formData.wordDetailRelationships,
        formData.wordRelationships,
      );

      if (result.success) {
        toast.success('Relationships saved successfully!');
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save relationships');
      }
    } catch (error) {
      console.error('Error saving relationships:', error);
      toast.error('Failed to save relationships');
    } finally {
      setIsSavingRelationships(false);
    }
  }, [formData, wordDetailId, loadWordDetail, setIsSavingRelationships]);

  /**
   * Save all sections at once
   */
  const handleSaveAll = useCallback(async () => {
    if (!formData) return;

    try {
      setIsSaving(true);
      const result = await updateWordDetailById(wordDetailId, formData);

      if (result.success) {
        toast.success('All changes saved successfully!');
        // Reload data to get fresh state
        await loadWordDetail();
      } else {
        toast.error(result.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving all changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [formData, wordDetailId, loadWordDetail, setIsSaving]);

  return {
    handleSaveAll,
    handleSaveDefinitions,
    handleSaveAudioFiles,
    handleSaveImages,
    handleSaveRelationships,
  };
}
