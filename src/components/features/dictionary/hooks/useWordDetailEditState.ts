import { useState } from 'react';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions';

interface UseWordDetailEditStateProps {
  initialData: WordDetailEditData;
}

interface UseWordDetailEditStateReturn {
  formData: WordDetailEditData;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setFormData: React.Dispatch<React.SetStateAction<WordDetailEditData>>;

  // Form field handlers
  handleInputChange: (
    field: keyof WordDetailEditData,
    value: string | number | boolean | null,
  ) => void;
  handleDefinitionChange: (
    index: number,
    field: string,
    value: string | number | boolean | null,
  ) => void;
  handleAudioChange: (
    index: number,
    field: string,
    value: string | number | boolean | null,
  ) => void;
  handleExampleChange: (
    definitionIndex: number,
    exampleIndex: number,
    field: string,
    value: string | null,
  ) => void;
}

export function useWordDetailEditState({
  initialData,
}: UseWordDetailEditStateProps): UseWordDetailEditStateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<WordDetailEditData>(initialData);

  // Handle form field changes
  const handleInputChange = (
    field: keyof WordDetailEditData,
    value: string | number | boolean | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle definition changes
  const handleDefinitionChange = (
    index: number,
    field: string,
    value: string | number | boolean | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      definitions: prev.definitions.map((def, i) =>
        i === index ? { ...def, [field]: value } : def,
      ),
    }));
  };

  // Handle audio file changes
  const handleAudioChange = (
    index: number,
    field: string,
    value: string | number | boolean | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      audioFiles: prev.audioFiles.map((audio, i) =>
        i === index ? { ...audio, [field]: value } : audio,
      ),
    }));
  };

  // Handle example changes
  const handleExampleChange = (
    definitionIndex: number,
    exampleIndex: number,
    field: string,
    value: string | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      definitions: prev.definitions.map((def, i) =>
        i === definitionIndex
          ? {
              ...def,
              examples: def.examples.map((ex, j) =>
                j === exampleIndex ? { ...ex, [field]: value } : ex,
              ),
            }
          : def,
      ),
    }));
  };

  return {
    formData,
    isLoading,
    setIsLoading,
    setFormData,
    handleInputChange,
    handleDefinitionChange,
    handleAudioChange,
    handleExampleChange,
  };
}
