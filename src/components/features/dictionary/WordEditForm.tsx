'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  PartOfSpeech,
  RelationshipType,
  SourceType,
  LanguageCode,
} from '@prisma/client';
import { WordFormData } from '@/core/types/wordDefinition';
import {
  WordUpdateData,
  ExampleUpdateData,
  RelatedWordUpdateData,
} from '@/core/types/dictionary';
import { updateWordDetails } from '@/core/lib/actions/dictionaryActions';
import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, Save, Loader2, ImageIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { WordImage } from '@/components/features/dictionary';
import { toast } from 'sonner';

// Form validation schema
const wordFormSchema = z.object({
  // Base word information
  word: z.string().min(1, 'Word is required'),
  phonetic: z.string().optional(),
  etymology: z.string().optional(),

  // Definitions
  definitions: z.array(
    z.object({
      id: z.number().optional(),
      text: z.string().min(1, 'Definition text is required'),
      partOfSpeech: z.nativeEnum(PartOfSpeech),
      subjectStatusLabels: z.string().nullable().optional(),
      isPlural: z.boolean().default(false),
      generalLabels: z.string().nullable().optional(),
      grammaticalNote: z.string().nullable().optional(),
      usageNote: z.string().nullable().optional(),
      isInShortDef: z.boolean().default(false),
      examples: z.array(
        z.object({
          id: z.number().optional(),
          text: z.string().min(1, 'Example text is required'),
          grammaticalNote: z.string().optional(),
          audio: z.string().optional(),
        }),
      ),
    }),
  ),

  // Related words
  relatedWords: z
    .record(
      z.string(),
      z.array(
        z.object({
          id: z.number().optional(),
          word: z.string().min(1, 'Related word is required'),
          phonetic: z.string().optional().nullable(),
          audio: z.string().optional().nullable(),
        }),
      ),
    )
    .optional(),

  // Audio
  audioFiles: z.array(
    z.object({
      id: z.number().optional(),
      url: z.string().min(1, 'Audio URL is required'),
      isPrimary: z.boolean(),
    }),
  ),
});

type WordFormValues = z.infer<typeof wordFormSchema>;

interface WordEditFormProps {
  wordId: string;
  wordDetails: WordFormData | null;
  isLoading: boolean;
}

