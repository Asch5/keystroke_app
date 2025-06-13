'use client';

import { useState, useEffect, useCallback } from 'react';
import { LanguageCode } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  Globe,
  Volume2,
  Loader2,
  Plus,
  BookOpen,
  Languages,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
// import { getPublicListPreview } from '@/core/domains/dictionary';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import {
  getDisplayDefinition,
  shouldShowTranslations,
} from '@/core/domains/user/utils/dictionary-display-utils';
import type { PublicListSummary } from '@/core/domains/dictionary';

interface PublicListPreviewDialogProps {
  list: PublicListSummary;
  isOpen: boolean;
  onClose: () => void;
  onAddToCollection: () => void;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  };
  isPending: boolean;
  isUserList?: boolean;
}

interface ListWordPreview {
  id: string;
  word: string;
  pronunciation?: string | null;
  audioUrl?: string | null;
  definition: string;
  translatedDefinition?: string | null;
  examples: Array<{
    text: string;
    translation?: string | null;
  }>;
  tags: string[];
  difficultyLevel: string;
}

const difficultyDisplayNames = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
} as const;

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  elementary: 'bg-blue-100 text-blue-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  proficient: 'bg-red-100 text-red-800',
} as const;

export function PublicListPreviewDialog({
  list,
  isOpen,
  onClose,
  onAddToCollection,
  userLanguages,
  isPending,
  isUserList = false,
}: PublicListPreviewDialogProps) {
  const [words, setWords] = useState<ListWordPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const loadListPreview = useCallback(async () => {
    setIsLoading(true);
    try {
      // Re-enable preview functionality
      const preview = isUserList
        ? await import('@/core/domains/dictionary').then((m) =>
            m.getPublicUserListPreview(list.id),
          )
        : await import('@/core/domains/dictionary').then((m) =>
            m.getPublicListPreview(list.id, userLanguages),
          );
      setWords(preview.words || []);
    } catch (error) {
      console.error('Error loading list preview:', error);
      toast.error('Failed to load list preview');
      // Show empty state on error
      setWords([]);
    } finally {
      setIsLoading(false);
    }
  }, [isUserList, list.id, userLanguages]);

  // Load list preview when dialog opens
  useEffect(() => {
    if (isOpen && list.id) {
      loadListPreview();
    }
  }, [isOpen, list.id, loadListPreview]);

  const handlePlayAudio = async (audioUrl: string, wordId: string) => {
    if (!audioUrl) return;

    try {
      setPlayingAudioId(wordId);
      await AudioService.playAudioFromDatabase(audioUrl);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
    } finally {
      setPlayingAudioId(null);
    }
  };

  const showTranslations = shouldShowTranslations(
    userLanguages.base,
    userLanguages.target,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="truncate">{list.name}</DialogTitle>
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
                <Badge className={difficultyColors[list.difficultyLevel]}>
                  {difficultyDisplayNames[list.difficultyLevel]}
                </Badge>
              </div>

              {list.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {list.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {list.wordCount} words
                </div>
                <div className="flex items-center gap-1">
                  <Languages className="h-4 w-4" />
                  {list.categoryName}
                </div>
              </div>

              {list.tags && list.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Tag className="h-3 w-3" />
                  <div className="flex flex-wrap gap-1">
                    {list.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading words...</span>
            </div>
          ) : words.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No words found</h3>
                <p className="text-muted-foreground">
                  This list appears to be empty.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-3 pr-4">
                {words.map((wordData) => {
                  const displayResult = showTranslations
                    ? getDisplayDefinition(
                        {
                          definition: wordData.definition,
                          targetLanguageCode: userLanguages.target,
                          translations: wordData.translatedDefinition
                            ? [
                                {
                                  id: 1,
                                  languageCode: userLanguages.base,
                                  content: wordData.translatedDefinition,
                                },
                              ]
                            : [],
                        },
                        userLanguages.base,
                      )
                    : { content: wordData.definition, isTranslation: false };

                  const displayDefinition = displayResult.content;
                  const isTranslationUsed = displayResult.isTranslation;

                  return (
                    <Card
                      key={wordData.id}
                      className="hover:shadow-sm transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Word header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-lg">
                                  {wordData.word}
                                </h4>
                                {wordData.audioUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handlePlayAudio(
                                        wordData.audioUrl!,
                                        wordData.id,
                                      )
                                    }
                                    disabled={playingAudioId === wordData.id}
                                    className="h-8 w-8 p-0"
                                  >
                                    {playingAudioId === wordData.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Volume2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>

                              {wordData.pronunciation && (
                                <p className="text-sm text-muted-foreground">
                                  [{wordData.pronunciation}]
                                </p>
                              )}
                            </div>

                            <Badge
                              className={
                                difficultyColors[
                                  wordData.difficultyLevel as keyof typeof difficultyColors
                                ]
                              }
                            >
                              {
                                difficultyDisplayNames[
                                  wordData.difficultyLevel as keyof typeof difficultyDisplayNames
                                ]
                              }
                            </Badge>
                          </div>

                          {/* Definition */}
                          <div>
                            <p className="text-sm">{displayDefinition}</p>
                            {isTranslationUsed && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Original: {wordData.definition}
                              </p>
                            )}
                          </div>

                          {/* Examples */}
                          {wordData.examples &&
                            wordData.examples.length > 0 && (
                              <div>
                                <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                  Examples:
                                </h5>
                                <div className="space-y-1">
                                  {wordData.examples
                                    .slice(0, 2)
                                    .map((example, index) => (
                                      <div key={index} className="text-xs">
                                        <p className="italic text-muted-foreground">
                                          &ldquo;{example.text}&rdquo;
                                        </p>
                                        {showTranslations &&
                                          example.translation && (
                                            <p className="text-muted-foreground">
                                              {example.translation}
                                            </p>
                                          )}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                          {/* Tags */}
                          {wordData.tags && wordData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {wordData.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(words.length, 10)} of {list.wordCount} words
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onAddToCollection} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add to Collection
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
