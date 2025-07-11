import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  updateWordDetailById,
  type WordDetailEditData,
} from '@/core/domains/dictionary/actions';
import { SourceType } from '@/core/types';

interface UseWordDetailEditActionsProps {
  formData: WordDetailEditData;
  setFormData: React.Dispatch<React.SetStateAction<WordDetailEditData>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  wordDetailId: number;
}

interface UseWordDetailEditActionsReturn {
  // Definition actions
  addDefinition: () => void;
  removeDefinition: (index: number) => void;

  // Example actions
  addExample: (definitionIndex: number) => void;
  removeExample: (definitionIndex: number, exampleIndex: number) => void;

  // Audio actions
  addAudioFile: () => void;
  removeAudioFile: (index: number) => void;
  togglePrimaryAudio: (index: number) => void;

  // Form submission
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
}

export function useWordDetailEditActions({
  formData,
  setFormData,
  setIsLoading,
  wordDetailId,
}: UseWordDetailEditActionsProps): UseWordDetailEditActionsReturn {
  const router = useRouter();

  // Add new definition
  const addDefinition = useCallback(() => {
    const newDefinition = {
      id: null, // Will be created on server
      definition: '',
      languageCode: formData.languageCode,
      source: 'admin' as SourceType,
      subjectStatusLabels: null,
      generalLabels: null,
      grammaticalNote: null,
      usageNote: null,
      isInShortDef: false,
      imageId: null,
      imageUrl: null,
      examples: [],
      _isNew: true,
    };

    setFormData((prev) => ({
      ...prev,
      definitions: [...prev.definitions, newDefinition],
    }));
  }, [formData.languageCode, setFormData]);

  // Remove definition
  const removeDefinition = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        definitions: prev.definitions.filter((_, i) => i !== index),
      }));
    },
    [setFormData],
  );

  // Add example to definition
  const addExample = useCallback(
    (definitionIndex: number) => {
      const newExample = {
        id: null,
        example: '',
        grammaticalNote: null,
        sourceOfExample: null,
        _isNew: true,
      };

      setFormData((prev) => ({
        ...prev,
        definitions: prev.definitions.map((def, i) =>
          i === definitionIndex
            ? { ...def, examples: [...def.examples, newExample] }
            : def,
        ),
      }));
    },
    [setFormData],
  );

  // Remove example from definition
  const removeExample = useCallback(
    (definitionIndex: number, exampleIndex: number) => {
      setFormData((prev) => ({
        ...prev,
        definitions: prev.definitions.map((def, i) =>
          i === definitionIndex
            ? {
                ...def,
                examples: def.examples.filter((_, j) => j !== exampleIndex),
              }
            : def,
        ),
      }));
    },
    [setFormData],
  );

  // Add new audio file
  const addAudioFile = useCallback(() => {
    const newAudio = {
      id: null,
      url: '',
      source: 'admin' as SourceType,
      languageCode: formData.languageCode,
      note: null,
      isPrimary: formData.audioFiles.length === 0, // First audio is primary by default
      _isNew: true,
    };

    setFormData((prev) => ({
      ...prev,
      audioFiles: [...prev.audioFiles, newAudio],
    }));
  }, [formData.languageCode, formData.audioFiles.length, setFormData]);

  // Remove audio file
  const removeAudioFile = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        audioFiles: prev.audioFiles.filter((_, i) => i !== index),
      }));
    },
    [setFormData],
  );

  // Toggle primary audio file
  const togglePrimaryAudio = useCallback(
    (index: number) => {
      setFormData((prev) => ({
        ...prev,
        audioFiles: prev.audioFiles.map((audio, i) => ({
          ...audio,
          isPrimary: i === index,
        })),
      }));
    },
    [setFormData],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const result = await updateWordDetailById(wordDetailId, formData);

        if (result.success) {
          toast.success('Word detail updated successfully!');
          router.push('/admin/dictionaries');
        } else {
          toast.error(result.error || 'Failed to update word detail');
        }
      } catch (error) {
        console.error('Error updating word detail:', error);
        toast.error('Failed to update word detail');
      } finally {
        setIsLoading(false);
      }
    },
    [wordDetailId, formData, setIsLoading, router],
  );

  // Handle cancel action
  const handleCancel = useCallback(() => {
    router.push('/admin/dictionaries');
  }, [router]);

  return {
    addDefinition,
    removeDefinition,
    addExample,
    removeExample,
    addAudioFile,
    removeAudioFile,
    togglePrimaryAudio,
    handleSubmit,
    handleCancel,
  };
}
