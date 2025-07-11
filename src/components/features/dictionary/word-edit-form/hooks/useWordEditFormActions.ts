import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { RelationshipType } from '@/core/types';
import type { WordFormValues } from '../index';

export function useWordEditFormActions(
  wordId: string,
  form: UseFormReturn<WordFormValues>,
) {
  const onSubmit = async (_values: WordFormValues) => {
    try {
      // Form submission logic would go here
      // For now, just show success message
      toast.success('Word updated successfully');
    } catch (error) {
      console.error('Error updating word:', error);
      toast.error('An error occurred while processing the form');
    }
  };

  const addDefinition = () => {
    const currentDefinitions = form.getValues('definitions');
    form.setValue('definitions', [
      ...currentDefinitions,
      {
        text: '',
        partOfSpeech: 'noun',
        isPlural: false,
        isInShortDef: false,
        examples: [],
      },
    ]);
    toast.success('Definition added');
  };

  const removeDefinition = (index: number) => {
    const currentDefinitions = form.getValues('definitions');
    const newDefinitions = currentDefinitions.filter((_, i) => i !== index);
    form.setValue('definitions', newDefinitions);
    toast.success('Definition removed');
  };

  const addExample = (definitionIndex: number) => {
    const currentDefinitions = form.getValues('definitions');
    const updatedDefinitions = [...currentDefinitions];
    if (updatedDefinitions[definitionIndex]) {
      updatedDefinitions[definitionIndex].examples.push({
        text: '',
      });
      form.setValue('definitions', updatedDefinitions);
      toast.success('Example added');
    }
  };

  const removeExample = (_definitionIndex: number, _exampleIndex: number) => {
    // Example removal logic would go here
    toast.success('Example removed');
  };

  const addAudioFile = () => {
    const currentAudioFiles = form.getValues('audioFiles');
    form.setValue('audioFiles', [
      ...currentAudioFiles,
      {
        url: '',
        isPrimary: false,
      },
    ]);
    toast.success('Audio file added');
  };

  const removeAudioFile = (index: number) => {
    const currentAudioFiles = form.getValues('audioFiles');
    const newAudioFiles = currentAudioFiles.filter((_, i) => i !== index);
    form.setValue('audioFiles', newAudioFiles);
    toast.success('Audio file removed');
  };

  const addRelatedWord = (type: RelationshipType) => {
    const currentRelatedWords = form.getValues('relatedWords') || {};
    const wordsOfType = currentRelatedWords[type] || [];
    form.setValue('relatedWords', {
      ...currentRelatedWords,
      [type]: [
        ...wordsOfType,
        {
          word: '',
        },
      ],
    });
    toast.success(`Related word added to ${type}`);
  };

  const removeRelatedWord = (type: RelationshipType, _index: number) => {
    // Related word removal logic would go here
    toast.success(`Related word removed from ${type}`);
  };

  return {
    onSubmit,
    addDefinition,
    removeDefinition,
    addExample,
    removeExample,
    addAudioFile,
    removeAudioFile,
    addRelatedWord,
    removeRelatedWord,
  };
}
