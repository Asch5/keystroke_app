import React from 'react';
import type {
  WordPartOfSpeechDetails,
  DefinitionData,
  AudioFileData,
  DetailRelationForPOS,
  WordEntryData,
} from '@/core/lib/actions/dictionaryActions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LanguageCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Explicitly type DefinitionExample based on the structure from dictionaryActions.ts
// This is one example object from the examples array within a DefinitionData object.
type DefinitionExample = NonNullable<
  NonNullable<
    NonNullable<WordEntryData['details']>[0]['definitions']
  >[0]['examples']
>[0];

// Type for local use for related words display
type WordVariant = {
  id: number;
  word: string;
  phonetic?: string | null;
  audio?: string | null;
  type?: string; // e.g., "plural_en", "synonym"
  description?: string | null; // e.g. "Plural form"
};

// Add a utility function to render text with {it} tags as italic
function renderTextWithEmphasis(text: string): React.ReactNode {
  if (!text || text.length === 0) return text;

  if (text.includes('{ldquo}') || text.includes('{rdquo}')) {
    text = text.replace(/\{ldquo\}/g, '"').replace(/\{rdquo\}/g, '"');
  }

  // Handle {bc} tags as bullet points
  if (text.includes('{bc}')) {
    const parts = text.split('{bc}').filter((part) => part.trim().length > 0);

    if (parts.length >= 1) {
      return (
        <div className="space-y-1">
          {parts.map((part, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-primary flex-shrink-0">•</span>
              <span className="flex-1">
                {renderTextWithEmphasis(part.trim())}
              </span>
            </div>
          ))}
        </div>
      );
    }
  }

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

  interface TextPart {
    type: 'phrase' | 'definition' | 'italic';
    content: string;
  }

  if (text.includes('{phrase}') && text.includes('{/phrase}')) {
    try {
      const parts: (string | TextPart)[] = [];
      let currentText = text;
      let startIndex = currentText.indexOf('{phrase}');
      let endIndex = -1;

      while (startIndex !== -1) {
        if (startIndex > 0) {
          parts.push(currentText.substring(0, startIndex));
        }
        endIndex = currentText.indexOf('{/phrase}', startIndex);
        if (endIndex === -1) break;
        const phraseContent = currentText.substring(startIndex + 8, endIndex);
        parts.push({ type: 'phrase', content: phraseContent });
        currentText = currentText.substring(endIndex + 9);
        startIndex = currentText.indexOf('{phrase}');
      }
      if (currentText.length > 0) parts.push(currentText);

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
      console.error('Error parsing phrase tags:', error);
      return text;
    }
  }

  if (text.includes('[=') && text.includes(']')) {
    try {
      const parts: (string | TextPart)[] = [];
      let currentText = text;
      let startIndex = currentText.indexOf('[=');
      let endIndex = -1;

      while (startIndex !== -1) {
        if (startIndex > 0) {
          parts.push(currentText.substring(0, startIndex));
        }
        endIndex = currentText.indexOf(']', startIndex);
        if (endIndex === -1) break;
        const defContent = currentText.substring(startIndex + 2, endIndex);
        parts.push({ type: 'definition', content: defContent });
        currentText = currentText.substring(endIndex + 1);
        startIndex = currentText.indexOf('[=');
      }
      if (currentText.length > 0) parts.push(currentText);
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
      console.error('Error parsing definition brackets:', error);
      return text;
    }
  }

  if (text.includes('{it}') && text.includes('{/it}')) {
    try {
      const parts: (string | TextPart)[] = [];
      let currentText = text;
      let startIndex = currentText.indexOf('{it}');
      let endIndex = -1;

      while (startIndex !== -1) {
        if (startIndex > 0) {
          parts.push(currentText.substring(0, startIndex));
        }
        endIndex = currentText.indexOf('{/it}', startIndex);
        if (endIndex === -1) break;
        const italicContent = currentText.substring(startIndex + 4, endIndex);
        parts.push({ type: 'italic', content: italicContent });
        currentText = currentText.substring(endIndex + 5);
        startIndex = currentText.indexOf('{it}');
      }
      if (currentText.length > 0) parts.push(currentText);
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
      console.error('Error parsing italic tags:', error);
      return text;
    }
  }
  return text;
}

