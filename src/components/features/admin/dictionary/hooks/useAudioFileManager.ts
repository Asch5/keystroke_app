import { useCallback } from 'react';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions/word-details-actions';

// Extract exact types from WordDetailEditData to ensure compatibility
type AudioFileData = WordDetailEditData['audioFiles'][0];

interface UseAudioFileManagerProps {
  formData: WordDetailEditData | null;
  setFormData: React.Dispatch<React.SetStateAction<WordDetailEditData | null>>;
}

interface UseAudioFileManagerReturn {
  addAudioFile: () => void;
  removeAudioFile: (index: number) => void;
  updateAudioFile: (
    index: number,
    field: keyof AudioFileData,
    value: string | boolean | null,
  ) => void;
  togglePrimaryAudio: (index: number) => void;
}

export function useAudioFileManager({
  formData,
  setFormData,
}: UseAudioFileManagerProps): UseAudioFileManagerReturn {
  /**
   * Add a new audio file
   */
  const addAudioFile = useCallback(() => {
    if (!formData) return;

    const newAudioFile: AudioFileData = {
      id: null,
      url: '',
      isPrimary: false,
      languageCode: 'da',
      source: 'admin',
      note: null,
      _toDelete: false,
    };

    setFormData((prev: WordDetailEditData | null) =>
      prev
        ? {
            ...prev,
            audioFiles: [...prev.audioFiles, newAudioFile],
          }
        : null,
    );
  }, [formData, setFormData]);

  /**
   * Remove an audio file (mark for deletion if existing, remove if new)
   */
  const removeAudioFile = useCallback(
    (index: number) => {
      if (!formData) return;

      setFormData((prev: WordDetailEditData | null) => {
        if (!prev) return null;
        const updatedAudioFiles = [...prev.audioFiles];
        if (index < 0 || index >= updatedAudioFiles.length) return prev;

        const audioFile = updatedAudioFiles[index];
        if (!audioFile) return prev;

        if (audioFile.id) {
          // Mark existing audio file for deletion
          updatedAudioFiles[index] = {
            id: audioFile.id,
            url: audioFile.url,
            isPrimary: audioFile.isPrimary,
            languageCode: audioFile.languageCode,
            source: audioFile.source,
            note: audioFile.note,
            _toDelete: true,
          };
        } else {
          // Remove new audio file entirely
          updatedAudioFiles.splice(index, 1);
        }
        return { ...prev, audioFiles: updatedAudioFiles };
      });
    },
    [formData, setFormData],
  );

  /**
   * Update an audio file field
   */
  const updateAudioFile = useCallback(
    (
      index: number,
      field: keyof AudioFileData,
      value: string | boolean | null,
    ) => {
      if (!formData) return;

      setFormData((prev: WordDetailEditData | null) => {
        if (!prev) return null;
        const updatedAudioFiles = [...prev.audioFiles];
        if (index < 0 || index >= updatedAudioFiles.length) return prev;

        const audioFile = updatedAudioFiles[index];
        if (!audioFile) return prev;

        updatedAudioFiles[index] = {
          id: audioFile.id,
          url: field === 'url' ? (value as string) : audioFile.url,
          isPrimary:
            field === 'isPrimary' ? (value as boolean) : audioFile.isPrimary,
          languageCode:
            field === 'languageCode'
              ? (value as AudioFileData['languageCode'])
              : audioFile.languageCode,
          source:
            field === 'source'
              ? (value as AudioFileData['source'])
              : audioFile.source,
          note: field === 'note' ? (value as string | null) : audioFile.note,
          _toDelete: audioFile._toDelete ?? false,
        };
        return { ...prev, audioFiles: updatedAudioFiles };
      });
    },
    [formData, setFormData],
  );

  /**
   * Toggle primary audio (only one can be primary)
   */
  const togglePrimaryAudio = useCallback(
    (index: number) => {
      if (!formData) return;

      setFormData((prev: WordDetailEditData | null) => {
        if (!prev) return null;
        const updatedAudioFiles = prev.audioFiles.map(
          (audio: AudioFileData, i: number) => ({
            ...audio,
            isPrimary: i === index, // Only the selected audio is primary
          }),
        );
        return { ...prev, audioFiles: updatedAudioFiles };
      });
    },
    [formData, setFormData],
  );

  return {
    addAudioFile,
    removeAudioFile,
    updateAudioFile,
    togglePrimaryAudio,
  };
}
