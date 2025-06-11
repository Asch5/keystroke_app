import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import type { WordEntryData } from '@/core/lib/actions/dictionaryActions';

// Type for local use for related words display
type WordVariant = {
  id: number;
  word: string;
  phonetic?: string | null;
  audio?: string | null;
  type?: string; // e.g., "plural_en", "synonym"
  description?: string | null; // e.g. "Plural form"
};

type EnhancedRelatedWordsListProps = {
  relatedWords: WordEntryData['relatedWords'];
  onSelect: (word: string) => void;
};

function EnhancedRelatedWordsList({
  relatedWords,
  onSelect,
}: EnhancedRelatedWordsListProps) {
  const relationshipCategories = [
    {
      title: 'Semantic Relationships',
      description: 'Words with meaning connections',
      types: [
        { key: 'synonym', label: 'Synonyms' },
        { key: 'antonym', label: 'Antonyms' },
        { key: 'related', label: 'Related Words' },
      ],
    },
    {
      title: 'Compositions & Phrases',
      description: 'Multi-word expressions and compounds',
      types: [
        { key: 'composition', label: 'Compositions' },
        { key: 'phrasal_verb', label: 'Phrasal Verbs' },
        { key: 'phrase', label: 'Phrases' },
      ],
    },
    {
      title: 'Derivational Forms',
      description: 'Words derived from the same root',
      types: [
        { key: 'derived_form', label: 'Derived Forms' },
        { key: 'alternative_spelling', label: 'Alternative Spellings' },
        { key: 'abbreviation', label: 'Abbreviations' },
        { key: 'dialect_variant', label: 'Dialect Variants' },
      ],
    },
    {
      title: 'Inflectional Forms',
      description: 'Grammatical variations of the same word',
      types: [
        { key: 'plural_da', label: 'Plural (DA)' },
        { key: 'plural_en', label: 'Plural (EN)' },
        { key: 'definite_form_da', label: 'Definite Form (DA)' },
        { key: 'common_gender_da', label: 'Common Gender Form (DA)' },
        { key: 'plural_definite_da', label: 'Plural Definite (DA)' },
        { key: 'past_tense_da', label: 'Past Tense (DA)' },
        { key: 'past_tense_en', label: 'Past Tense (EN)' },
        { key: 'past_participle_da', label: 'Past Participle (DA)' },
        { key: 'past_participle_en', label: 'Past Participle (EN)' },
        { key: 'present_participle_en', label: 'Present Participle (EN)' },
        { key: 'third_person_en', label: 'Third Person (EN)' },
        { key: 'variant_form_phrasal_verb_en', label: 'Phrasal Verb Variant' },
      ],
    },
  ];

  // For now, show all categories, but clearly separated.
  // TODO: Integrate with WordToWordRelationship table for true semantic relationships
  // To show only semantic relationships, change this to semanticCategories
  const categoriesToShow = relationshipCategories;

  return (
    <div className="space-y-6">
      {categoriesToShow.map((category) => {
        const wordsInCategory = category.types
          .flatMap((typeInfo) => {
            const wordsOfType =
              relatedWords[typeInfo.key as keyof typeof relatedWords] || [];
            return wordsOfType.length
              ? {
                  typeLabel: typeInfo.label,
                  words: wordsOfType as WordVariant[],
                }
              : null;
          })
          .filter(
            (item): item is { typeLabel: string; words: WordVariant[] } =>
              item !== null,
          );

        if (wordsInCategory.length === 0) return null;

        return (
          <div key={category.title} className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-md font-semibold text-muted-foreground">
                {category.title}
              </h3>
              {category.description && (
                <p className="text-xs text-muted-foreground/80 mt-1">
                  {category.description}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {wordsInCategory.map((group) => (
                <div key={group.typeLabel}>
                  <h4 className="text-sm font-medium mb-1.5">
                    {group.typeLabel}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {group.words.map((wordObj: WordVariant) => (
                      <div key={wordObj.id} className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelect(wordObj.word)}
                          className="border-primary/40 hover:bg-primary/5 text-primary text-xs h-auto py-1 px-2"
                        >
                          {wordObj.word}
                        </Button>
                        {wordObj.audio && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 rounded-full"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await AudioService.playAudioFromDatabase(
                                  wordObj.audio!,
                                );
                              } catch (error) {
                                console.error('Error playing audio:', error);
                              }
                            }}
                          >
                            <span
                              role="img"
                              aria-label="play audio"
                              className="text-[0.8em]"
                            >
                              🔊
                            </span>
                          </Button>
                        )}
                        {wordObj.phonetic && (
                          <span className="text-xs text-muted-foreground">
                            ({wordObj.phonetic})
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

interface WordDetailsRelatedWordsProps {
  wordDetails: WordEntryData;
  onNavigateToWord: (word: string) => void;
}

/**
 * WordDetailsRelatedWords component displays related words and forms
 * organized by relationship categories (semantic, inflectional, etc.)
 *
 * @param wordDetails - The complete word entry data
 * @param onNavigateToWord - Callback for word navigation
 */
export function WordDetailsRelatedWords({
  wordDetails,
  onNavigateToWord,
}: WordDetailsRelatedWordsProps) {
  if (
    !wordDetails.relatedWords ||
    Object.keys(wordDetails.relatedWords).length === 0
  ) {
    return null;
  }

  return (
    <Card className="mt-6 bg-card">
      <CardHeader>
        <CardTitle className="text-xl">Related Words & Forms</CardTitle>
      </CardHeader>
      <CardContent>
        <EnhancedRelatedWordsList
          relatedWords={wordDetails.relatedWords}
          onSelect={onNavigateToWord}
        />
      </CardContent>
    </Card>
  );
}
