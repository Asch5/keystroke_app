import {
  BookOpen,
  MoreHorizontal,
  Trash2,
  Volume2,
  VolumeX,
  Plus,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getDisplayDefinition,
  shouldShowTranslations,
} from '@/core/domains/user/utils/dictionary-display-utils';
import { LanguageCode } from '@/core/types';
import type { UserListWordWithDetails, RemoveDialogState } from '../types';
import { getStatusColor } from '../utils/styleUtils';

interface WordsTableProps {
  words: UserListWordWithDetails[];
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  } | null;
  isPlayingAudio: boolean;
  playingWordId: string | null;
  isPending: boolean;
  onPlayAudio: (
    word: string,
    audioUrl: string | null,
    wordId: string,
  ) => Promise<void>;
  onRemoveWord: (dialog: RemoveDialogState) => void;
  onAddWords: () => void;
  onPopulateList: () => void;
  onClearSearch: () => void;
  searchTerm: string;
}

/**
 * Words table component for displaying list words with actions
 * Handles empty states, search results, and individual word actions
 */
export function WordsTable({
  words,
  userLanguages,
  isPlayingAudio,
  playingWordId,
  isPending,
  onPlayAudio,
  onRemoveWord,
  onAddWords,
  onPopulateList,
  onClearSearch,
  searchTerm,
}: WordsTableProps) {
  // Empty state when no words
  if (words.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Words (0)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-content-tertiary mx-auto mb-4" />
            {searchTerm ? (
              <>
                <h3 className="text-lg font-medium text-foreground">
                  No words found
                </h3>
                <p className="text-content-secondary mt-2">
                  No words match your search &quot;{searchTerm}&quot;
                </p>
                <Button
                  variant="outline"
                  onClick={onClearSearch}
                  className="mt-4"
                >
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-foreground">
                  No words yet
                </h3>
                <p className="text-content-secondary mt-2">
                  Start building your vocabulary by adding words to this list
                </p>
                <div className="flex gap-2 mt-4">
                  <Button onClick={onAddWords}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Words
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onPopulateList}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      'Load Original Words'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Table with words
  return (
    <Card>
      <CardHeader>
        <CardTitle>Words ({words.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead>Translation</TableHead>
              <TableHead>Definition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {words.map((word) => {
              return (
                <TableRow key={word.userDictionaryId}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{word.word}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {word.partOfSpeech}
                          {word.phoneticTranscription && (
                            <span className="font-mono ml-2">
                              /{word.phoneticTranscription}/
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Audio Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onPlayAudio(
                            word.word,
                            word.audioUrl,
                            word.userDictionaryId,
                          )
                        }
                        disabled={
                          isPlayingAudio &&
                          playingWordId !== word.userDictionaryId
                        }
                        className="h-8 w-8 p-0"
                      >
                        {isPlayingAudio &&
                        playingWordId === word.userDictionaryId ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Translation Column - Show only DefinitionToOneWord or dash */}
                    {word.oneWordTranslation ? (
                      <span className="text-sm">{word.oneWordTranslation}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-sm">
                        {userLanguages &&
                        shouldShowTranslations(
                          userLanguages.base,
                          userLanguages.target,
                        )
                          ? getDisplayDefinition(
                              {
                                definition: word.definition,
                                targetLanguageCode: userLanguages.target,
                                translations: word.translations.map((t) => ({
                                  id: t.id,
                                  languageCode: t.languageCode,
                                  content: t.translatedText,
                                })),
                              },
                              userLanguages.base,
                            ).content
                          : word.definition}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(word.learningStatus)}>
                      {word.learningStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm">{word.masteryScore}%</div>
                      <div className="text-xs text-content-secondary">
                        ({word.reviewCount} reviews)
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            onRemoveWord({
                              open: true,
                              wordId: word.userDictionaryId,
                              wordText: word.word,
                              userDictionaryId: word.userDictionaryId,
                            })
                          }
                          className="text-error-foreground"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from List
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
