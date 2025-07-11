import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import type {
  WordPartOfSpeechDetails,
  AudioFileData,
  DetailRelationForPOS,
} from '@/core/lib/actions/dictionaryActions';
import { LanguageCode } from '@/core/types';
import { formatRelationshipType } from './utils/translation-utils';
import { WordDetailsDefinitions } from './WordDetailsDefinitions';

interface WordDetailsPartOfSpeechProps {
  detail: WordPartOfSpeechDetails;
  selectedLanguageCode: LanguageCode;
  onNavigateToWord: (word: string) => void;
  userId?: string;
  showDictionaryActions?: boolean;
  userLanguages?: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

/**
 * WordDetailsPartOfSpeech component displays a single part of speech section
 * including metadata, audio files, detail relations, and definitions
 *
 * @param detail - The part of speech details data
 * @param selectedLanguageCode - Current language for translation tooltips
 * @param onNavigateToWord - Callback for word navigation
 */
export function WordDetailsPartOfSpeech({
  detail,
  selectedLanguageCode,
  onNavigateToWord,
  userId,
  showDictionaryActions = false,
  userLanguages,
}: WordDetailsPartOfSpeechProps) {
  const navigateToRelatedWord = async (word: string) => {
    if (onNavigateToWord) {
      onNavigateToWord(word);
    }
  };

  return (
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
        {/* Metadata Section */}
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

        {/* Etymology Section */}
        {detail.etymology && (
          <div className="bg-muted/20 p-3 rounded-md">
            <h5 className="text-sm font-semibold text-muted-foreground mb-1.5">
              Etymology:
            </h5>
            <p className="text-sm text-muted-foreground">{detail.etymology}</p>
          </div>
        )}

        {/* Audio Files Section */}
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
                  onClick={async () => {
                    try {
                      await AudioService.playAudioFromDatabase(audioFile.url);
                    } catch (error) {
                      console.error('Error playing audio:', error);
                    }
                  }}
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

        {/* Detail-Specific Relations Section */}
        {detail.detailRelations && detail.detailRelations.length > 0 && (
          <Accordion
            type="single"
            collapsible
            className="w-full mt-4 rounded-md border bg-muted/20 shadow-sm"
          >
            <AccordionItem value="pos-detail-relations" className="border-b-0">
              <AccordionTrigger className="text-md font-semibold px-4 py-3 hover:no-underline">
                Related Forms & Details (for this Part of Speech)
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3 pt-1">
                <div className="space-y-3 mt-2">
                  {detail.detailRelations.map(
                    (posRelation: DetailRelationForPOS, index: number) => (
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
                              navigateToRelatedWord(posRelation.toWordText)
                            }
                          >
                            {posRelation.toWordText}
                          </Button>
                          {posRelation.toWordAudio && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 rounded-full"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await AudioService.playAudioFromDatabase(
                                    posRelation.toWordAudio!,
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
                          {posRelation.targetPartOfSpeech && (
                            <Badge variant="outline" className="text-xs">
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

        {/* Definitions Section */}
        {detail.definitions && detail.definitions.length > 0 && (
          <WordDetailsDefinitions
            definitions={detail.definitions}
            selectedLanguageCode={selectedLanguageCode}
            {...(userId && { userId })}
            showDictionaryActions={showDictionaryActions && !!userId}
            userLanguages={
              userLanguages || {
                base: LanguageCode.en,
                target: selectedLanguageCode,
              }
            }
          />
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
