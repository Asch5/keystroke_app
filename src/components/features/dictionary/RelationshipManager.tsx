'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Plus, Trash2, X, Link } from 'lucide-react';
import {
  searchWordsForRelationships,
  type WordDetailEditData,
} from '@/core/domains/dictionary/actions';
import { PartOfSpeech, RelationshipType } from '@/core/types';

// Display name mappings
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

const relationshipTypeDisplayNames: Record<RelationshipType, string> = {
  synonym: 'Synonym',
  antonym: 'Antonym',
  related: 'Related',
  stem: 'Stem',
  composition: 'Composition',
  phrasal_verb: 'Phrasal Verb',
  phrase: 'Phrase',
  alternative_spelling: 'Alternative Spelling',
  abbreviation: 'Abbreviation',
  derived_form: 'Derived Form',
  dialect_variant: 'Dialect Variant',
  translation: 'Translation',
  plural_en: 'Plural (EN)',
  past_tense_en: 'Past Tense (EN)',
  past_participle_en: 'Past Participle (EN)',
  present_participle_en: 'Present Participle (EN)',
  third_person_en: 'Third Person (EN)',
  variant_form_phrasal_verb_en: 'Phrasal Verb Variant (EN)',
  definite_form_da: 'Definite Form (DA)',
  plural_da: 'Plural (DA)',
  plural_definite_da: 'Plural Definite (DA)',
  present_tense_da: 'Present Tense (DA)',
  past_tense_da: 'Past Tense (DA)',
  past_participle_da: 'Past Participle (DA)',
  imperative_da: 'Imperative (DA)',
  adjective_neuter_da: 'Adjective Neuter (DA)',
  adjective_plural_da: 'Adjective Plural (DA)',
  comparative_da: 'Comparative (DA)',
  superlative_da: 'Superlative (DA)',
  adverb_comparative_da: 'Adverb Comparative (DA)',
  adverb_superlative_da: 'Adverb Superlative (DA)',
  pronoun_accusative_da: 'Pronoun Accusative (DA)',
  pronoun_genitive_da: 'Pronoun Genitive (DA)',
  genitive_form_da: 'Genitive Form (DA)',
  common_gender_da: 'Common Gender (DA)',
  neuter_gender_da: 'Neuter Gender (DA)',
  neuter_form_da: 'Neuter Form (DA)',
  adverbial_form_da: 'Adverbial Form (DA)',
  other_form_da: 'Other Form (DA)',
  neuter_pronoun_da: 'Neuter Pronoun (DA)',
  plural_pronoun_da: 'Plural Pronoun (DA)',
  contextual_usage_da: 'Contextual Usage (DA)',
};

interface RelationshipManagerProps {
  formData: WordDetailEditData;
  onUpdateFormData: (updates: Partial<WordDetailEditData>) => void;
}