// Tooltip translation helper
const findTranslation = (
  translations:
    | Array<{ id: number; languageCode: LanguageCode; content: string }>
    | undefined,
  targetLang: LanguageCode,
): string | undefined => {
  return translations?.find(
    (t: { languageCode: LanguageCode }) => t.languageCode === targetLang,
  )?.content;
};

// Helper to format relationship types for display
function formatRelationshipType(typeKey: string): string {
  if (!typeKey) return 'Related';
  // Example transformations (can be expanded)
  const parts = typeKey.split('_');
  const capitalized = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
  if (typeKey.endsWith('_da')) return `${capitalized.replace(' Da', '')} (DA)`;
  if (typeKey.endsWith('_en')) return `${capitalized.replace(' En', '')} (EN)`;
  return capitalized;
}

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
                            onClick={(e) => {
                              e.stopPropagation();
                              new Audio(wordObj.audio!).play();
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

export default function WordDetails({
  wordDetails,
  onNavigateToWord,
  selectedLanguageCode = LanguageCode.en,
}: {
  wordDetails: WordEntryData;
  onNavigateToWord?: (word: string) => void;
  selectedLanguageCode?: LanguageCode;
}) {
  const primaryAudioUrl =
    wordDetails?.details?.[0]?.audioFiles?.find((af) => af.isPrimary)?.url ||
    wordDetails?.details?.[0]?.audioFiles?.[0]?.url;

  const navigateToRelatedWord = async (word: string) => {
    if (onNavigateToWord) {
      onNavigateToWord(word);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-col items-center">
          <CardTitle className="text-3xl font-bold mb-2 flex items-center gap-3">
            {wordDetails.word}
            {primaryAudioUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => {
                  if (primaryAudioUrl) {
                    new Audio(primaryAudioUrl).play();
                  }
                }}
              >
                <span role="img" aria-label="play audio">
                  🔊
                </span>
              </Button>
            )}
          </CardTitle>
          {wordDetails.phoneticGeneral && (
            <CardDescription className="text-lg text-muted-foreground">
              {wordDetails.phoneticGeneral}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-md font-semibold mb-1 text-muted-foreground">
              Language
            </h4>
            <Badge variant="secondary" className="mt-1">
              {wordDetails.languageCode.toUpperCase()}
            </Badge>
          </div>
          {wordDetails.frequencyGeneral > 0 && (
            <div className="md:col-span-2">
              <h4 className="text-md font-semibold mb-1 text-muted-foreground">
                Overall Frequency
              </h4>
              <div className="bg-muted/20 p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Rank:</p>
                  <Badge variant="outline" className="font-mono">
                    {wordDetails.frequencyGeneral}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        <Accordion type="multiple" className="w-full space-y-4">
          {wordDetails.details.map((detail: WordPartOfSpeechDetails) => (
            <AccordionItem
              key={detail.id}
              value={`pos-${detail.id}`}
              className="border rounded-md shadow-sm hover:shadow-md transition-shadow bg-card"
            >
              <AccordionTrigger className="text-lg font-semibold hover:no-underline px-4 py-3">
                <div className="flex items-center justify-between w-full">
                  <span className="capitalize text-primary">
                    {detail.partOfSpeech.toString().replace('_', ' ')}
                    {detail.variant && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        {' '}
                        (Variant {detail.variant})
                      </span>
                    )}
                  </span>
                  {detail.phonetic && (
                    <span className="text-sm text-muted-foreground font-normal mr-2">
                      {detail.phonetic}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 px-4 pb-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-4 text-sm">
                  {detail.gender && (
                    <div>
                      <strong className="text-muted-foreground">Gender:</strong>{' '}
                      <span className="capitalize">{detail.gender}</span>
                    </div>
                  )}
                  {detail.forms && (
                    <div>
                      <strong className="text-muted-foreground">Forms:</strong>{' '}
                      <span className="font-mono bg-muted/50 px-1 rounded-sm">
                        {detail.forms}
                      </span>
                    </div>
                  )}
                  {detail.source && (
                    <div>
                      <strong className="text-muted-foreground">Source:</strong>{' '}
                      <span>{detail.source}</span>
                    </div>
                  )}
                  {detail.frequency > 0 && (
                    <div>
                      <strong className="text-muted-foreground">
                        Frequency (this form):
                      </strong>{' '}
                      <Badge variant="outline" className="ml-1">
                        {detail.frequency}
                      </Badge>
                    </div>
                  )}
                </div>

                {detail.etymology && (
                  <div className="bg-muted/20 p-3 rounded-md">
                    <h5 className="text-sm font-semibold text-muted-foreground mb-1.5">
                      Etymology:
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      {detail.etymology}
                    </p>
                  </div>
                )}

                {detail.audioFiles && detail.audioFiles.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-semibold text-muted-foreground mb-1.5">
                      Pronunciations:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {detail.audioFiles.map((audioFile: AudioFileData) => (
                        <Button
                          key={audioFile.id}
                          variant="outline"
                          size="sm"
                          onClick={() => new Audio(audioFile.url).play()}
                          className="text-xs"
                        >
                          {audioFile.note ||
                            (audioFile.isPrimary ? 'Primary' : 'Audio')}
                          <span
                            role="img"
                            aria-label="play audio"
                            className="ml-1.5 text-[0.9em]"
                          >
                            🔊
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* START: Section for Detail-Specific Relations (single AccordionItem) */}
                {detail.detailRelations &&
                  detail.detailRelations.length > 0 && (
                    <Accordion
                      type="single"
                      collapsible
                      className="w-full mt-4 rounded-md border bg-muted/20 shadow-sm"
                    >
                      <AccordionItem
                        value="pos-detail-relations"
                        className="border-b-0"
                      >
                        <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:no-underline">
                          Related Forms & Details (for this Part of Speech)
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3 pt-1">
                          <div className="space-y-3 mt-2">
                            {detail.detailRelations.map(
                              (
                                posRelation: DetailRelationForPOS,
                                index: number,
                              ) => (
                                <div
                                  key={`${posRelation.toWordId}-${posRelation.type}-${index}`}
                                  className="p-2.5 rounded-md bg-background border-l-2 border-secondary/30 shadow-sm"
                                >
                                  <h5 className="text-sm font-medium mb-1">
                                    {posRelation.description ||
                                      formatRelationshipType(posRelation.type)}
                                  </h5>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-primary h-auto p-0 text-sm hover:underline"
                                      onClick={() =>
                                        navigateToRelatedWord(
                                          posRelation.toWordText,
                                        )
                                      }
                                    >
                                      {posRelation.toWordText}
                                    </Button>
                                    {posRelation.toWordAudio && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 p-0 rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          new Audio(
                                            posRelation.toWordAudio!,
                                          ).play();
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
                                    {posRelation.targetPartOfSpeech && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {posRelation.targetPartOfSpeech
                                          .toString()
                                          .replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                {/* END: Section for Detail-Specific Relations */}

                {/* START: Definitions Section (single AccordionItem) */}
                {detail.definitions && detail.definitions.length > 0 && (
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full mt-4 rounded-md border bg-card shadow-sm"
                  >
                    <AccordionItem
                      value="pos-definitions"
                      className="border-b-0"
                    >
                      <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:no-underline">
                        Definitions ({detail.definitions.length})
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 pt-1">
                        <div className="space-y-4 mt-2">
                          {detail.definitions.map(
                            (def: DefinitionData, index: number) => (
                              <Card
                                key={def.id}
                                className={`overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-150 ${def.isInShortDef ? 'bg-primary/5 border-l-4 border-primary' : 'bg-background'}`}
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-mono"
                                    >
                                      {index + 1}
                                    </Badge>
                                    {def.isInShortDef && (
                                      <Badge
                                        variant="default"
                                        className="bg-amber-500 text-white text-xs"
                                      >
                                        Main Definition
                                      </Badge>
                                    )}
                                    {def.subjectStatusLabels && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {def.subjectStatusLabels}
                                      </Badge>
                                    )}
                                  </div>
                                  <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <CardTitle className="text-lg cursor-default">
                                          {renderTextWithEmphasis(def.text)}
                                        </CardTitle>
                                      </TooltipTrigger>
                                      {selectedLanguageCode ===
                                        LanguageCode.da &&
                                        def.translations &&
                                        findTranslation(
                                          def.translations,
                                          LanguageCode.en,
                                        ) && (
                                          <TooltipContent
                                            side="top"
                                            className="max-w-md"
                                          >
                                            <p className="text-sm font-normal">
                                              <strong>EN:</strong>{' '}
                                              {findTranslation(
                                                def.translations,
                                                LanguageCode.en,
                                              )}
                                            </p>
                                          </TooltipContent>
                                        )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                  {def.image?.url && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <div className="cursor-pointer hover:opacity-90 transition-opacity rounded-lg overflow-hidden border max-w-xs">
                                          <AspectRatio
                                            ratio={16 / 9}
                                            className="bg-muted"
                                          >
                                            <Image
                                              src={`/api/images/${def.image.id}`}
                                              alt={
                                                def.image.description ||
                                                def.text
                                              }
                                              fill
                                              className="object-cover"
                                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                          </AspectRatio>
                                        </div>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-3xl w-full p-0 bg-black">
                                        <AspectRatio ratio={16 / 9}>
                                          <Image
                                            src={def.image.url}
                                            alt={
                                              def.image.description || def.text
                                            }
                                            fill
                                            className="object-contain"
                                            sizes="100vw"
                                            priority
                                          />
                                        </AspectRatio>
                                      </DialogContent>
                                    </Dialog>
                                  )}

                                  {(def.generalLabels ||
                                    def.grammaticalNote ||
                                    def.usageNote) && (
                                    <div className="space-y-3 pt-1">
                                      {def.generalLabels && (
                                        <div>
                                          <strong className="text-xs text-muted-foreground">
                                            Labels:
                                          </strong>
                                          <p className="text-xs">
                                            {renderTextWithEmphasis(
                                              def.generalLabels,
                                            )}
                                          </p>
                                        </div>
                                      )}
                                      {def.grammaticalNote && (
                                        <div>
                                          <strong className="text-xs text-muted-foreground">
                                            Grammar:
                                          </strong>
                                          <p className="text-xs">
                                            {renderTextWithEmphasis(
                                              def.grammaticalNote,
                                            )}
                                          </p>
                                        </div>
                                      )}
                                      {def.usageNote && (
                                        <div className="bg-muted/40 p-3 rounded-md mt-2">
                                          <strong className="text-xs text-muted-foreground">
                                            Usage:
                                          </strong>
                                          <p className="text-xs whitespace-pre-line">
                                            {renderTextWithEmphasis(
                                              def.usageNote,
                                            )}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {def.examples && def.examples.length > 0 && (
                                    <div className="pt-3">
                                      <h5 className="text-sm font-semibold text-muted-foreground mb-2">
                                        Examples
                                      </h5>
                                      <ScrollArea className="max-h-[300px] pr-3">
                                        {(() => {
                                          const examplesToGroup = def.examples;
                                          const groupedExamples =
                                            examplesToGroup.reduce(
                                              (
                                                acc: Record<
                                                  string,
                                                  DefinitionExample[]
                                                >,
                                                example: DefinitionExample,
                                              ) => {
                                                const noteKey =
                                                  example.grammaticalNote ||
                                                  'General Examples';
                                                if (!acc[noteKey])
                                                  acc[noteKey] = [];
                                                acc[noteKey].push(example);
                                                return acc;
                                              },
                                              {} as Record<
                                                string,
                                                DefinitionExample[]
                                              >,
                                            );

                                          return (
                                            <div className="space-y-2.5">
                                              {Object.entries(
                                                groupedExamples,
                                              ).map(
                                                ([noteKey, groupExamples]) => (
                                                  <div
                                                    key={noteKey}
                                                    className={`p-2.5 rounded-md text-xs ${noteKey === 'General Examples' ? 'bg-background border' : 'bg-muted/30 border-l-2 border-primary/30'}`}
                                                  >
                                                    {noteKey !==
                                                      'General Examples' && (
                                                      <p className="text-[0.7rem] font-medium text-primary/80 mb-1">
                                                        {renderTextWithEmphasis(
                                                          noteKey,
                                                        )}
                                                      </p>
                                                    )}
                                                    <ul className="space-y-1">
                                                      {groupExamples.map(
                                                        (
                                                          ex: DefinitionExample,
                                                        ) => (
                                                          <li
                                                            key={ex.id}
                                                            className="flex items-start gap-2"
                                                          >
                                                            <span className="text-primary flex-shrink-0">
                                                              •
                                                            </span>
                                                            <div className="flex items-start gap-1.5 flex-1">
                                                              <TooltipProvider
                                                                delayDuration={
                                                                  300
                                                                }
                                                              >
                                                                <Tooltip>
                                                                  <TooltipTrigger
                                                                    asChild
                                                                  >
                                                                    <span className="flex-1 cursor-default">
                                                                      {renderTextWithEmphasis(
                                                                        ex.text,
                                                                      )}
                                                                    </span>
                                                                  </TooltipTrigger>
                                                                  {selectedLanguageCode ===
                                                                    LanguageCode.da &&
                                                                    ex.translations &&
                                                                    findTranslation(
                                                                      ex.translations,
                                                                      LanguageCode.en,
                                                                    ) && (
                                                                      <TooltipContent
                                                                        side="top"
                                                                        className="max-w-xs"
                                                                      >
                                                                        <p className="text-xs font-normal">
                                                                          <strong>
                                                                            EN:
                                                                          </strong>{' '}
                                                                          {findTranslation(
                                                                            ex.translations,
                                                                            LanguageCode.en,
                                                                          )}
                                                                        </p>
                                                                      </TooltipContent>
                                                                    )}
                                                                </Tooltip>
                                                              </TooltipProvider>
                                                              {ex.audio && (
                                                                <Button
                                                                  variant="ghost"
                                                                  size="icon"
                                                                  className="h-4 w-4 p-0 rounded-full shrink-0"
                                                                  onClick={() =>
                                                                    new Audio(
                                                                      ex.audio!,
                                                                    ).play()
                                                                  }
                                                                >
                                                                  <span
                                                                    role="img"
                                                                    aria-label="play example audio"
                                                                    className="text-[0.8em]"
                                                                  >
                                                                    🔊
                                                                  </span>
                                                                </Button>
                                                              )}
                                                            </div>
                                                          </li>
                                                        ),
                                                      )}
                                                    </ul>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </ScrollArea>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ),
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                {/* END: Definitions Section */}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {wordDetails.relatedWords &&
          Object.keys(wordDetails.relatedWords).length > 0 && (
            <Card className="mt-6 bg-card">
              <CardHeader>
                <CardTitle className="text-xl">Related Words & Forms</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedRelatedWordsList
                  relatedWords={wordDetails.relatedWords}
                  onSelect={navigateToRelatedWord}
                />
              </CardContent>
            </Card>
          )}

        {/* Phrases section is currently not part of WordEntryData, 
            but keeping the structure here if it's added back. 
            If WordEntryData is final, this section can be removed. */}
        {/* {wordDetails.phrases && wordDetails.phrases.length > 0 && ( ... )} */}
      </CardContent>
    </Card>
  );
}
