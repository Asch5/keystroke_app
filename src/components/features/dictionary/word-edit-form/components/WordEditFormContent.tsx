'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2 } from 'lucide-react';
// Remove invalid imports
// import { WordEditFormProps } from '../types';

// Create minimal interface for props
interface WordEditFormContentProps {
  wordId: string;
  wordDetails: Record<string, unknown> | null;
  isLoading: boolean;
}
import { useWordEditFormState } from '../hooks/useWordEditFormState';
import { useWordEditFormActions } from '../hooks/useWordEditFormActions';
import { WordBasicFields } from './WordBasicFields';
import { DefinitionsSection } from './DefinitionsSection';
import { ImagesSection } from './ImagesSection';
import { RelatedWordsSection } from './RelatedWordsSection';
import { AudioFilesSection } from './AudioFilesSection';

export function WordEditFormContent({
  wordId,
  wordDetails,
  isLoading,
}: WordEditFormContentProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Custom hooks for state and actions
  const { form } = useWordEditFormState(wordDetails);
  const {
    onSubmit,
    addDefinition,
    addExample,
    addRelatedWord,
    addAudioFile,
    onRemoveDefinition,
    onRemoveExample,
    removeRelatedWord,
    removeAudioFile,
  } = useWordEditFormActions(wordId, form, isSaving, setIsSaving);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="definitions">Definitions</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="related">Related Words</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>

          {/* Basic Word Info */}
          <TabsContent value="basic" className="space-y-4">
            <WordBasicFields form={form} isLoading={isLoading} />
          </TabsContent>

          {/* Definitions Tab */}
          <TabsContent value="definitions" className="space-y-6">
            <DefinitionsSection
              form={form}
              isLoading={isLoading}
              addDefinition={addDefinition}
              addExample={addExample}
              onRemoveDefinition={onRemoveDefinition}
              onRemoveExample={onRemoveExample}
            />
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <ImagesSection isLoading={isLoading} />
          </TabsContent>

          {/* Related Words Tab */}
          <TabsContent value="related" className="space-y-6">
            <RelatedWordsSection
              form={form}
              isLoading={isLoading}
              addRelatedWord={addRelatedWord}
              removeRelatedWord={removeRelatedWord}
            />
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="space-y-6">
            <AudioFilesSection
              form={form}
              isLoading={isLoading}
              addAudioFile={addAudioFile}
              removeAudioFile={removeAudioFile}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/dictionaries')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
