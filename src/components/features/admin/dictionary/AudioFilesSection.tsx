'use client';

import { Loader2, Trash2, Plus, Save } from 'lucide-react';
import { memo } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WordDetailEditData } from '@/core/domains/dictionary/actions/word-details-actions';

// Extract exact types from WordDetailEditData to ensure compatibility
type AudioFileData = WordDetailEditData['audioFiles'][0];

interface AudioFilesSectionProps {
  formData: WordDetailEditData;
  isSavingAudioFiles: boolean;
  onSaveAudioFiles: () => Promise<void>;
  onAddAudioFile: () => void;
  onRemoveAudioFile: (index: number) => void;
  onUpdateAudioFile: (
    index: number,
    field: keyof AudioFileData,
    value: string | boolean | null,
  ) => void;
  onTogglePrimaryAudio: (index: number) => void;
}

/**
 * AudioFilesSection component for managing audio files
 * Memoized to prevent unnecessary re-renders when parent updates but props remain same
 */
const AudioFilesSection = memo(function AudioFilesSection({
  formData,
  isSavingAudioFiles,
  onSaveAudioFiles,
  onAddAudioFile,
  onRemoveAudioFile,
  onUpdateAudioFile,
  onTogglePrimaryAudio,
}: AudioFilesSectionProps) {
  return (
    <AccordionItem value="audio">
      <AccordionTrigger className="text-xl font-semibold">
        <div className="flex items-center gap-2">
          <span>Audio Files</span>
          <Badge variant="secondary">
            {
              formData.audioFiles.filter(
                (audio: AudioFileData) => !audio._toDelete,
              ).length
            }
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Manage Audio Files</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={onSaveAudioFiles}
                disabled={isSavingAudioFiles}
                variant="outline"
                size="sm"
              >
                {isSavingAudioFiles ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Audio Files
                  </>
                )}
              </Button>
              <Button onClick={onAddAudioFile} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Audio File
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.audioFiles.filter(
              (audio: AudioFileData) => !audio._toDelete,
            ).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No audio files added yet. Click &quot;Add Audio File&quot; to
                get started.
              </p>
            ) : (
              formData.audioFiles.map(
                (audio: AudioFileData, audioIndex: number) => {
                  if (audio._toDelete) return null;
                  return (
                    <Card
                      key={audio.id ?? `new-audio-${audioIndex}`}
                      className="relative"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Audio File {audioIndex + 1}
                          {audio.isPrimary && (
                            <Badge variant="default" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </CardTitle>
                        <Button
                          onClick={() => onRemoveAudioFile(audioIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor={`audio-url-${audioIndex}`}>
                              Audio URL *
                            </Label>
                            <Input
                              id={`audio-url-${audioIndex}`}
                              value={audio.url}
                              onChange={(e) =>
                                onUpdateAudioFile(
                                  audioIndex,
                                  'url',
                                  e.target.value,
                                )
                              }
                              placeholder="https://example.com/audio.mp3"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor={`audio-source-${audioIndex}`}>
                              Source
                            </Label>
                            <Select
                              value={audio.source}
                              onValueChange={(value) =>
                                onUpdateAudioFile(audioIndex, 'source', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ai_generated">
                                  AI Generated
                                </SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="danish_dictionary">
                                  Danish Dictionary
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`audio-language-${audioIndex}`}>
                              Language
                            </Label>
                            <Select
                              value={audio.languageCode}
                              onValueChange={(value) =>
                                onUpdateAudioFile(
                                  audioIndex,
                                  'languageCode',
                                  value,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="da">Danish</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="md:col-span-2">
                            <Label htmlFor={`audio-note-${audioIndex}`}>
                              Note
                            </Label>
                            <Input
                              id={`audio-note-${audioIndex}`}
                              value={audio.note ?? ''}
                              onChange={(e) =>
                                onUpdateAudioFile(
                                  audioIndex,
                                  'note',
                                  e.target.value,
                                )
                              }
                              placeholder="Optional note about this audio file"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`is-primary-${audioIndex}`}
                              checked={audio.isPrimary}
                              onCheckedChange={() =>
                                onTogglePrimaryAudio(audioIndex)
                              }
                            />
                            <Label htmlFor={`is-primary-${audioIndex}`}>
                              Primary Audio
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                },
              )
            )}
          </CardContent>
        </Card>
      </AccordionContent>
    </AccordionItem>
  );
});

export default AudioFilesSection;
