'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions';
import { useWordDetailEditState } from './hooks/useWordDetailEditState';
import { useWordDetailEditActions } from './hooks/useWordDetailEditActions';
import WordFieldsSection from './WordFieldsSection';
import WordDetailFieldsSection from './WordDetailFieldsSection';
import DefinitionsSection from './DefinitionsSection';
import AudioFilesSection from './AudioFilesSection';
import { RelationshipManager } from './RelationshipManager';

interface WordDetailEditFormProps {
  wordDetailId: number;
  initialData: WordDetailEditData;
}

/**
 * WordDetailEditForm component for editing word details
 * Refactored into modular components and custom hooks following Cursor Rules
 * Memoized to prevent unnecessary re-renders
 */
export const WordDetailEditForm = memo(function WordDetailEditForm({
  wordDetailId,
  initialData,
}: WordDetailEditFormProps) {
  // Custom hooks for state and actions
  const {
    formData,
    isLoading,
    setIsLoading,
    setFormData,
    handleInputChange,
    handleDefinitionChange,
    handleAudioChange,
    handleExampleChange,
  } = useWordDetailEditState({ initialData });

  const {
    addDefinition,
    removeDefinition,
    addExample,
    removeExample,
    addAudioFile,
    removeAudioFile,
    togglePrimaryAudio,
    handleSubmit,
    handleCancel,
  } = useWordDetailEditActions({
    formData,
    setFormData,
    setIsLoading,
    wordDetailId,
  });

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Word Detail</h1>
          <p className="text-muted-foreground">
            WordDetail ID: {wordDetailId} • Word: &ldquo;{formData.wordText}
            &rdquo;
          </p>
        </div>
        <Button
          onClick={handleCancel}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dictionaries</span>
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Word Fields Section */}
        <WordFieldsSection
          formData={formData}
          onInputChange={handleInputChange}
        />

        {/* WordDetail Fields Section */}
        <WordDetailFieldsSection
          formData={formData}
          onInputChange={handleInputChange}
        />

        {/* Definitions and Audio in Accordion */}
        <Accordion
          type="multiple"
          defaultValue={['definitions', 'audio']}
          className="w-full"
        >
          {/* Definitions Section */}
          <DefinitionsSection
            formData={formData}
            onDefinitionChange={handleDefinitionChange}
            onExampleChange={handleExampleChange}
            onAddDefinition={addDefinition}
            onRemoveDefinition={removeDefinition}
            onAddExample={addExample}
            onRemoveExample={removeExample}
          />

          {/* Audio Files Section */}
          <AudioFilesSection
            formData={formData}
            onAudioChange={handleAudioChange}
            onAddAudioFile={addAudioFile}
            onRemoveAudioFile={removeAudioFile}
            onTogglePrimaryAudio={togglePrimaryAudio}
          />

          {/* Relationships Section */}
          <RelationshipManager
            formData={formData}
            onUpdateFormData={(updates) =>
              setFormData((prev) => ({ ...prev, ...updates }))
            }
          />
        </Accordion>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
});
