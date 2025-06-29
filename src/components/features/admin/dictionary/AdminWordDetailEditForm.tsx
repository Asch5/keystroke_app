'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions/word-details-actions';

// Imported hooks
import { useWordDetailEditState } from './hooks/useWordDetailEditState';
import { useWordDetailEditActions } from './hooks/useWordDetailEditActions';
import { useDefinitionManager } from './hooks/useDefinitionManager';
import { useAudioFileManager } from './hooks/useAudioFileManager';

// Imported section components
import DefinitionsSection from './DefinitionsSection';
import AudioFilesSection from './AudioFilesSection';
import RelationshipsSection from './RelationshipsSection';

interface WordDetailEditFormProps {
  wordDetailId: number;
}

/**
 * WordDetailEditForm component refactored to use extracted hooks and components
 * This is now a focused orchestrator component that delegates specific functionality
 * to custom hooks and specialized section components
 */
export default function WordDetailEditForm({
  wordDetailId,
}: WordDetailEditFormProps) {
  // Use extracted state management hook
  const {
    formData,
    setFormData,
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
    loadWordDetail,
    isAnySaving,
  } = useWordDetailEditState({ wordDetailId });

  // Use extracted save actions hook
  const {
    handleSaveAll,
    handleSaveDefinitions,
    handleSaveAudioFiles,
    handleSaveImages,
    handleSaveRelationships,
  } = useWordDetailEditActions({
    wordDetailId,
    formData,
    setIsSaving,
    setIsSavingDefinitions,
    setIsSavingAudioFiles,
    setIsSavingRelationships,
    setIsSavingImages,
    loadWordDetail,
  });

  // Use extracted definition manager hook
  const {
    addDefinition,
    removeDefinition,
    updateDefinition,
    addExample,
    removeExample,
    updateExample,
  } = useDefinitionManager({ formData, setFormData });

  // Use extracted audio file manager hook
  const { addAudioFile, removeAudioFile, updateAudioFile, togglePrimaryAudio } =
    useAudioFileManager({ formData, setFormData });

  // Handle form data updates for relationships
  const handleUpdateFormData = (updates: Partial<WordDetailEditData>) => {
    setFormData((prev: WordDetailEditData | null) =>
      prev ? { ...prev, ...updates } : null,
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading word detail...</span>
        </div>
      </div>
    );
  }

  // No data state
  if (!formData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Word detail not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with global save */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Word Detail</h1>
        <Button
          onClick={handleSaveAll}
          disabled={isAnySaving}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving All...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      {/* Main sections in accordion */}
      <Accordion
        type="multiple"
        defaultValue={['definitions', 'audio', 'relationships']}
        className="space-y-4"
      >
        {/* Definitions Section */}
        <DefinitionsSection
          formData={formData}
          isSavingDefinitions={isSavingDefinitions}
          isSavingImages={isSavingImages}
          onSaveDefinitions={handleSaveDefinitions}
          onSaveImages={handleSaveImages}
          onAddDefinition={addDefinition}
          onRemoveDefinition={removeDefinition}
          onUpdateDefinition={updateDefinition}
          onAddExample={addExample}
          onRemoveExample={removeExample}
          onUpdateExample={updateExample}
        />

        {/* Audio Files Section */}
        <AudioFilesSection
          formData={formData}
          isSavingAudioFiles={isSavingAudioFiles}
          onSaveAudioFiles={handleSaveAudioFiles}
          onAddAudioFile={addAudioFile}
          onRemoveAudioFile={removeAudioFile}
          onUpdateAudioFile={updateAudioFile}
          onTogglePrimaryAudio={togglePrimaryAudio}
        />

        {/* Relationships Section */}
        <RelationshipsSection
          formData={formData}
          isSavingRelationships={isSavingRelationships}
          onSaveRelationships={handleSaveRelationships}
          onUpdateFormData={handleUpdateFormData}
        />
      </Accordion>

      {/* Global Save Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={handleSaveAll}
          disabled={isAnySaving}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving All Changes...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
