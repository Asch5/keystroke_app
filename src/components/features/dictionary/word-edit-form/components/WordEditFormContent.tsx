'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2 } from 'lucide-react';

// Define proper interface for component props
interface WordEditFormContentProps {
  wordId: string;
  wordDetails: {
    word: {
      text: string;
      phoneticGeneral?: string | null;
      etymology?: string | null;
    };
    definitions?: Array<{
      text: string;
      partOfSpeech: string;
      subjectStatusLabels?: string | null;
      isPlural: boolean;
      generalLabels?: string | null;
      grammaticalNote?: string | null;
      usageNote?: string | null;
      isInShortDef: boolean;
      examples: Array<{
        text: string;
        grammaticalNote?: string | null;
        audio?: string | null;
      }>;
    }>;
    audioFiles?: Array<{
      url: string;
      isPrimary: boolean;
    }>;
    relatedWords?: Record<
      string,
      Array<{
        word: string;
        phoneticGeneral?: string | null;
        audio?: string | null;
      }>
    >;
  } | null;
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

  // Custom hooks for state and actions
  const { form } = useWordEditFormState(wordDetails, isLoading);
  const {
    onSubmit,
    addDefinition,
    removeDefinition,
    addExample,
    removeExample,
    addRelatedWord,
    removeRelatedWord,
    addAudioFile,
    removeAudioFile,
  } = useWordEditFormActions(wordId, form);

  const isSaving = form.formState.isSubmitting;

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
              removeDefinition={removeDefinition}
              addExample={addExample}
              removeExample={removeExample}
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
