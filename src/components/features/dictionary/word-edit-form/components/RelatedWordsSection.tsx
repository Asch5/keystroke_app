'use client';

import { PlusCircle, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelationshipType } from '@/core/types';
import type { WordFormValues } from '../index';

interface RelatedWordsSectionProps {
  form: UseFormReturn<WordFormValues>;
  isLoading: boolean;
  addRelatedWord: (type: RelationshipType) => void;
  removeRelatedWord: (type: RelationshipType, index: number) => void;
}

const relationshipTypeDisplayNames: Record<RelationshipType, string> = {
  synonym: 'Synonyms',
  antonym: 'Antonyms',
  related: 'Related Words',
  stem: 'Stem',
  composition: 'Composition',
  phrasal_verb: 'Phrasal Verb',
  phrase: 'Phrase',
  alternative_spelling: 'Alternative Spelling',
  abbreviation: 'Abbreviation',
  derived_form: 'Derived Form',
  dialect_variant: 'Dialect Variant',
  translation: 'Translation',
  plural_en: 'Plural (English)',
  past_tense_en: 'Past Tense (English)',
  past_participle_en: 'Past Participle (English)',
  present_participle_en: 'Present Participle (English)',
  third_person_en: 'Third Person (English)',
  variant_form_phrasal_verb_en: 'Variant Form Phrasal Verb (English)',
  definite_form_da: 'Definite Form (Danish)',
  plural_da: 'Plural (Danish)',
  plural_definite_da: 'Plural Definite (Danish)',
  present_tense_da: 'Present Tense (Danish)',
  past_tense_da: 'Past Tense (Danish)',
  past_participle_da: 'Past Participle (Danish)',
  imperative_da: 'Imperative (Danish)',
  adjective_neuter_da: 'Adjective Neuter (Danish)',
  adjective_plural_da: 'Adjective Plural (Danish)',
  comparative_da: 'Comparative (Danish)',
  superlative_da: 'Superlative (Danish)',
  adverb_comparative_da: 'Adverb Comparative (Danish)',
  adverb_superlative_da: 'Adverb Superlative (Danish)',
  pronoun_accusative_da: 'Pronoun Accusative (Danish)',
  pronoun_genitive_da: 'Pronoun Genitive (Danish)',
  genitive_form_da: 'Genitive Form (Danish)',
  common_gender_da: 'Common Gender (Danish)',
  neuter_gender_da: 'Neuter Gender (Danish)',
  neuter_form_da: 'Neuter Form (Danish)',
  adverbial_form_da: 'Adverbial Form (Danish)',
  other_form_da: 'Other Form (Danish)',
  neuter_pronoun_da: 'Neuter Pronoun (Danish)',
  plural_pronoun_da: 'Plural Pronoun (Danish)',
  contextual_usage_da: 'Contextual Usage (Danish)',
};

export const RelatedWordsSection = memo(function RelatedWordsSection({
  form,
  isLoading,
  addRelatedWord,
  removeRelatedWord,
}: RelatedWordsSectionProps) {
  const relatedWords = form.watch('relatedWords') || {};

  const relationshipTypes = [
    RelationshipType.synonym,
    RelationshipType.antonym,
    RelationshipType.related,
    RelationshipType.translation,
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Words</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={RelationshipType.synonym} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {relationshipTypes.map((type) => (
              <TabsTrigger key={type} value={type}>
                {relationshipTypeDisplayNames[type]}
              </TabsTrigger>
            ))}
          </TabsList>

          {relationshipTypes.map((type) => {
            const wordsOfType = relatedWords[type] || [];

            return (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{relationshipTypeDisplayNames[type]}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addRelatedWord(type)}
                    disabled={isLoading}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add {relationshipTypeDisplayNames[type].slice(0, -1)}
                  </Button>
                </div>

                {wordsOfType.length > 0 && (
                  <div className="space-y-4">
                    <Badge variant="secondary" className="text-sm">
                      {wordsOfType.length}{' '}
                      {relationshipTypeDisplayNames[type].toLowerCase()}
                    </Badge>

                    {wordsOfType.map((relatedWord, rwIndex) => (
                      <div
                        key={rwIndex}
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {relationshipTypeDisplayNames[type].slice(0, -1)}{' '}
                            {rwIndex + 1}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRelatedWord(type, rwIndex)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Word */}
                          <div className="space-y-2">
                            <Label htmlFor={`${type}-word-${rwIndex}`}>
                              Word
                            </Label>
                            <FormField
                              control={form.control}
                              name={`relatedWords.${type}.${rwIndex}.word`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Enter word"
                                      disabled={isLoading}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Phonetic */}
                          <div className="space-y-2">
                            <Label htmlFor={`${type}-phonetic-${rwIndex}`}>
                              Phonetic
                            </Label>
                            <FormField
                              control={form.control}
                              name={`relatedWords.${type}.${rwIndex}.phonetic`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Phonetic transcription"
                                      disabled={isLoading}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {wordsOfType.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>
                      No {relationshipTypeDisplayNames[type].toLowerCase()}{' '}
                      added yet.
                    </p>
                    <p className="text-sm">
                      Click &ldquo;Add{' '}
                      {relationshipTypeDisplayNames[type].slice(0, -1)}&rdquo;
                      to get started.
                    </p>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
});
