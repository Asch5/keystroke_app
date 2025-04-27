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
import React from 'react';
import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const formSchema = z.object({
  wordText: z.string().min(1, 'Please enter a word'),
});

// Add type definition or update the existing one to include grammaticalNote in examples
// This is needed for TypeScript to recognize the grammaticalNote property

// If there's no explicit type definition in the file, we'll need to add it
type DefinitionExample = {
  id: number;
  text: string;
  grammaticalNote?: string | null;
  audio: string | null;
  languageCode?: string;
};

// Add a utility function to render text with {it} tags as italic
function renderTextWithEmphasis(text: string): React.ReactNode {
  // Early exit for empty text
  if (!text || text.length === 0) return text;

  // Handle {ldquo} and {rdquo} patterns first - simple string replacement
  if (text.includes('{ldquo}') || text.includes('{rdquo}')) {
    text = text.replace(/\{ldquo\}/g, '"').replace(/\{rdquo\}/g, '"');
  }

  // Split by equals sign first to handle multiple examples
  if (text.includes(' = ')) {
    const examples = text.split(' = ');
    return (
      <>
        {examples.map((example, index) => (
          <span key={index}>
            {index > 0 && (
              <span className="mx-2 text-muted-foreground font-medium">=</span>
            )}
            {renderTextWithEmphasis(example)}
          </span>
        ))}
      </>
    );
  }

  // Handle {phrase}...{/phrase} pattern - process without splitting if no phrase tags found
  if (text.includes('{phrase}') && text.includes('{/phrase}')) {
    try {
      const parts = [];
      let currentText = text;
      let startIndex = currentText.indexOf('{phrase}');
      let endIndex = -1;

      while (startIndex !== -1) {
        // Add text before the phrase tag
        if (startIndex > 0) {
          parts.push(currentText.substring(0, startIndex));
        }

        // Find matching end tag
        endIndex = currentText.indexOf('{/phrase}', startIndex);
        if (endIndex === -1) break; // No matching end tag found

        // Extract phrase content without the tags
        const phraseContent = currentText.substring(startIndex + 8, endIndex);
        parts.push({
          type: 'phrase',
          content: phraseContent,
        });

        // Update remaining text
        currentText = currentText.substring(endIndex + 9);
        startIndex = currentText.indexOf('{phrase}');
      }

      // Add any remaining text
      if (currentText.length > 0) {
        parts.push(currentText);
      }

      return (
        <>
          {parts.map((part, index) => {
            if (typeof part === 'string') {
              return (
                <React.Fragment key={index}>
                  {renderTextWithEmphasis(part)}
                </React.Fragment>
              );
            } else {
              return (
                <span
                  key={index}
                  className="inline-block bg-primary/10 text-primary rounded-sm px-1 py-0.5 font-medium border border-primary/20"
                >
                  {renderTextWithEmphasis(part.content)}
                </span>
              );
            }
          })}
        </>
      );
    } catch (error) {
      // Fallback in case of parsing error
      console.error('Error parsing phrase tags:', error);
      return text;
    }
  }

  // Handle [=...] pattern - process without splitting if no brackets found
  if (text.includes('[=') && text.includes(']')) {
    try {
      const parts = [];
      let currentText = text;
      let startIndex = currentText.indexOf('[=');
      let endIndex = -1;

      while (startIndex !== -1) {
        // Add text before the definition tag
        if (startIndex > 0) {
          parts.push(currentText.substring(0, startIndex));
        }

        // Find matching end bracket
        endIndex = currentText.indexOf(']', startIndex);
        if (endIndex === -1) break; // No matching end bracket found

        // Extract definition content without the tags
        const defContent = currentText.substring(startIndex + 2, endIndex);
        parts.push({
          type: 'definition',
          content: defContent,
        });

        // Update remaining text
        currentText = currentText.substring(endIndex + 1);
        startIndex = currentText.indexOf('[=');
      }

      // Add any remaining text
      if (currentText.length > 0) {
        parts.push(currentText);
      }

      return (
        <>
          {parts.map((part, index) => {
            if (typeof part === 'string') {
              return (
                <React.Fragment key={index}>
                  {renderTextWithEmphasis(part)}
                </React.Fragment>
              );
            } else {
              return (
                <span
                  key={index}
                  className="inline-block bg-muted/30 text-muted-foreground rounded px-1.5 py-0.5 text-[0.9em] font-medium"
                >
                  ({renderTextWithEmphasis(part.content)})
                </span>
              );
            }
          })}
        </>
      );
    } catch (error) {
      // Fallback in case of parsing error
      console.error('Error parsing definition brackets:', error);
      return text;
    }
  }

  // Then handle {it} pattern
  if (text.includes('{it}') && text.includes('{/it}')) {
    try {
      const parts = [];
      let currentText = text;
      let startIndex = currentText.indexOf('{it}');
      let endIndex = -1;

      while (startIndex !== -1) {
        // Add text before the italic tag
        if (startIndex > 0) {
          parts.push(currentText.substring(0, startIndex));
        }

        // Find matching end tag
        endIndex = currentText.indexOf('{/it}', startIndex);
        if (endIndex === -1) break; // No matching end tag found

        // Extract italic content without the tags
        const italicContent = currentText.substring(startIndex + 4, endIndex);
        parts.push({
          type: 'italic',
          content: italicContent,
        });

        // Update remaining text
        currentText = currentText.substring(endIndex + 5);
        startIndex = currentText.indexOf('{it}');
      }

      // Add any remaining text
      if (currentText.length > 0) {
        parts.push(currentText);
      }

      return (
        <>
          {parts.map((part, index) => {
            if (typeof part === 'string') {
              return <React.Fragment key={index}>{part}</React.Fragment>;
            } else {
              return (
                <em className="font-bold text-red-500" key={index}>
                  {part.content}
                </em>
              );
            }
          })}
        </>
      );
    } catch (error) {
      // Fallback in case of parsing error
      console.error('Error parsing italic tags:', error);
      return text;
    }
  }

  // If none of the specific patterns are found, return the text as is
  return text;
}

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

      console.log('details', details);

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
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Etymology
                  </p>
                  <p className="text-sm">{wordDetails.word.etymology}</p>
                </div>
              )}

              {/* Word metadata in a grid */}
              <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Part of Speech
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Array.from(
                      new Set(
                        wordDetails.definitions.map((d) => d.partOfSpeech),
                      ),
                    ).map((pos) => (
                      <Badge key={pos} variant="outline" className="capitalize">
                        {pos.toString().replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Language
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {wordDetails.word.languageCode}
                  </Badge>
                </div>
              </div>

              {/* Add this within the Word metadata in a grid section */}
              <div className="col-span-2 mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Frequency Rankings
                </p>
                <div className="bg-muted/10 p-3 rounded-md">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">
                        Overall Word Rank
                      </p>
                      <Badge variant="outline" className={`mt-1`}>
                        {String(wordDetails.word.wordFrequency).replace(
                          '_',
                          ' ',
                        )}
                      </Badge>
                    </div>

                    {/* {wordDetails.definitions.some(
                      (d) => d.frequencyPartOfSpeech,
                    ) && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Part of Speech Rankings
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Array.from(
                            new Set(
                              wordDetails.definitions
                                .map((d) =>
                                  d.frequencyPartOfSpeech && d.partOfSpeech
                                    ? {
                                        pos: d.partOfSpeech,
                                        freq: d.frequencyPartOfSpeech,
                                      }
                                    : null,
                                )
                                .filter(Boolean),
                            ),
                          ).map(
                            (posFreq) =>
                              posFreq && (
                                <div
                                  key={String(posFreq.pos)}
                                  className="flex items-center gap-1"
                                >
                                  <Badge>
                                    {String(posFreq.pos).replace('_', ' ')}
                                  </Badge>
                                  <Badge variant="outline">
                                    {String(posFreq.freq).replace('_', ' ')}
                                  </Badge>
                                </div>
                              ),
                          )}
                        </div>
                      </div>
                    )} */}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Rankings indicate how common the word is in typical usage.
                    Lower numbers indicate more common words.
                    <span className="block mt-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-100 mr-1"></span>{' '}
                      Very Common
                      <span className="inline-block w-3 h-3 rounded-full bg-yellow-100 mx-1 ml-2"></span>{' '}
                      Common
                      <span className="inline-block w-3 h-3 rounded-full bg-amber-50 mx-1 ml-2"></span>{' '}
                      Less Common
                      <span className="inline-block w-3 h-3 rounded-full bg-gray-100 mx-1 ml-2"></span>{' '}
                      Rare
                    </span>
                  </p>
                </div>
              </div>

              {/* Verb Forms Section - Enhanced */}
              {(wordDetails.word.pastTenseForm ||
                wordDetails.word.pastParticipleForm ||
                wordDetails.word.presentParticipleForm ||
                wordDetails.word.thirdPersonForm) && (
                <div className="col-span-2 mt-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Verb Forms
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-accent/10 p-3 rounded-md">
                    {wordDetails.word.pastTenseForm && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Past Tense
                        </p>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary"
                          onClick={() =>
                            navigateToRelatedWord(
                              wordDetails.word.pastTenseForm || '',
                            )
                          }
                        >
                          {wordDetails.word.pastTenseForm}
                        </Button>
                      </div>
                    )}
                    {wordDetails.word.pastParticipleForm && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Past Participle
                        </p>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary"
                          onClick={() =>
                            navigateToRelatedWord(
                              wordDetails.word.pastParticipleForm || '',
                            )
                          }
                        >
                          {wordDetails.word.pastParticipleForm}
                        </Button>
                      </div>
                    )}
                    {wordDetails.word.presentParticipleForm && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Present Participle
                        </p>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary"
                          onClick={() =>
                            navigateToRelatedWord(
                              wordDetails.word.presentParticipleForm || '',
                            )
                          }
                        >
                          {wordDetails.word.presentParticipleForm}
                        </Button>
                      </div>
                    )}
                    {wordDetails.word.thirdPersonForm && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Third Person
                        </p>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary"
                          onClick={() =>
                            navigateToRelatedWord(
                              wordDetails.word.thirdPersonForm || '',
                            )
                          }
                        >
                          {wordDetails.word.thirdPersonForm}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plural Form - Enhanced */}
              {wordDetails.word.pluralForm && (
                <div className="col-span-2 sm:col-span-1 mt-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Plural Form
                  </p>
                  <Button
                    variant="outline"
                    className="text-primary"
                    size="sm"
                    onClick={() =>
                      wordDetails.word.pluralForm &&
                      navigateToRelatedWord(wordDetails.word.pluralForm)
                    }
                  >
                    {wordDetails.word.pluralForm}
                  </Button>
                </div>
              )}

              {/* Word Variants Section */}
              {(wordDetails.relatedWords.alternative_spelling.length > 0 ||
                wordDetails.relatedWords.variant_form_phrasal_verb_en.length >
                  0) && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Alternative Forms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {wordDetails.relatedWords.alternative_spelling.map(
                      (variant: WordVariant) => (
                        <div
                          key={variant.id}
                          className="flex items-center gap-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToRelatedWord(variant.word)}
                          >
                            {variant.word}
                          </Button>
                          {variant.audio && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={() => {
                                new Audio(variant.audio || '').play();
                              }}
                            >
                              🔊
                            </Button>
                          )}
                        </div>
                      ),
                    )}
                    {wordDetails.relatedWords.variant_form_phrasal_verb_en.map(
                      (variant: WordVariant) => (
                        <div
                          key={variant.id}
                          className="flex items-center gap-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToRelatedWord(variant.word)}
                          >
                            {variant.word}
                          </Button>
                          {variant.audio && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={() => {
                                new Audio(variant.audio || '').play();
                              }}
                            >
                              🔊
                            </Button>
                          )}
                          <span className="text-xs text-muted-foreground">
                            (phrasal verb form)
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Multiple Audio Pronunciations */}
              {wordDetails.word.audioFiles.length > 1 && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Pronunciations
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {wordDetails.word.audioFiles.map((audio, index) => (
                      <Button
                        key={audio.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          new Audio(audio.url).play();
                        }}
                      >
                        {audio.isPrimary
                          ? 'Primary'
                          : `Pronunciation ${index + 1}`}{' '}
                        🔊
                      </Button>
                    ))}
                  </div>
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
                  {/* Group definitions by part of speech */}
                  {(() => {
                    // Group definitions by part of speech
                    const defsByPartOfSpeech = wordDetails.definitions.reduce(
                      (acc, def) => {
                        const pos = def.partOfSpeech;
                        if (!acc[pos]) {
                          acc[pos] = [];
                        }
                        acc[pos].push(def);
                        return acc;
                      },
                      {} as Record<string, typeof wordDetails.definitions>,
                    );

                    // Order the parts of speech in a logical sequence
                    const posOrder = [
                      'noun',
                      'verb',
                      'adjective',
                      'adverb',
                      'pronoun',
                      'preposition',
                      'conjunction',
                      'interjection',
                      'phrasal_verb',
                      'phrase',
                      'undefined',
                    ];

                    // Sort the keys based on the posOrder
                    const sortedPOS = Object.keys(defsByPartOfSpeech).sort(
                      (a, b) => {
                        const indexA = posOrder.indexOf(a);
                        const indexB = posOrder.indexOf(b);
                        return indexA - indexB;
                      },
                    );

                    return (
                      <div className="space-y-8">
                        {sortedPOS.map((pos) => (
                          <div
                            key={pos}
                            className="border-l-4 pl-4 border-primary/60"
                          >
                            <h3 className="text-lg font-medium mb-4 capitalize">
                              {pos.replace('_', ' ')}
                            </h3>
                            <div className="space-y-6">
                              {(defsByPartOfSpeech[pos] || [])
                                // Sort definitions: primary/shortDef ones first
                                .sort((a, b) => {
                                  if (a.isInShortDef && !b.isInShortDef)
                                    return -1;
                                  if (!a.isInShortDef && b.isInShortDef)
                                    return 1;
                                  return 0;
                                })
                                .map((def, index) => (
                                  <Card
                                    key={def.id}
                                    className={`border-l-4 ${
                                      def.isInShortDef
                                        ? 'border-l-primary bg-accent/10'
                                        : 'border-l-muted'
                                    } shadow-sm`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="text-sm font-semibold text-muted-foreground">
                                          {index + 1}.
                                        </div>
                                        {def.isInShortDef && (
                                          <Badge variant="secondary">
                                            Main Definition
                                          </Badge>
                                        )}
                                        {def.subjectStatusLabels && (
                                          <Badge variant="outline">
                                            {def.subjectStatusLabels}
                                          </Badge>
                                        )}
                                        {def.frequencyPartOfSpeech && (
                                          <Badge variant="outline">
                                            {String(
                                              def.frequencyPartOfSpeech,
                                            ).replace('_', ' ')}
                                          </Badge>
                                        )}
                                      </div>
                                      <h4 className="text-lg font-medium mb-3">
                                        {def.text}
                                      </h4>
                                      <div className="mb-4">
                                        {def.image?.url ? (
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <div className="cursor-pointer hover:opacity-90 transition-opacity">
                                                <AspectRatio
                                                  ratio={10 / 7}
                                                  className="bg-muted"
                                                >
                                                  <Image
                                                    src={def.image.url}
                                                    alt={
                                                      def.image.description ||
                                                      def.text
                                                    }
                                                    fill
                                                    className="rounded-md object-cover"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                  />
                                                </AspectRatio>
                                              </div>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-screen-lg w-full p-0">
                                              <AspectRatio ratio={16 / 9}>
                                                <Image
                                                  src={def.image.url}
                                                  alt={
                                                    def.image.description ||
                                                    def.text
                                                  }
                                                  fill
                                                  className="object-contain"
                                                  sizes="100vw"
                                                  priority
                                                />
                                              </AspectRatio>
                                            </DialogContent>
                                          </Dialog>
                                        ) : (
                                          <div className="rounded-md border-2 border-dashed border-muted p-6 text-center">
                                            <p className="text-sm text-muted-foreground">
                                              No image available
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        {def.generalLabels && (
                                          <div className="col-span-full">
                                            <p className="text-sm font-medium text-muted-foreground">
                                              Context/Labels
                                            </p>
                                            <p className="text-sm">
                                              {def.generalLabels}
                                            </p>
                                          </div>
                                        )}
                                        {def.grammaticalNote && (
                                          <div className="col-span-full">
                                            <p className="text-sm font-medium text-muted-foreground">
                                              Grammatical Note
                                            </p>
                                            <p className="text-sm">
                                              {renderTextWithEmphasis(
                                                def.grammaticalNote,
                                              )}
                                            </p>
                                          </div>
                                        )}
                                        {def.usageNote && (
                                          <div className="col-span-full bg-muted/30 p-2 rounded">
                                            <p className="text-sm font-medium text-muted-foreground">
                                              Usage Notes
                                            </p>
                                            <p className="text-sm whitespace-pre-line">
                                              {renderTextWithEmphasis(
                                                def.usageNote,
                                              )}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      {def.examples.length > 0 && (
                                        <div>
                                          <p className="text-sm font-medium text-muted-foreground mb-2">
                                            Examples
                                          </p>
                                          {(() => {
                                            // Ensure examples are properly typed
                                            const examples =
                                              def.examples as DefinitionExample[];

                                            // Group examples by their grammatical notes
                                            const groupedExamples =
                                              examples.reduce(
                                                (acc, example) => {
                                                  const noteKey =
                                                    example.grammaticalNote ||
                                                    'General Examples';
                                                  if (!acc[noteKey]) {
                                                    acc[noteKey] = [];
                                                  }
                                                  acc[noteKey].push(example);
                                                  return acc;
                                                },
                                                {} as Record<
                                                  string,
                                                  DefinitionExample[]
                                                >,
                                              );

                                            return (
                                              <div className="space-y-4">
                                                {Object.entries(
                                                  groupedExamples,
                                                ).map(
                                                  ([
                                                    noteKey,
                                                    groupExamples,
                                                  ]) => (
                                                    <div
                                                      key={noteKey}
                                                      className={`rounded-md p-3 ${
                                                        noteKey ===
                                                        'General Examples'
                                                          ? ''
                                                          : 'bg-muted/20 border-l-2 border-primary/40'
                                                      }`}
                                                    >
                                                      {noteKey !==
                                                        'General Examples' && (
                                                        <p className="text-sm font-medium text-muted-foreground mb-2">
                                                          {renderTextWithEmphasis(
                                                            noteKey,
                                                          )}
                                                        </p>
                                                      )}
                                                      <ol className="list-decimal pl-6 space-y-2">
                                                        {groupExamples.map(
                                                          (ex) => (
                                                            <li
                                                              key={ex.id}
                                                              className="text-sm"
                                                            >
                                                              <div className="flex items-start gap-2">
                                                                <div className="flex-1">
                                                                  <span>
                                                                    {renderTextWithEmphasis(
                                                                      ex.text,
                                                                    )}
                                                                  </span>
                                                                </div>
                                                                {ex.audio && (
                                                                  <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 rounded-full shrink-0"
                                                                    onClick={() => {
                                                                      new Audio(
                                                                        ex.audio ||
                                                                          '',
                                                                      ).play();
                                                                    }}
                                                                  >
                                                                    🔊
                                                                  </Button>
                                                                )}
                                                              </div>
                                                            </li>
                                                          ),
                                                        )}
                                                      </ol>
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>

          {/* Related Phrases Section - Enhanced */}
          {wordDetails.phrases.length > 0 && (
            <CardContent className="pt-0">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="phrases">
                  <AccordionTrigger className="text-lg font-semibold">
                    Related Phrases and Expressions
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6">
                      {/* Group phrases by part of speech */}
                      {(() => {
                        const phrasesByType = wordDetails.phrases.reduce(
                          (acc, phrase) => {
                            const type = phrase.partOfSpeech;
                            if (!acc[type]) {
                              acc[type] = [];
                            }
                            acc[type].push(phrase);
                            return acc;
                          },
                          {} as Record<string, typeof wordDetails.phrases>,
                        );

                        return Object.entries(phrasesByType).map(
                          ([type, phrases]) => (
                            <div key={type} className="space-y-4">
                              <h3 className="text-md font-semibold border-b pb-1 capitalize">
                                {type.replace('_', ' ')} Phrases
                              </h3>
                              {phrases.map((phrase) => (
                                <Card
                                  key={phrase.id}
                                  className="border-l-4 border-l-secondary bg-accent/20 shadow-sm"
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <h4 className="text-lg font-medium">
                                        {phrase.text}
                                      </h4>
                                      {phrase.audio && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 rounded-full"
                                          onClick={() => {
                                            new Audio(
                                              phrase.audio || '',
                                            ).play();
                                          }}
                                        >
                                          🔊
                                        </Button>
                                      )}
                                    </div>

                                    <div className="mb-4">
                                      <p className="text-sm font-medium text-muted-foreground mb-1">
                                        Definition
                                      </p>
                                      <p className="text-base">
                                        {phrase.definition}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                      {phrase.grammaticalNote && (
                                        <div className="col-span-full">
                                          <p className="text-sm font-medium text-muted-foreground">
                                            Grammatical Note
                                          </p>
                                          <p className="text-sm">
                                            {phrase.grammaticalNote}
                                          </p>
                                        </div>
                                      )}
                                      {phrase.generalLabels && (
                                        <div className="col-span-full">
                                          <p className="text-sm font-medium text-muted-foreground">
                                            General Labels
                                          </p>
                                          <p className="text-sm">
                                            {phrase.generalLabels}
                                          </p>
                                        </div>
                                      )}
                                      {phrase.subjectStatusLabels && (
                                        <div className="col-span-full">
                                          <p className="text-sm font-medium text-muted-foreground">
                                            Subject/Status Labels
                                          </p>
                                          <p className="text-sm">
                                            {phrase.subjectStatusLabels}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {phrase.examples.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">
                                          Examples
                                        </p>
                                        <div className="bg-muted/20 p-3 rounded">
                                          <ol className="list-decimal pl-6 space-y-2">
                                            {phrase.examples.map((ex) => (
                                              <li
                                                key={ex.id}
                                                className="text-sm"
                                              >
                                                {renderTextWithEmphasis(
                                                  ex.text,
                                                )}
                                                {ex.audio && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 rounded-full ml-2"
                                                    onClick={() => {
                                                      new Audio(
                                                        ex.audio || '',
                                                      ).play();
                                                    }}
                                                  >
                                                    🔊
                                                  </Button>
                                                )}
                                                {ex.grammaticalNote && (
                                                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                                                    ({ex.grammaticalNote})
                                                  </p>
                                                )}
                                              </li>
                                            ))}
                                          </ol>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ),
                        );
                      })()}
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
  // Define categories and their display order
  const relationshipCategories = [
    {
      title: 'Word Forms',
      types: [
        { key: 'plural_en', label: 'Plural' },
        { key: 'past_tense_en', label: 'Past Tense' },
        { key: 'past_participle_en', label: 'Past Participle' },
        { key: 'present_participle_en', label: 'Present Participle' },
        { key: 'third_person_en', label: 'Third Person' },
        { key: 'alternative_spelling', label: 'Alternative Spelling' },
      ],
    },
    {
      title: 'Meaning Relationships',
      types: [
        { key: 'synonym', label: 'Synonyms' },
        { key: 'antonym', label: 'Antonyms' },
        { key: 'related', label: 'Related Words' },
      ],
    },
    {
      title: 'Phrases & Compositions',
      types: [
        { key: 'phrasal_verb', label: 'Phrasal Verbs' },
        { key: 'variant_form_phrasal_verb_en', label: 'Phrasal Verb Variants' },
        { key: 'phrase', label: 'Phrases' },
        { key: 'composition', label: 'Compositions' },
      ],
    },
    {
      title: 'Other Relationships',
      types: [
        { key: 'abbreviation', label: 'Abbreviations' },
        { key: 'derived_form', label: 'Derived Forms' },
        { key: 'dialect_variant', label: 'Dialect Variants' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {relationshipCategories.map((category) => {
        // Get words for this category and assert the type
        const wordsInCategory = category.types
          .flatMap((type) => {
            const wordsOfType =
              relatedWords[type.key as keyof typeof relatedWords] || [];
            return wordsOfType.length
              ? { type: type.label, words: wordsOfType }
              : null;
          })
          .filter(
            (item): item is { type: string; words: WordVariant[] } =>
              item !== null,
          );

        // Only render category if it has words
        if (wordsInCategory.length === 0) return null;

        return (
          <div key={category.title} className="space-y-3">
            <h3 className="text-md font-semibold border-b pb-1">
              {category.title}
            </h3>
            <div className="space-y-4">
              {wordsInCategory.map((group) => (
                // We can safely access group.type now that we've filtered out nulls with a type guard
                <div key={group.type} className="space-y-2">
                  <h4 className="text-sm font-medium">{group.type}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.words.map((wordObj: WordVariant) => (
                      <div key={wordObj.id} className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelect(wordObj.word)}
                          className="border-primary/40"
                        >
                          {wordObj.word}
                        </Button>
                        {wordObj.audio && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              new Audio(wordObj.audio || '').play();
                            }}
                          >
                            🔊
                          </Button>
                        )}
                        {wordObj.phonetic && (
                          <span className="text-xs text-muted-foreground">
                            {wordObj.phonetic}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type WordVariant = {
  id: number;
  word: string;
  phonetic?: string | null;
  audio?: string | null;
  type?: string;
  details?: string;
};
