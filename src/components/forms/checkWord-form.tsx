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
import { Badge } from '../ui/badge';

const formSchema = z.object({
  wordText: z.string().min(1, 'Please enter a word'),
});

export default function CheckWordForm() {
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wordText: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.wordText.trim()) return;

    const searchTerm = values.wordText.trim();
    setLoading(true);
    setError(null);

    try {
      const details = await getWordDetails(searchTerm, LanguageCode.en);
      setWordDetails(details);

      // Update search history only if word is found
      if (details) {
        setSearchHistory((prev) => {
          // Filter out the same word if it exists in history
          const filteredHistory = prev.filter((w) => w !== searchTerm);
          // Add to the beginning of the array
          return [searchTerm, ...filteredHistory];
        });
        setHistoryIndex(0);
      } else {
        setError(`Word "${searchTerm}" not found in database`);
      }
    } catch (err) {
      console.error('Error fetching word details:', err);
      setError('Failed to fetch word details');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRelatedWord = async (word: string) => {
    form.setValue('wordText', word);
    await onSubmit({ wordText: word });
  };

  const handleNavigateHistory = (direction: 'back' | 'forward') => {
    if (searchHistory.length === 0) return;

    let newIndex;
    if (direction === 'back') {
      newIndex = Math.max(historyIndex - 1, 0);
    } else {
      newIndex = Math.min(historyIndex + 1, searchHistory.length - 1);
    }

    setHistoryIndex(newIndex);
    const word = searchHistory[newIndex];
    if (word) {
      form.setValue('wordText', word);
      onSubmit({ wordText: word });
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

          {/* Navigation history buttons */}
          {searchHistory.length > 1 && (
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateHistory('back')}
                disabled={historyIndex <= 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateHistory('forward')}
                disabled={historyIndex >= searchHistory.length - 1}
              >
                Next
              </Button>
            </div>
          )}
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
            <CardTitle className="text-center flex items-center justify-center gap-2">
              {wordDetails.word.text}
              {wordDetails.word.audio && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() => {
                    if (wordDetails.word.audio) {
                      new Audio(wordDetails.word.audio).play();
                    }
                  }}
                >
                  🔊
                </Button>
              )}
            </CardTitle>
            {wordDetails.word.phonetic && (
              <p className="text-center text-muted-foreground">
                {wordDetails.word.phonetic}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {wordDetails.word.etymology && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Etymology
                  </p>
                  <p>{wordDetails.word.etymology}</p>
                </div>
              )}
              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Difficulty Level
                </p>
                <Badge variant="outline">
                  {wordDetails.word.difficultyLevel}
                </Badge>
              </div>
              {wordDetails.word.pluralForm && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Plural Form
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() =>
                      wordDetails.word.pluralForm &&
                      navigateToRelatedWord(wordDetails.word.pluralForm)
                    }
                  >
                    {wordDetails.word.pluralForm}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>

          {/* Related Words Section */}
          <CardContent className="pt-0">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="related-words"
            >
              <AccordionItem value="related-words">
                <AccordionTrigger className="text-lg font-semibold">
                  Related Words
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 mt-4">
                    <EnhancedRelatedWordsList
                      relatedWords={wordDetails.relatedWords}
                      onSelect={navigateToRelatedWord}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>

          {/* Definitions Section */}
          <CardContent className="pt-0">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="definitions"
            >
              <AccordionItem value="definitions">
                <AccordionTrigger className="text-lg font-semibold">
                  Definitions
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    {wordDetails.definitions.map((def) => (
                      <Card
                        key={def.id}
                        className={`border-none shadow-none ${def.isInShortDef ? 'bg-primary/10' : 'bg-accent/40'}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge>{def.partOfSpeech}</Badge>
                            {def.isInShortDef && (
                              <Badge variant="secondary">Primary</Badge>
                            )}
                          </div>
                          <h4 className="text-lg font-medium mb-3">
                            {def.text}
                          </h4>
                          <div className="grid grid-cols-2 gap-3 mb-3">
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

type EnhancedRelatedWordsListProps = {
  relatedWords: WordDetails['relatedWords'];
  onSelect: (word: string) => void;
};

function EnhancedRelatedWordsList({
  relatedWords,
  onSelect,
}: EnhancedRelatedWordsListProps) {
  // Create arrays for different relationship types
  const synonyms = relatedWords.synonym?.map((item) => item.word) || [];
  const antonyms = relatedWords.antonym?.map((item) => item.word) || [];
  const related = relatedWords.related?.map((item) => item.word) || [];
  const composition = relatedWords.composition?.map((item) => item.word) || [];
  const phrasal_verbs =
    relatedWords.phrasal_verb?.map((item) => item.word) || [];
  const plurals = relatedWords.plural_en?.map((item) => item.word) || [];

  // Verb forms
  const pastTense = relatedWords.past_tense_en?.map((item) => item.word) || [];
  const pastParticiple =
    relatedWords.past_participle_en?.map((item) => item.word) || [];
  const presentParticiple =
    relatedWords.present_participle_en?.map((item) => item.word) || [];
  const thirdPerson =
    relatedWords.third_person_en?.map((item) => item.word) || [];

  // Create a structured object for rendering
  const wordsByType: Record<string, string[]> = {
    Synonyms: synonyms,
    Antonyms: antonyms,
    'Related Words': related,
    Compositions: composition,
    'Phrasal Verbs': phrasal_verbs,
    'Plural Forms': plurals,
    'Past Tense': pastTense,
    'Past Participle': pastParticiple,
    'Present Participle': presentParticiple,
    'Third Person': thirdPerson,
  };

  return (
    <div className="space-y-4">
      {Object.entries(wordsByType).map(([type, words]) =>
        words.length > 0 ? (
          <div key={type} className="space-y-2">
            <h4 className="text-sm font-medium">{type}</h4>
            <div className="flex flex-wrap gap-2">
              {words.map((word) => (
                <Button
                  key={word}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(word)}
                >
                  {word}
                </Button>
              ))}
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
