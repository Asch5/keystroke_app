'use client';

import { PlusCircle, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { PartOfSpeech } from '@/core/types';
import type { WordFormValues } from '../index';

interface DefinitionsSectionProps {
  form: UseFormReturn<WordFormValues>;
  isLoading: boolean;
  addDefinition: () => void;
  removeDefinition: (index: number) => void;
  addExample: (definitionIndex: number) => void;
  removeExample: (definitionIndex: number, exampleIndex: number) => void;
}

const partOfSpeechDisplayNames: Record<PartOfSpeech, string> = {
  first_part: 'First Part',
  noun: 'Noun',
  verb: 'Verb',
  phrasal_verb: 'Phrasal Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  pronoun: 'Pronoun',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  interjection: 'Interjection',
  numeral: 'Numeral',
  article: 'Article',
  exclamation: 'Exclamation',
  abbreviation: 'Abbreviation',
  suffix: 'Suffix',
  last_letter: 'Last Letter',
  adj_pl: 'Adjective Plural',
  symbol: 'Symbol',
  phrase: 'Phrase',
  sentence: 'Sentence',
  undefined: 'Undefined',
};

export const DefinitionsSection = memo(function DefinitionsSection({
  form,
  isLoading,
  addDefinition,
  removeDefinition,
  addExample,
  removeExample,
}: DefinitionsSectionProps) {
  const definitions = form.watch('definitions');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Definitions
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDefinition}
            disabled={isLoading}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Definition
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {definitions.map((definition, defIndex) => (
          <div key={defIndex} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Definition {defIndex + 1}</Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDefinition(defIndex)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Definition Text */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor={`definition-text-${defIndex}`}>
                  Definition Text
                </Label>
                <FormField
                  control={form.control}
                  name={`definitions.${defIndex}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter definition"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Part of Speech */}
              <div className="space-y-2">
                <Label htmlFor={`part-of-speech-${defIndex}`}>
                  Part of Speech
                </Label>
                <FormField
                  control={form.control}
                  name={`definitions.${defIndex}.partOfSpeech`}
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select part of speech" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(partOfSpeechDisplayNames).map(
                            ([key, name]) => (
                              <SelectItem key={key} value={key}>
                                {name}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Subject Status Labels */}
              <div className="space-y-2">
                <Label htmlFor={`subject-status-${defIndex}`}>
                  Subject Status Labels
                </Label>
                <FormField
                  control={form.control}
                  name={`definitions.${defIndex}.subjectStatusLabels`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Subject status labels"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex space-x-6">
              <FormField
                control={form.control}
                name={`definitions.${defIndex}.isPlural`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormLabel>Is Plural</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`definitions.${defIndex}.isInShortDef`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormLabel>Include in Short Definition</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Examples Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Examples</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addExample(defIndex)}
                  disabled={isLoading}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Example
                </Button>
              </div>

              {definition.examples.map((example, exampleIndex) => (
                <div key={exampleIndex} className="border-l-2 pl-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      Example {exampleIndex + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExample(defIndex, exampleIndex)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`definitions.${defIndex}.examples.${exampleIndex}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Example text"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            {defIndex < definitions.length - 1 && <Separator />}
          </div>
        ))}

        {definitions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No definitions added yet.</p>
            <p className="text-sm">
              Click &ldquo;Add Definition&rdquo; to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
