'use client';

import { useState } from 'react';
import { getWordDetails, WordDetails } from '@/lib/actions/dictionaryActions';
import { LanguageCode } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  wordText: z.string().min(1, 'Please enter a word'),
});

export default function CheckWordForm() {
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wordText: '',
    },
  });

  console.log('wordDetails', wordDetails);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.wordText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const details = await getWordDetails(
        values.wordText.trim(),
        LanguageCode.en,
      );
      setWordDetails(details);
      if (!details) {
        setError(`Word "${values.wordText}" not found in database`);
      }
    } catch (err) {
      console.error('Error fetching word details:', err);
      setError('Failed to fetch word details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 border-t pt-10 border-border">
      <h2 className="text-2xl font-bold mb-6 text-center">Word Checker</h2>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-xl mx-auto mb-8 space-y-4"
        >
          <FormField
            control={form.control}
            name="wordText"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter word to check"
                      className="flex-1"
                      {...field}
                    />
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Checking...' : 'Check word'}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
        </form>
      </Form>

      {loading && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      )}

      {wordDetails && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">WORD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Name
                </p>
                <p className="text-lg">{wordDetails.word.text}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Phonetic
                </p>
                <p className="text-lg">{wordDetails.word.phonetic || '—'}</p>
              </div>
              {wordDetails.word.audio && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Audio
                  </p>
                  <audio
                    controls
                    src={wordDetails.word.audio}
                    className="w-full mt-1"
                  />
                </div>
              )}
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Etymology
                </p>
                <p>{wordDetails.word.etymology || '—'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Plural
                </p>
                <p>{wordDetails.word.plural ? 'true' : 'false'}</p>
              </div>
              {wordDetails.word.pluralForm && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Plural Form
                  </p>
                  <p>{wordDetails.word.pluralForm}</p>
                </div>
              )}
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Difficulty Level
                </p>
                <p>{wordDetails.word.difficultyLevel}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Language Code
                </p>
                <p>{wordDetails.word.languageCode}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Created At
                </p>
                <p>{new Date(wordDetails.word.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>

          {/* Related Words Section */}
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="related-words">
                <AccordionTrigger className="text-lg font-semibold">
                  Related Words
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 mt-4">
                    <RelatedWordsList
                      title="Synonym"
                      words={wordDetails.relatedWords.synonym}
                    />
                    <RelatedWordsList
                      title="Antonym"
                      words={wordDetails.relatedWords.antonym}
                    />
                    <RelatedWordsList
                      title="Related"
                      words={wordDetails.relatedWords.related}
                    />
                    <RelatedWordsList
                      title="Composition"
                      words={wordDetails.relatedWords.composition}
                    />
                    <RelatedWordsList
                      title="Plural Form"
                      words={wordDetails.relatedWords.plural_en}
                    />
                    <RelatedWordsList
                      title="Phrasal Verb"
                      words={wordDetails.relatedWords.phrasal_verb}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>

          {/* Definitions Section */}
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="definitions">
                <AccordionTrigger className="text-lg font-semibold">
                  Definitions
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    {wordDetails.definitions.map((def, index) => (
                      <Card
                        key={def.id}
                        className="border-none shadow-none bg-accent/40"
                      >
                        <CardContent className="p-4">
                          <h4 className="text-lg font-medium mb-3">
                            Definition {index + 1}: {def.text}
                          </h4>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Part of speech
                              </p>
                              <p>{def.partOfSpeech}</p>
                            </div>
                            {def.image && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Image
                                </p>
                                <a
                                  href={def.image.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {def.image.description || 'View image'}
                                </a>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Frequency Using
                              </p>
                              <p>{def.frequencyUsing}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Language Code
                              </p>
                              <p>{def.languageCode}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Source
                              </p>
                              <p>{def.source}</p>
                            </div>
                            {def.subjectStatusLabels && (
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Subject/Status Labels
                                </p>
                                <p>{def.subjectStatusLabels}</p>
                              </div>
                            )}
                            {def.generalLabels && (
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                  General Labels
                                </p>
                                <p>{def.generalLabels}</p>
                              </div>
                            )}
                            {def.grammaticalNote && (
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                  Grammatical Note
                                </p>
                                <p>{def.grammaticalNote}</p>
                              </div>
                            )}
                            {def.isInShortDef && (
                              <div className="col-span-2">
                                <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Primary Definition
                                </p>
                              </div>
                            )}
                          </div>
                          {def.examples.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                Examples
                              </p>
                              <ol className="list-decimal pl-6 space-y-1">
                                {def.examples.map((ex) => (
                                  <li key={ex.id} className="text-sm">
                                    {ex.text}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>

          {/* Related Phrases Section */}
          {wordDetails.phrases.length > 0 && (
            <CardContent className="pt-0">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="phrases">
                  <AccordionTrigger className="text-lg font-semibold">
                    Related Phrases
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6">
                      {wordDetails.phrases.map((phrase) => (
                        <Card
                          key={phrase.id}
                          className="border-none shadow-none bg-accent/40"
                        >
                          <CardContent className="p-4">
                            <h4 className="text-lg font-medium mb-2">
                              {phrase.text}
                            </h4>
                            <div className="mb-3">
                              <p className="text-sm font-medium text-muted-foreground">
                                Definition
                              </p>
                              <p>{phrase.definition}</p>
                            </div>
                            {phrase.examples.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                  Examples
                                </p>
                                <ol className="list-decimal pl-6 space-y-1">
                                  {phrase.examples.map((ex) => (
                                    <li key={ex.id} className="text-sm">
                                      {ex.text}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

type RelatedWordsListProps = {
  title: string;
  words: Array<{ id: number; word: string }>;
};

function RelatedWordsList({ title, words }: RelatedWordsListProps) {
  if (words.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">
        {title + ' relation'}
      </p>
      <ol className="list-decimal pl-6 space-y-1">
        {words.map((word) => (
          <li key={word.id} className="text-sm">
            {word.word}
          </li>
        ))}
      </ol>
    </div>
  );
}
