'use client';

import { Plus, List, Loader2, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AuthenticatedImage } from '@/components/shared/AuthenticatedImage';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  addDefinitionToUserDictionary,
  checkDefinitionsInUserDictionary,
} from '@/core/domains/dictionary/actions';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import type { DefinitionData } from '@/core/lib/actions/dictionaryActions';
import { LanguageCode } from '@/core/types';
import { AddToListDialog } from '../../dictionary/AddToListDialog';
import { renderTextWithEmphasis } from './utils/text-rendering';
import { findTranslation } from './utils/translation-utils';

// Explicitly type DefinitionExample based on the structure from dictionaryActions.ts
type DefinitionExample = NonNullable<
  NonNullable<DefinitionData['examples']>[0]
>;

interface WordDetailsDefinitionsProps {
  definitions: DefinitionData[];
  selectedLanguageCode: LanguageCode;
  userId?: string;
  showDictionaryActions?: boolean;
  userLanguages?: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

/**
 * WordDetailsDefinitions component displays definitions with examples,
 * translations, images, and complex text formatting.
 * Also includes "Add to Dictionary" and "Add to List" actions when enabled.
 */
export function WordDetailsDefinitions({
  definitions,
  selectedLanguageCode,
  userId,
  showDictionaryActions = false,
  userLanguages = {
    base: LanguageCode.en,
    target: selectedLanguageCode,
  },
}: WordDetailsDefinitionsProps) {
  const [loadingDefinitions, setLoadingDefinitions] = useState<Set<number>>(
    new Set(),
  );
  const [definitionStatus, setDefinitionStatus] = useState<
    Record<number, { exists: boolean; userDictionaryId?: string | undefined }>
  >({});
  const [addToListDialog, setAddToListDialog] = useState<{
    open: boolean;
    definitionId: number | null;
    wordText: string;
  }>({
    open: false,
    definitionId: null,
    wordText: '',
  });

  // Check which definitions are already in user's dictionary
  useEffect(() => {
    const loadDefinitionStatus = async () => {
      if (!userId || !showDictionaryActions || definitions.length === 0) {
        return;
      }

      try {
        const definitionIds = definitions.map((def) => def.id);
        const status = await checkDefinitionsInUserDictionary(
          userId,
          definitionIds,
        );
        setDefinitionStatus(status);
      } catch (error) {
        console.error('Error loading definition status:', error);
      }
    };

    loadDefinitionStatus();
  }, [userId, showDictionaryActions, definitions]);

  // Handle adding definition to user dictionary
  const handleAddToUserDictionary = async (definition: DefinitionData) => {
    if (!userId) return;

    setLoadingDefinitions((prev) => new Set(prev).add(definition.id));

    try {
      const result = await addDefinitionToUserDictionary(
        userId,
        definition.id,
        userLanguages.target,
      );

      if (result.success) {
        // Update local state to reflect the change
        if (result.data?.id) {
          setDefinitionStatus((prev) => ({
            ...prev,
            [definition.id]: {
              exists: true,
              userDictionaryId: result.data.id,
            },
          }));
        }

        toast.success('Word added to your dictionary!', {
          action: {
            label: 'Add to List',
            onClick: () => {
              if (result.data) {
                setAddToListDialog({
                  open: true,
                  definitionId: definition.id,
                  wordText: `Definition ${definition.id}`,
                });
              }
            },
          },
        });
      } else {
        toast.error(result.error ?? 'Failed to add word to dictionary');
      }
    } catch (error) {
      console.error('Error adding word to dictionary:', error);
      toast.error('Failed to add word to dictionary');
    } finally {
      setLoadingDefinitions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(definition.id);
        return newSet;
      });
    }
  };

  // Handle adding to list dialog
  const handleAddToList = (definition: DefinitionData) => {
    setAddToListDialog({
      open: true,
      definitionId: definition.id,
      wordText: `Definition ${definition.id}`,
    });
  };

  // Close add to list dialog
  const closeAddToListDialog = () => {
    setAddToListDialog({
      open: false,
      definitionId: null,
      wordText: '',
    });
  };

  return (
    <>
      <Accordion
        type="single"
        collapsible
        className="w-full mt-4 rounded-md border bg-card shadow-sm"
      >
        <AccordionItem value="pos-definitions" className="border-b-0">
          <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:no-underline">
            Definitions ({definitions.length})
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3 pt-1">
            <div className="space-y-4 mt-2">
              {definitions.map((def: DefinitionData, index: number) => {
                const isInDictionary =
                  definitionStatus[def.id]?.exists ?? false;

                return (
                  <Card
                    key={def.id}
                    className={`overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-150 ${def.isInShortDef ? 'bg-primary/5 border-l-4 border-primary' : 'bg-background'}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {index + 1}
                          </Badge>
                          {def.isInShortDef && (
                            <Badge
                              variant="default"
                              className="bg-warning-subtle text-warning-foreground text-xs"
                            >
                              Main Definition
                            </Badge>
                          )}
                          {def.subjectStatusLabels && (
                            <Badge variant="secondary" className="text-xs">
                              {def.subjectStatusLabels}
                            </Badge>
                          )}
                          {isInDictionary && (
                            <Badge
                              variant="secondary"
                              className="bg-success-subtle text-success-foreground text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              In Dictionary
                            </Badge>
                          )}
                        </div>

                        {/* Dictionary Actions */}
                        {showDictionaryActions && userId && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant={isInDictionary ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => handleAddToUserDictionary(def)}
                              disabled={
                                loadingDefinitions.has(def.id) || isInDictionary
                              }
                            >
                              {loadingDefinitions.has(def.id) ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : isInDictionary ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              {isInDictionary
                                ? 'In Dictionary'
                                : 'Add to Dictionary'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddToList(def)}
                              disabled={!isInDictionary}
                            >
                              <List className="h-4 w-4 mr-2" />
                              Add to List
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Definition text with translation tooltip */}
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CardTitle className="text-lg cursor-default">
                              {renderTextWithEmphasis(def.text)}
                            </CardTitle>
                          </TooltipTrigger>
                          {selectedLanguageCode === LanguageCode.da &&
                            def.translations &&
                            findTranslation(
                              def.translations,
                              LanguageCode.en,
                            ) && (
                              <TooltipContent side="top" className="max-w-md">
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
                      {/* Image Section */}
                      {def.image?.url && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="cursor-pointer hover:opacity-90 transition-opacity rounded-lg overflow-hidden border max-w-xs">
                              <AspectRatio ratio={16 / 9} className="bg-muted">
                                <AuthenticatedImage
                                  src={`/api/images/${def.image.id}`}
                                  alt={def.image.description || def.text}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              </AspectRatio>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl w-full p-0 bg-black">
                            <AspectRatio ratio={16 / 9}>
                              <AuthenticatedImage
                                src={`/api/images/${def.image.id}`}
                                alt={def.image.description || def.text}
                                fill
                                className="object-contain"
                                sizes="100vw"
                                priority
                              />
                            </AspectRatio>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Labels and Notes Section */}
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
                                {renderTextWithEmphasis(def.generalLabels)}
                              </p>
                            </div>
                          )}
                          {def.grammaticalNote && (
                            <div>
                              <strong className="text-xs text-muted-foreground">
                                Grammar:
                              </strong>
                              <p className="text-xs">
                                {renderTextWithEmphasis(def.grammaticalNote)}
                              </p>
                            </div>
                          )}
                          {def.usageNote && (
                            <div className="bg-muted/40 p-3 rounded-md mt-2">
                              <strong className="text-xs text-muted-foreground">
                                Usage:
                              </strong>
                              <p className="text-xs whitespace-pre-line">
                                {renderTextWithEmphasis(def.usageNote)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Examples Section */}
                      {def.examples && def.examples.length > 0 && (
                        <div className="pt-3">
                          <h5 className="text-sm font-semibold text-muted-foreground mb-2">
                            Examples
                          </h5>
                          <ScrollArea className="max-h-[300px] pr-3">
                            {(() => {
                              const examplesToGroup = def.examples;
                              const groupedExamples = examplesToGroup.reduce(
                                (
                                  acc: Record<string, DefinitionExample[]>,
                                  example: DefinitionExample,
                                ) => {
                                  const noteKey =
                                    example.grammaticalNote ??
                                    'General Examples';
                                  if (!acc[noteKey]) acc[noteKey] = [];
                                  acc[noteKey].push(example);
                                  return acc;
                                },
                                {} as Record<string, DefinitionExample[]>,
                              );

                              return (
                                <div className="space-y-2.5">
                                  {Object.entries(groupedExamples).map(
                                    ([noteKey, groupExamples]) => (
                                      <div
                                        key={noteKey}
                                        className={`p-2.5 rounded-md text-xs ${noteKey === 'General Examples' ? 'bg-background border' : 'bg-muted/30 border-l-2 border-primary/30'}`}
                                      >
                                        {noteKey !== 'General Examples' && (
                                          <p className="text-[0.7rem] font-medium text-primary/80 mb-1">
                                            {renderTextWithEmphasis(noteKey)}
                                          </p>
                                        )}
                                        <ul className="space-y-1">
                                          {groupExamples.map(
                                            (ex: DefinitionExample) => (
                                              <li
                                                key={ex.id}
                                                className="flex items-start gap-2"
                                              >
                                                <span className="text-primary flex-shrink-0">
                                                  •
                                                </span>
                                                <div className="flex items-start gap-1.5 flex-1">
                                                  <TooltipProvider
                                                    delayDuration={300}
                                                  >
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
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
                                                        AudioService.playAudioFromDatabase(
                                                          ex.audio!,
                                                        )
                                                      }
                                                    >
                                                      🔊
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
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Add to List Dialog */}
      {showDictionaryActions && userId && (
        <AddToListDialog
          isOpen={addToListDialog.open}
          onClose={closeAddToListDialog}
          userId={userId}
          userLanguages={userLanguages}
          wordText={addToListDialog.wordText}
          userDictionaryId={addToListDialog.definitionId?.toString() ?? ''}
          onWordAddedToList={() => {
            toast.success('Word added to list!');
            closeAddToListDialog();
          }}
        />
      )}
    </>
  );
}