export default function WordEditForm({
  wordId,
  wordDetails,
  isLoading,
}: WordEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form
  const form = useForm<WordFormValues>({
    resolver: zodResolver(wordFormSchema) as Resolver<WordFormValues>,
    defaultValues: {
      word: '',
      phonetic: '',
      etymology: '',
      definitions: [],
      relatedWords: {} as Record<string, { word: string; phonetic: string }[]>,
      audioFiles: [],
    },
  });

  // Extract mapping functions for form data
  const mapDefinitions = (definitions: WordFormData['definitions']) =>
    definitions.map((def) => ({
      id: def.id,
      text: def.text,
      partOfSpeech: def.partOfSpeech,
      subjectStatusLabels: def.subjectStatusLabels,
      isPlural: def.isPlural,
      generalLabels: def.generalLabels,
      grammaticalNote: def.grammaticalNote,
      usageNote: def.usageNote,
      isInShortDef: def.isInShortDef,
      examples: def.examples.map((ex) => ({
        id: ex.id,
        text: ex.text,
        grammaticalNote: ex.grammaticalNote || '',
        audio: ex.audio || '',
      })),
    }));

  const mapRelatedWords = (relatedWords: WordFormData['relatedWords']) =>
    Object.fromEntries(
      Object.entries(relatedWords).map(([type, words]) => [
        type,
        words.map((word) => ({
          id: word.id,
          word: word.word,
          phonetic: word.phoneticGeneral || null,
          audio: word.audio,
        })),
      ]),
    );

  const mapAudioFiles = (audioFiles: WordFormData['word']['audioFiles']) =>
    audioFiles.map((audio) => ({
      id: audio.id,
      url: audio.url,
      isPrimary: audio.isPrimary || false,
    }));

  // Populate form when wordDetails changes
  useEffect(() => {
    if (wordDetails) {
      console.log('Word details:', JSON.stringify(wordDetails, null, 2));
      console.log(
        'Definitions with images:',
        wordDetails.definitions.map((def) => ({
          id: def.id,
          text: def.text.substring(0, 30),
          imageId: def.image?.id,
          hasImage: !!def.image,
        })),
      );

      form.reset({
        word: wordDetails.word.text,
        phonetic: wordDetails.word.phoneticGeneral || '',
        etymology: wordDetails.word.etymology || '',
        definitions: mapDefinitions(wordDetails.definitions),
        relatedWords: mapRelatedWords(wordDetails.relatedWords),
        audioFiles: mapAudioFiles(wordDetails.word.audioFiles),
      });
    }
  }, [wordDetails, form]);

  // Preserve form state on tab switching - using React 19's automatic cache
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Form values are automatically cached by React 19
      // This creates a subscription to watch for changes
      console.log('Form values updated:', value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle form submission
  const onSubmit = async (values: WordFormValues) => {
    setIsSaving(true);
    try {
      // Validate the form data
      const validatedData = wordFormSchema.parse(values);

      // Prepare data for server action
      const updateData: WordUpdateData = {
        word: validatedData.word,
        phonetic: validatedData.phonetic || null,
        etymology: validatedData.etymology || null,
        // Transform definitions to match the API format
        definitions: validatedData.definitions.map((def) => ({
          id: def.id && def.id > 0 ? def.id : undefined, // Only include valid IDs
          definition: def.text,
          partOfSpeech: def.partOfSpeech,
          imageId: null, // Images are handled separately via WordImage component
          isPlural: def.isPlural,
          source: 'user' as SourceType,
          languageCode: 'en' as LanguageCode,
          subjectStatusLabels: def.subjectStatusLabels ?? null,
          generalLabels: def.generalLabels ?? null,
          grammaticalNote: def.grammaticalNote ?? null,
          usageNote: def.usageNote ?? null,
          isInShortDef: def.isInShortDef,
        })),
        // Transform examples to match the API format - grouped by definition ID
        examples: validatedData.definitions.reduce(
          (acc, def) => {
            if (def.id && def.id > 0 && def.examples?.length) {
              acc[def.id] = def.examples.map((ex) => ({
                id: ex.id && ex.id > 0 ? ex.id : undefined, // Only include valid IDs
                example: ex.text,
                grammaticalNote: ex.grammaticalNote || null,
              }));
            }
            return acc;
          },
          {} as Record<number, ExampleUpdateData[]>,
        ),
        // Transform audio files
        audioFiles: validatedData.audioFiles.map((audio) => ({
          id: audio.id && audio.id > 0 ? audio.id : undefined, // Only include valid IDs
          url: audio.url,
          isPrimary: audio.isPrimary,
          source: 'user' as SourceType,
          languageCode: 'en' as LanguageCode,
        })),
        // Transform related words - need to match the RelationshipType enum structure
        relatedWords: Object.entries(validatedData.relatedWords || {}).reduce(
          (acc, [type, words]) => {
            if (words && words.length > 0) {
              acc[type as RelationshipType] = words.map((word) => ({
                id: word.id && word.id > 0 ? word.id : undefined, // Only include valid IDs
                word: word.word,
                phonetic: word.phonetic || null,
              }));
            }
            return acc;
          },
          {} as Record<RelationshipType, RelatedWordUpdateData[]>,
        ),
      };

      // Use server action to save data
      try {
        const result = await updateWordDetails(wordId, updateData);

        if (result.success) {
          toast.success('Word updated successfully!');

          // Redirect after successful save
          setTimeout(() => {
            router.push('/admin/dictionaries');
          }, 1500);
        } else {
          throw new Error(result.error || 'Failed to save word');
        }
      } catch (error) {
        console.error('Error in save operation:', error);
        toast.error(
          `Failed to save word: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Error saving word:', error);
      toast.error(
        `Failed to save word: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to add a new definition
  const addDefinition = () => {
    const definitions = form.getValues('definitions') || [];
    form.setValue('definitions', [
      ...definitions,
      {
        text: '',
        partOfSpeech: PartOfSpeech.undefined,
        isPlural: false,
        examples: [],
        subjectStatusLabels: null,
        generalLabels: null,
        grammaticalNote: null,
        usageNote: null,
        isInShortDef: false,
      },
    ]);
  };

  // Helper to add a new example to a definition
  const addExample = (definitionIndex: number) => {
    const definitions = form.getValues('definitions');
    const definition = definitions[definitionIndex];

    if (definition) {
      const examples = definition.examples || [];
      definition.examples = [...examples, { text: '', grammaticalNote: '' }];
      form.setValue('definitions', definitions);
    }
  };

  // Helper to add a new related word
  const addRelatedWord = (type: RelationshipType) => {
    const relatedWords = form.getValues('relatedWords') || {};
    const words = relatedWords[type] || [];

    relatedWords[type] = [...words, { word: '', phonetic: '' }];
    form.setValue('relatedWords', relatedWords);
  };

  // Helper to add a new audio file
  const addAudioFile = () => {
    const audioFiles = form.getValues('audioFiles') || [];
    form.setValue('audioFiles', [
      ...audioFiles,
      { url: '', isPrimary: audioFiles.length === 0 }, // First one is primary by default
    ]);
  };

  // Remove item helpers
  const onRemoveDefinition = (index: number) => {
    const currentDefinitions = form.getValues('definitions') || [];
    if (currentDefinitions[index]) {
      const newDefinitions = [...currentDefinitions];
      newDefinitions.splice(index, 1);
      form.setValue('definitions', newDefinitions);
    }
  };

  const onRemoveExample = (definitionIndex: number, exampleIndex: number) => {
    const currentDefinitions = form.getValues('definitions') || [];
    const definition = currentDefinitions[definitionIndex];

    if (definition && definition.examples) {
      const newExamples = [...definition.examples];
      newExamples.splice(exampleIndex, 1);

      const newDefinitions = [...currentDefinitions];
      newDefinitions[definitionIndex] = {
        ...definition,
        examples: newExamples,
      };

      form.setValue('definitions', newDefinitions);
    }
  };

  const removeRelatedWord = (type: RelationshipType, index: number) => {
    const relatedWords = form.getValues('relatedWords');
    if (relatedWords && relatedWords[type]) {
      relatedWords[type].splice(index, 1);
      form.setValue('relatedWords', relatedWords);
    }
  };

  const removeAudioFile = (index: number) => {
    const audioFiles = form.getValues('audioFiles');
    audioFiles.splice(index, 1);
    form.setValue('audioFiles', audioFiles);
  };

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
            {isLoading ? (
              <>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="word"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Word</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phonetic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phonetic</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Phonetic transcription (e.g., /ˈwɜːrd/)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="etymology"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etymology</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormDescription>Word origin and history</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </TabsContent>

          {/* Definitions Tab */}
          <TabsContent value="definitions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Definitions & Examples</h3>
              <Button
                type="button"
                variant="outline"
                onClick={addDefinition}
                disabled={isLoading}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Definition
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            ) : (
              <>
                <Accordion type="multiple" className="w-full">
                  {form.watch('definitions').map((definition, defIndex) => (
                    <AccordionItem key={defIndex} value={`def-${defIndex}`}>
                      <div className="flex items-center justify-between">
                        <AccordionTrigger>
                          Definition {defIndex + 1}:{' '}
                          {definition.text.substring(0, 40)}
                          {definition.text.length > 40 ? '...' : ''}
                        </AccordionTrigger>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveDefinition(defIndex)}
                          className="mr-4"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <FormField
                            control={form.control}
                            name={`definitions.${defIndex}.text`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Definition Text</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`definitions.${defIndex}.partOfSpeech`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Part of Speech</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select part of speech" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.values(PartOfSpeech).map((pos) => (
                                      <SelectItem key={pos} value={pos}>
                                        {pos.charAt(0).toUpperCase() +
                                          pos.slice(1).replace('_', ' ')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/*subjectStatusLabels*/}
                          <FormField
                            control={form.control}
                            name={`definitions.${defIndex}.subjectStatusLabels`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject Status Labels</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/*generalLabels*/}
                          <FormField
                            control={form.control}
                            name={`definitions.${defIndex}.generalLabels`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>General Labels</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/*grammaticalNote*/}
                          <FormField
                            control={form.control}
                            name={`definitions.${defIndex}.grammaticalNote`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grammatical Note</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/*usageNote*/}
                          <FormField
                            control={form.control}
                            name={`definitions.${defIndex}.usageNote`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Usage Note</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/*isInShortDef*/}
                          <FormField
                            control={form.control}
                            name={`definitions.${defIndex}.isInShortDef`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Checkbox
                                    checked={Boolean(field.value)}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="ml-2">
                                  Is In Short Def
                                </FormLabel>
                                <FormDescription>
                                  Check if this definition is in the short
                                  definition
                                </FormDescription>
                              </FormItem>
                            )}
                          />

                          {/*isPlural*/}
                          <FormField
                            control={form.control}
                            name={`definitions.${defIndex}.isPlural`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Checkbox
                                    checked={Boolean(field.value)}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="ml-2">
                                  Is Plural
                                </FormLabel>
                                <FormDescription>
                                  Check if this definition is in the plural form
                                </FormDescription>
                              </FormItem>
                            )}
                          />

                          {/* Examples section */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium">Examples</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addExample(defIndex)}
                              >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Example
                              </Button>
                            </div>

                            {form
                              .watch(`definitions.${defIndex}.examples`)
                              .map((example, exIndex) => (
                                <div
                                  key={exIndex}
                                  className="border rounded-md p-4 relative"
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() =>
                                      onRemoveExample(defIndex, exIndex)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>

                                  <FormField
                                    control={form.control}
                                    name={`definitions.${defIndex}.examples.${exIndex}.text`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Example Text</FormLabel>
                                        <FormControl>
                                          <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`definitions.${defIndex}.examples.${exIndex}.grammaticalNote`}
                                    render={({ field }) => (
                                      <FormItem className="mt-2">
                                        <FormLabel>Grammatical Note</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              ))}

                            {form.watch(`definitions.${defIndex}.examples`)
                              .length === 0 && (
                              <div className="text-center p-4 border border-dashed rounded-md">
                                <p className="text-muted-foreground text-sm">
                                  No examples added yet.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {form.watch('definitions').length === 0 && (
                  <div className="text-center p-6 border border-dashed rounded-md">
                    <p className="text-muted-foreground">
                      No definitions added yet.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDefinition}
                      className="mt-2"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add First Definition
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Definition Images</h3>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            ) : (
              <>
                <Accordion type="multiple" className="w-full">
                  {form.watch('definitions').map((definition, defIndex) => (
                    <AccordionItem
                      key={defIndex}
                      value={`image-def-${defIndex}`}
                    >
                      <AccordionTrigger>
                        Definition {defIndex + 1}:{' '}
                        {definition.text.substring(0, 40)}
                        {definition.text.length > 40 ? '...' : ''}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium">
                              Current Image
                            </h4>
                            {definition.id && (
                              <WordImage
                                mainWord={wordDetails?.word?.text}
                                definitionId={definition.id}
                                definitionText={definition.text}
                                definitionExamples={definition.examples.map(
                                  (example) => example.text,
                                )}
                                className="w-full h-full"
                                onImageSelect={(newImageId) => {
                                  console.log(
                                    `Image updated to ID: ${newImageId} for definition ${definition.id}`,
                                  );
                                  toast.success(
                                    `Image has been updated for definition ${defIndex + 1}`,
                                  );
                                }}
                              />
                            )}
                          </div>

                          {/* Debug the image data */}
                          <div className="text-xs text-muted-foreground mb-2">
                            Definition ID: {definition.id || 'Not saved yet'} |
                            Image ID:{' '}
                            {wordDetails?.definitions[defIndex]?.image?.id ||
                              'None'}
                          </div>

                          {/* Display current image from database */}
                          <div className="w-full max-w-xs mx-auto">
                            {definition.id ? (
                              <div className="border rounded-lg p-4">
                                {wordDetails?.definitions[defIndex]?.image
                                  ?.id ? (
                                  <div className="relative aspect-square w-full overflow-hidden rounded-lg h-64">
                                    <Image
                                      src={`/api/images/${wordDetails.definitions[defIndex].image.id}`}
                                      alt="Word illustration"
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-64 bg-muted/20 rounded-lg">
                                    <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-2" />
                                    <p className="text-sm text-muted-foreground text-center">
                                      No image selected for this definition.
                                      <br />
                                      Click &quot;Change Image&quot; to add one.
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center p-4 border border-dashed rounded-md">
                                <p className="text-muted-foreground text-sm">
                                  Save the word first to add an image to this
                                  definition.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {form.watch('definitions').length === 0 && (
                  <div className="text-center p-6 border border-dashed rounded-md">
                    <p className="text-muted-foreground">
                      No definitions added yet. Add definitions first to attach
                      images.
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Related Words Tab */}
          <TabsContent value="related" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Related Words</h3>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            ) : (
              <>
                <Accordion type="multiple" className="w-full">
                  {Object.entries(RelationshipType).map(([, type]) => (
                    <AccordionItem key={type} value={`relation-${type}`}>
                      <AccordionTrigger className="flex items-center ">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">
                            {type
                              .replace('_', ' ')
                              .replace(/([A-Z])/g, ' $1')
                              .toLowerCase()}
                          </span>
                          {form.watch(`relatedWords.${type}`)?.length > 0 && (
                            <span className="ml-2 text-xs font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-muted-foreground">
                              {form.watch(`relatedWords.${type}`)?.length || 0}
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              addRelatedWord(type as RelationshipType)
                            }
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Related Word
                          </Button>

                          {form
                            .watch(`relatedWords.${type}`)
                            ?.map((relatedWord, rwIndex) => (
                              <div
                                key={rwIndex}
                                className="border rounded-md p-4 relative"
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() =>
                                    removeRelatedWord(
                                      type as RelationshipType,
                                      rwIndex,
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>

                                <FormField
                                  control={form.control}
                                  name={`relatedWords.${type}.${rwIndex}.word`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Word</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`relatedWords.${type}.${rwIndex}.phonetic`}
                                  render={({ field }) => (
                                    <FormItem className="mt-2">
                                      <FormLabel>Phonetic</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          value={field.value || ''}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            ))}

                          {(!form.watch(`relatedWords.${type}`) ||
                            form.watch(`relatedWords.${type}`).length ===
                              0) && (
                            <div className="text-center p-4 border border-dashed rounded-md">
                              <p className="text-muted-foreground text-sm">
                                No related words added yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </>
            )}
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Audio Files</h3>
              <Button
                type="button"
                variant="outline"
                onClick={addAudioFile}
                disabled={isLoading}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Audio File
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            ) : (
              <>
                {form.watch('audioFiles').map((audio, audioIndex) => (
                  <div
                    key={audioIndex}
                    className="border rounded-md p-4 relative space-y-4"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeAudioFile(audioIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>

                    <FormField
                      control={form.control}
                      name={`audioFiles.${audioIndex}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Audio URL</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`audioFiles.${audioIndex}.isPrimary`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Set as primary audio</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                {form.watch('audioFiles').length === 0 && (
                  <div className="text-center p-6 border border-dashed rounded-md">
                    <p className="text-muted-foreground">
                      No audio files added yet.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAudioFile}
                      className="mt-2"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add First Audio File
                    </Button>
                  </div>
                )}
              </>
            )}
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