export function RelationshipManager({
  formData,
  onUpdateFormData,
}: RelationshipManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{
      wordId: number;
      wordText: string;
      phoneticGeneral: string | null;
      wordDetails: Array<{
        id: number;
        partOfSpeech: PartOfSpeech;
        variant: string | null;
      }>;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<
    RelationshipType | ''
  >('');

  // Search for words
  const searchWords = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchWordsForRelationships(
        query,
        formData.languageCode,
        undefined,
        10,
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching words:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add WordDetail relationship
  const addWordDetailRelationship = (
    targetWordDetailId: number,
    targetWordText: string,
    targetPartOfSpeech: PartOfSpeech,
    targetVariant: string | null,
  ) => {
    if (!selectedRelationshipType) return;

    const newRelationship = {
      id: null,
      toWordDetailsId: targetWordDetailId,
      toWordText: targetWordText,
      toPartOfSpeech: targetPartOfSpeech,
      toVariant: targetVariant,
      type: selectedRelationshipType as RelationshipType,
      description: null,
      orderIndex: null,
    };

    onUpdateFormData({
      wordDetailRelationships: [
        ...formData.wordDetailRelationships,
        newRelationship,
      ],
    });

    resetDialog();
  };

  // Add Word relationship
  const addWordRelationship = (
    targetWordId: number,
    targetWordText: string,
  ) => {
    if (!selectedRelationshipType) return;

    const newRelationship = {
      id: null,
      toWordId: targetWordId,
      toWordText: targetWordText,
      type: selectedRelationshipType as RelationshipType,
      description: null,
      orderIndex: null,
    };

    onUpdateFormData({
      wordRelationships: [...formData.wordRelationships, newRelationship],
    });

    resetDialog();
  };

  // Remove relationships
  const removeWordDetailRelationship = (index: number) => {
    onUpdateFormData({
      wordDetailRelationships: formData.wordDetailRelationships.filter(
        (_, i) => i !== index,
      ),
    });
  };

  const removeWordRelationship = (index: number) => {
    onUpdateFormData({
      wordRelationships: formData.wordRelationships.filter(
        (_, i) => i !== index,
      ),
    });
  };

  // Reset dialog
  const resetDialog = () => {
    setShowAddRelationship(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRelationshipType('');
  };

  return (
    <Card>
      <CardHeader>
        <AccordionTrigger className="flex items-center justify-between w-full text-left">
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Relationships</span>
            <Badge variant="outline" className="text-xs">
              {formData.wordDetailRelationships.length +
                formData.wordRelationships.length}{' '}
              total
            </Badge>
          </CardTitle>
        </AccordionTrigger>
      </CardHeader>
      <AccordionContent>
        <CardContent className="space-y-6">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddRelationship(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </div>
          {/* WordDetail-Level Relationships */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center space-x-2">
              <span>WordDetail Relationships</span>
              <Badge variant="outline" className="text-xs">
                Specific to this WordDetail
              </Badge>
            </h3>
            {formData.wordDetailRelationships.length > 0 ? (
              <div className="space-y-2">
                {formData.wordDetailRelationships.map((rel, index) => (
                  <Card
                    key={rel.id || `new-${index}`}
                    className="border-dashed"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {relationshipTypeDisplayNames[rel.type]}
                            </Badge>
                            <span className="font-medium">
                              {rel.toWordText}
                            </span>
                            {rel.toVariant && (
                              <span className="text-xs text-muted-foreground">
                                ({rel.toVariant})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {partOfSpeechDisplayNames[rel.toPartOfSpeech]} •
                            WordDetail ID: {rel.toWordDetailsId}
                          </div>
                          {rel.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {rel.description}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWordDetailRelationship(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No WordDetail relationships yet.
              </div>
            )}
          </div>

          <Separator />

          {/* Word-Level Relationships */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center space-x-2">
              <span>Word Relationships</span>
              <Badge variant="secondary" className="text-xs">
                Shared across all WordDetails
              </Badge>
            </h3>
            {formData.wordRelationships.length > 0 ? (
              <div className="space-y-2">
                {formData.wordRelationships.map((rel, index) => (
                  <Card
                    key={rel.id || `new-${index}`}
                    className="border-dashed"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="default" className="text-xs">
                              {relationshipTypeDisplayNames[rel.type]}
                            </Badge>
                            <span className="font-medium">
                              {rel.toWordText}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Word ID: {rel.toWordId}
                          </div>
                          {rel.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {rel.description}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWordRelationship(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No Word relationships yet.
              </div>
            )}
          </div>

          {/* Add Relationship Dialog */}
          {showAddRelationship && (
            <Card className="border-info-border bg-info-subtle">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Add New Relationship</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetDialog}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Relationship Type Selection */}
                <div className="space-y-2">
                  <Label>Relationship Type</Label>
                  <Select
                    value={selectedRelationshipType}
                    onValueChange={(value) =>
                      setSelectedRelationshipType(value as RelationshipType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(relationshipTypeDisplayNames).map(
                        ([type, name]) => (
                          <SelectItem key={type} value={type}>
                            {name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Word Search */}
                <div className="space-y-2">
                  <Label>Search for Words</Label>
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchWords(e.target.value);
                    }}
                    placeholder="Type to search for words..."
                  />
                </div>

                {/* Search Results */}
                {isSearching && (
                  <div className="text-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((word) => (
                      <Card
                        key={word.wordId}
                        className="border border-content-border"
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">
                                  {word.wordText}
                                </span>
                                {word.phoneticGeneral && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    [{word.phoneticGeneral}]
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  addWordRelationship(
                                    word.wordId,
                                    word.wordText,
                                  )
                                }
                                disabled={!selectedRelationshipType}
                              >
                                Add Word Relationship
                              </Button>
                            </div>

                            {/* WordDetails for this word */}
                            {word.wordDetails.length > 0 && (
                              <div className="pt-2 border-t">
                                <div className="text-xs text-muted-foreground mb-2">
                                  WordDetails:
                                </div>
                                <div className="space-y-1">
                                  {word.wordDetails.map((detail) => (
                                    <div
                                      key={detail.id}
                                      className="flex items-center justify-between p-2 bg-content-soft rounded text-xs"
                                    >
                                      <div>
                                        <span className="font-medium">
                                          {
                                            partOfSpeechDisplayNames[
                                              detail.partOfSpeech
                                            ]
                                          }
                                        </span>
                                        {detail.variant && (
                                          <span className="text-muted-foreground ml-1">
                                            ({detail.variant})
                                          </span>
                                        )}
                                        <span className="text-muted-foreground ml-2">
                                          ID: {detail.id}
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          addWordDetailRelationship(
                                            detail.id,
                                            word.wordText,
                                            detail.partOfSpeech,
                                            detail.variant,
                                          )
                                        }
                                        disabled={!selectedRelationshipType}
                                      >
                                        Add WordDetail Relationship
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 2 &&
                  !isSearching &&
                  searchResults.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No words found matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </AccordionContent>
    </Card>
  );
}
