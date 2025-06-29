import { useCallback } from 'react';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions/word-details-actions';

// Extract exact types from WordDetailEditData to ensure compatibility
type DefinitionData = WordDetailEditData['definitions'][0];
type ExampleData = DefinitionData['examples'][0];

interface UseDefinitionManagerProps {
  formData: WordDetailEditData | null;
  setFormData: React.Dispatch<React.SetStateAction<WordDetailEditData | null>>;
}

interface UseDefinitionManagerReturn {
  // Definition operations
  addDefinition: () => void;
  removeDefinition: (index: number) => void;
  updateDefinition: (
    index: number,
    field: string,
    value: string | boolean | null,
  ) => void;

  // Example operations
  addExample: (definitionIndex: number) => void;
  removeExample: (definitionIndex: number, exampleIndex: number) => void;
  updateExample: (
    definitionIndex: number,
    exampleIndex: number,
    field: string,
    value: string | null,
  ) => void;
}

export function useDefinitionManager({
  formData,
  setFormData,
}: UseDefinitionManagerProps): UseDefinitionManagerReturn {
  /**
   * Add a new definition
   */
  const addDefinition = useCallback(() => {
    if (!formData) return;

    const newDefinition: DefinitionData = {
      id: null,
      definition: '',
      source: 'admin',
      languageCode: 'da',
      subjectStatusLabels: null,
      generalLabels: null,
      grammaticalNote: null,
      usageNote: null,
      isInShortDef: false,
      imageId: null,
      imageUrl: null,
      examples: [],
      _toDelete: false,
    };

    setFormData((prev: WordDetailEditData | null) =>
      prev
        ? {
            ...prev,
            definitions: [...prev.definitions, newDefinition],
          }
        : null,
    );
  }, [formData, setFormData]);

  /**
   * Remove a definition (mark for deletion if existing, remove if new)
   */
  const removeDefinition = useCallback(
    (index: number) => {
      if (!formData) return;

      setFormData((prev: WordDetailEditData | null) => {
        if (!prev) return null;
        const updatedDefinitions = [...prev.definitions];
        if (index < 0 || index >= updatedDefinitions.length) return prev;

        const definition = updatedDefinitions[index];
        if (!definition) return prev;

        if (definition.id) {
          // Mark existing definition for deletion
          updatedDefinitions[index] = {
            ...definition,
            _toDelete: true,
          };
        } else {
          // Remove new definition entirely
          updatedDefinitions.splice(index, 1);
        }
        return { ...prev, definitions: updatedDefinitions };
      });
    },
    [formData, setFormData],
  );

  /**
   * Update a definition field
   */
  const updateDefinition = useCallback(
    (index: number, field: string, value: string | boolean | null) => {
      if (!formData) return;

      setFormData((prev: WordDetailEditData | null) => {
        if (!prev) return null;
        const updatedDefinitions = [...prev.definitions];
        if (index < 0 || index >= updatedDefinitions.length) return prev;

        const definition = updatedDefinitions[index];
        if (!definition) return prev;

        updatedDefinitions[index] = {
          ...definition,
          [field]: value,
        } as DefinitionData;
        return { ...prev, definitions: updatedDefinitions };
      });
    },
    [formData, setFormData],
  );

  /**
   * Add a new example to a definition
   */
  const addExample = useCallback(
    (definitionIndex: number) => {
      if (!formData) return;

      const newExample: ExampleData = {
        id: null,
        example: '',
        grammaticalNote: null,
        sourceOfExample: null,
      };

      setFormData((prev: WordDetailEditData | null) => {
        if (!prev) return null;
        const updatedDefinitions = [...prev.definitions];
        if (definitionIndex < 0 || definitionIndex >= updatedDefinitions.length)
          return prev;

        const definition = updatedDefinitions[definitionIndex];
        if (!definition) return prev;

        updatedDefinitions[definitionIndex] = {
          ...definition,
          examples: [...definition.examples, newExample],
        };
        return { ...prev, definitions: updatedDefinitions };
      });
    },
    [formData, setFormData],
  );

  /**
   * Remove an example (mark for deletion if existing, remove if new)
   */
  const removeExample = useCallback(
    (definitionIndex: number, exampleIndex: number) => {
      if (!formData) return;

      setFormData((prev: WordDetailEditData | null) => {
        if (!prev) return null;
        const updatedDefinitions = [...prev.definitions];
        if (definitionIndex < 0 || definitionIndex >= updatedDefinitions.length)
          return prev;

        const definition = updatedDefinitions[definitionIndex];
        if (!definition) return prev;

        const updatedExamples = [...definition.examples];
        if (exampleIndex < 0 || exampleIndex >= updatedExamples.length)
          return prev;

        const example = updatedExamples[exampleIndex];
        if (!example) return prev;

        if (example.id) {
          // Mark existing example for deletion by adding _toDelete flag
          updatedExamples[exampleIndex] = {
            ...example,
            _toDelete: true,
          } as ExampleData & { _toDelete: boolean };
        } else {
          // Remove new example entirely
          updatedExamples.splice(exampleIndex, 1);
        }

        updatedDefinitions[definitionIndex] = {
          ...definition,
          examples: updatedExamples,
        };
        return { ...prev, definitions: updatedDefinitions };
      });
    },
    [formData, setFormData],
  );

  /**
   * Update an example field
   */
  const updateExample = useCallback(
    (
      definitionIndex: number,
      exampleIndex: number,
      field: string,
      value: string | null,
    ) => {
      if (!formData) return;

      setFormData((prev: WordDetailEditData | null) => {
        if (!prev) return null;
        const updatedDefinitions = [...prev.definitions];
        if (definitionIndex < 0 || definitionIndex >= updatedDefinitions.length)
          return prev;

        const definition = updatedDefinitions[definitionIndex];
        if (!definition) return prev;

        const updatedExamples = [...definition.examples];
        if (exampleIndex < 0 || exampleIndex >= updatedExamples.length)
          return prev;

        const example = updatedExamples[exampleIndex];
        if (!example) return prev;

        updatedExamples[exampleIndex] = {
          ...example,
          [field]: value,
        } as ExampleData;

        updatedDefinitions[definitionIndex] = {
          ...definition,
          examples: updatedExamples,
        };
        return { ...prev, definitions: updatedDefinitions };
      });
    },
    [formData, setFormData],
  );

  return {
    // Definition operations
    addDefinition,
    removeDefinition,
    updateDefinition,

    // Example operations
    addExample,
    removeExample,
    updateExample,
  };
}
